const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  const exported = {};
  new Function('require', 'exports', code)(name => name in dependencies ? dependencies[name] : require(name), exported);
  return exported;
}
const model = load('src/lib/jobs-model.ts');
const { createJobFeedClient, searchUrl } = load('src/lib/job-feed.ts', { './jobs-model': model });
const listing = { id: 123, companyName: 'Example company', jobTitle: 'WordPress &amp; PHP Developer', jobGeo: 'Philippines', url: 'https://jobicy.com/jobs/123-developer', pubDate: '2026-11-04T08:00:00+00:00', jobExcerpt: '<b>Build WooCommerce sites</b> &amp; maintain JavaScript.', jobType: ['Contract'], salaryMin: 1000, salaryMax: 2000, salaryCurrency: 'USD', salaryPeriod: 'monthly', jobDescription: '<script>never render this HTML</script>' };
const search = { keyword: '', geo: 'philippines' };
const payload = { jobs: [listing], hasMore: true, nextCursor: 'opaque-cursor_123', appliedFilters: { geo: 'philippines' } };
const response = (body = payload) => ({ ok: true, status: 200, json: async () => body });
const filters = { keyword: '', focus: 'development', salaryOnly: false, sort: 'skills' };

test('Jobicy normalization preserves eligibility, date, currency/period and canonical application URL, omitting HTML', () => {
  const job = model.jobFromApi(listing);
  assert.equal(job.sourceId, 'jobicy-123'); assert.equal(job.source, 'Jobicy'); assert.equal(job.remote, true);
  assert.equal(job.title, 'WordPress & PHP Developer'); assert.equal(job.summary, 'Build WooCommerce sites & maintain JavaScript.');
  assert.equal(job.salary, 'USD 1,000–2,000 / monthly'); assert.equal(job.location, 'Philippines'); assert.equal(job.url, listing.url);
  assert.equal(job.postedAt, Date.parse(listing.pubDate)); assert.equal(job.jobDescription, undefined);
  assert.deepEqual(model.jobFromSaved(job), job);
  const unknown = model.jobFromApi({ ...listing, pubDate: undefined, salaryMin: undefined, salaryMax: undefined, jobGeo: undefined });
  assert.equal(unknown.postedAt, null); assert.equal(unknown.salary, ''); assert.equal(unknown.location, 'Location not provided');
});

test('existing Arbeitnow bookmarks remain readable without migration or changed document IDs', () => {
  const legacy = { sourceId: 'engineer-123', source: 'Arbeitnow', title: 'Engineer', company: 'Example', location: 'Germany', remote: false, url: 'https://www.arbeitnow.com/jobs/companies/example/engineer-123', postedAt: 1760000000000 };
  assert.deepEqual(model.jobFromSaved(legacy), legacy);
  assert.equal(model.jobFromSaved({ ...legacy, source: 'Jobicy' }), null);
  assert.equal(model.arrangementLabel(false), 'Not marked remote');
});

test('unsafe URLs, cross-provider links, invalid IDs and malformed pagination are rejected', () => {
  for (const url of ['javascript:alert(1)', 'https://evil.example/jobs/123', 'https://jobicy.com.evil/jobs/123', 'https://user:password@jobicy.com/jobs/123', 'https://jobicy.com/login', 'https://jobicy.com:8443/jobs/123', 'https://www.arbeitnow.com/jobs/123']) assert.equal(model.jobFromApi({ ...listing, url }), null);
  assert.equal(model.jobFromApi({ ...listing, id: '../other' }), null);
  assert.equal(model.parseFeed(payload, 0).nextCursor, payload.nextCursor);
  assert.throws(() => model.parseFeed({ ...payload, nextCursor: 'https://evil.example/steal' }, 0), /pagination/);
  assert.throws(() => model.parseFeed({}, 0), /unsupported/);
  assert.equal(model.parseFeed({ jobs: [], hasMore: false }, 0).jobs.length, 0);
});

test('Philippines is the actual provider filter, keywords are encoded and cursors never change source/filters', () => {
  const url = new URL(searchUrl(search));
  assert.equal(url.origin, 'https://jobicy.com'); assert.equal(url.searchParams.get('geo'), 'philippines');
  const next = new URL(searchUrl({ keyword: 'PHP & WordPress', geo: 'anywhere' }, 'opaque_123'));
  assert.equal(next.searchParams.get('tag'), 'PHP & WordPress'); assert.equal(next.searchParams.get('cursor'), 'opaque_123');
  for (const invalid of [{ keyword: 'ab', geo: 'philippines' }, { keyword: '', geo: 'usa' }]) assert.throws(() => searchUrl(invalid));
});

test('local skill ordering is explainable, salary is optional and role focus can be broadened explicitly', () => {
  const wordpress = model.jobFromApi(listing);
  const software = model.jobFromApi({ ...listing, id: 124, jobTitle: 'Software Engineer', jobExcerpt: '', salaryMin: null, salaryMax: null });
  const sales = model.jobFromApi({ ...listing, id: 125, jobTitle: 'Sales Manager', jobExcerpt: '', salaryMin: null, salaryMax: null });
  assert.deepEqual(model.filterJobs([sales, software, wordpress], filters), [wordpress, software]);
  assert.ok(model.matchingSkills(wordpress).includes('WordPress'));
  assert.deepEqual(model.filterJobs([software, wordpress], { ...filters, salaryOnly: true }), [wordpress]);
  assert.equal(model.filterJobs([sales, software, wordpress], { ...filters, focus: 'all' }).length, 3);
  assert.deepEqual(model.filterJobs([software, wordpress], { ...filters, keyword: 'woocommerce' }), [wordpress]);
  const boilerplate = { ...sales, title: 'Supply Chain Manager', summary: 'We build a full-stack cloud platform for web developers.' };
  assert.equal(model.isDevelopmentJob(boilerplate), false); assert.deepEqual(model.matchingSkills(boilerplate), []);
});

test('concurrent requests deduplicate and searches are cached separately for one hour', async () => {
  let calls = 0; let resolve;
  const client = createJobFeedClient(async (url, options) => { calls++; assert.equal(url, 'https://jobicy.com/api/jobs?count=100&geo=philippines'); assert.equal(options.credentials, 'omit'); return new Promise(done => { resolve = done; }); }, () => null, () => 1000);
  const first = client.get(search); const second = client.get(search);
  assert.equal(first, second); resolve(response());
  await first; await client.get(search); assert.equal(calls, 1);
  const mismatch = createJobFeedClient(async () => response(), () => null);
  await assert.rejects(mismatch.get({ ...search, geo: 'anywhere' }), /did not confirm/);
});

test('offline caches are marked stale, stop pagination and are not used beyond one day', async () => {
  let calls = 0; let now = 1000;
  const client = createJobFeedClient(async () => { if (++calls === 1) return response(); throw new Error('offline'); }, () => null, () => now);
  await client.get(search); now += 61 * 60000;
  const stale = await client.get(search); assert.equal(stale.stale, true); assert.equal(stale.jobs.length, 1); assert.equal(stale.nextCursor, null);
  await client.get(search); assert.equal(calls, 2);
  now += 24 * 60 * 60000;
  await assert.rejects(client.get(search), /offline/);
});

test('rate limits respect Retry-After across searches; failed requests are not repeatedly sent', async () => {
  let calls = 0; let now = 1000;
  const client = createJobFeedClient(async () => { calls++; return { ok: false, status: 429, headers: new Headers({ 'Retry-After': '300' }) }; }, () => null, () => now);
  await assert.rejects(client.get(search), /busy/);
  now += 120000;
  await assert.rejects(client.get({ ...search, geo: 'anywhere' }), /rate limited/); assert.equal(calls, 1);
  const failing = createJobFeedClient(async () => { throw new Error('offline'); }, () => null, () => 0);
  await assert.rejects(failing.get(search), /offline/); await assert.rejects(failing.get(search), /wait a minute/);
});

test('feed browsing works when browser storage is blocked', async () => {
  const client = createJobFeedClient(async () => response(), () => { throw new Error('blocked'); });
  assert.equal((await client.get(search)).jobs.length, 1);
});

test('Himalayas uses the configured proxy, confirms PH/UTC+8 filters and caches separately for 24 hours', async () => {
  const proxy = 'https://portfolio-feed.example/jobs';
  const query = { keyword: 'WordPress', geo: 'philippines', provider: 'himalayas' };
  let calls = 0; let now = 1000;
  const normalized = { ...model.jobFromApi(listing), source: 'Himalayas', sourceId: 'himalayas-7-example-wordpress-developer', url: 'https://himalayas.app/companies/example/jobs/wordpress-developer?utm_source=api', timezone: 'UTC+8 included in source restrictions' };
  const client = createJobFeedClient(async url => { calls++; assert.equal(url, `${proxy}?q=WordPress&geo=philippines&page=1`); return response({ jobs: [normalized], nextCursor: '2', fetchedAt: 1000, appliedFilters: { q: 'WordPress', geo: 'philippines', country: 'Philippines', timezone: 8, page: 1 } }); }, () => null, () => now, proxy);
  assert.equal((await client.get(query)).jobs[0].source, 'Himalayas'); now += 2 * 60 * 60000;
  await client.get(query); assert.equal(calls, 1);
  assert.throws(() => searchUrl(query, 'https://evil.example', proxy), /keyword|page/);
  assert.throws(() => searchUrl(query, null, 'http://insecure.example/jobs'), /invalid/);
  assert.throws(() => searchUrl(query, null, ''), /not connected/);
});

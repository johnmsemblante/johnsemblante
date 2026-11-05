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
const { createHandler } = load('workers/job-feed/index.ts', { '../../src/lib/jobs-model': model });
const listing = { guid: 'https://himalayas.app/companies/example/jobs/wordpress-developer', applicationLink: 'https://himalayas.app/companies/example/jobs/wordpress-developer?utm_source=api', title: 'WordPress Developer', companyName: 'Example', excerpt: 'Build WooCommerce stores.', locationRestrictions: ['Philippines'], timezoneRestrictions: [8], minSalary: 1200, maxSalary: 2400, currency: 'USD', salaryPeriod: 'monthly', pubDate: 1760000000, expiryDate: 8640000000, employmentType: 'Contractor', description: '<script>must not survive</script>' };
const env = { ALLOWED_ORIGINS: 'https://johnmsemblanteapp.web.app,http://localhost:3000' };
const request = (query = '', init = {}) => new Request(`https://feed.example/jobs${query}`, { headers: { Origin: 'http://localhost:3000' }, ...init });
const context = { waitUntil(promise) { return promise; } };

test('Himalayas country and UTC+8 restrictions are independently checked, including worldwide jobs', () => {
  const job = model.himalayasJobFromApi(listing);
  assert.equal(job.source, 'Himalayas'); assert.equal(job.sourceId, 'himalayas-7-example-wordpress-developer');
  assert.equal(job.url, listing.applicationLink); assert.equal(job.salary, 'USD 1,200–2,400 / monthly');
  assert.equal(job.description, undefined); assert.equal(job.expiresAt, listing.expiryDate * 1000);
  assert.deepEqual(model.jobFromSaved(job), job);
  assert.equal(model.himalayasJobFromApi(listing, true), null);
  assert.ok(model.himalayasJobFromApi({ ...listing, locationRestrictions: [], timezoneRestrictions: [] }, true));
  assert.ok(model.himalayasJobFromApi({ ...listing, locationRestrictions: [{ alpha2: 'PH', name: 'Philippines' }], timezoneRestrictions: ['UTC+08:00'] }));
  for (const patch of [{ locationRestrictions: ['United States'] }, { timezoneRestrictions: [-5, -8] }, { locationRestrictions: undefined }, { timezoneRestrictions: undefined }, { timezoneRestrictions: ['anywhere'] }, { expiryDate: 1 }, { title: 'WordPress Developer (U.S. Based)' }, { applicationLink: 'https://evil.example/apply' }, { guid: 'https://himalayas.app/companies/other/jobs/wordpress-developer' }]) assert.equal(model.himalayasJobFromApi({ ...listing, ...patch }), null);
});

test('proxy fixes Philippines/UTC+8, strips full HTML, preserves source links and caches normalized metadata', async () => {
  const records = new Map(); let calls = 0;
  const cache = { match: async key => records.get(key.url)?.clone(), put: async (key, value) => { records.set(key.url, value); } };
  const handler = createHandler(async (url, options) => {
    calls++; const parsed = new URL(url);
    assert.equal(parsed.origin, 'https://himalayas.app'); assert.equal(parsed.pathname, '/jobs/api/search');
    assert.equal(parsed.searchParams.get('country'), 'Philippines'); assert.equal(parsed.searchParams.get('timezone'), '8');
    assert.equal(parsed.searchParams.get('q'), 'WordPress'); assert.equal(options.redirect, 'manual');
    assert.equal(new Headers(options.headers).has('Authorization'), false);
    return Response.json({ jobs: [listing, { ...listing, locationRestrictions: ['USA'] }] });
  }, cache);
  const response = await handler(request('?q=WordPress'), env, context);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), 'http://localhost:3000');
  const body = await response.json(); assert.equal(body.jobs.length, 1); assert.equal(body.jobs[0].source, 'Himalayas');
  assert.equal(body.appliedFilters.country, 'Philippines'); assert.equal(body.nextCursor, null);
  assert.equal(JSON.stringify(body).includes('<script>'), false);
  await handler(request('?q=WordPress'), env, context); assert.equal(calls, 1);
});

test('proxy rejects unapproved origins, credentials, arbitrary destinations and malformed pagination before fetching', async () => {
  let calls = 0; const handler = createHandler(async () => { calls++; throw new Error('Must not fetch'); });
  for (const [req, status] of [[request('', { headers: { Origin: 'https://evil.example' } }), 403], [request('?url=https://evil.example'), 400], [request('?geo=usa'), 400], [request('?page=999'), 400], [request('?q=ab'), 400], [request('', { headers: { Authorization: 'Bearer test' } }), 400], [request('', { method: 'POST' }), 405]]) assert.equal((await handler(req, env, context)).status, status);
  assert.equal(calls, 0);
  assert.equal((await handler(request('', { method: 'OPTIONS' }), env, context)).status, 204);
});

test('search pagination uses raw page size even when ineligible listings are removed, not estimated totals', async () => {
  const handler = createHandler(async () => Response.json({ jobs: Array.from({ length: 20 }, (_, i) => i ? { ...listing, locationRestrictions: ['USA'] } : listing), totalCount: 1 }));
  const response = await handler(request('?page=2&geo=anywhere'), env, context);
  const body = await response.json(); assert.equal(body.nextCursor, '3'); assert.equal(body.jobs.length, 0);
});

test('proxy errors are not cached, rate limits retain Retry-After and network failures remain errors', async () => {
  let puts = 0; let calls = 0;
  const cache = { match: async () => undefined, put: async () => { puts++; } };
  const handler = createHandler(async () => { calls++; return new Response('busy', { status: 429, headers: { 'Retry-After': '300' } }); }, cache);
  const limited = await handler(request(), env, context); assert.equal(limited.status, 429); assert.equal(limited.headers.get('Retry-After'), '300');
  assert.equal((await handler(request('?q=WordPress'), env, context)).status, 429); assert.equal(calls, 1); assert.equal(puts, 0);
  const offline = createHandler(async () => { throw new Error('offline'); }, cache);
  assert.equal((await offline(request(), env, context)).status, 502); assert.equal(puts, 0);
  const redirected = createHandler(async (_, options) => { assert.equal(options.redirect, 'manual'); return new Response(null, { status: 302, headers: { Location: 'https://unapproved.example' } }); }, cache);
  assert.equal((await redirected(request(), env, context)).status, 502); assert.equal(puts, 0);
});

test('the deployed entry point preserves the runtime fetch receiver and returns independent response bodies', async () => {
  const originalFetch = globalThis.fetch; const originalCaches = globalThis.caches;
  try {
    globalThis.fetch = function () { 'use strict'; assert.equal(this, globalThis); return Promise.resolve(Response.json({ jobs: [listing] })); };
    globalThis.caches = { default: { match: async () => undefined, put: async () => {} } };
    const worker = load('workers/job-feed/index.ts', { '../../src/lib/jobs-model': model }).default;
    const [first, second] = await Promise.all([worker.fetch(request(), env, context), worker.fetch(request(), env, context)]);
    assert.equal(first.status, 200); assert.equal(second.status, 200);
    assert.equal((await first.json()).jobs.length, 1); assert.equal((await second.json()).jobs.length, 1);
  } finally { globalThis.fetch = originalFetch; if (originalCaches === undefined) delete globalThis.caches; else globalThis.caches = originalCaches; }
});

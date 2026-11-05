const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const cache = new Map();
function load(file) {
  file = path.resolve(file); if (cache.has(file)) return cache.get(file);
  const exported = {}; cache.set(file, exported);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  new Function('require', 'exports', code)(name => {
    if (name.startsWith('@/') || name.startsWith('.')) return load(`${name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name)}.ts`);
    return require(name);
  }, exported); return exported;
}
const { createProjectFilterSession, copyFilteredPortfolio } = load('src/lib/project-filter-session.ts');
function harness(initial = 'https://portfolio.example/work/', fixedIndustry) {
  let history = [initial], index = 0, now = 0, id = 0;
  const timers = new Map(); const writes = [];
  const session = createProjectFilterSession({ href: () => history[index], write(url, mode) { const href = new URL(url, history[index]).href; writes.push({ mode, href }); if (mode === 'replace') history[index] = href; else { history = [...history.slice(0, index + 1), href]; index++; } } }, ['WordPress', 'UI', 'Next.js'], fixedIndustry, { set(fn, delay) { const key = ++id; timers.set(key, { at: now + delay, fn }); return key; }, clear(key) { timers.delete(key); } });
  const advance = duration => { const end = now + duration; while (true) { const next = [...timers].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0]; if (!next) break; now = next[1].at; timers.delete(next[0]); next[1].fn(); } now = end; };
  session.restore();
  return { session, advance, writes, href: () => history[index], count: () => history.length, go(delta) { index += delta; assert.ok(index >= 0 && index < history.length); session.restore(); } };
}

test('search waits 300ms, batches typing into one history checkpoint and replaces subsequent edits in that session', () => {
  const h = harness(); h.session.focusSearch();
  h.session.search('W'); h.advance(100); h.session.search('Word'); h.advance(299);
  assert.equal(h.session.snapshot().filters.q, ''); assert.equal(h.count(), 1);
  h.advance(1); assert.equal(h.session.snapshot().filters.q, 'Word'); assert.equal(h.count(), 2);
  h.session.search('WordPress'); h.advance(300);
  assert.equal(h.session.snapshot().filters.q, 'WordPress'); assert.equal(h.count(), 2);
  assert.equal(h.writes.at(-1).mode, 'replace');
});

test('multi-group selections, chip removals and Clear All are immediately reflected in URL and Back/Forward state', () => {
  const h = harness();
  h.session.toggle('industries', 'dental'); h.session.toggle('industries', 'healthcare');
  h.session.toggle('technologies', 'wordpress'); h.session.toggle('types', 'client-project');
  assert.ok(h.href().includes('industry=dental,healthcare&technology=wordpress&type=client-project'));
  h.session.toggle('industries', 'dental'); assert.deepEqual(h.session.snapshot().filters.industries, ['healthcare']);
  h.go(-1); assert.deepEqual(h.session.snapshot().filters.industries, ['dental', 'healthcare']);
  h.go(1); assert.deepEqual(h.session.snapshot().filters.industries, ['healthcare']);
  h.session.clearGroup('technologies'); assert.ok(!h.href().includes('technology=')); assert.ok(h.href().includes('type=client-project'));
  h.session.clearAll(); assert.equal(h.href(), 'https://portfolio.example/work/');
});

test('Back cancels an outstanding debounce instead of overwriting the restored URL', () => {
  const h = harness(); h.session.toggle('industries', 'healthcare');
  h.session.search('WordPress'); h.advance(100); h.go(-1); h.advance(1000);
  assert.equal(h.href(), 'https://portfolio.example/work/?industry=healthcare'); assert.equal(h.session.snapshot().query, ''); assert.equal(h.session.snapshot().filters.q, '');
});

test('group changes clear typed search and cancel its pending timer instead of reintroducing it', () => {
  const h = harness(); h.session.search('  WP  '); h.advance(100); h.session.toggle('types', 'client-project');
  assert.equal(h.href(), 'https://portfolio.example/work/?type=client-project');
  assert.equal(h.session.snapshot().query, ''); assert.equal(h.session.snapshot().filters.q, '');
  const count = h.count(); h.advance(500); assert.equal(h.count(), count);
  h.session.clearSearch(); assert.equal(h.session.snapshot().filters.q, ''); assert.deepEqual(h.session.snapshot().filters.types, ['client-project']);
});

test('shared links restore duplicate/legacy values and normalize ordering without adding a history entry', () => {
  const h = harness('https://portfolio.example/work?type=client&technology=WordPress,wp&industry=travel,dental&industry=dental&unknown=ignored&q=real%20%20estates');
  assert.equal(h.count(), 1); assert.equal(h.writes[0].mode, 'replace');
  assert.equal(h.href(), 'https://portfolio.example/work/?q=real+estates');
  assert.deepEqual(h.session.snapshot().filters.industries, []); assert.deepEqual(h.session.snapshot().filters.technologies, []); assert.deepEqual(h.session.snapshot().filters.types, []);
  assert.equal(h.session.snapshot().query, 'real estates');
});

test('sharing flushes pending input and copies the actual full deep link; clipboard failure supplies a usable fallback', async () => {
  const h = harness(); let copied;
  h.session.toggle('industries', 'dental'); h.session.toggle('technologies', 'wordpress'); h.session.search('landing-page');
  const result = await copyFilteredPortfolio(h.session, async text => { copied = text; });
  assert.equal(result.copied, true); assert.equal(copied, 'https://portfolio.example/work/?q=landing-page');
  const fallback = await copyFilteredPortfolio(h.session, async () => { throw new Error('denied'); });
  assert.equal(fallback.copied, false); assert.equal(fallback.url, copied);
  assert.equal((await copyFilteredPortfolio(h.session)).copied, false);
});

test('typing clears every dropdown immediately, debounces only the keyword and Back restores the previous filter mode', () => {
  const h = harness();
  h.session.toggle('industries', 'healthcare'); h.session.toggle('technologies', 'wordpress'); h.session.toggle('types', 'client-project');
  const previous = h.href(); const previousCount = h.count();
  h.session.search('React');
  assert.deepEqual(h.session.snapshot().filters, { q: '', industries: [], technologies: [], types: [] });
  assert.equal(h.session.snapshot().query, 'React'); assert.equal(h.href(), 'https://portfolio.example/work/');
  h.advance(300); assert.equal(h.href(), 'https://portfolio.example/work/?q=React'); assert.equal(h.count(), previousCount + 1);
  h.go(-1); assert.equal(h.href(), previous); assert.equal(h.session.snapshot().query, '');
  h.go(1); assert.equal(h.session.snapshot().query, 'React'); assert.deepEqual(h.session.snapshot().filters.types, []);
});

test('clearing a dropdown group also leaves keyword mode, while clearing the input returns all projects', () => {
  const h = harness('https://portfolio.example/work/?q=WP');
  h.session.clearGroup('technologies'); assert.equal(h.session.snapshot().query, ''); assert.equal(h.href(), 'https://portfolio.example/work/');
  h.session.toggle('technologies', 'wordpress'); h.session.search('');
  assert.equal(h.href(), 'https://portfolio.example/work/'); assert.deepEqual(h.session.snapshot().filters.technologies, []);
});

test('dedicated industry routes keep their collection scope and dispose cancels pending work', () => {
  const h = harness('https://portfolio.example/work/industry/dental/?industry=healthcare&technology=WordPress', 'dental');
  assert.deepEqual(h.session.snapshot().filters.industries, []);
  assert.equal(h.href(), 'https://portfolio.example/work/industry/dental/?technology=wordpress');
  h.session.clearAll(); assert.equal(h.href(), 'https://portfolio.example/work/industry/dental/');
  h.session.search('dental'); h.session.dispose(); h.advance(1000); assert.equal(h.href(), 'https://portfolio.example/work/industry/dental/');
});

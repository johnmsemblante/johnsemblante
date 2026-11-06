const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, mocks = {}) { const exports = {}; new Function('require', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText)(name => mocks[name] ?? require(name), exports); return exports; }
const { articleRefresher, requestBlogRefresh, subscribeBlogRefresh } = load('src/lib/blog-refresh.ts');

test('overlapping refreshes suppress the old read and deliver the latest saved version', async () => {
  let resolve; let reads = 0; const received = [];
  const controller = articleRefresher(() => ++reads === 1 ? new Promise(done => resolve = done) : Promise.resolve('latest'), value => received.push(value), () => assert.fail('Unexpected failure'));
  const first = controller.refresh(); const second = controller.refresh();
  assert.equal(first, second); resolve('old'); await first;
  assert.equal(reads, 2); assert.deepEqual(received, ['latest']); controller.dispose();
});

test('errors preserve the last delivered value and a later refresh can recover', async () => {
  let value = 'saved'; let failures = 0; const received = [];
  const controller = articleRefresher(async () => { if (value instanceof Error) throw value; return value; }, item => received.push(item), () => failures++);
  await controller.refresh(); value = new Error('offline'); await controller.refresh();
  assert.deepEqual(received, ['saved']); assert.equal(failures, 1);
  value = 'newer'; await controller.refresh(); assert.deepEqual(received, ['saved', 'newer']);
});

test('disposed pages do not apply an in-flight response or start more reads', async () => {
  let resolve, reads = 0; const received = [];
  const controller = articleRefresher(() => { reads++; return new Promise(done => resolve = done); }, item => received.push(item), () => assert.fail('Unexpected failure'));
  const pending = controller.refresh(); controller.dispose(); resolve('obsolete'); await pending; await controller.refresh();
  assert.deepEqual(received, []); assert.equal(reads, 1);
});

test('refresh signals notify local and other-tab listeners without clearing other storage', () => {
  const previous = global.window; const listeners = new Map(); const writes = []; let refreshed = 0;
  global.window = { localStorage: { setItem(key, value) { writes.push([key, value]); }, clear() { assert.fail('Must not clear authentication or saved jobs'); } }, addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name) { listeners.delete(name); }, dispatchEvent(event) { listeners.get(event.type)?.(); } };
  try {
    const cleanup = subscribeBlogRefresh(() => refreshed++);
    assert.equal(requestBlogRefresh(), true); assert.equal(refreshed, 1); assert.equal(writes.length, 1);
    listeners.get('storage')({ key: writes[0][0], newValue: 'new-signal' }); assert.equal(refreshed, 2);
    listeners.get('storage')({ key: 'firebase-auth', newValue: 'unchanged' }); assert.equal(refreshed, 2);
    window.localStorage.setItem = () => { throw Error('blocked'); };
    assert.equal(requestBlogRefresh(), false); assert.equal(refreshed, 3);
    cleanup(); assert.equal(listeners.size, 0);
  } finally { if (previous === undefined) delete global.window; else global.window = previous; }
});

test('article reads explicitly bypass HTTP cache and treat unpublished/deleted records as unavailable', async () => {
  const model = load('src/lib/blog-model.ts');
  const { readPublicArticle } = load('src/lib/public-blog-store.ts', { './blog-model': model });
  const previous = global.fetch; const requests = [];
  const db = { app: { options: { projectId: 'demo-project' } } };
  try {
    global.fetch = async (url, options) => { requests.push({ url: String(url), options }); return { status: 404 }; };
    assert.equal(await readPublicArticle(db, 'deleted'), null);
    assert.equal(requests[0].options.cache, 'no-store'); assert.equal(requests[0].options.credentials, 'omit');
    assert.ok(!requests[0].url.includes('token'));
    global.fetch = async () => ({ status: 403 }); assert.equal(await readPublicArticle(db, 'private-draft'), null);
    global.fetch = async () => ({ status: 503, ok: false }); await assert.rejects(readPublicArticle(db, 'example'), /unavailable/);
  } finally { global.fetch = previous; }
});

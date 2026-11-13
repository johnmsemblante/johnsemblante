const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(file, mocks = {}) {
  const out = {};
  new Function('require', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText)(name => mocks[name] ?? require(name), out);
  return out;
}
test('concurrent activities remain active until every operation ends, with idempotent cleanup', () => {
  const store = load('src/lib/admin-feedback.ts'); let changes = 0;
  const stop = store.subscribeAdminFeedback(() => changes++);
  const endSave = store.beginAdminActivity('Saving'), endUpload = store.beginAdminActivity('Uploading', 1);
  assert.equal(store.getAdminFeedback().activities.length, 2);
  endSave(); assert.equal(store.getAdminFeedback().activities.length, 1);
  endSave(); assert.equal(store.getAdminFeedback().activities.length, 1);
  endUpload(); assert.equal(store.getAdminFeedback().activities.length, 0);
  assert.equal(changes, 4); stop(); store.notifyAdmin('Done'); assert.equal(changes, 4);
  assert.deepEqual(store.getServerAdminFeedback(), { activities: [], notices: [] });
});
test('notices support repeated outcomes, bounded queues, dismiss and session cleanup without storage', () => {
  const store = load('src/lib/admin-feedback.ts');
  store.notifyAdmin(''); assert.equal(store.getAdminFeedback().notices.length, 0);
  store.notifyAdmin('Same validation error', 'error'); store.notifyAdmin('Same validation error', 'error');
  assert.equal(store.getAdminFeedback().notices.length, 2);
  assert.notEqual(...store.getAdminFeedback().notices.map(notice => notice.id));
  for (let i = 0; i < 5; i++) store.notifyAdmin('Saved ' + i);
  assert.equal(store.getAdminFeedback().notices.length, 4);
  store.dismissAdminNotice(store.getAdminFeedback().notices[0].id);
  assert.equal(store.getAdminFeedback().notices.length, 3);
  const end = store.beginAdminActivity('Pending'); store.clearAdminNotices();
  assert.equal(store.getAdminFeedback().activities.length, 1);
  store.clearAdminFeedback(); end();
  assert.deepEqual(store.getAdminFeedback(), { activities: [], notices: [] });
});
test('message hooks report repeated outcomes and activity hooks end on unmount', () => {
  const store = load('src/lib/admin-feedback.ts'); const effects = [];
  const hooks = load('src/components/admin/use-admin-feedback.ts', {
    '@/lib/admin-feedback': store, react: { useState: () => ['', () => {}], useRef: value => ({ current: value }), useEffect: effect => effects.push(effect) },
  });
  const [, setError] = hooks.useAdminMessage('error'); setError('Invalid'); setError('Invalid'); setError('');
  assert.equal(store.getAdminFeedback().notices.length, 2);
  hooks.useAdminActivity(true, 'Saving'); const cleanup = effects[1]();
  assert.equal(store.getAdminFeedback().activities.length, 1); cleanup();
  assert.equal(store.getAdminFeedback().activities.length, 0);
  effects[0]()(); setError('Late response');
  assert.equal(store.getAdminFeedback().notices.length, 2);
});
test('async admin features share feedback, preserve inline messages and isolate publication from deployment', () => {
  for (const name of ['admin-blog', 'admin-pages', 'admin-works', 'admin-ventures', 'image-upload', 'job-finder', 'use-saved-jobs', 'blog-refresh-control', 'admin-gate']) {
    const source = fs.readFileSync(`src/components/admin/${name}.${name === 'use-saved-jobs' ? 'ts' : 'tsx'}`, 'utf8');
    assert.ok(source.includes('useAdminActivity'), name);
    assert.ok(source.includes('useAdminMessage') || source.includes('notifyAdmin'), name);
  }
  assert.ok(fs.readFileSync('src/components/admin/blog-refresh-control.tsx', 'utf8').includes('This does not deploy the website'));
  assert.ok(fs.readFileSync('src/components/admin/admin-gate.tsx', 'utf8').includes('clearAdminNotices()'));
  const source = fs.readFileSync('src/components/admin/admin-feedback.tsx', 'utf8');
  assert.ok(source.includes('dialog[open]')); assert.ok(source.includes('notice.kind === "error" || paused'));
  assert.ok(!/aria-valuenow|fetch\(|localStorage|sessionStorage/.test(source));
});

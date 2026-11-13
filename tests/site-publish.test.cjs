const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const output = {};
  new Function('require', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText)(name => dependencies[name] ?? require(name), output);
  return output;
}
test('saved-content notices stay local and preserve unrelated browser state', () => {
  const previous = global.window;
  const target = new EventTarget();
  global.window = target;
  try {
    const { notifySitePublish, subscribeSitePublish } = load('src/lib/site-publish.ts');
    let notices = 0;
    const stop = subscribeSitePublish(() => notices++);
    notifySitePublish();
    assert.equal(notices, 1);
    stop(); notifySitePublish();
    assert.equal(notices, 1);
  } finally { global.window = previous; }
});
test('deployment fingerprints ignore read timestamps but detect edits, removal and newly released posts', () => {
  const { fingerprint } = require('../scripts/content-deployment.cjs');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'publish-fingerprint-'));
  const write = (records, time) => {
    for (const name of ['blog-posts', 'works', 'pages', 'ventures']) fs.writeFileSync(path.join(directory, `${name}.json`), JSON.stringify({ project: 'test', records, generatedAt: time }));
  };
  try {
    write([{ title: 'First' }], 'old'); const first = fingerprint(directory);
    write([{ title: 'First' }], 'new'); assert.equal(fingerprint(directory), first);
    write([{ title: 'Edited' }], 'new'); assert.notEqual(fingerprint(directory), first);
    write([], 'new'); assert.notEqual(fingerprint(directory), first);
    write([{ title: 'First' }, { title: 'Released schedule' }], 'new'); assert.notEqual(fingerprint(directory), first);
  } finally { for (const file of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, file)); fs.rmdirSync(directory); }
});

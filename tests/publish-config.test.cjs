const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const ts = require('typescript');
const { validatePublishConfig, verifyFirebaseSignIn } = require('../scripts/check-publish-config.cjs');
const fixture = () => ({
  NEXT_PUBLIC_FIREBASE_API_KEY: 'AIza' + 'a'.repeat(35),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'fixture-project.firebaseapp.com',
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'fixture-project',
  NEXT_PUBLIC_FIREBASE_APP_ID: '1:123456789:web:abcdef012345',
  NEXT_PUBLIC_MEDIA_UPLOAD_URL: 'https://media.example.test/upload',
  NEXT_PUBLIC_HIMALAYAS_PROXY_URL: 'https://jobs.example.test/jobs',
});
test('publishing rejects assignment strings, quotes, whitespace, missing and malformed public values', () => {
  assert.deepEqual(validatePublishConfig(fixture()), []);
  for (const [name, value] of Object.entries(fixture())) {
    for (const bad of [`${name}=${value}`, `"${value}"`, `'${value}'`, ` ${value}`, `${value}\n`, '']) {
      const errors = validatePublishConfig({ ...fixture(), [name]: bad });
      assert.ok(errors.some(message => message.startsWith(name + ':')), name);
      assert.ok(!errors.join('\n').includes(value), 'configuration values are never logged');
    }
  }
  for (const [name, value] of [
    ['NEXT_PUBLIC_FIREBASE_API_KEY', 'placeholder'], ['NEXT_PUBLIC_FIREBASE_APP_ID', 'wrong-app'],
    ['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', 'https://fixture-project.firebaseapp.com/'],
    ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'wrong/project'],
    ['NEXT_PUBLIC_MEDIA_UPLOAD_URL', 'javascript:alert(1)'], ['NEXT_PUBLIC_HIMALAYAS_PROXY_URL', 'https://user:password@example.test/jobs'],
  ]) assert.ok(validatePublishConfig({ ...fixture(), [name]: value }).length, name);
});
test('live preflight requires an accepted key and authorized production domain, preserving failures', async () => {
  let called = false;
  await verifyFirebaseSignIn(fixture(), async (url, options) => {
    called = true; assert.ok(url.startsWith('https://identitytoolkit.googleapis.com/v1/projects?key='));
    assert.equal(options.headers.Referer, 'https://johnsemblante.com/');
    return { ok: true, json: async () => ({ authorizedDomains: ['johnsemblante.com'] }) };
  });
  assert.ok(called);
  await assert.rejects(verifyFirebaseSignIn(fixture(), async () => ({ ok: false, status: 400 })), /HTTP 400/);
  await assert.rejects(verifyFirebaseSignIn(fixture(), async () => ({ ok: true, json: async () => ({ authorizedDomains: ['other.example'] }) })), /not authorized/);
  await assert.rejects(verifyFirebaseSignIn(fixture(), async () => { throw Error('offline'); }), /offline/);
});
test('CLI blocks malformed settings before networking and never prints their contents', () => {
  const value = `NEXT_PUBLIC_FIREBASE_API_KEY=${fixture().NEXT_PUBLIC_FIREBASE_API_KEY}`;
  const result = spawnSync(process.execPath, ['scripts/check-publish-config.cjs'], {
    env: { ...process.env, ...fixture(), NEXT_PUBLIC_FIREBASE_API_KEY: value }, encoding: 'utf8', timeout: 5000,
  });
  assert.equal(result.status, 1); assert.ok(result.stderr.includes('enter only the value'));
  assert.ok(!result.stderr.includes(fixture().NEXT_PUBLIC_FIREBASE_API_KEY));
});
test('Firebase error messages distinguish bad deployment configuration from account/network failures', () => {
  const out = {};
  const code = ts.transpileModule(fs.readFileSync('src/lib/firebase-client.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(() => ({}), out);
  for (const code of ['auth/invalid-api-key', 'auth/api-key-not-valid.-please-pass-a-valid-api-key.']) assert.match(out.firebaseMessage({ code }), /deployed Firebase sign-in configuration is invalid/);
  assert.match(out.firebaseMessage({ code: 'auth/operation-not-allowed' }), /not enabled/);
  assert.match(out.firebaseMessage({ code: 'permission-denied' }), /Access was denied/);
  assert.match(out.firebaseMessage({ code: 'auth/popup-blocked' }), /Allow the Google sign-in popup/);
  assert.match(out.firebaseMessage({ code: 'auth/network-request-failed' }), /connection/);
});

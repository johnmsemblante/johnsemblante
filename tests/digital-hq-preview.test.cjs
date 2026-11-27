const { test } = require('node:test');
const assert = require('node:assert/strict');
const { assertSource, previewConfig, deployArgs, BRANCH } = require('../scripts/digital-hq-preview.cjs');

test('preview refuses main and stale source commits', () => {
  assert.throws(() => assertSource('main', 'a'), /requires/);
  assert.throws(() => assertSource(BRANCH, 'b', 'a'), /changed/);
  assert.doesNotThrow(() => assertSource(BRANCH, 'a', 'a'));
});

test('preview configuration changes only a copy of Hosting and disables indexing', () => {
  const base = require('../firebase.json');
  const original = JSON.stringify(base);
  const config = previewConfig(base, '/preview/public');
  assert.deepEqual(Object.keys(config), ['hosting']);
  assert.equal(config.hosting.site, 'johnmsemblanteapp');
  assert.equal(config.hosting.public, '/preview/public');
  assert.deepEqual(config.hosting.headers.at(-1).headers, [
    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
    { key: 'Cache-Control', value: 'no-store' },
  ]);
  assert.equal(JSON.stringify(base), original);
});

test('deployment targets a non-live channel without changing Auth domains', () => {
  const args = deployArgs('/preview/config.json');
  assert.deepEqual(args.slice(0, 4), ['hosting:channel:deploy', 'digital-hq', '--project', 'johnmsemblanteapp']);
  assert.ok(args.includes('--no-authorized-domains'));
  assert.equal(args[args.indexOf('--expires') + 1], '30d');
  assert.ok(!args.includes('deploy') && !args.includes('live'));
});

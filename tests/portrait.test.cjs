const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const model = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/portrait-model.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText)(model);
test('cursor targeting is centered at the eyes, directional, bounded and translation invariant', () => {
  const box = { left: 100, top: 50, width: 500, height: 625 };
  assert.deepEqual(model.portraitTarget(350, 310, box), { x: 0, y: 0 });
  assert.ok(model.portraitTarget(900, 310, box).x > 0);
  assert.ok(model.portraitTarget(0, 100, box).x < 0);
  assert.ok(model.portraitTarget(350, 600, box).y > 0);
  assert.deepEqual(model.portraitTarget(500, 400, box), model.portraitTarget(550, 500, { ...box, left: 150, top: 150 }));
  assert.deepEqual(model.portraitTarget(1e8, -1e8, box), { x: 1, y: -1 });
});
test('head response settles without oscillation and is independent of refresh rate', () => {
  function simulate(hz) {
    let state = { position: 0, velocity: 0 }, previous = 0;
    for (let i = 0; i < hz; i++) {
      state = model.advancePortrait(state.position, state.velocity, 1, 1 / hz);
      assert.ok(state.position >= previous && state.position <= 1);
      previous = state.position;
    }
    return state.position;
  }
  assert.ok(simulate(60) > .999);
  assert.ok(Math.abs(simulate(30) - simulate(144)) < 1e-10);
});
test('mesh has finite geometry, valid triangles and unit normals; neck blend is below the face', () => {
  const { vertices, indices } = model.createPortraitMesh();
  assert.ok([...vertices].every(Number.isFinite));
  assert.ok([...indices].every(i => i < vertices.length / 8));
  for (let i = 0; i < vertices.length; i += 8) assert.ok(Math.abs(Math.hypot(...vertices.slice(i + 3, i + 6)) - 1) < 1e-6);
  assert.ok(model.portraitNeck.start >= .74 && model.portraitNeck.end < .9);
  assert.throws(() => model.createPortraitMesh(1000, 1000));
  assert.ok(fs.existsSync('public' + model.portraitArtwork));
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), ts = require('typescript');
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => mocks[name] ?? require(name), exports); return exports;
}
const T = require('three');
const assets = load('src/components/digital-hq/assets.ts');
const config = load('src/components/digital-hq/character-config.ts');
const { CharacterAnimationController, buildPreviewCharacter, loadCharacter } = load('src/components/digital-hq/character.ts', { './assets': assets, './character-config': config });
test('temporary figure is a true skinned 3D rig with usable animation tracks', () => {
  const model = buildPreviewCharacter();
  const meshes = []; model.root.traverse(object => { if (object.isSkinnedMesh) meshes.push(object); });
  assert.ok(meshes.length > 0); assert.ok(meshes.every(mesh => mesh.skeleton.bones.length >= 9));
  assert.ok(meshes.every(mesh => mesh.geometry.attributes.skinWeight.count === mesh.geometry.attributes.position.count));
  assert.ok(new T.Box3().setFromObject(model.root).getSize(new T.Vector3()).y > 4);
  const animation = new CharacterAnimationController(model.root, model.clips, model.names, false);
  animation.play('welcome'); animation.update(.5); assert.equal(animation.state, 'welcome');
  animation.play('introduce'); animation.update(.1); assert.equal(animation.state, 'introduce');
  for (let i = 0; i < 60; i++) animation.update(.05);
  assert.equal(animation.state, 'idle');
  animation.play('typing'); assert.equal(animation.state, 'idle', 'unsupported motion falls back to real idle');
  animation.dispose(); assets.disposeObject(model.root);
});
test('reduced motion holds a stable character pose', () => {
  const model = buildPreviewCharacter(), animation = new CharacterAnimationController(model.root, model.clips, model.names, true);
  animation.play('welcome'); const bone = model.root.getObjectByName('RightArm'); const initial = bone.quaternion.clone();
  animation.update(1); animation.update(1); assert.deepEqual(bone.quaternion.toArray(), initial.toArray());
  animation.dispose(); assets.disposeObject(model.root);
});
test('character loading omits temporary assets from release mode and cancels safely', async () => {
  const controller = new AbortController();
  assert.equal(await loadCharacter({ url: null, preview: false, signal: controller.signal, reducedMotion: false }), null);
  const preview = await loadCharacter({ url: null, preview: true, signal: controller.signal, reducedMotion: false }); assert.ok(preview.temporary); preview.dispose();
  controller.abort(); assert.equal(await loadCharacter({ url: null, preview: true, signal: controller.signal, reducedMotion: false }), null);
  await assert.rejects(loadCharacter({ url: 'https://unapproved.invalid/character.glb', preview: false, signal: new AbortController().signal, reducedMotion: false }), /local/);
});
test('local embedded GLB loads, normalizes bounds and handles a missing asset', async () => {
  const document = { asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }], meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }], buffers: [{ byteLength: 36 }], bufferViews: [{ buffer: 0, byteLength: 36 }], accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }] };
  let json = Buffer.from(JSON.stringify(document)); json = Buffer.concat([json, Buffer.alloc((4 - json.length % 4) % 4, 0x20)]);
  const binary = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]).buffer), glb = Buffer.alloc(12 + 8 + json.length + 8 + binary.length);
  glb.writeUInt32LE(0x46546c67, 0); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8); glb.writeUInt32LE(json.length, 12); glb.writeUInt32LE(0x4e4f534a, 16); json.copy(glb, 20); const offset = 20 + json.length; glb.writeUInt32LE(binary.length, offset); glb.writeUInt32LE(0x004e4942, offset + 4); binary.copy(glb, offset + 8);
  const prior = global.fetch;
  try {
    global.fetch = async () => new Response(glb);
    const loaded = await loadCharacter({ url: '/models/test.glb', preview: false, signal: new AbortController().signal, reducedMotion: true });
    assert.ok(loaded && !loaded.temporary); assert.ok(Math.abs(new T.Box3().setFromObject(loaded.root).getSize(new T.Vector3()).y - config.characterConfig.height) < .001); loaded.dispose();
    global.fetch = async () => new Response(null, { status: 404 });
    await assert.rejects(loadCharacter({ url: '/models/missing.glb', preview: false, signal: new AbortController().signal, reducedMotion: true }), /unavailable/);
  } finally { global.fetch = prior; }
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { inspectPortraitGlb, importPortraitModel } = require('../scripts/import-portrait-model.cjs');

function fixture(change = () => {}) {
  const doc = {
    asset: { version: '2.0' }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
    buffers: [{ byteLength: 42 }], bufferViews: [{ buffer: 0, byteLength: 36 }, { buffer: 0, byteOffset: 36, byteLength: 6 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-1, -1, 0], max: [1, 1, 0] }, { bufferView: 1, componentType: 5123, count: 3, type: 'SCALAR' }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 }, indices: 1 }] }],
  };
  change(doc);
  const json = Buffer.from(JSON.stringify(doc));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const glb = Buffer.alloc(12 + 8 + jsonLength + 8 + 44);
  glb.write('glTF'); glb.writeUInt32LE(2, 4); glb.writeUInt32LE(glb.length, 8);
  glb.writeUInt32LE(jsonLength, 12); glb.writeUInt32LE(0x4e4f534a, 16);
  glb.fill(32, 20, 20 + jsonLength); json.copy(glb, 20);
  const bin = 20 + jsonLength;
  glb.writeUInt32LE(44, bin); glb.writeUInt32LE(0x004e4942, bin + 4);
  [-1, -1, 0, 1, -1, 0, 0, 1, 0].forEach((v, i) => glb.writeFloatLE(v, bin + 8 + i * 4));
  [0, 1, 2].forEach((v, i) => glb.writeUInt16LE(v, bin + 44 + i * 2));
  return glb;
}

test('imported GLB is self-contained, content-addressed, and readable by the actual renderer loader', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'portrait-import-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'src/content'), { recursive: true });
  const input = path.join(root, 'download.glb'); fs.writeFileSync(input, fixture());
  const result = importPortraitModel(input, root);
  assert.equal(result.triangles, 1);
  const config = JSON.parse(fs.readFileSync(path.join(root, 'src/content/hero-portrait.json')));
  assert.equal(config.modelUrl, result.modelUrl);
  const imported = fs.readFileSync(path.join(root, 'public', result.modelUrl));
  assert.deepEqual(imported, fixture());
  assert.equal(importPortraitModel(input, root).modelUrl, result.modelUrl);
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const loaded = await new GLTFLoader().parseAsync(imported.buffer.slice(imported.byteOffset, imported.byteOffset + imported.byteLength), '');
  assert.equal(loaded.scene.children[0].geometry.getAttribute('position').count, 3);
  loaded.scene.children[0].geometry.dispose(); loaded.scene.children[0].material.dispose();
});

test('unsupported, remote, oversized, and incomplete models are rejected before import', () => {
  assert.throws(() => inspectPortraitGlb(Buffer.from('not a model')), /GLB/);
  assert.throws(() => inspectPortraitGlb(fixture().subarray(0, 40)), /complete/);
  assert.throws(() => inspectPortraitGlb(Buffer.alloc(13 * 1024 * 1024)), /budget/);
  assert.throws(() => inspectPortraitGlb(fixture(d => d.buffers[0].uri = 'https://example.com/mesh.bin')), /embedded/);
  assert.throws(() => inspectPortraitGlb(fixture(d => d.images = [{ uri: 'texture.png' }])), /embedded/);
  assert.throws(() => inspectPortraitGlb(fixture(d => d.bufferViews[0].byteLength = 100000)), /bounds/);
  assert.throws(() => inspectPortraitGlb(fixture(d => d.extensionsRequired = ['KHR_draco_mesh_compression'])), /extensions/);
  assert.throws(() => inspectPortraitGlb(fixture(d => d.accessors[1].count = 600000)), /triangles/);
  assert.throws(() => inspectPortraitGlb(fixture(d => d.skins = [{}])), /unrigged/);
});

test('configured portrait assets exist, pass the importer, and use a finite orientation', () => {
  const config = require('../src/content/hero-portrait.json');
  assert.equal(config.rotation.length, 3);
  assert.ok(config.rotation.every(Number.isFinite));
  if (config.modelUrl === null) return; // Genuine mesh is still awaiting export and review.
  assert.match(config.modelUrl, /^\/models\/portrait\/john-[a-f0-9]{12}\.glb$/);
  inspectPortraitGlb(fs.readFileSync(path.join('public', config.modelUrl)));
});

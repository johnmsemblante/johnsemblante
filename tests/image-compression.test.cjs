const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const exportsObject = {};
new Function('exports', ts.transpileModule(fs.readFileSync('src/lib/image-compression.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText)(exportsObject);
const { inspectImage, targetBytes, downloadName, compressImage } = exportsObject;
function png(width = 1200, height = 800, size = 300000) {
  const bytes = Buffer.alloc(size); Buffer.from([137,80,78,71,13,10,26,10]).copy(bytes);
  bytes.writeUInt32BE(13, 8); bytes.write('IHDR', 12); bytes.writeUInt32BE(width, 16); bytes.writeUInt32BE(height, 20);
  return new Blob([bytes], { type: 'image/png' });
}
test('decimal targets and format-appropriate download names', () => {
  assert.equal(targetBytes('100', 'KB'), 100000); assert.equal(targetBytes('.2', 'MB'), 200000);
  for (const value of ['', '-2', '0', 'Infinity', '0.1', '20001']) assert.throws(() => targetBytes(value, 'KB'));
  assert.equal(downloadName('photo.png', 'image/jpeg'), 'photo-compressed.jpg');
  assert.equal(downloadName('photo.jpg', 'image/webp'), 'photo-compressed.webp');
});
test('header validation rejects empty, unsupported, corrupted and excessive dimensions before decode', async () => {
  await assert.rejects(inspectImage(new Blob()), /empty/);
  await assert.rejects(inspectImage(new Blob(['fake.jpg'])), /Unsupported/);
  await assert.rejects(inspectImage(new Blob([new Uint8Array(20000001)])), /20 MB/);
  await assert.rejects(inspectImage(png(12000, 12000)), /24 megapixels/);
  await assert.rejects(inspectImage(png(0, 1)), /damaged/);
  assert.deepEqual(await inspectImage(png()), { width: 1200, height: 800, format: 'image/png' });
});
test('bounded target search measures actual blobs, shrinks PNG, preserves already-small input and checks MIME', async () => {
  let encodes = 0, closed = 0, requested = 'image/jpeg';
  global.createImageBitmap = async () => ({ width: 1200, height: 800, close() { closed++; } });
  global.OffscreenCanvas = class {
    constructor(w, h) { this.width = w; this.height = h; }
    getContext() { return { fillRect() {}, drawImage() {} }; }
    async convertToBlob({ type, quality }) { encodes++; return new Blob([new Uint8Array(Math.ceil(this.width * this.height * (type === 'image/png' ? 1 : quality / 2)))], { type: requested || type }); }
  };
  try {
    for (const target of [50000, 100000, 200000, 500000]) {
      encodes = 0;
      const result = await compressImage(png(), { mode: 'target', target, quality: .8, format: 'image/jpeg' });
      assert.ok(result.blob.size <= target); assert.ok(encodes <= 22); assert.equal(result.blob.type, 'image/jpeg');
    }
    requested = '';
    const pngResult = await compressImage(png(), { mode: 'target', target: 50000, quality: .8, format: 'image/png' });
    assert.ok(pngResult.blob.size <= 50000); assert.ok(pngResult.width < 1200);
    const unchanged = await compressImage(png(), { mode: 'target', target: 500000, quality: .8, format: 'image/png' });
    assert.ok(unchanged.unchanged); assert.equal(unchanged.blob.size, 300000);
    const quality = await compressImage(png(), { mode: 'quality', target: 100000, quality: .7, format: 'image/webp' });
    assert.equal(quality.blob.type, 'image/webp');
    requested = 'image/png';
    await assert.rejects(compressImage(png(), { mode: 'quality', target: 100000, quality: .7, format: 'image/webp' }), /cannot export/);
    assert.ok(closed >= 8);
  } finally { delete global.createImageBitmap; delete global.OffscreenCanvas; }
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { PDFDocument, degrees } = require('pdf-lib');
let canvas;
try {
  canvas = require('@napi-rs/canvas');
  Object.assign(globalThis, { DOMMatrix: canvas.DOMMatrix, ImageData: canvas.ImageData, Path2D: canvas.Path2D });
} catch { /* Native canvas can be blocked by Windows Application Control. */ }
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => mocks[name] ?? require(name), exports);
  return exports;
}
const model = load('src/lib/pdf-editor-model.ts');
const { exportEditedPdf } = load('src/lib/pdf-editor-export.ts', { './pdf-editor-model': model });
const png = canvas?.createCanvas(40, 20);
if (png) { const ctx = png.getContext('2d'); ctx.fillStyle = '#ff0000'; ctx.fillRect(0, 0, 40, 20); }
const annotation = { id: 'a', kind: 'signature', x: 100, y: 200, width: 40, height: 20, angle: 0, png: png?.toDataURL('image/png') ?? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==' };

test('PDF header and resource limits reject invalid inputs', () => {
  for (const input of [new Uint8Array(), new TextEncoder().encode('not a pdf'), new Uint8Array(model.PDF_LIMITS.bytes + 1)]) assert.throws(() => model.validatePdfBytes(input));
  assert.doesNotThrow(() => model.validatePdfBytes(new TextEncoder().encode('%PDF-1.7')));
  assert.equal(model.normalizeRotation(-90), 270);
});

test('saved PDFs preserve original text, page identity, rotation and nonzero page count', async () => {
  const original = await PDFDocument.create();
  for (let index = 0; index < 3; index++) original.addPage([400 + index * 10, 600]).drawText(`Original page ${index + 1}`);
  const bytes = await original.save();
  const states = [0, 2].map(index => ({ id: `page-${index}`, sourceIndex: index, rotation: index ? 90 : 0, annotations: index ? [annotation] : [] }));
  const output = await exportEditedPdf(bytes, states), reopened = await PDFDocument.load(output);
  assert.equal(reopened.getPageCount(), 2); assert.equal(reopened.getPage(1).getWidth(), 420); assert.equal(reopened.getPage(1).getRotation().angle, 90);
  const renderer = await import('pdfjs-dist');
  const doc = await renderer.getDocument({ data: output.slice() }).promise;
  try {
    assert.match((await (await doc.getPage(1)).getTextContent()).items.map(item => item.str).join(''), /Original page 1/);
    assert.match((await (await doc.getPage(2)).getTextContent()).items.map(item => item.str).join(''), /Original page 3/);
  } finally { await doc.loadingTask.destroy(); }
  assert.equal((await PDFDocument.load(bytes)).getPageCount(), 3, 'original remains unchanged');
  await assert.rejects(exportEditedPdf(bytes, []));
  await assert.rejects(exportEditedPdf(bytes, [{ ...states[0], sourceIndex: 7 }]));
});

test('exported annotation pixels match preview coordinates for portrait, landscape, crop offsets, rotations and zoom', { skip: !canvas && 'Native canvas blocked/unavailable on this host' }, async () => {
  const renderer = await import('pdfjs-dist');
  for (const dimensions of [[400, 600], [600, 400]]) {
    for (const initial of [0, 90, 180, 270]) {
      for (const turn of [0, 90]) {
        const original = await PDFDocument.create(), page = original.addPage(dimensions);
        page.setCropBox(20, 30, dimensions[0] - 40, dimensions[1] - 60); page.setRotation(degrees(initial));
        const a = { ...annotation, angle: initial };
        const output = await exportEditedPdf(await original.save(), [{ id: 'p', sourceIndex: 0, rotation: model.normalizeRotation(initial + turn), annotations: [a] }]);
        const doc = await renderer.getDocument({ data: output }).promise;
        try {
          const proxy = await doc.getPage(1);
          for (const scale of [.5, 1.5]) {
            const viewport = proxy.getViewport({ scale });
            const surface = canvas.createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
            await proxy.render({ canvas: surface, canvasContext: surface.getContext('2d'), viewport }).promise;
            const { data } = surface.getContext('2d').getImageData(0, 0, surface.width, surface.height);
            let left = Infinity, top = Infinity, right = -1, bottom = -1;
            for (let y = 0; y < surface.height; y++) for (let x = 0; x < surface.width; x++) {
              const i = (y * surface.width + x) * 4;
              if (data[i] > 200 && data[i + 1] < 60 && data[i + 2] < 60) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y); }
            }
            const theta = a.angle * Math.PI / 180;
            const corners = [[0, 0], [a.width, 0], [0, a.height], [a.width, a.height]].map(([x, y]) => viewport.convertToViewportPoint(a.x + x * Math.cos(theta) + y * Math.sin(theta), a.y + x * Math.sin(theta) - y * Math.cos(theta)));
            const expected = [Math.min(...corners.map(p => p[0])), Math.min(...corners.map(p => p[1])), Math.max(...corners.map(p => p[0])), Math.max(...corners.map(p => p[1]))];
            for (const [i, value] of [left, top, right + 1, bottom + 1].entries()) assert.ok(Math.abs(value - expected[i]) <= 1.5, `placement mismatch ${dimensions}, rotation ${initial}+${turn}, zoom ${scale}: ${value} vs ${expected[i]}`);
          }
        } finally { await doc.loadingTask.destroy(); }
      }
    }
  }
});

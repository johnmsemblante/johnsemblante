// Self-host every PDF.js resource; no document data or worker requests go to a CDN.
const fs = require('node:fs');
const path = require('node:path');
const root = path.dirname(require.resolve('pdfjs-dist/package.json'));
const { version } = require('pdfjs-dist/package.json');
const destination = path.join(__dirname, '../public/tools/pdf-editor');
fs.mkdirSync(destination, { recursive: true });
fs.copyFileSync(path.join(root, 'build/pdf.worker.min.mjs'), path.join(destination, `pdf.worker-${version}.min.mjs`));
for (const directory of ['cmaps', 'standard_fonts', 'wasm']) fs.cpSync(path.join(root, directory), path.join(destination, directory), { recursive: true });
fs.copyFileSync(path.join(root, 'LICENSE'), path.join(destination, 'PDFJS-LICENSE.txt'));
fs.copyFileSync(path.join(path.dirname(require.resolve('pdf-lib/package.json')), 'LICENSE.md'), path.join(destination, 'PDF-LIB-LICENSE.txt'));
console.log(`Prepared local PDF.js ${version} assets.`);

const { createHash } = require('node:crypto');
const { mkdir, readFile, readdir, writeFile } = require('node:fs/promises');
const { join } = require('node:path');
const sharp = require('sharp');

const output = 'images/social-previews';
const width = 1200;
const height = 630;

async function* images(directory) {
  for (const entry of await readdir(join('public', directory), { withFileTypes: true })) {
    const path = directory + '/' + entry.name;
    if (path === '/' + output || path === '/images/donations') continue;
    if (entry.isDirectory()) yield* images(path);
    else if (entry.isFile() && /\.(?:avif|gif|jpe?g|png|webp)$/i.test(path)) yield path;
  }
}

async function prepare() {
  await mkdir(join('public', output), { recursive: true });
  await mkdir('.generated', { recursive: true });
  const manifest = {};
  for await (const path of images('')) {
    const input = await readFile(join('public', path));
    const card = await sharp(input, { limitInputPixels: 36_000_000 })
      .rotate()
      .resize(width, height, { fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 84 })
      .toBuffer();
    const hash = createHash('sha256').update(card).digest('hex').slice(0, 24);
    const url = `/${output}/${hash}.jpg`;
    await writeFile(join('public', url), card);
    manifest[path] = { url, width, height, type: 'image/jpeg' };
  }
  await writeFile('.generated/social-images.json', JSON.stringify(manifest));
  console.log(`Prepared ${Object.keys(manifest).length} local social preview images.`);
}

prepare().catch(error => { console.error(error); process.exitCode = 1; });

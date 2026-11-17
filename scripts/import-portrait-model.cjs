const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/** Check the static site's supported format before copying any file or changing configuration. */
function inspectPortraitGlb(bytes) {
  if (bytes.length > 12 * 1024 * 1024) throw new Error('Model exceeds the 12 MiB portrait budget; export fewer faces or smaller textures.');
  if (bytes.length < 28 || bytes.toString('ascii', 0, 4) !== 'glTF'
    || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error('Expected a complete GLB 2.0 file.');
  const jsonSize = bytes.readUInt32LE(12);
  if (bytes.readUInt32LE(16) !== 0x4e4f534a || jsonSize % 4 || 20 + jsonSize + 8 > bytes.length) throw new Error('Invalid GLB JSON chunk.');
  const doc = JSON.parse(bytes.toString('utf8', 20, 20 + jsonSize).trim());
  const binStart = 20 + jsonSize;
  const binSize = bytes.readUInt32LE(binStart);
  if (bytes.readUInt32LE(binStart + 4) !== 0x004e4942 || binStart + 8 + binSize !== bytes.length) throw new Error('Expected an embedded binary buffer.');
  if (doc.asset?.version !== '2.0' || doc.buffers?.length !== 1 || doc.buffers[0].uri
    || !Number.isInteger(doc.buffers[0].byteLength) || doc.buffers[0].byteLength > binSize) throw new Error('Use one embedded GLB buffer.');
  for (const view of doc.bufferViews ?? []) {
    if (view.buffer !== 0 || !Number.isInteger(view.byteLength) || view.byteLength < 0
      || !Number.isInteger(view.byteOffset ?? 0) || (view.byteOffset ?? 0) < 0
      || (view.byteOffset ?? 0) + view.byteLength > doc.buffers[0].byteLength) throw new Error('Invalid GLB buffer bounds.');
  }
  if ((doc.images ?? []).some(image => image.uri || !doc.bufferViews?.[image.bufferView])) throw new Error('All textures must be embedded in the GLB.');
  const unsupported = (doc.extensionsRequired ?? []).filter(name => !['EXT_texture_webp', 'KHR_mesh_quantization', 'KHR_materials_unlit'].includes(name));
  if (unsupported.length) throw new Error('Re-export without these required extensions: ' + unsupported.join(', '));
  if (doc.skins?.length) throw new Error('Export an unrigged mesh; this renderer adds its own portrait neck rig.');
  let triangles = 0;
  for (const mesh of doc.meshes ?? []) for (const primitive of mesh.primitives ?? []) {
    const positions = doc.accessors?.[primitive.attributes?.POSITION];
    const indices = primitive.indices === undefined ? positions : doc.accessors?.[primitive.indices];
    if ((primitive.mode ?? 4) !== 4 || !positions || positions.type !== 'VEC3' || !indices
      || !Number.isInteger(indices.count) || indices.count <= 0 || indices.count % 3) throw new Error('Expected triangle meshes with valid position and index counts.');
    if (primitive.targets?.length) throw new Error('Export without morph targets before applying the portrait neck rig.');
    triangles += indices.count / 3;
  }
  if (!triangles || triangles > 150000) throw new Error('Export between 1 and 150,000 triangles (100,000 recommended in the free demo).');
  return { triangles, bytes: bytes.length, textures: doc.images?.length ?? 0 };
}

function importPortraitModel(file, root = path.resolve(__dirname, '..')) {
  const bytes = fs.readFileSync(file);
  const report = inspectPortraitGlb(bytes);
  const digest = crypto.createHash('sha256').update(bytes).digest('hex').slice(0, 12);
  const modelUrl = `/models/portrait/john-${digest}.glb`;
  const destination = path.join(root, 'public', modelUrl);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, bytes);
  // Reset orientation for a newly imported asset; calibration must be reviewed locally.
  fs.writeFileSync(path.join(root, 'src/content/hero-portrait.json'), JSON.stringify({ modelUrl, rotation: [0, 0, 0] }, null, 2) + '\n');
  return { ...report, modelUrl };
}

if (require.main === module) {
  try {
    if (!process.argv[2]) throw new Error('Usage: npm run portrait:import -- "path/to/downloaded-model.glb"');
    console.log(JSON.stringify(importPortraitModel(process.argv[2]), null, 2));
    console.log('Imported for local preview. Review orientation, likeness and neck weighting before publishing. Set modelUrl to null to restore the shallow portrait.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { inspectPortraitGlb, importPortraitModel };

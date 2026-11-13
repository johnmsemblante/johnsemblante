const fs = require('node:fs');
const { createHash } = require('node:crypto');

// Snapshot generation timestamps change on every read; only public content counts.
function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  return value;
}
function fingerprint(directory = '.generated') {
  const contents = ['blog-posts', 'works', 'pages', 'ventures'].map(name => {
    const { generatedAt, ...content } = JSON.parse(fs.readFileSync(`${directory}/${name}.json`, 'utf8'));
    return content;
  });
  return createHash('sha256').update(JSON.stringify(stable(contents))).digest('hex');
}
async function main() {
  const digest = fingerprint();
  if (process.argv[2] === 'write') {
    fs.writeFileSync('out/content-deployment.json', JSON.stringify({ fingerprint: digest, builtAt: new Date().toISOString() }));
    return;
  }
  let changed = true;
  const response = await fetch('https://johnsemblante.com/content-deployment.json', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
  if (response.ok) changed = (await response.json()).fingerprint !== digest;
  else if (response.status !== 404) throw new Error(`Could not check deployed content (${response.status})`);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  console.log(changed ? 'Public content differs; build required.' : 'Public content unchanged; scheduled build skipped.');
}
module.exports = { stable, fingerprint };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });

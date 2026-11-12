const fs = require('node:fs'), ts = require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
function load(file, deps = {}) {
  const out = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  new Function('require', 'exports', code)(name => deps[name] ?? require(name), out);
  return out;
}
(async () => {
  const model = load('src/lib/page-model.ts');
  const { fetchPublicPages } = load('src/lib/public-pages.ts', { './page-model': model });
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || JSON.parse(fs.readFileSync('.firebaserc', 'utf8')).projects.default;
  const records = await fetchPublicPages(project);
  fs.mkdirSync('.generated', { recursive: true });
  fs.writeFileSync('.generated/pages.tmp', JSON.stringify({ project, records, generatedAt: new Date().toISOString() }));
  fs.renameSync('.generated/pages.tmp', '.generated/pages.json');
  console.log(`Prepared ${Object.keys(records).length} page overrides for static export.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });

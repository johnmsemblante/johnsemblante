const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
require('@next/env').loadEnvConfig(process.cwd());
function load(file, dependencies = {}) {
  const output = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText;
  new Function('require', 'exports', code)(name => dependencies[name] ?? require(name), output);
  return output;
}
(async () => {
  const model = load('src/lib/blog-model.ts');
  const { fetchPublicBlogSnapshot } = load('src/lib/public-blog-snapshot.ts', { './blog-model': model });
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || JSON.parse(fs.readFileSync('.firebaserc', 'utf8')).projects?.default;
  if (!project) throw new Error('Configure a public Firebase project ID before exporting the blog.');
  const posts = project ? await fetchPublicBlogSnapshot(project) : [];
  const directory = path.resolve('.generated');
  fs.mkdirSync(directory, { recursive: true });
  const target = path.join(directory, 'blog-posts.json');
  const temporary = path.join(directory, 'blog-posts.tmp');
  fs.writeFileSync(temporary, JSON.stringify({ project: project || null, generatedAt: new Date().toISOString(), posts }));
  fs.renameSync(temporary, target);
  console.log(`Prepared ${posts.length} public blog articles for static export${project ? '.' : ' (Firebase is not configured).'}`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });

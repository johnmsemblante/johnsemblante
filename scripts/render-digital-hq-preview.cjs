// Renders the actual scene modules, not a generated mockup. No runtime dependency.
// node scripts/render-digital-hq-preview.cjs --playwright <installed package path>
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const ts = require('typescript'), sharp = require('sharp');
const args = process.argv.slice(2), index = args.indexOf('--playwright');
if (index < 0 || !args[index + 1]) throw Error('Supply --playwright <installed package path>.');
const { chromium } = require(path.resolve(args[index + 1]));
const output = path.resolve('tmp/digital-hq/render'); fs.mkdirSync(output, { recursive: true });
for (const name of ['assets', 'environment', 'objects', 'character', 'character-config', 'lighting', 'background', 'background-config']) {
  const source = fs.readFileSync(`src/components/digital-hq/${name}.ts`, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText
    .replace(/from "\.\/(assets|objects|character-config|background)"/g, 'from "./$1.js"').replace(/process.env.NODE_ENV/g, '"development"').replace(/process.env.NEXT_PUBLIC_DIGITAL_HQ_PREVIEW/g, '"false"');
  fs.writeFileSync(path.join(output, name + '.js'), compiled);
}
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html><head><style>html,body{margin:0;background:#171927}canvas{display:block}</style><script type="importmap">{"imports":{"three":"/vendor/build/three.module.js","three/addons/":"/vendor/examples/jsm/"}}</script></head><body><script type="module">
import * as T from 'three'; import { buildEnvironment } from './environment.js'; import { buildPreviewCharacter } from './character.js'; import { hqObjects, overview } from './objects.js'; import { buildLighting } from './lighting.js'; import { HQ_BACKGROUND_URL } from './background-config.js';
document.body.style.backgroundImage='url('+HQ_BACKGROUND_URL+')';document.body.style.backgroundPosition='center';document.body.style.backgroundSize='cover';const background=new Image();background.src=HQ_BACKGROUND_URL;await background.decode();
const renderer=new T.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(1);renderer.setSize(innerWidth,innerHeight);renderer.setClearColor('#000000',0);renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;document.body.appendChild(renderer.domElement);
const scene=new T.Scene();const environment=await buildEnvironment();scene.add(environment.root,buildLighting(true).root);if(location.search.includes('character=1'))scene.add(buildPreviewCharacter().root);
const camera=new T.PerspectiveCamera(43,innerWidth/innerHeight,.1,100);const target=new T.Vector3(...overview.target);camera.position.set(...overview.position).sub(target).multiplyScalar(Math.max(1,1.64/(innerWidth/innerHeight))).add(target);camera.lookAt(target);camera.updateMatrixWorld();await renderer.compileAsync(scene,camera);renderer.render(scene,camera);
window.metadata={anchors:Object.fromEntries(hqObjects.map(item=>{const v=new T.Vector3(...item.anchor).project(camera);return[item.id,[(v.x*.5+.5)*100,(-v.y*.5+.5)*100]]})),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures};window.ready=true;
</script></body></html>`);
const vendor = path.resolve('node_modules/three');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost'), isVendor = url.pathname.startsWith('/vendor/'), isAsset = url.pathname.startsWith('/images/');
  const root = isVendor ? vendor : isAsset ? path.resolve('public') : output, file = path.resolve(root, isVendor ? url.pathname.slice(8) : url.pathname.slice(1) || 'index.html');
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  try { const body = fs.readFileSync(file); res.setHeader('Content-Type', file.endsWith('.js') ? 'text/javascript' : file.endsWith('.webp') ? 'image/webp' : 'text/html'); res.end(body); } catch { res.writeHead(404).end(); }
});
(async () => {
  await new Promise(resolve => server.listen(3112, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.HQ_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    fs.mkdirSync('public/images/digital-hq', { recursive: true }); const report = {};
    for (const [name, hasCharacter] of [['workspace', false], ['preview', true]]) {
      for (const [suffix, width, height] of [['', 1920, 1080], ['-mobile', 1000, 720]]) {
        const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 }); page.on('pageerror', error => console.error(error));
        await page.goto('http://127.0.0.1:3112/?character=' + Number(hasCharacter)); await page.waitForFunction(() => window.ready);
        const file = `tmp/digital-hq/${name}${suffix}.png`; await page.screenshot({ path: file }); report[name + suffix] = await page.evaluate(() => window.metadata);
        const input = sharp(file); if (suffix) input.resize(800);
        await input.clone().webp({ quality: 85 }).toFile(`public/images/digital-hq/${name}${suffix}.webp`);
        await input.clone().avif({ quality: 54, effort: 5 }).toFile(`public/images/digital-hq/${name}${suffix}.avif`); await page.close();
      }
    }
    fs.writeFileSync('tmp/digital-hq/scene-metadata.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });

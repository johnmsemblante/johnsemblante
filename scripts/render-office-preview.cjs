// Regenerate the static preview from the exact same scene as the live homepage.
// Usage: node scripts/render-office-preview.cjs --playwright <installed playwright directory>
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const ts = require('typescript');
const sharp = require('sharp');
const args = process.argv.slice(2);
const playwrightPath = args[args.indexOf('--playwright') + 1];
if (!args.includes('--playwright') || !playwrightPath) throw new Error('Supply --playwright with a local Playwright package directory.');
const { chromium } = require(path.resolve(playwrightPath));
const output = path.resolve('tmp/office/render');
fs.mkdirSync(output, { recursive: true });
for (const name of ['model', 'renderer', 'rooms']) {
  const source = fs.readFileSync(`src/components/office/${name}.ts`, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 }}).outputText.replace(/from "\.\/(model|rooms)"/g, 'from "./$1.js"');
  fs.writeFileSync(path.join(output, name+'.js'), compiled);
}
fs.writeFileSync(path.join(output, 'index.html'), `<!doctype html><html><head><style>html,body{margin:0;background:#101319}#scene{width:100vw;height:100vh}</style><script type="importmap">{"imports":{"three":"/vendor/build/three.module.js","three/addons/":"/vendor/examples/jsm/"}}</script></head><body><div id="scene"></div><script type="module">import { createOfficeRenderer } from './renderer.js';window.anchors={};window.office=await createOfficeRenderer(document.querySelector('#scene'),{quality:'high',reducedMotion:true,project:(id,x,y)=>window.anchors[id]=[x/innerWidth*100,y/innerHeight*100],failed:()=>{throw Error('Context lost')}});window.ready=true;</script></body></html>`);
const vendor = path.resolve('node_modules/three');
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const root = url.pathname.startsWith('/vendor/') ? vendor : output;
  const relative = url.pathname.startsWith('/vendor/') ? url.pathname.slice(8) : url.pathname.slice(1) || 'index.html';
  const file = path.resolve(root, relative);
  if (!file.startsWith(root+path.sep)) { res.writeHead(403).end(); return; }
  try { const body=fs.readFileSync(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':'text/html');res.end(body); }
  catch { res.writeHead(404).end(); }
});
(async()=>{
  await new Promise(resolve=>server.listen(3112,'127.0.0.1',resolve));
  const executablePath = process.env.OFFICE_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
  const browser=await chromium.launch({executablePath,headless:true});
  try {
    const page=await browser.newPage({viewport:{width:1672,height:850},deviceScaleFactor:1});
    page.on('pageerror',error=>console.error(error));
    await page.goto('http://127.0.0.1:3112/');await page.waitForFunction(()=>window.ready);
    await page.waitForTimeout(1000);
    const metadata=await page.evaluate(()=>({anchors:window.anchors,renderer:window.office.info()}));
    await page.screenshot({path:'tmp/office/scene-desktop.png'});
    fs.mkdirSync('public/images/office',{recursive:true});
    await sharp('tmp/office/scene-desktop.png').webp({quality:85}).toFile('public/images/office/workspace.webp');
    await sharp('tmp/office/scene-desktop.png').avif({quality:55,effort:6}).toFile('public/images/office/workspace.avif');
    await page.setViewportSize({width:1000,height:720});await page.waitForTimeout(400);
    await page.screenshot({path:'tmp/office/scene-mobile.png'});
    await sharp('tmp/office/scene-mobile.png').resize(640).webp({quality:76}).toFile('public/images/office/workspace-mobile.webp');
    await sharp('tmp/office/scene-mobile.png').resize(640).avif({quality:50,effort:6}).toFile('public/images/office/workspace-mobile.avif');
    fs.writeFileSync('tmp/office/scene-metadata.json',JSON.stringify(metadata,null,2));
    console.log(JSON.stringify({...metadata,previewBytes:fs.statSync('public/images/office/workspace.webp').size,mobilePreviewBytes:fs.statSync('public/images/office/workspace-mobile.webp').size,avifPreviewBytes:fs.statSync('public/images/office/workspace.avif').size,avifMobilePreviewBytes:fs.statSync('public/images/office/workspace-mobile.avif').size},null,2));
  }finally{await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});

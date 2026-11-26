// Production browser checks. Requires an existing local Playwright installation.
// node scripts/check-office-browser.cjs --playwright <directory> [--url http://127.0.0.1:3100] [--axe <axe.min.js>]
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const args=process.argv.slice(2);const arg=name=>args.includes(name)?args[args.indexOf(name)+1]:undefined;
if(!arg('--playwright'))throw Error('Supply --playwright <package directory>.');
const {chromium}=require(path.resolve(arg('--playwright')));
const url=arg('--url')||'http://127.0.0.1:3100';
const output=path.resolve('tmp/office');fs.mkdirSync(output,{recursive:true});
const report={checks:[],screens:[],errors:[],accessibility:[],engineScripts:[]};
function passed(name){report.checks.push(name);console.log('PASS '+name);}
async function instruments(context){await context.addInitScript(()=>{
  window.officeTest={contexts:[],draws:0,lost:0};
  const original=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){const result=original.call(this,type,...args);if(result&&/^webgl/.test(type)&&!window.officeTest.contexts.includes(result)){window.officeTest.contexts.push(result);this.addEventListener('webglcontextlost',()=>window.officeTest.lost++);}return result;};
  for(const method of ['drawArrays','drawElements']){const original=WebGL2RenderingContext.prototype[method];WebGL2RenderingContext.prototype[method]=function(...args){window.officeTest.draws++;return original.apply(this,args);};}
});}
async function loaded(page){await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('.office-hero').waitFor();await page.locator('.office-preview img').evaluate(image=>image.decode());await page.evaluate(()=>document.fonts.ready);await page.waitForFunction(()=>document.documentElement.dataset.homePresentation==='interactive');}
async function ready(page){await page.mouse.move(101,201);await page.waitForFunction(()=>document.querySelector('.office-hero')?.dataset.live==='true',{},{timeout:30000});}
async function noOverflow(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'document overflow');}
async function shot(page,name){await page.screenshot({path:path.join(output,name+'.png')});report.screens.push(name+'.png');}
async function axe(page,label){if(!arg('--axe'))return;await page.addScriptTag({path:path.resolve(arg('--axe'))});const results=await page.evaluate(()=>window.axe.run({include:[['.office-hero'],['.site-header']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}}));report.accessibility.push({label,violations:results.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}))});}
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.OFFICE_BROWSER||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try{
    const context=await browser.newContext({viewport:{width:1672,height:941},deviceScaleFactor:1});await instruments(context);
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    const scripts=new Set();page.on('request',request=>{if(request.resourceType()==='script')scripts.add(new URL(request.url()).pathname);});
    await loaded(page);await page.waitForTimeout(300);assert.equal(await page.locator('.office-canvas canvas').count(),0);passed('passive arrival keeps the interactive preview and defers WebGL until exploration');await ready(page);await noOverflow(page);
    assert.equal(await page.locator('h1').count(),1);assert.match(await page.locator('h1').innerText(),/Cebu Web Developer/);
    assert.equal(await page.locator('.office-canvas canvas').count(),1);
    const rectangles=await page.locator('.office-hotspot').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};}));
    for(let i=0;i<rectangles.length;i++)for(let j=i+1;j<rectangles.length;j++){const a=rectangles[i],b=rectangles[j];assert.ok(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y,'overlapping desktop hotspots');}
    await shot(page,'workspace-desktop');await axe(page,'desktop');passed('desktop overview, one H1, one canvas, anchored labels without overlap');
    const rooms=['about','work','ventures','tools','arcade','blog','skills','contact'];
    for(const id of rooms){const trigger=page.locator('.office-hotspot-'+id);await trigger.focus();await page.keyboard.press('Enter');const panel=page.locator('#office-room-panel');assert.equal(await panel.evaluate(e=>e.open),true);assert.ok(await panel.locator('a[href]').count()>0);await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>!!document.activeElement.closest('dialog')),true);if(id==='work'){await page.waitForTimeout(900);await shot(page,'workspace-works-panel');await axe(page,'works panel');}await page.keyboard.press('Escape');assert.equal(await panel.evaluate(e=>e.open),false);assert.equal(await trigger.evaluate(e=>e===document.activeElement),true);}
    passed('all eight panels, keyboard opening/closing, contained focus and focus restoration');
    for(const script of scripts){const file=path.resolve('out','.'+script);if(script.startsWith('/_next/')&&fs.existsSync(file))assert.ok(!fs.readFileSync(file,'utf8').includes('neon-dash:v2:player-data'),'homepage requested the Neon Dash engine');}passed('homepage navigation does not request the Neon Dash engine');
    await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.getByRole('button',{name:'Rotate workspace left',exact:true}).click();await page.getByRole('button',{name:'Reset workspace view',exact:true}).click();await page.waitForTimeout(1200);
    const idle=await page.evaluate(()=>window.officeTest.draws);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.officeTest.draws),idle);passed('camera controls settle and stop drawing while idle');
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});const hidden=await page.evaluate(()=>window.officeTest.draws);await page.getByRole('button',{name:'Zoom in',exact:true}).click();await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.officeTest.draws),hidden);await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(900);assert.ok(await page.evaluate(()=>window.officeTest.draws)>hidden);passed('simulated hidden-tab visibility pauses and resumes rendering');
    await page.locator('#services-title').scrollIntoViewIfNeeded();await page.waitForTimeout(300);const outside=await page.evaluate(()=>window.officeTest.draws);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.officeTest.draws),outside);await page.evaluate(()=>scrollTo(0,0));passed('offscreen scene does not draw continuously');
    await page.getByRole('button',{name:'Classic',exact:true}).click();assert.equal(await page.locator('.office-canvas canvas').count(),0);assert.equal(await page.locator('h1').count(),1);assert.equal(await page.locator('.portrait-hero').count(),1);assert.ok(await page.evaluate(()=>window.officeTest.lost)>=1);await shot(page,'workspace-classic');
    const interactiveScripts=[...scripts];scripts.clear();await page.reload({waitUntil:'domcontentloaded'});await page.locator('.portrait-hero').waitFor();await page.waitForTimeout(2000);assert.equal(await page.locator('canvas').count(),0);
    report.engineScripts=interactiveScripts.filter(script=>!scripts.has(script)&&script.includes('/_next/'));assert.ok(report.engineScripts.length>0);passed('Classic preference survives reload, releases WebGL and skips renderer chunks');
    await page.getByRole('button',{name:'Interactive',exact:true}).click();await ready(page);assert.equal(await page.locator('.office-canvas canvas').count(),1);passed('returning to Interactive creates exactly one usable canvas');
    await page.evaluate(()=>{const canvas=document.querySelector('.office-canvas canvas');canvas.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext();});await page.waitForFunction(()=>document.querySelector('.office-hero')?.dataset.live==='false');await page.waitForTimeout(200);assert.equal(await page.locator('.office-canvas canvas').count(),0);await page.locator('.office-hotspot-contact').click();assert.equal(await page.locator('dialog').evaluate(e=>e.open),true);await page.keyboard.press('Escape');passed('WebGL context loss falls back to functional HTML room navigation');
    await page.getByRole('button',{name:'Enable 3D view',exact:true}).click();await ready(page);passed('3D can be retried after context loss');
    await page.goto(url+'/about/',{waitUntil:'domcontentloaded'});assert.equal(await page.locator('.office-hero').count(),0);assert.equal(await page.locator('.office-canvas canvas').count(),0);assert.equal(await page.getByRole('group',{name:'Homepage presentation'}).count(),0);passed('internal About route keeps its original presentation');await context.close();
    const freshAbout=await browser.newContext();const aboutPage=await freshAbout.newPage();const aboutScripts=[];aboutPage.on('request',request=>{if(request.resourceType()==='script')aboutScripts.push(new URL(request.url()).pathname);});await aboutPage.goto(url+'/about/',{waitUntil:'load'});await aboutPage.waitForTimeout(500);assert.ok(report.engineScripts.every(script=>!aboutScripts.includes(script)));await freshAbout.close();passed('fresh About navigation does not download office renderer chunks');

    const pending=await browser.newContext({viewport:{width:1440,height:900}});await instruments(pending);const pp=await pending.newPage();await loaded(pp);await pp.mouse.move(101,201);await pp.waitForFunction(()=>window.officeTest.contexts.length>0);await pp.getByRole('button',{name:'Classic',exact:true}).click();await pp.locator('.portrait-hero').waitFor();await pp.waitForTimeout(500);assert.equal(await pp.locator('.office-canvas canvas').count(),0);await pending.close();passed('switching modes during asynchronous construction cancels and releases the pending scene');

    for(const width of [320,390,768,1024,1440]){
      const ctx=await browser.newContext({viewport:{width,height:width<760?844:1024},deviceScaleFactor:1,isMobile:width<760,hasTouch:width<1100});const p=await ctx.newPage();await loaded(p);await noOverflow(p);
      if(width>=760)await ready(p);
      const trigger=p.locator('.office-hotspot-about');if(width<1100)await trigger.tap();else await trigger.click();await p.locator('dialog[open]').waitFor();await noOverflow(p);assert.equal(await p.locator('dialog').evaluate(e=>e.open),true);await p.keyboard.press('Escape');
      if(width===390){await shot(p,'workspace-mobile');await axe(p,'mobile');await p.getByRole('button',{name:'Enable 3D view',exact:true}).click();await ready(p);passed('phone preview supports explicit low-tier live 3D');}
      if(width<760&&width!==390)assert.equal(await p.locator('canvas').count(),0);
      if(width===768)await shot(p,'workspace-tablet');
      await ctx.close();passed(`${width}px responsive layout, accessible room panel and no horizontal overflow`);
    }

    const reduced=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const rp=await reduced.newPage();await loaded(rp);await rp.waitForTimeout(2500);assert.equal(await rp.locator('canvas').count(),0);await rp.locator('.office-hotspot-tools').click();await rp.locator('dialog[open]').waitFor();assert.equal(await rp.locator('dialog').evaluate(e=>e.open),true);await reduced.close();passed('reduced motion defaults to a working static office');

    const blocked=await browser.newContext({viewport:{width:1440,height:900}});await blocked.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:original.call(this,type,...args);};});const bp=await blocked.newPage();await loaded(bp);await bp.mouse.move(101,201);await bp.getByRole('status').filter({hasText:'Preview mode'}).waitFor({timeout:30000});assert.equal(await bp.locator('.office-canvas canvas').count(),0);await bp.locator('.office-hotspot-work').click();await bp.locator('dialog[open]').waitFor();assert.equal(await bp.locator('dialog').evaluate(e=>e.open),true);await blocked.close();passed('unavailable WebGL retains the preview and usable room panels');

    const noStorage=await browser.newContext({viewport:{width:1440,height:900}});await noStorage.addInitScript(()=>{Storage.prototype.getItem=Storage.prototype.setItem=function(){throw new DOMException('Storage blocked','SecurityError');};});const sp=await noStorage.newPage();await loaded(sp);await sp.getByRole('button',{name:'Classic',exact:true}).click();await sp.locator('.portrait-hero').waitFor();await sp.getByRole('button',{name:'Interactive',exact:true}).click();await sp.locator('.office-hero').waitFor();await noStorage.close();passed('mode switching works when browser storage is blocked');

    const scriptsBlocked=await browser.newContext({viewport:{width:1440,height:900}});for(const script of report.engineScripts)await scriptsBlocked.route('**'+script,route=>route.abort());const fp=await scriptsBlocked.newPage();await loaded(fp);await fp.mouse.move(101,201);await fp.getByRole('status').filter({hasText:'Preview mode'}).waitFor({timeout:30000});assert.equal(await fp.locator('.office-canvas canvas').count(),0);await scriptsBlocked.close();passed('failed renderer chunk download preserves the homepage');

    const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:1440,height:900}});const jp=await noJS.newPage();await jp.goto(url);assert.equal(await jp.locator('h1').count(),1);for(const href of ['/work/','/about/','/ventures/','/tools/','/games/neon-dash/','/blog/','/contact/'])assert.ok(await jp.locator(`a[href="${href}"]`).count(),href);await noJS.close();passed('no-JavaScript HTML preserves the heading, introduction, links and shared content');
    assert.deepEqual(report.errors,[]);
    const violations=report.accessibility.flatMap(result=>result.violations);assert.deepEqual(violations,[],'workspace accessibility violations');
    passed('no uncaught homepage errors and no scoped axe WCAG A/AA violations');
  }finally{fs.writeFileSync(path.join(output,'browser-check.json'),JSON.stringify(report,null,2));await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

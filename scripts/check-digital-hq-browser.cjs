// Local browser QA; uses the caller's installed Playwright and Edge.
// node scripts/check-digital-hq-browser.cjs --playwright <path> [--url <url>] [--axe <path>] [--screens-only]
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const args = process.argv.slice(2), arg = name => args.includes(name) ? args[args.indexOf(name) + 1] : null;
if (!arg('--playwright')) throw Error('Supply --playwright <installed package path>.');
const { chromium } = require(path.resolve(arg('--playwright')));
const url = arg('--url') || 'http://127.0.0.1:3100', output = path.resolve(arg('--output') || 'tmp/digital-hq/browser'); fs.mkdirSync(output, { recursive: true });
const report = { checks: [], errors: [], accessibility: [], resources: [] };
const passed = name => { report.checks.push(name); console.log('PASS ' + name); };
async function loaded(page) { await page.goto(url, { waitUntil: 'domcontentloaded' }); await page.locator('.hq').waitFor(); await page.locator('.hq-preview img').evaluate(img => img.decode()); await page.evaluate(() => document.fonts.ready); await page.waitForFunction(() => document.documentElement.dataset.homePresentation === 'interactive'); }
async function ready(page) { await page.waitForFunction(() => document.querySelector('.hq')?.dataset.live === 'true', null, { timeout: 60000 }); await page.waitForTimeout(1400); }
async function screenshot(page, name) { await page.addStyleTag({ content: 'nextjs-portal{display:none}' }); await page.screenshot({ path: path.join(output, name + '.png') }); }
async function accessibility(page, label) { if (!arg('--axe')) return; await page.addScriptTag({ path: path.resolve(arg('--axe')) }); const result = await page.evaluate(() => window.axe.run({ include: [['.hq']] }, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })); report.accessibility.push({ label, violations: result.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })) }); }
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.HQ_BROWSER || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    for (const [width, height] of [[1920, 1080], [1440, 900], [768, 1024], [390, 844]]) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: width < 760, hasTouch: width < 1100 });
      const page = await context.newPage(); page.on('pageerror', e => report.errors.push(e.message));
      await loaded(page); assert.equal(await page.getByRole('button', { name: 'Enter 3D workspace', exact: true }).count(), 0); await ready(page); assert.equal(await page.locator('.hq-canvas canvas').count(), 1); await screenshot(page, `${width}-live`);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); assert.equal(await page.locator('h1').count(), 1);
      await accessibility(page, String(width));
      const rectangles = await page.locator('.hq-hotspot').evaluateAll(nodes => nodes.map(n => { const r = n.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }));
      for (let i = 0; i < rectangles.length; i++) for (let j = i + 1; j < rectangles.length; j++) { const a = rectangles[i], b = rectangles[j]; assert.ok(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y, `${width}: overlapping labels ${i},${j}`); }
      passed(`${width}x${height}: automatic 3D, responsive layout, one H1, no overflow or overlapping labels`); await context.close();
    }
    if (args.includes('--screens-only')) return;
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      window.hqTest = { contexts: [], draws: 0, lost: 0 };
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function(type, ...args) { const result = getContext.call(this, type, ...args); if (result && /^webgl/.test(type) && !window.hqTest.contexts.includes(result)) { window.hqTest.contexts.push(result); this.addEventListener('webglcontextlost', () => window.hqTest.lost++); } return result; };
      for (const method of ['drawElements', 'drawArrays']) { const original = WebGL2RenderingContext.prototype[method]; WebGL2RenderingContext.prototype[method] = function(...args) { window.hqTest.draws++; return original.apply(this, args); }; }
    });
    const page = await context.newPage();
    page.on('pageerror', e => report.errors.push(e.message)); const scripts = new Set(); page.on('request', r => { if (r.resourceType() === 'script') scripts.add(new URL(r.url()).pathname); });
    await loaded(page); assert.equal(await page.locator('.site-header,.site-footer').count(), 0); assert.equal(await page.locator('.hq-brand .wordmark').innerText(), 'js.'); assert.equal(await page.locator('.hq-hotspot[href]').count(), 8);
    passed('original wordmark, eight crawlable destinations, immersive shell and automatic renderer startup');
    for (const id of ['work', 'skills', 'ventures', 'blog', 'tools', 'arcade', 'contact', 'about']) {
      const trigger = page.locator('.hq-hotspot-' + id); await trigger.waitFor({state:'visible'}); await trigger.focus(); await page.keyboard.press('Enter'); const dialog = page.locator('#hq-section-panel'); await dialog.waitFor({ state: 'visible' }); assert.ok(await dialog.locator('a[href]').count() > 0); await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => !!document.activeElement.closest('dialog')), true);
      if (id === 'work') { await screenshot(page, 'works-panel'); await accessibility(page, 'works panel'); }
      await page.keyboard.press('Escape'); assert.equal(await trigger.evaluate(e => e === document.activeElement), true);
    }
    passed('all eight sections open by keyboard, contain focus, Escape closes and restores focus');
    await page.getByRole('button', { name: 'How to explore Digital HQ' }).click(); await page.getByRole('heading', { name: 'A little look around.' }).waitFor(); assert.equal(await page.locator('.hq-help nav a').count(), 8); await page.keyboard.press('Escape'); passed('accessible help navigation guide');
    await ready(page); const liveScripts = new Set(scripts);
    report.resources = await page.evaluate(() => performance.getEntriesByType('resource').filter(r => r.name.startsWith(location.origin)).map(r => ({ url: new URL(r.name).pathname, bytes: r.decodedBodySize, type: r.initiatorType })));
    await page.mouse.click(370, 585); await page.locator('#hq-section-panel').waitFor({ state: 'visible' }); await page.keyboard.press('Escape'); passed('physical SD card raycasting opens its content panel');
    await page.getByRole('button', { name: 'Zoom in', exact: true }).click(); await page.getByRole('button', { name: 'Rotate left', exact: true }).click(); await page.getByRole('button', { name: 'Reset camera', exact: true }).click();
    await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await page.waitForTimeout(150); const draws = await page.evaluate(() => window.hqTest.draws); await page.waitForTimeout(200); assert.equal(await page.evaluate(() => window.hqTest.draws), draws); await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: false, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); passed('hidden-tab rendering pauses');
    await page.getByRole('button', { name: 'Classic', exact: true }).click(); await page.locator('.portrait-hero').waitFor(); await page.waitForTimeout(700); assert.ok(await page.evaluate(() => window.hqTest.lost) >= 1); assert.equal(await page.locator('.hq-canvas canvas').count(), 0); assert.equal(await page.locator('h1').count(), 1); assert.equal(await page.locator('.site-header,.site-footer').count(), 2); await screenshot(page, 'classic');
    scripts.clear(); await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('.portrait-hero').waitFor(); await page.waitForTimeout(1500); assert.equal(await page.locator('.hq').count(), 0);
    const rendererChunks = [...liveScripts].filter(script => !scripts.has(script) && script.includes('/_next/')); assert.ok(rendererChunks.length > 0);
    const coreChunks = [...liveScripts].filter(script => { const file = path.resolve('out', '.' + script); return script.startsWith('/_next/') && fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes('THREE.WebGLRenderer'); });
    if (!arg('--url')) { assert.ok(coreChunks.length > 0, 'live visit requested the Three.js renderer'); assert.ok(coreChunks.every(script => !scripts.has(script)), 'remembered Classic must skip the renderer core'); }
    passed('Classic persistence, original homepage shell, one H1 and unloaded scene');
    await page.getByRole('button', { name: 'Interactive', exact: true }).click(); await page.locator('.hq').waitFor(); await ready(page); assert.equal(await page.locator('.hq-canvas canvas').count(), 1); passed('repeat mode switching creates one canvas');
    await page.evaluate(() => document.querySelector('.hq-canvas canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()); await page.waitForFunction(() => document.querySelector('.hq')?.dataset.live === 'false'); await page.locator('.hq-hotspot-contact').click(); await page.locator('#hq-section-panel').waitFor({ state: 'visible' }); await page.keyboard.press('Escape'); passed('context loss falls back to usable HTML navigation');
    await context.close();
    const fallback = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 390, height: 844 } }); const fallbackPage = await fallback.newPage();
    await fallbackPage.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /^webgl/.test(type) ? null : original.call(this, type, ...args); }; });
    await loaded(fallbackPage); await fallbackPage.waitForFunction(() => document.querySelector('.hq-status')?.textContent.includes('Preview mode'), null, {timeout:30000}); await fallbackPage.locator('.hq-hotspot-work').click(); await fallbackPage.locator('#hq-section-panel').waitFor({ state: 'visible' }); passed('unsupported WebGL and reduced motion retain functional content navigation'); await fallback.close();
    const about = await browser.newContext(); const aboutPage = await about.newPage(), aboutScripts = []; aboutPage.on('request', r => { if (r.resourceType() === 'script') aboutScripts.push(new URL(r.url()).pathname); }); await aboutPage.goto(url + '/about/', { waitUntil: 'domcontentloaded' }); await aboutPage.locator('.site-header').waitFor(); await aboutPage.waitForTimeout(1000); assert.ok(rendererChunks.every(script => !aboutScripts.includes(script))); passed('fresh internal route does not request Digital HQ renderer'); await about.close();
    const pending = await browser.newContext({viewport:{width:1440,height:900}}); const pendingPage = await pending.newPage();
    pendingPage.on('pageerror', e => report.errors.push(e.message)); await loaded(pendingPage);
    await pendingPage.waitForFunction(() => !!document.querySelector('.hq-canvas canvas') && document.querySelector('.hq')?.dataset.live === 'false');
    await pendingPage.getByRole('button',{name:'Classic',exact:true}).click(); await pendingPage.locator('.portrait-hero').waitFor(); await pendingPage.waitForTimeout(1000); assert.equal(await pendingPage.locator('.hq-canvas canvas').count(),0); await pending.close(); passed('switching to Classic cancels pending scene construction and shader warmup');
    assert.deepEqual(report.errors, []);
    for (const result of report.accessibility) assert.deepEqual(result.violations, [], result.label + ': accessibility violations');
  } finally { fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2)); await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, mocks = {}) {
  const exports = {};
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'exports', source)(name => mocks[name] ?? require(name), exports);
  return exports;
}
const { donationConfig } = load('src/config/donations.ts');
const { configuredDonationMethods } = load('src/lib/donation-methods.ts');
const { toolVentures } = load('src/config/tool-ventures.ts');
const fixture = () => ({
  gcash: { enabled: false, qrImagePath: '', allowDownload: true },
  international: { enabled: false, providerName: '', url: '' },
});

test('approved production GCash asset and PayPal link are configured for the opted-in tool', () => {
  const methods = configuredDonationMethods(donationConfig, path => fs.existsSync('public' + path));
  assert.deepEqual(methods.map(method => method.id), ['gcash', 'international']);
  assert.equal(methods[0].qrImagePath, '/images/donations/gcash.jpg');
  assert.equal(methods[1].url, 'https://paypal.me/johnmsemblante');
  assert.equal(toolVentures.find(tool => tool.id === 'qr-code-generator').donationsEnabled, true);
});

test('unconfigured or disabled methods produce no public payment options', () => {
  assert.deepEqual(configuredDonationMethods(fixture(), () => true), []);
});

test('GCash requires an enabled method, an allowed local raster image and an existing asset', () => {
  const config = fixture();
  config.gcash = { enabled: true, qrImagePath: '/images/donations/test-fixture.png', allowDownload: true };
  const methods = configuredDonationMethods(config, path => path === config.gcash.qrImagePath);
  assert.equal(methods.length, 1);
  assert.equal(methods[0].id, 'gcash');
  assert.deepEqual(configuredDonationMethods(config, () => false), []);
  for (const path of ['', 'https://example.test/qr.png', '//example.test/qr.png', '/images/donations/../secret.png', '/images/donations/%2e%2e/qr.png', '/images/donations/qr.svg', '/images/donations/qr.png?x=1']) {
    config.gcash.qrImagePath = path;
    assert.deepEqual(configuredDonationMethods(config, () => true), [], path);
  }
  config.gcash.qrImagePath = '/images/donations/receiving-qr.jpg';
  config.gcash.enabled = false;
  assert.deepEqual(configuredDonationMethods(config, () => true), []);
});

test('international method requires an explicit provider and safe HTTPS URL', () => {
  const config = fixture();
  config.international = { enabled: true, providerName: 'Test provider', url: 'https://example.test/support' };
  assert.equal(configuredDonationMethods(config, () => false)[0].url, 'https://example.test/support');
  for (const url of ['', 'javascript:alert(1)', 'data:text/html,bad', 'http://example.test/support', '//example.test/support', 'https://user:password@example.test/']) {
    config.international.url = url;
    assert.deepEqual(configuredDonationMethods(config, () => true), [], url);
  }
  config.international.url = 'https://example.test/support';
  config.international.providerName = ' ';
  assert.deepEqual(configuredDonationMethods(config, () => true), []);
});

test('only exact eligible tool routes render a single widget, including slash normalization', () => {
  const methods = [{ id: 'international', label: 'Test provider', url: 'https://example.test/support' }];
  let pathname = '/tools/qr-code-generator';
  const widget = load('src/components/tools/donation-widget.tsx', {
    'next/navigation': { usePathname: () => pathname },
    './donation-modal': { DonationModal: () => null },
  });
  const props = { methods, eligiblePaths: ['/tools/qr-code-generator/'] };
  const render = () => renderToStaticMarkup(React.createElement(widget.ToolDonationWidget, props));
  assert.equal((render().match(/class="donation-trigger"/g) || []).length, 1);
  pathname += '/';
  assert.ok(render().includes('aria-haspopup="dialog"'));
  for (pathname of ['/', '/tools/', '/ventures/', '/ventures/lazy-barista/', '/adminauth/', '/blog/', '/work/', '/contact/', '/about/', '/tools/unpublished/', '/tools/qr-code-generator/nested/']) {
    assert.equal(render(), '', pathname);
  }
  pathname = '/tools/qr-code-generator/';
  assert.equal(renderToStaticMarkup(React.createElement(widget.ToolDonationWidget, { ...props, methods: [] })), '');
  assert.equal(renderToStaticMarkup(React.createElement(widget.DonationWidget, { methods: [] })), '');
});

test('the shared layout selects published opt-in tools and never modifies admin or QR processing sources', () => {
  const layout = fs.readFileSync('src/app/(portfolio)/tools/layout.tsx', 'utf8');
  assert.ok(layout.includes('publishedTools.filter(tool => tool.donationsEnabled)'));
  assert.ok(layout.includes('statSync'));
  for (const file of ['src/components/admin/admin-ventures.tsx', 'src/lib/venture-store.ts', 'src/ventures/registry.ts', 'src/lib/page-catalog.ts', 'src/components/qr-generator.tsx']) {
    assert.ok(!/donation/i.test(fs.readFileSync(file, 'utf8')), file);
  }
  for (const file of ['src/components/tools/donation-widget.tsx', 'src/components/tools/donation-modal.tsx', 'src/lib/donation-methods.ts']) {
    assert.ok(!/localStorage|sessionStorage|console\.|fetch\(|firebase|cloudinary/i.test(fs.readFileSync(file, 'utf8')), file);
  }
});

test('modal wraps keyboard focus, dismisses with Escape, and restores focus and body scrolling', () => {
  const effects = [], refs = [];
  const originalDocument = global.document, originalHTMLElement = global.HTMLElement;
  class Control {
    isConnected = true;
    focus() { global.document.activeElement = this; }
    getClientRects() { return [{}]; }
  }
  const opener = new Control(), first = new Control(), last = new Control();
  global.HTMLElement = Control;
  global.document = { activeElement: opener, body: { style: { overflow: 'auto' } } };
  try {
    const { DonationModal } = load('src/components/tools/donation-modal.tsx', {
      react: {
        useEffect: effect => effects.push(effect), useId: () => 'test-id',
        useRef: () => { const ref = { current: null }; refs.push(ref); return ref; },
        useState: value => [value, () => {}],
      },
      'react-dom': { createPortal: node => node },
    });
    let dismissed = 0, opened = 0;
    const modal = DonationModal({ methods: [{ id: 'international', label: 'Test provider', url: 'https://example.test/support' }], onClose: () => dismissed++, returnFocusRef: { current: opener } });
    refs[0].current = { showModal() { opened++; }, close() {} };
    refs[1].current = first;
    const cleanup = effects[0]();
    assert.equal(opened, 1);
    assert.equal(document.activeElement, first);
    assert.equal(document.body.style.overflow, 'hidden');
    let prevented = false;
    const event = { key: 'Tab', shiftKey: true, currentTarget: { querySelectorAll: () => [first, last] }, preventDefault() { prevented = true; } };
    modal.props.onKeyDown(event);
    assert.equal(prevented, true);
    assert.equal(document.activeElement, last);
    modal.props.onKeyDown({ ...event, shiftKey: false });
    assert.equal(document.activeElement, first);
    modal.props.onCancel({ preventDefault() {} });
    assert.equal(dismissed, 1);
    cleanup();
    assert.equal(document.activeElement, opener);
    assert.equal(document.body.style.overflow, 'auto');
  } finally { global.document = originalDocument; global.HTMLElement = originalHTMLElement; }
});

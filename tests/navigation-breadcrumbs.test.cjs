const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'exports', code)(name => mocks[name] ?? require(name), exports);
  return exports;
}
const site = { url: 'https://johnsemblante.com' };
const jsonLd = value => JSON.stringify(value).replace(/</g, '\\u003c');
const { Breadcrumbs } = load('src/components/breadcrumbs.tsx', {
  'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
  '@/content/site': { site }, '@/lib/seo': { jsonLd },
});

test('breadcrumbs render parent links, one current page and matching canonical structured URLs', () => {
  const items = [{ label: 'Home', href: '/' }, { label: 'Free Tools', href: '/tools/' }, { label: 'QR Generator', href: '/tools/qr-code-generator/' }];
  const html = renderToStaticMarkup(React.createElement(Breadcrumbs, { items }));
  assert.ok(html.includes('aria-label="Breadcrumb"'));
  assert.equal((html.match(/aria-current="page"/g) || []).length, 1);
  assert.equal((html.match(/<a /g) || []).length, 2);
  const schema = JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/)[1]);
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.deepEqual(schema.itemListElement.map(item => item.position), [1, 2, 3]);
  assert.equal(schema.itemListElement.at(-1).item, 'https://johnsemblante.com/tools/qr-code-generator/');
  assert.equal(renderToStaticMarkup(React.createElement(Breadcrumbs, { items: items.slice(0, 1) })), '');
});

test('portfolio breadcrumbs skip nonexistent intermediary routes, the homepage and unknown URLs', () => {
  let pathname = '/work/industry/dental';
  const { PortfolioBreadcrumbs } = load('src/components/portfolio-breadcrumbs.tsx', {
    'next/navigation': { usePathname: () => pathname }, './breadcrumbs': { Breadcrumbs },
  });
  const routes = [{ label: 'Home', href: '/' }, { label: 'Work', href: '/work/' }, { label: 'Dental', href: '/work/industry/dental/' }, { label: 'Blog', href: '/blog/' }];
  const render = () => renderToStaticMarkup(React.createElement(PortfolioBreadcrumbs, { routes }));
  const html = render();
  assert.ok(html.includes('>Dental</span>'));
  assert.ok(!html.includes('href="/work/industry/"'));
  pathname = '/'; assert.equal(render(), '');
  pathname = '/adminauth/'; assert.equal(render(), '');
  pathname = '/missing/'; assert.equal(render(), '');
});

test('breadcrumb names are escaped safely in markup and JSON-LD', () => {
  const html = renderToStaticMarkup(React.createElement(Breadcrumbs, { items: [{ label: 'Home', href: '/' }, { label: '</script><script>bad()</script>', href: '/work/example/' }] }));
  assert.ok(!html.includes('<script>bad()'));
  assert.equal((html.match(/<script /g) || []).length, 1);
});

test('navigation builds exported venture destinations in display order and lightweight breadcrumb labels', () => {
  const ventures = ['lazy-barista', 'golden-travel-and-tours', 'lapse-hub'].map(slug => ({ slug, name: slug }));
  const { buildNavigation } = load('src/lib/build-navigation.ts', {
    './build-ventures': { buildVentures: () => ventures },
    './build-works': { buildWorks: () => [{ slug: 'example', title: 'Example work' }] },
    './build-blog': { buildBlogPosts: () => [{ slug: 'post', title: 'Post' }] },
    '@/content/blog': { publishedPosts: () => [] },
    '@/content/industries': { industries: [{ slug: 'dental', label: 'Dental' }], industryPath: slug => `/work/industry/${slug}/` },
    '@/config/tool-ventures': { publishedTools: [{ route: '/tools/qr-code-generator/', shortName: 'QR Generator' }] },
  });
  const nav = buildNavigation();
  assert.deepEqual(nav.ventureLinks.map(link => link.href), ['/ventures/golden-travel-and-tours/', '/ventures/lazy-barista/', '/ventures/lapse-hub/']);
  assert.ok(nav.breadcrumbRoutes.some(item => item.href === '/tools/qr-code-generator/'));
  assert.ok(!JSON.stringify(nav).includes('qr-code-styling'));
});

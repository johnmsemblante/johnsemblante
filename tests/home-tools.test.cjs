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

const registry = load('src/config/tool-ventures.ts');
const qr = registry.toolVentures[0];
function tool(id, overrides = {}) {
  return { ...qr, id, slug: id, route: `/tools/${id}/`, ...overrides };
}
function showcase(items) {
  const { HomeToolsShowcase } = load('src/components/home-tools-showcase.tsx', {
    '@/components/page-content': require('./page-content-mocks.cjs').content,
    '@/config/tool-ventures': { featuredHomeTools: () => registry.featuredHomeTools(items) },
    'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) },
    './ui': { Arrow: () => React.createElement('span', { 'aria-hidden': true }, '↗') },
  });
  return renderToStaticMarkup(React.createElement(HomeToolsShowcase));
}

test('home tools require published status and explicit homepage visibility', () => {
  const items = [
    tool('draft', { status: 'draft' }),
    tool('hidden', { featuredOnHome: false }),
    tool('unconfigured', { featuredOnHome: undefined }),
    tool('visible'),
  ];
  assert.deepEqual(registry.featuredHomeTools(items).map(item => item.id), ['visible']);
  assert.deepEqual(registry.featuredHomeTools().map(item => item.id), ['business-startup-calculator', 'pdf-editor', 'image-compressor']);
});

test('home tools honor feature order, fall back to directory order and leave input unchanged', () => {
  const items = [
    tool('later', { featuredOrder: 9 }),
    tool('fallback', { featuredOrder: undefined, order: 3 }),
    tool('first', { featuredOrder: 0 }),
  ];
  const original = structuredClone(items);
  assert.deepEqual(registry.featuredHomeTools(items).map(item => item.id), ['later', 'fallback', 'first']);
  assert.deepEqual(items, original);
});

test('home tools deduplicate IDs and destinations before applying the three-item limit', () => {
  const items = [tool('one'), tool('one'), tool('alias', { route: '/tools/one/' }),
    ...['two', 'three', 'four', 'five', 'six'].map(id => tool(id))];
  assert.deepEqual(registry.featuredHomeTools(items).map(item => item.id), ['one', 'two', 'three']);
});

test('compact tool list links to the latest eligible tools and the full directory', () => {
  assert.equal(showcase([]), '');
  const html = showcase(registry.toolVentures);
  assert.ok(html.includes('<h2 id="home-tools-title">Free Online Tools</h2>'));
  assert.equal((html.match(/<li>/g) || []).length, 3);
  assert.ok(html.includes('href="/tools/business-startup-calculator/"'));
  assert.ok(html.includes('href="/tools/"'));
  assert.ok(!html.includes('href="/tools/qr-code-generator/"'));
});

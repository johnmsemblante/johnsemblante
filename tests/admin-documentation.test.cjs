const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'exports', code)(name => mocks[name] ?? require(name), exports);
  return exports;
}
const { documentationGuides: guides } = load('src/content/admin-documentation.ts');
const { searchDocumentation: search } = load('src/lib/documentation-search.ts');
const navigation = load('src/lib/admin-navigation.ts');
test('full-text documentation search combines tokens, ignores case/accents and filters by topic', () => {
  assert.ok(search(guides, 'IMAGE transparency').some(guide => guide.id === 'image-compressor'));
  assert.ok(search(guides, 'bounded attempts').some(guide => guide.id === 'image-compressor'), 'body-only text is indexed');
  assert.deepEqual(search(guides, 'Cloudinary', 'Getting started'), []);
  assert.ok(search(guides, 'Cloudinary', 'Integrations').some(guide => guide.id === 'media-uploads'));
  assert.equal(search(guides, '    ').length, guides.length);
  assert.equal(search(guides, 'no-such-guide-xyz').length, 0);
  const fixture = { ...guides[0], title: 'Café instructions', tags: [], sections: [] };
  assert.equal(search([fixture], 'CAFE')[0], fixture);
  assert.equal(search([guides[0], { ...guides[0], id: 'ranking', title: 'Authentication', tags: [] }], 'authentication')[0].id, 'ranking');
});
test('handbook IDs, review dates, references and related links remain valid and credential-free', () => {
  assert.equal(new Set(guides.map(guide => guide.id)).size, guides.length);
  for (const guide of guides) {
    assert.match(guide.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(guide.updated, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(new Date(guide.updated).toISOString().slice(0, 10), guide.updated);
    assert.ok(guide.sections.length && guide.summary && guide.tags.length && guide.category);
    for (const source of guide.sources) assert.ok(fs.existsSync(source), `${guide.id}: missing ${source}`);
    for (const section of guide.sections) assert.ok(section.heading && (section.paragraphs?.length || section.steps?.length));
    for (const { href } of guide.links ?? []) {
      assert.ok(/^\/(?!\/)|^https:\/\//.test(href), href);
      assert.ok(!new URL(href, 'https://johnsemblante.com').username);
    }
  }
  assert.ok(!/BEGIN (?:RSA )?PRIVATE KEY|ghp_[a-zA-Z0-9]{20}|AIza[a-zA-Z0-9_-]{30}/.test(JSON.stringify(guides)));
});
test('handbook renders accessible search, native disclosures, guide steps and safe external links', () => {
  const { AdminDocumentation } = load('src/components/admin/admin-documentation.tsx', {
    '@/content/admin-documentation': { documentationGuides: guides }, '@/lib/documentation-search': { searchDocumentation: search },
    'next/link': { __esModule: true, default: ({ children, ...props }) => React.createElement('a', props, children) },
  });
  const html = renderToStaticMarkup(React.createElement(AdminDocumentation));
  assert.ok(html.includes('<h1>Documentation</h1>'));
  assert.ok(html.includes('for="documentation-query"')); assert.ok(html.includes('for="documentation-category"'));
  assert.ok(html.includes('aria-live="polite"')); assert.ok(html.includes('Expand results')); assert.ok(html.includes('Collapse results'));
  assert.equal((html.match(/<details /g) ?? []).length, guides.length);
  assert.ok(html.includes('<ol>')); assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes('not automatically rewritten after content saves'));
});
test('documentation uses the existing admin route boundary and stays out of the public sitemap', () => {
  assert.equal(navigation.safeAdminDestination('/adminauth/documentation'), '/adminauth/documentation/');
  assert.equal(navigation.adminLinks.filter(link => link.href === '/adminauth/documentation/').length, 1);
  assert.ok(navigation.activeAdminLink('/adminauth/documentation/', '/adminauth/documentation/'));
  assert.ok(fs.readFileSync('src/components/admin/admin-home.tsx', 'utf8').includes('/adminauth/documentation/'));
  assert.ok(fs.readFileSync('src/app/adminauth/layout.tsx', 'utf8').includes('<AdminGate>'));
  assert.ok(!fs.readFileSync('src/app/sitemap.ts', 'utf8').includes('/adminauth/documentation'));
  assert.ok(fs.readFileSync('AGENTS.md', 'utf8').includes('src/content/admin-documentation.ts'));
});

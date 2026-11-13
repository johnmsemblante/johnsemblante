const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), ts = require('typescript');
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
function loader(mocks = {}) {
  const cache = {};
  return function load(file) {
    file = path.resolve(file);
    if (cache[file]) return cache[file];
    const out = {}; cache[file] = out;
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Function('require', 'exports', code)(name => {
      if (name in mocks) return mocks[name];
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.resolve('src', name.slice(2)) : path.resolve(path.dirname(file), name);
        if (base.endsWith('.json')) return JSON.parse(fs.readFileSync(base, 'utf8'));
        return load(['.ts', '.tsx'].map(ext => base + ext).find(fs.existsSync));
      }
      return require(name);
    }, out);
    return out;
  };
}
const load = loader({ '@/lib/firebase-client': { firebaseConfigured: false }, 'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) }, '@/lib/build-works': { buildWorks: () => [] }, '@/lib/build-blog': { buildBlogPosts: () => [] } });
const model = load('src/lib/page-model.ts');
const { PageContent, PageText, PageImage, PageLink } = load('src/components/page-content.tsx');
const fields = require('../src/content/page-fields.json');
function render(record, children) { return renderToStaticMarkup(React.createElement(PageContent, { id: 'home', initial: record }, children)); }

test('content overrides render on the server, escape markup, and keep defaults outside a page', () => {
  const record = model.emptyPage();
  record.values[model.fieldKey('hero', 'Original')] = '<script>alert(1)</script>';
  const child = React.createElement(PageText, { scope: 'hero', fallback: 'Original' });
  assert.equal(render(record, child), '&lt;script&gt;alert(1)&lt;/script&gt;');
  assert.equal(renderToStaticMarkup(child), 'Original');
  assert.equal(render(model.emptyPage(), child), 'Original');
});
test('existing images and links remain code defaults, and unsafe override URLs never render', () => {
  const record = model.emptyPage();
  record.values[model.fieldKey('image_src', '/original.webp')] = 'javascript:alert(1)';
  record.values[model.fieldKey('link', '/contact/')] = '//malicious.invalid';
  let html = render(record, React.createElement('div', null, React.createElement(PageImage, { scope: 'image', src: '/original.webp', alt: 'Portrait' }), React.createElement(PageLink, { scope: 'link', href: '/contact/', children: 'Contact' })));
  assert.match(html, /src="\/original.webp"/); assert.match(html, /href="\/contact\/"/);
  record.values[model.fieldKey('image_src', '/original.webp')] = 'https://images.example/new.webp';
  html = render(record, React.createElement(PageImage, { scope: 'image', src: '/original.webp', alt: 'Portrait' }));
  assert.match(html, /src="https:\/\/images.example\/new.webp"/);
});
test('page registry has only landing pages, valid unique field keys, and actual source image paths', () => {
  assert.deepEqual(Object.keys(fields).sort(), [...model.pageIds].sort());
  for (const [id, entries] of Object.entries(fields)) {
    assert.equal(new Set(entries.map(f => f.key)).size, entries.length, id);
    for (const field of entries) {
      assert.match(field.key, /^[a-zA-Z0-9_-]{1,100}$/);
      if (field.kind === 'image' && field.value.startsWith('/')) assert.ok(fs.existsSync(path.join('public', field.value)), field.value);
    }
  }
});
test('model rejects malformed records, unsafe galleries and oversized input', () => {
  assert.equal(model.validatePage(model.emptyPage()), true);
  for (const patch of [{ values: { key: 10 } }, { seoTitle: 'x'.repeat(161) }, { images: [{ src: 'javascript:alert(1)', alt: 'a', caption: '' }] }, { images: [{ src: '/image.webp', alt: '', caption: '' }] }, { revision: -1 }, { values: { key: 'x\0y' } }]) assert.equal(model.validatePage({ ...model.emptyPage(), ...patch }), false);
  for (const url of ['javascript:alert(1)', '//evil.invalid', '/\\evil.invalid', 'https://user:secret@example.com/a', 'http://example.com/a']) assert.equal(model.pageUrl(url, true), false, url);
  for (const url of ['/images/example.webp', 'https://example.com/a.webp']) assert.equal(model.pageUrl(url, true), true);
});
test('additional images render with accessible descriptions and escaped captions', () => {
  const record = model.emptyPage(); record.images = [{ src: '/photo.webp', alt: 'A photo', caption: '<b>Caption</b>' }];
  const html = render(record, 'Content');
  assert.match(html, /alt="A photo"/); assert.match(html, /&lt;b&gt;Caption&lt;\/b&gt;/);
});
test('public snapshot fetching handles missing defaults, validates records and fails closed', async () => {
  const { fetchPublicPages } = load('src/lib/public-pages.ts');
  const wire = { values: { mapValue: { fields: {} } }, seoTitle: { stringValue: 'Custom title' }, seoDescription: { stringValue: 'Custom description' }, images: { arrayValue: {} }, revision: { integerValue: '1' } };
  const records = await fetchPublicPages('demo-portfolio-admin', async url => url.endsWith('/home') ? Response.json({ fields: wire }) : new Response(null, { status: 404 }));
  assert.equal(records.home.seoTitle, 'Custom title'); assert.equal(records.about, undefined);
  await assert.rejects(fetchPublicPages('demo-portfolio-admin', async () => new Response(null, { status: 403 })), /could not be refreshed/);
  await assert.rejects(fetchPublicPages('demo-portfolio-admin', async () => Response.json({ fields: {} })), /Invalid page record/);
});
test('build metadata uses overrides for title, description, Open Graph and Twitter without changing canonical', () => {
  const record = { ...model.emptyPage(), seoTitle: 'New title', seoDescription: 'New description' };
  const build = loader({ 'node:fs': { existsSync: () => true, readFileSync: () => JSON.stringify({ project: 'test-project', records: { home: record } }) } })('src/lib/build-pages.ts');
  const prior = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'test-project';
  try {
    const meta = build.withPageMetadata('home', { title: 'Old', description: 'Old', alternates: { canonical: 'https://example.com/' }, openGraph: { title: 'Old', images: ['/original.webp'] }, twitter: { card: 'summary_large_image' } });
    assert.deepEqual(meta.title, { absolute: 'New title' }); assert.equal(meta.description, 'New description'); assert.equal(meta.openGraph.title, 'New title'); assert.equal(meta.twitter.description, 'New description'); assert.equal(meta.alternates.canonical, 'https://example.com/'); assert.deepEqual(meta.openGraph.images, ['/original.webp']);
  } finally { if (prior === undefined) delete process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID; else process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = prior; }
});
test('real About page renders edited hero and experience fields in exported HTML', () => {
  const record = model.emptyPage();
  const hero = fields.about.find(f => f.label === 'Hero title');
  const job = fields.about.find(f => f.value === 'LegalMatch PH');
  record.values[hero.key] = 'Updated About heading'; record.values[job.key] = 'Updated company';
  const routeLoad = loader({ '@/lib/firebase-client': { firebaseConfigured: false }, '@/lib/build-pages': { buildPage: () => record, withPageMetadata: (_,v) => v }, 'next/link': { __esModule: true, default: ({ href, children, ...props }) => React.createElement('a', { href, ...props }, children) } });
  const About = routeLoad('src/app/(portfolio)/about/page.tsx').default;
  const html = renderToStaticMarkup(React.createElement(About));
  assert.match(html, /<h1>Updated About heading<\/h1>/); assert.match(html, /Updated company/); assert.match(html, /\/images\/profile\/john-about-doodle-sketch.webp/);
});

function adminHarness() {
  const states = [], refs = []; let cursor = 0, refCursor = 0, tree, stored = null, conflict = false;
  const hooks = { ...React, useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; }, useRef(initial) { return refs[refCursor++] ?? (refs[refCursor - 1] = { current: initial }); }, useEffect() {} };
  const snapshot = () => ({ exists: () => !!stored, data: () => stored });
  const mockFirestore = { doc: (_, collection, id) => ({ collection, id }), getDocFromServer: async () => snapshot(), runTransaction: async (_, action) => action({ get: async () => conflict ? { exists: () => true, data: () => ({ ...stored, revision: 50 }) } : snapshot(), set: (_, value) => { stored = structuredClone(value); } }) };
  const Admin = loader({ react: hooks, 'firebase/firestore': mockFirestore, './admin-gate': { useAdmin: () => ({ db: {} }) }, './image-upload': { ImageUpload: () => null }, './blog-editor-drawer': { BlogEditorDrawer: () => null } })('src/components/admin/admin-pages.tsx').AdminPages;
  function render() { cursor = refCursor = 0; tree = Admin(); }
  function nodes(node = tree) { if (!node || typeof node !== 'object') return []; if (Array.isArray(node)) return node.flatMap(nodes); return [node, ...(node.props?.children === undefined ? [] : nodes(node.props.children))]; }
  render();
  return { render, nodes, stored: () => stored, conflict: () => { conflict = true; } };
}
test('Pages lists six routes, opens the shared drawer on the left and persists edits with revisions', async () => {
  const h = adminHarness();
  assert.equal(h.nodes().filter(n => n.props?.id?.startsWith('edit-page-')).length, 6);
  await h.nodes().find(n => n.props?.id === 'edit-page-home').props.onClick(); h.render();
  assert.ok(h.nodes().some(n => n.props?.editorLabel === 'page' && n.props.side === 'left'));
  const hero = fields.home.find(f => f.label === 'Hero title');
  h.nodes().find(n => n.props?.id === hero.key).props.onChange({ target: { value: 'New home title' } }); h.render();
  await h.nodes().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); h.render();
  assert.equal(h.stored().values[hero.key], 'New home title'); assert.equal(h.stored().revision, 1);
  h.conflict();
  h.nodes().find(n => n.props?.id === hero.key).props.onChange({ target: { value: 'Unsaved conflict edit' } }); h.render();
  await h.nodes().find(n => n.type === 'form').props.onSubmit({ preventDefault() {} }); h.render();
  assert.equal(h.stored().revision, 1); assert.equal(h.stored().values[hero.key], 'New home title');
  assert.ok(h.nodes().some(n => n.props?.role === 'alert' && n.props.children.includes('another tab')));
  assert.equal(h.nodes().find(n => n.props?.id === hero.key).props.value, 'Unsaved conflict edit');
});

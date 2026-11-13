const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  mocks['./use-admin-feedback'] ??= { useAdminMessage: () => React.useState(''), useAdminActivity() {} };
  const exports = {};
  new Function('require', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText)(name => mocks[name] ?? require(name), exports);
  return exports;
}
const model = load('src/lib/blog-model.ts');
const featured = load('src/components/blog-featured-image.tsx', { '@/lib/blog-model': model });

test('blog rows put the image first, then category, title, date, excerpt, tags and CTA', () => {
  const { BlogCard } = load('src/components/blog-card.tsx', { './blog-featured-image': featured });
  const html = renderToStaticMarkup(React.createElement(BlogCard, { title: 'Example title', excerpt: 'Example introduction', href: '/blog/?post=example', image: 'https://example.com/photo.webp', date: React.createElement('time', null, 'Publication date'), tags: React.createElement('ul', { className: 'article-tags tags' }, React.createElement('li', null, 'WordPress')) }, React.createElement('span', null, 'Example category')));
  const sequence = ['class="blog-image-link"', 'Example category', '<h2>', 'Publication date', 'Example introduction', 'class="article-tags tags"', 'Read article →'];
  const positions = sequence.map(text => html.indexOf(text));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.ok(html.includes('src="https://example.com/photo.webp"'));
});

test('the admin blog starts with a full-width library and no hidden editing form', () => {
  const { AdminBlog } = load('src/components/admin/admin-blog.tsx', { 'next/link': {}, 'firebase/firestore': {}, '@/components/blog-article-content': {}, '@/lib/firebase-client': {}, '@/lib/blog-model': model, '@/lib/blog-store': {}, './admin-gate': { useAdmin: () => ({ db: {} }) }, '@/components/blog-featured-image': {}, './article-editor': {}, './image-upload': {}, '@/lib/article-media': {}, './token-input': {}, './blog-editor-drawer': {}, '@/components/article-share-link': {}, '@/content/site': { site: {} }, '@/lib/blog-refresh': {}, '@/lib/site-publish': {} });
  const html = renderToStaticMarkup(React.createElement(AdminBlog));
  assert.ok(html.includes('admin-post-library'));
  assert.ok(html.includes('Your articles'));
  assert.ok(html.includes('aria-haspopup="dialog"'));
  assert.ok(!html.includes('<form'));
  assert.ok(!html.includes('post-title'));
});

test('drawer opens modally, restores scroll/focus, and guards Escape/backdrop during saves', () => {
  const effects = []; const refs = [];
  const hooks = { useEffect: callback => effects.push(callback), useRef: () => { const ref = { current: null }; refs.push(ref); return ref; } };
  const { BlogEditorDrawer } = load('src/components/admin/blog-editor-drawer.tsx', { react: hooks });
  let closed = 0; const props = { title: 'Edit post', busy: false, onClose: () => closed++, children: 'Editor fields' };
  const drawer = BlogEditorDrawer(props);
  let opened = 0, dismissed = 0, focused = 0, restored = 0;
  const originalDocument = global.document, originalHTMLElement = global.HTMLElement;
  class FakeElement { isConnected = true; focus() { restored++; } }
  const opener = new FakeElement();
  refs[0].current = { showModal() { opened++; }, close() { dismissed++; } };
  refs[1].current = { focus() { focused++; } };
  global.HTMLElement = FakeElement;
  global.document = { activeElement: opener, body: { style: { overflow: 'auto' } } };
  try {
    const cleanup = effects[0](); assert.equal(opened, 1); assert.equal(focused, 1); assert.equal(document.body.style.overflow, 'hidden');
    let prevented = false; drawer.props.onCancel({ preventDefault() { prevented = true; } }); assert.equal(prevented, true); assert.equal(closed, 1);
    const target = { getBoundingClientRect: () => ({ left: 100, top: 0, right: 500, bottom: 800 }) };
    drawer.props.onClick({ target, currentTarget: target, clientX: 200, clientY: 100 }); assert.equal(closed, 1);
    drawer.props.onClick({ target, currentTarget: target, clientX: 20, clientY: 100 }); assert.equal(closed, 2);
    const busy = BlogEditorDrawer({ ...props, busy: true }); busy.props.onCancel({ preventDefault() {} }); busy.props.onClick({ target, currentTarget: target, clientX: 20, clientY: 100 }); assert.equal(closed, 2);
    cleanup(); assert.equal(dismissed, 1); assert.equal(restored, 1); assert.equal(document.body.style.overflow, 'auto');
  } finally { global.document = originalDocument; global.HTMLElement = originalHTMLElement; }
});

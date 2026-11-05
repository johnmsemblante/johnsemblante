const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function initialBlog(configured, hasStaticPosts) {
  const code = ts.transpileModule(fs.readFileSync('src/components/managed-blog.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exported = {};
  new Function('require', 'exports', code)(name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name === '@/lib/firebase-client') return { firebaseConfigured: configured, getFirebase() { throw new Error('Server rendering must not fetch Firestore'); } };
    return {};
  }, exported);
  return renderToStaticMarkup(React.createElement(exported.ManagedBlog, { hasStaticPosts }, React.createElement('p', null, 'STATIC FALLBACK CONTENT')));
}

test('configured blog initially renders loading, never the static fallback or a false empty state', () => {
  for (const hasStaticPosts of [false, true]) {
    const html = initialBlog(true, hasStaticPosts);
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes('aria-busy="true"'));
    assert.ok(!html.includes('STATIC FALLBACK CONTENT'));
    assert.ok(!html.includes('No articles published yet'));
  }
});
test('a site without Firebase configuration keeps its source-based blog fallback', () => {
  const html = initialBlog(false, false);
  assert.ok(html.includes('STATIC FALLBACK CONTENT'));
  assert.ok(!html.includes('role="status"'));
});

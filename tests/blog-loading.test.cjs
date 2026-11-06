const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function initialBlog(configured, hasStaticPosts, initialPosts = []) {
  const code = ts.transpileModule(fs.readFileSync('src/components/managed-blog.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exported = {};
  new Function('require', 'exports', code)(name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name === '@/lib/firebase-client') return { firebaseConfigured: configured, getFirebase() { throw new Error('Server rendering must not fetch Firestore'); } };
    if (name === './ui') return { PageIntro: ({ title, children }) => React.createElement('header', null, React.createElement('h1', null, title), children) };
    if (name === './blog-card') return { BlogCard: ({ title, href }) => React.createElement('article', null, React.createElement('a', { href }, title)) };
    return {};
  }, exported);
  return renderToStaticMarkup(React.createElement(exported.ManagedBlog, { hasStaticPosts, initialPosts }, React.createElement('p', null, 'STATIC FALLBACK CONTENT')));
}

test('configured blog initially renders a heading and loading, never a draft fallback or false empty state', () => {
  for (const hasStaticPosts of [false]) {
    const html = initialBlog(true, hasStaticPosts);
    assert.ok(html.includes('role="status"'));
    assert.ok(html.includes('aria-busy="true"'));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
    assert.ok(!html.includes('STATIC FALLBACK CONTENT'));
    assert.ok(!html.includes('No articles published yet'));
  }
});

test('explicitly published source articles remain crawlable in the initial HTML', () => {
  assert.ok(initialBlog(true, true).includes('STATIC FALLBACK CONTENT'));
});
test('a site without Firebase configuration keeps its source-based blog fallback', () => {
  const html = initialBlog(false, false);
  assert.ok(html.includes('STATIC FALLBACK CONTENT'));
  assert.ok(!html.includes('role="status"'));
});

test('public snapshots render clean article links before JavaScript, including without browser Firebase configuration', () => {
  const posts = [{ slug: 'published-article', title: 'Published article', excerpt: 'Intro', publishedAt: '2026-11-05T00:00:00Z', categories: ['Notes'], tags: [], featuredImage: '', featuredImageAlt: '' }];
  for (const configured of [true, false]) {
    const html = initialBlog(configured, false, posts);
    assert.ok(html.includes('href="/blog/published-article/"'));
    assert.ok(html.includes('Published article'));
    assert.ok(!html.includes('STATIC FALLBACK CONTENT'));
    assert.equal((html.match(/<h1>/g) || []).length, 1);
  }
});

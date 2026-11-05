const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const path = require('node:path');
const file = path.resolve('src/lib/blog-model.ts');
const loaded = new Module(file, module);
loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, file);
const { validatePost, validDate, postFromData, articleBlocks } = loaded.exports;
const post = { slug: 'first-article', title: 'An article', excerpt: 'An introduction', category: 'Notes', content: 'Hello\n\n## A heading\n\n- First\n- Second', status: 'draft', publishedAt: '' };

test('drafts may omit a publication date; published articles require a real date', () => {
  assert.equal(validatePost(post), null);
  assert.ok(validatePost({ ...post, status: 'published' }));
  assert.ok(validatePost({ ...post, status: 'published', publishedAt: '2026-02-30' }));
  assert.equal(validatePost({ ...post, status: 'published', publishedAt: '2026-11-05' }), null);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2025-02-29'), false);
});
test('reject unsafe slugs, blank content and oversized fields', () => {
  for (const slug of ['../secret', 'Bad Slug', '-start', 'end-', 'two--hyphens', 'x'.repeat(101)]) assert.ok(validatePost({ ...post, slug }));
  assert.ok(validatePost({ ...post, content: ' \n ' }));
  assert.ok(validatePost({ ...post, content: 'x'.repeat(60001) }));
  assert.ok(validatePost({ ...post, status: 'invalid' }));
});
test('reject malformed database records and require positive revisions', () => {
  assert.equal(postFromData(post.slug, { ...post, revision: 1 }).title, post.title);
  for (const revision of [0, -1, 1.5, '1', undefined]) assert.equal(postFromData(post.slug, { ...post, revision }), null);
  assert.equal(postFromData(post.slug, { ...post, revision: 1, title: null }), null);
});
test('article formatting preserves literal HTML and supports headings, lists and quotes', () => {
  assert.deepEqual(articleBlocks('A paragraph\r\n\r\n## Heading\r\n\r\n- One\r\n- Two\r\n\r\n> A quote\r\n> More\r\n\r\n<script>alert(1)</script>'), [
    { type: 'paragraph', text: 'A paragraph' }, { type: 'heading', text: 'Heading' },
    { type: 'list', items: ['One', 'Two'] }, { type: 'quote', text: 'A quote\nMore' },
    { type: 'paragraph', text: '<script>alert(1)</script>' },
  ]);
  assert.deepEqual(articleBlocks(' \n\n '), []);
});

test('article rendering escapes HTML instead of executing author input', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const renderer = ts.transpileModule(fs.readFileSync('src/components/blog-article-content.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exported = {};
  new Function('require', 'exports', renderer)(name => name === '@/lib/blog-model' ? loaded.exports : require(name), exported);
  const html = renderToStaticMarkup(React.createElement(exported.BlogArticleContent, { content: '<script>alert(1)</script>\n\n## Real heading' }));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('<h2>Real heading</h2>'));
});

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'exports', code)(name => mocks[name] ?? require(name), exports);
  return exports;
}
const model = load('src/lib/blog-model.ts');
const { formatArticle } = load('src/lib/article-formatting.ts', { './blog-model': model });
const { insertArticleMedia } = load('src/lib/article-media.ts', { './blog-model': model });
const { BlogArticleContent } = load('src/components/blog-article-content.tsx', { '@/lib/blog-model': model });
const render = content => renderToStaticMarkup(React.createElement(BlogArticleContent, { content }));

test('uploaded images insert between paragraphs and render with descriptions without losing text', () => {
  const before = 'First paragraph.'; const after = 'Second paragraph.';
  const url = 'https://res.cloudinary.com/demo/image/upload/v1/photo.webp';
  const next = insertArticleMedia(before + '\n\n' + after, before.length, 'image', url, 'Cebu waterfront');
  const html = render(next.content);
  assert.ok(html.indexOf(before) < html.indexOf('<figure'));
  assert.ok(html.indexOf('</figure>') < html.indexOf(after));
  assert.ok(html.includes('alt="Cebu waterfront"'));
  assert.ok(html.includes('<figcaption>Cebu waterfront</figcaption>'));
  const repeated = insertArticleMedia(next.content, next.caret, 'image', url, 'Second view');
  assert.equal((render(repeated.content).match(/<figure/g) || []).length, 2);
  assert.ok(repeated.content.includes(before) && repeated.content.includes(after));
});

test('media insertion rejects invalid input and oversized content while retaining URL file links', () => {
  for (const url of ['javascript:bad', '//evil.example/a', 'data:image/png,bad', 'https://user:pass@example.com/a']) assert.throws(() => insertArticleMedia('Original', 4, 'image', url, 'Photo'));
  for (const label of ['', '[]\n', 'a'.repeat(201)]) assert.throws(() => insertArticleMedia('Original', 4, 'image', '/photo.webp', label));
  assert.throws(() => insertArticleMedia('x'.repeat(60000), 10, 'image', '/photo.webp', 'Photo'), /60,000/);
  const file = insertArticleMedia('Body', 999, 'asset', '/files/guide(1).pdf', 'Read [the] guide');
  assert.ok(file.content.startsWith('Body'));
  assert.ok(render(file.content).includes('href="/files/guide%281%29.pdf"'));
  assert.ok(!render(file.content).includes('<figure'));
});

test('inline toolbar wraps the selection, restores it, and toggles existing formatting', () => {
  const bold = formatArticle('Hello world', 6, 11, 'bold');
  assert.deepEqual(bold, { content: 'Hello **world**', start: 8, end: 13 });
  assert.equal(formatArticle(bold.content, bold.start, bold.end, 'bold').content, 'Hello world');
  assert.equal(formatArticle('**world**', 0, 9, 'bold').content, 'world');
  assert.equal(formatArticle('Hello', 5, 5, 'italic').content, 'Hello*text*');
  assert.equal(formatArticle('word', 0, 4, 'code').content, '`word`');
});

test('block tools act on entire selected lines and preserve surrounding content', () => {
  const text = 'Intro\nFirst\nSecond\nEnd';
  const list = formatArticle(text, 8, 17, 'list');
  assert.equal(list.content, 'Intro\n- First\n- Second\nEnd');
  assert.equal(formatArticle(list.content, list.start, list.end, 'list').content, text);
  assert.equal(formatArticle('First\nSecond', 0, 12, 'ordered-list').content, '1. First\n2. Second');
  assert.equal(formatArticle('## Heading', 3, 10, 'subheading').content, '### Heading');
  assert.equal(formatArticle('Heading', 0, 7, 'heading').content, '## Heading');
  assert.equal(formatArticle('', 0, 0, 'ordered-list').content, '1. ');
  assert.equal(formatArticle('\nHeading', 0, 0, 'heading').content, '## \nHeading');
  assert.equal(formatArticle('First\nSecond', 0, 6, 'quote').content, '> First\nSecond');
});

test('link insertion preserves selected text and rejects unsafe destinations', () => {
  const link = formatArticle('Read more today', 5, 9, 'link', 'https://example.com/a(b)');
  assert.equal(link.content, 'Read [more](https://example.com/a%28b%29) today');
  assert.equal(link.content.slice(link.start, link.end), 'more');
  for (const url of ['javascript:alert(1)', '//evil.example', 'data:text/html,bad', 'https://user:pass@example.com']) assert.equal(formatArticle('Text', 0, 4, 'link', url).content, 'Text');
});

test('preview and public renderer support adjacent headings, inline formatting and both list kinds', () => {
  const html = render('Intro **bold** and *italic* with `code`.\n## Main heading\n### Detail\nA [safe link](https://example.com).\n- Bullet **one**\n- Bullet two\n1. First\n2. Second\n> A *quote*');
  for (const part of ['<strong>bold</strong>', '<em>italic</em>', '<code>code</code>', '<h2>Main heading</h2>', '<h3>Detail</h3>', 'href="https://example.com"', '<ul>', '<ol>', '<blockquote>']) assert.ok(html.includes(part), part);
  assert.ok(!html.includes('<h1>'));
});

test('formatted content stays safe against stored HTML, scripts and unsafe links', () => {
  const html = render('**<script>alert(1)</script>**\n[Bad](javascript:evil)\n![Bad](data:image/svg+xml,bad)\n<a href="javascript:evil">raw</a>');
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('src="data:'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('&lt;a href='));
});

test('legacy media, paragraphs, H2 headings and lists remain compatible', () => {
  const html = render('Old paragraph\nwith a line break\n\n## Old heading\n\n- First\n- Second\n\n![Cebu coast](https://example.com/coast.webp)\n\n[Download](/files/guide.pdf)');
  for (const part of ['Old paragraph\nwith a line break', '<h2>Old heading</h2>', '<li>First</li>', 'alt="Cebu coast"', 'href="/files/guide.pdf"']) assert.ok(html.includes(part), part);
});

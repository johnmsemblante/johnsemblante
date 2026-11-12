const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const Module = require('node:module');
const ts = require('typescript');
const path = require('node:path');
const file = path.resolve('src/lib/blog-model.ts');
const loaded = new Module(file, module);
loaded._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017 } }).outputText, file);
const { emptyPost, validatePost, validDate, postFromData, articleBlocks, slugForTitle, slugCandidate, normalizeLabels, scheduleMillis, manilaDateTime, effectiveStatus, safeAssetUrl, postMetadata } = loaded.exports;
const post = { ...emptyPost(), slug: 'first-article', title: 'An article', excerpt: 'An introduction', content: 'Hello\n\n## A heading\n\n- First\n- Second' };

test('slugs are generated from titles, normalized and suffixed for collisions', () => {
  assert.equal(slugForTitle('  Café & WordPress: A Guide! '), 'cafe-wordpress-a-guide');
  assert.equal(slugForTitle('你好'), 'post');
  assert.equal(slugCandidate('hello', 0), 'hello');
  assert.equal(slugCandidate('hello', 2), 'hello-3');
  assert.ok(slugForTitle('x'.repeat(300)).length <= 90);
});
test('categories and tags normalize duplicates and enforce limits', () => {
  assert.deepEqual(normalizeLabels(['Web', ' web ', 'Travel']), ['Web', 'Travel']);
  assert.equal(validatePost(post), null);
  assert.ok(validatePost({ ...post, categories: [] }));
  assert.ok(validatePost({ ...post, tags: ['Web', 'web'] }));
  assert.ok(validatePost({ ...post, tags: Array.from({ length: 21 }, (_, i) => `tag-${i}`) }));
});
test('only Schedule requires a date, interpreted in Manila time and strictly in the future', () => {
  const now = Date.parse('2026-11-05T04:00:00Z');
  assert.equal(validatePost({ ...post, status: 'published' }, { now }), null);
  assert.ok(validatePost({ ...post, status: 'scheduled', scheduledFor: '2026-11-05T12:00' }, { now }));
  assert.equal(validatePost({ ...post, status: 'scheduled', scheduledFor: '2026-11-05T12:01' }, { now }), null);
  assert.ok(Number.isNaN(scheduleMillis('2026-02-30T12:00')));
  assert.ok(Number.isNaN(scheduleMillis('2026-11-05T24:01')));
  assert.equal(scheduleMillis('2026-11-05T12:01'), Date.parse('2026-11-05T04:01:00Z'));
  assert.equal(manilaDateTime(Date.parse('2026-11-05T16:01:00Z')), '2026-11-06T00:01');
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2025-02-29'), false);
});
test('legacy records remain readable; due schedules become public without a write', () => {
  const legacy = { title: post.title, excerpt: post.excerpt, category: 'Notes', content: post.content, status: 'published', publishedAt: '2026-11-05', revision: 1 };
  const imported = postFromData(post.slug, legacy);
  assert.deepEqual(imported.categories, ['Notes']);
  assert.deepEqual(imported.tags, []);
  assert.equal(postFromData(post.slug, { ...legacy, category: 'x'.repeat(80) }).categories[0].length, 80);
  const release = Date.parse('2026-11-05T04:00:00Z');
  const scheduled = postFromData(post.slug, { ...post, schemaVersion: 2, status: 'scheduled', publishedAt: { toDate: () => new Date(release) }, revision: 1 });
  assert.equal(effectiveStatus(scheduled, release - 1), 'scheduled');
  assert.equal(effectiveStatus(scheduled, release), 'published');
  assert.equal(postFromData(post.slug, { ...post, schemaVersion: 2, revision: 0 }), null);
});
test('SEO fields fall back independently to title and introduction', () => {
  assert.deepEqual(postMetadata(post), { title: post.title, description: post.excerpt });
  assert.deepEqual(postMetadata({ ...post, seoTitle: 'Custom title', seoDescription: '  ' }), { title: 'Custom title', description: post.excerpt });
  assert.ok(validatePost({ ...post, seoDescription: 'x'.repeat(501) }));
});
test('article rendering escapes HTML and supports safe images and asset links', () => {
  const React = require('react'); const { renderToStaticMarkup } = require('react-dom/server');
  const renderer = ts.transpileModule(fs.readFileSync('src/components/blog-article-content.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exported = {}; new Function('require', 'exports', renderer)(name => name === '@/lib/blog-model' ? loaded.exports : name === '@/content/site' ? { site: { url: 'https://johnsemblante.com' } } : require(name), exported);
  const html = renderToStaticMarkup(React.createElement(exported.BlogArticleContent, { content: '<script>alert(1)</script>\n\n## Heading\n\n![A photo](https://example.com/photo.webp)\n\n[Document](/files/info.pdf)\n\n![Bad](javascript:alert)' }));
  assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('<h2>Heading</h2>')); assert.ok(html.includes('alt="A photo"'));
  assert.ok(html.includes('href="/files/info.pdf"')); assert.ok(!html.includes('src="javascript:'));
  assert.equal(safeAssetUrl('//evil.example/file'), false);
  assert.equal(safeAssetUrl('data:image/png;base64,x'), false);
  assert.equal(safeAssetUrl('https://user:password@example.com/file'), false);
  assert.deepEqual(articleBlocks('- One\n- Two\n\n> A quote'), [{ type: 'list', items: ['One', 'Two'] }, { type: 'quote', text: 'A quote' }]);
});


test('featured images survive editing and older records default to the logo fallback', () => {
  const record = { ...post, schemaVersion: 2, revision: 1, featuredImage: 'https://example.com/cover.webp', featuredImageAlt: 'A Cebu coastline' };
  const parsed = postFromData(post.slug, record);
  assert.equal(parsed.featuredImage, record.featuredImage);
  assert.equal(loaded.exports.editablePost(parsed).featuredImageAlt, record.featuredImageAlt);
  const { featuredImage, featuredImageAlt, ...older } = record;
  assert.equal(postFromData(post.slug, older).featuredImage, '');
  for (const url of ['javascript:alert(1)', '//evil.example/a', 'http://example.com/a', 'x'.repeat(2001)]) assert.ok(validatePost({ ...post, featuredImage: url }));
  assert.equal(validatePost({ ...post, featuredImage: '/images/cover.webp' }), null);
  assert.ok(validatePost({ ...post, featuredImageAlt: 'x'.repeat(201) }));
});

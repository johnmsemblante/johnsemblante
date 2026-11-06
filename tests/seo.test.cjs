const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(file, mocks = {}) {
  const exports = {};
  new Function('require', 'exports', ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2017, jsx: ts.JsxEmit.ReactJSX } }).outputText)(name => mocks[name] ?? require(name), exports);
  return exports;
}
const site = { name: 'John Semblante', url: 'https://johnmsemblanteapp.web.app', description: 'Developer in Cebu', socialImage: '/images/seo/john-semblante-social.png' };
const model = load('src/lib/blog-model.ts');
const profile = load('src/content/profile.ts');
const metadata = load('src/lib/metadata.ts', { '@/content/site': { site }, '@/content/profile': profile });
const seo = load('src/lib/seo.ts', { '@/content/site': { site }, '@/content/profile': profile });
const { fetchPublicBlogSnapshot } = load('src/lib/public-blog-snapshot.ts', { './blog-model': model });
const now = Date.parse('2026-11-06T04:00:00Z');
const post = { ...model.emptyPost(), slug: 'seo-post', title: 'Article title', excerpt: 'An introduction', content: '## A section\n\n**Useful** article content.', status: 'published', publishedAt: '2026-11-05T04:00:00.000Z', revision: 1, schemaVersion: 2 };
function wire(value) { if (value === null) return { nullValue: null }; if (Array.isArray(value)) return { arrayValue: { values: value.map(wire) } }; return typeof value === 'number' ? { integerValue: String(value) } : { stringValue: value }; }
function document(value) { return { document: { name: 'projects/demo-site/databases/(default)/documents/blogPosts/' + value.slug, fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, wire(item)])) } }; }

test('shared metadata supplies canonical URLs, public images and large Twitter cards', () => {
  const result = metadata.pageMetadata('Title', 'Description', '/blog/');
  assert.equal(result.alternates.canonical, site.url + '/blog/');
  assert.equal(result.openGraph.images[0].url, site.socialImage);
  assert.equal(result.twitter.card, 'summary_large_image');
  assert.equal(metadata.pageMetadata('T', 'D', '/work/', { url: '/cover.webp', alt: 'Project cover' }).openGraph.images[0].url, '/cover.webp');
});

test('article structured data uses real author/date/image and escapes script-breaking content', () => {
  const schema = seo.articleSchema({ title: '</script><script>bad</script>', description: 'Intro', publishedAt: post.publishedAt, url: site.url + '/blog/seo-post/' });
  assert.equal(schema.datePublished, post.publishedAt);
  assert.equal(schema.author.url, site.url + '/about/');
  assert.equal(schema.author.name, 'John Clark Semblante');
  assert.equal(schema.image[0], site.url + site.socialImage);
  assert.ok(!seo.jsonLd(schema).includes('<'));
  assert.equal(JSON.parse(seo.jsonLd(schema)).headline, schema.headline);
});

test('anonymous export paginates both public queries without using admin tokens or API keys', async () => {
  const calls = [];
  const result = await fetchPublicBlogSnapshot('demo-site', async (url, options) => {
    const query = JSON.parse(options.body).structuredQuery; calls.push(query);
    assert.ok(!url.includes('key=')); assert.equal(options.credentials, 'omit'); assert.equal(options.headers.Authorization, undefined);
    const status = query.where.compositeFilter.filters[0].fieldFilter.value.stringValue;
    if (status === 'scheduled') return { ok: true, json: async () => [{ readTime: post.publishedAt }] };
    return { ok: true, json: async () => query.offset === 0 ? Array.from({ length: 200 }, (_, i) => document({ ...post, slug: 'post-' + i })) : [document(post)] };
  }, now);
  assert.equal(result.length, 201);
  assert.deepEqual(calls.map(query => query.offset), [0, 200, 0]);
  assert.equal(calls[2].where.compositeFilter.filters[2].fieldFilter.value.integerValue, String(now - 60000));
});

test('export never includes drafts or future schedules and stops on provider/record errors', async () => {
  let request = 0;
  const result = await fetchPublicBlogSnapshot('demo-site', async () => ({ ok: true, json: async () => ++request === 1 ? [document(post), document({ ...post, slug: 'draft', status: 'draft' })] : [document({ ...post, slug: 'future', status: 'scheduled', publishedAt: '2027-01-01T00:00:00Z' })] }), now);
  assert.deepEqual(result.map(value => value.slug), ['seo-post']);
  await assert.rejects(fetchPublicBlogSnapshot('demo-site', async () => ({ ok: false, status: 403 }), now), /build was stopped/);
  await assert.rejects(fetchPublicBlogSnapshot('demo-site', async () => ({ ok: true, json: async () => [document({ ...post, title: '' })] }), now), /invalid article/);
});

test('published managed articles render content, one H1 and JSON-LD without JavaScript', () => {
  const content = load('src/components/blog-article-content.tsx', { '@/lib/blog-model': model });
  const image = load('src/components/blog-featured-image.tsx', { '@/lib/blog-model': model });
  const { PublishedBlogArticle } = load('src/components/published-blog-article.tsx', { 'next/link': { default: ({ children, ...props }) => React.createElement('a', props, children) }, '@/content/site': { site }, '@/lib/blog-model': model, '@/lib/seo': seo, './blog-article-content': content, './blog-featured-image': image, './article-share-link': load('src/components/article-share-link.tsx') });
  const html = renderToStaticMarkup(React.createElement(PublishedBlogArticle, { post }));
  assert.equal((html.match(/<h1>/g) || []).length, 1);
  assert.ok(html.includes('<strong>Useful</strong>'));
  assert.ok(html.includes('application/ld+json'));
  assert.ok(html.includes(site.url + '/blog/seo-post/'));
});

test('managed article routes use admin SEO values and only published snapshot slugs', async () => {
  const source = { slug: 'source-post', title: 'Source title', excerpt: 'Source excerpt', category: 'Notes', publishedAt: '2026-11-04', body: [] };
  const route = load('src/app/(portfolio)/blog/[[...slug]]/page.tsx', { '@/components/blog-card': {}, '@/components/managed-blog': {}, 'next/link': {}, 'next/navigation': { notFound() { throw Error('404'); } }, '@/content/blog': { publishedPosts: () => [source] }, '@/components/ui': {}, '@/lib/build-blog': { buildBlogPosts: () => [{ ...post, seoTitle: 'Custom SEO title', seoDescription: 'Custom SEO description' }] }, '@/lib/blog-model': model, '@/components/live-published-blog-article': {}, '@/lib/seo': seo, '@/content/site': { site }, '@/lib/metadata': metadata });
  assert.deepEqual(route.generateStaticParams().map(value => value.slug), [[], ['source-post'], ['seo-post']]);
  const result = await route.generateMetadata({ params: Promise.resolve({ slug: ['seo-post'] }) });
  assert.equal(result.title, 'Custom SEO title'); assert.equal(result.description, 'Custom SEO description');
  assert.equal(result.alternates.canonical, site.url + '/blog/seo-post/');
  await assert.rejects(route.generateMetadata({ params: Promise.resolve({ slug: ['draft'] }) }), /404/);
});


test('identity schema uses the full name, brand alias and existing public profile URLs', () => {
  const person = seo.websiteSchema()['@graph'].find(item => item['@type'] === 'Person');
  assert.equal(person.name, 'John Clark Semblante'); assert.equal(person.alternateName, site.name);
  assert.equal(person.jobTitle, 'WordPress/Full Stack Developer');
  assert.ok(person.sameAs.includes('https://www.linkedin.com/in/johnsemblante/'));
  assert.deepEqual(person.sameAs, profile.socialAccounts.map(account => account.url));
});

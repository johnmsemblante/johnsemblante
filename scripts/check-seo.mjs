import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const errors = [], warnings = [];
const decode = text => text.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
function attrs(tag) { return Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(match => [match[1], decode(match[2])])); }
if (!fs.existsSync('out/sitemap.xml')) throw new Error('Run npm run build before npm run audit:seo.');
const urls = [...fs.readFileSync('out/sitemap.xml', 'utf8').matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));
const origin = new URL(urls[0]).origin;
const blogListing = fs.readFileSync('out/blog/index.html', 'utf8').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
assert.equal(new Set(urls).size, urls.length, 'Sitemap contains duplicate URLs');
for (const url of urls) {
  try {
    const parsed = new URL(url);
    assert.equal(parsed.origin, origin, 'Mixed sitemap domains');
    assert.ok(!parsed.search && !parsed.hash, 'Sitemap should contain clean canonical URLs');
    assert.ok(!parsed.pathname.startsWith('/adminauth'), 'Private admin route appears in sitemap');
    if (parsed.pathname.startsWith('/blog/') && parsed.pathname !== '/blog/') assert.ok(blogListing.includes(`href="${parsed.pathname}"`), 'Article has no initial-HTML link from the blog listing');
    const file = path.join('out', parsed.pathname, 'index.html');
    assert.ok(fs.existsSync(file), 'Sitemap URL has no exported HTML');
    const html = fs.readFileSync(file, 'utf8');
    const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(match => attrs(match[0]));
    const meta = key => metas.find(item => item.name === key || item.property === key)?.content;
    const canonical = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attrs(match[0])).find(link => link.rel === 'canonical')?.href;
    assert.equal(canonical, url, 'Missing or incorrect canonical');
    const title = decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || '');
    assert.ok(title.trim(), 'Missing title');
    assert.ok(meta('description')?.trim(), 'Missing description');
    assert.ok(!meta('robots')?.includes('noindex'), 'Public sitemap URL is noindex');
    assert.ok(html.includes('<html lang="en"'), 'Missing English document language');
    const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, '');
    assert.equal((body.match(/<h1\b/g) || []).length, 1, 'Expected one initial-HTML H1');
    assert.equal(meta('og:url'), url, 'Open Graph URL differs from canonical');
    assert.ok(meta('og:title') && meta('og:description'), 'Missing Open Graph title/description');
    assert.equal(meta('twitter:card'), 'summary_large_image', 'Missing large-image Twitter card');
    for (const key of ['og:image', 'twitter:image']) {
      const image = new URL(meta(key));
      assert.equal(image.protocol, 'https:', 'Social image must use HTTPS');
      if (image.origin === origin) assert.ok(fs.existsSync(path.join('out', image.pathname)), 'Social image is missing from export');
    }
    for (const match of body.matchAll(/<img\b[^>]*>/g)) assert.ok('alt' in attrs(match[0]), 'Image is missing alt attribute');
    const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
    if (parsed.pathname === '/') {
      const person = schemas.flatMap(schema => schema['@graph'] || [schema]).find(schema => schema['@type'] === 'Person');
      assert.ok(person?.name, 'Homepage is missing Person identity data');
      assert.ok(title.includes(person.name), 'Homepage title does not include the full Person name');
      assert.ok(person.jobTitle && title.includes(person.jobTitle), 'Homepage title differs from the current Person job title');
      const specialty = decode(body.match(/<p class="hero-specialty">([\s\S]*?)<\/p>/)?.[1] || '');
      assert.equal(specialty, person.jobTitle, 'Homepage hero differs from the current Person job title');
      const heading = decode(body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/)?.[1].replace(/<[^>]*>/g, '') || '');
      assert.ok(heading.includes(person.name), 'Homepage H1 does not include the full Person name');
    }
    if (title.length > 65) warnings.push(`${parsed.pathname}: title is ${title.length} characters; review for clarity.`);
    if ((meta('description') || '').length > 170) warnings.push(`${parsed.pathname}: description is long; review the snippet.`);
  } catch (error) { errors.push(`${url}: ${error.message}`); }
}
function walk(directory) { return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]); }
for (const file of walk('out/adminauth').filter(file => file.endsWith('.html'))) {
  if (!fs.readFileSync(file, 'utf8').includes('noindex, nofollow')) errors.push(`${file}: private page is missing noindex`);
}
const robots = fs.readFileSync('out/robots.txt', 'utf8');
if (!robots.includes(`Sitemap: ${origin}/sitemap.xml`)) errors.push('robots.txt does not point to the canonical sitemap.');
for (const error of errors) console.error(error);
for (const warning of warnings) console.warn(warning);
console.log(`SEO export audit: ${urls.length} public pages; ${errors.length} errors; ${warnings.length} editorial warnings. Admin noindex and robots.txt checked.`);
if (errors.length) process.exitCode = 1;

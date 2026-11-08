import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';

export function sitemapUrls(xml, origin) {
  assert.ok(Buffer.byteLength(xml) <= 50 * 1024 * 1024, 'Sitemap exceeds 50 MB');
  assert.match(xml, /^\s*<\?xml[^>]+encoding=["']UTF-8["'][^>]*\?>/i, 'Missing UTF-8 XML declaration');
  assert.match(xml, /<urlset\s+xmlns=["']http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9["']\s*>/, 'Incorrect sitemap namespace');
  assert.match(xml, /<\/urlset>\s*$/, 'Sitemap is incomplete');
  const entries = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)];
  const urls = entries.map(([, value]) => value.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>'));
  assert.ok(urls.length > 0 && urls.length <= 50000, 'Sitemap must contain 1–50,000 URLs');
  assert.equal(new Set(urls).size, urls.length, 'Sitemap contains duplicate URLs');
  for (const value of urls) {
    const url = new URL(value);
    assert.equal(url.origin, origin, 'Sitemap URL uses another origin');
    assert.ok(!url.search && !url.hash, 'Sitemap URL has a query or fragment');
    assert.ok(!url.pathname.startsWith('/adminauth'), 'Private route is in the sitemap');
  }
  return urls;
}

export async function auditLiveSeo(origin, fetcher = fetch) {
  const base = new URL(origin);
  assert.equal(base.protocol, 'https:', 'Use the HTTPS production origin');
  assert.equal(base.href.replace(/\/$/, ''), base.origin, 'Use an origin without a path, credentials or query');
  origin = base.origin;
  const read = (path, options = {}) => fetcher(new URL(path, origin), { redirect: 'manual', cache: 'no-store', signal: AbortSignal.timeout(20000), ...options });
  const response = await read('/sitemap.xml');
  assert.equal(response.status, 200, `Sitemap fetch returned HTTP ${response.status}`);
  assert.match(response.headers.get('content-type') || '', /(?:application|text)\/xml\b/i, 'Sitemap is not served as XML');
  assert.ok(!response.headers.get('x-robots-tag')?.includes('noindex'), 'Sitemap response is noindex');
  assert.match(response.headers.get('cache-control') || '', /must-revalidate/, 'Sitemap cache policy is missing revalidation');
  const xml = await response.text();
  const urls = sitemapUrls(xml, origin);
  for (const [label, headers] of [
    ['Googlebot user agent', { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }],
    ['uncompressed request', { 'Accept-Encoding': 'identity' }],
  ]) {
    const result = await read('/sitemap.xml', { headers });
    assert.equal(result.status, 200, `${label}: HTTP ${result.status}`);
    assert.equal(await result.text(), xml, `${label}: sitemap body differs`);
  }
  const head = await read('/sitemap.xml', { method: 'HEAD' });
  assert.equal(head.status, 200, 'Sitemap HEAD request failed');
  const robots = await read('/robots.txt');
  assert.equal(robots.status, 200, 'robots.txt is unavailable');
  assert.match(robots.headers.get('content-type') || '', /text\/plain/i, 'robots.txt is not plain text');
  const rules = await robots.text();
  assert.ok(rules.includes(`Sitemap: ${origin}/sitemap.xml`), 'robots.txt references a different sitemap');
  assert.ok(!/^Disallow:\s*\/\s*$/mi.test(rules), 'robots.txt blocks the whole site');
  for (const path of ['/sitemap.xml', '/robots.txt']) {
    const alias = await read(`${path}/`);
    assert.equal(alias.status, 301, `Extra trailing slash on ${path} must redirect`);
    assert.equal(new URL(alias.headers.get('location'), origin).href, `${origin}${path}`, 'Incorrect crawler-file redirect');
  }
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(4, urls.length) }, async () => {
    for (;;) {
      const index = next++; if (index >= urls.length) return;
      const url = urls[index]; const result = await read(url);
      assert.equal(result.status, 200, `${url}: HTTP ${result.status}`);
      assert.ok(!result.headers.get('x-robots-tag')?.includes('noindex'), `${url}: noindex response header`);
      const html = await result.text();
      assert.ok(!/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html), `${url}: noindex metadata`);
      const canonicals = [...html.matchAll(/<link\b[^>]*>/g)].map(m => m[0]).filter(tag => /rel=["']canonical["']/.test(tag));
      assert.equal(canonicals.length, 1, `${url}: expected one canonical`);
      assert.equal(canonicals[0].match(/href=["']([^"']+)["']/)?.[1], url, `${url}: canonical differs`);
    }
  }));
  return { origin, pages: urls.length, bytes: Buffer.byteLength(xml) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  auditLiveSeo(process.argv[2] || 'https://johnmsemblanteapp.web.app').then(result => {
    console.log(`Live SEO audit passed: ${result.pages} public URLs; sitemap ${result.bytes} bytes; XML/robots/crawler-file redirects/canonical pages checked.`);
    console.log('User-agent checks are not requests from Google infrastructure. Search Console fetch status and indexing must be checked separately.');
  }).catch(error => { console.error(`Live SEO audit failed: ${error.message}`); process.exitCode = 1; });
}

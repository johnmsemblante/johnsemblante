import { test } from 'node:test';
import assert from 'node:assert/strict';
import { auditLiveSeo, sitemapUrls } from '../scripts/check-live-seo.mjs';
import { auditSearchBranding } from '../scripts/check-search-branding.mjs';
const origin = 'https://portfolio.example';

test('search branding audit checks every page, homepage identity and actual PNG dimensions', async () => {
  function branding({name='John Clark Semblante',size=96}={}) {
    return async (url,options) => {
      assert.equal(options.cache,'no-store');
      const path=new URL(url).pathname;
      if(path==='/sitemap.xml')return new Response(xml([origin+'/',origin+'/about/']));
      if(path==='/icon.png'){const png=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(png);png.writeUInt32BE(size,16);png.writeUInt32BE(size,20);return new Response(png,{headers:{'Content-Type':'image/png'}});}
      return new Response(`<meta property="og:site_name" content="${name}"><link rel="icon" href="/icon.png?stable" type="image/png" sizes="96x96">${path==='/'?'<title>Cebu Web Developer | John Clark Semblante</title><script type="application/ld+json">'+JSON.stringify({'@type':'WebSite',name:'John Clark Semblante',alternateName:'John Semblante',url:origin+'/'})+'</script>':'<title>About John Clark Semblante</title>'}`);
    };
  }
  assert.deepEqual(await auditSearchBranding(origin,branding()),{pages:2,icon:'/icon.png'});
  await assert.rejects(auditSearchBranding(origin,branding({name:'Other site'})),/site name differs/);
  await assert.rejects(auditSearchBranding(origin,branding({size:16})));
});
const xml = urls => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${url}</loc></url>`).join('')}</urlset>`;
test('live sitemap checks reject broken namespaces, private URLs, duplicate URLs and other origins', () => {
  assert.deepEqual(sitemapUrls(xml([`${origin}/`]), origin), [`${origin}/`]);
  for (const value of [xml([`${origin}/`, `${origin}/`]), xml([`${origin}/adminauth/`]), xml(['https://other.example/']), xml([`${origin}/`]).replace('sitemap/0.9', 'sitemap/1.0')]) assert.throws(() => sitemapUrls(value, origin));
});
function mock({ brokenAlias = false, pageNoindex = false, sitemapStatus = 200 } = {}) {
  return async (url, options) => {
    const { pathname } = new URL(url);
    if (pathname.endsWith('.xml/') || pathname.endsWith('.txt/')) return new Response('', { status: brokenAlias ? 404 : 301, headers: { Location: pathname.slice(0, -1) } });
    if (pathname === '/sitemap.xml') return new Response(options.method === 'HEAD' ? null : xml([`${origin}/`]), { status: sitemapStatus, headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public,max-age=0,must-revalidate' } });
    if (pathname === '/robots.txt') return new Response(`User-Agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`, { headers: { 'Content-Type': 'text/plain' } });
    return new Response(`<link rel="canonical" href="${origin}/">${pageNoindex ? '<meta name="robots" content="noindex">' : ''}`);
  };
}
test('live audit checks canonical sitemap, robot discovery, headers, crawler variants, aliases and pages', async () => {
  const result = await auditLiveSeo(origin, mock()); assert.equal(result.pages, 1);
  await assert.rejects(() => auditLiveSeo(origin, mock({ brokenAlias: true })), /trailing slash/);
  await assert.rejects(() => auditLiveSeo(origin, mock({ pageNoindex: true })), /noindex/);
  await assert.rejects(() => auditLiveSeo(origin, mock({ sitemapStatus: 503 })), /HTTP 503/);
});

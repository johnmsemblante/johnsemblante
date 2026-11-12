import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { sitemapUrls } from './check-live-seo.mjs';

const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m => [m[1],m[2].replaceAll('&amp;','&')]));
export async function auditSearchBranding(origin = 'https://johnsemblante.com', fetcher = fetch) {
  const base = new URL(origin); assert.equal(base.protocol,'https:'); assert.equal(base.origin,origin.replace(/\/$/,''));
  const read = async path => { const r=await fetcher(new URL(path,base),{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)}); assert.equal(r.status,200,`${path}: expected HTTP 200`); return r; };
  const sitemap=await read('/sitemap.xml'), urls=sitemapUrls(await sitemap.text(),base.origin);
  let faviconPath=''; let cursor=0;
  await Promise.all(Array.from({length:Math.min(4,urls.length)},async()=>{
    while(cursor<urls.length){const url=urls[cursor++],r=await read(url),html=await r.text();
      const metas=[...html.matchAll(/<meta\b[^>]*>/g)].map(m=>attributes(m[0]));
      assert.equal(metas.find(m=>m.property==='og:site_name')?.content,'John Clark Semblante',`${url}: preferred site name differs`);
      const icon=[...html.matchAll(/<link\b[^>]*>/g)].map(m=>attributes(m[0])).find(l=>l.rel==='icon'&&l.type==='image/png'&&l.sizes==='96x96');
      assert.ok(icon,`${url}: missing 96px PNG favicon`);
      const iconUrl=new URL(icon.href,base);assert.equal(iconUrl.origin,base.origin);assert.equal(iconUrl.pathname,'/icon.png');faviconPath=iconUrl.href;
      if(new URL(url).pathname==='/'){
        assert.match(html,/<title>Cebu Web Developer \| John Clark Semblante<\/title>/);
        const nodes=[...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].flatMap(m=>{const data=JSON.parse(m[1]);return data['@graph']??[data];}).filter(n=>n['@type']==='WebSite');
        assert.equal(nodes.length,1);assert.equal(nodes[0].name,'John Clark Semblante');assert.equal(nodes[0].alternateName,'John Semblante');assert.equal(nodes[0].url,base.origin+'/');
      }
    }
  }));
  const image=await read(faviconPath);assert.match(image.headers.get('content-type')??'',/^image\/png/);
  const bytes=Buffer.from(await image.arrayBuffer());assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),96);assert.equal(bytes.readUInt32BE(20),96);
  return {pages:urls.length,icon:new URL(faviconPath).pathname};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  auditSearchBranding(process.argv[2]).then(result=>console.log(`Search branding passed: ${result.pages} public pages share John Clark Semblante and ${result.icon} (96x96). Homepage title and WebSite name/alternate verified. This checks the deployed site, not Google's chosen search appearance.`)).catch(error=>{console.error(error.message);process.exitCode=1;});
}

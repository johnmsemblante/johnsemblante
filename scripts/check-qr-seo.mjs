import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const origin = process.argv[2];
const canonical = "https://johnsemblante.com/tools/qr-code-generator/";
const route = "/tools/qr-code-generator/";
const title = "Free QR Code Generator (No Sign Up) | John Semblante";
const description = "Create free QR codes for websites, Wi-Fi, email, phone numbers and text. No sign-up, no watermarks or expiry. Customize and download PNG or SVG.";
const headings = [
  "How to Generate a QR Code for Free",
  "What Can You Use a QR Code For?",
  "Do Free QR Codes Expire?",
  "How to Create a Wi-Fi QR Code",
  "Frequently Asked Questions",
];
const decode = text => text.replace(/&amp;/g, "&").replace(/&#x27;/g, "'").replace(/&quot;/g, '"');
const attributes = tag => Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, decode(value)]));

async function read(path) {
  if (!origin) {
    const file = path.endsWith("/") ? `${path}index.html` : path;
    return readFile(`out${file}`, "utf8");
  }
  const response = await fetch(new URL(path, origin), { cache: "no-store" });
  assert.equal(response.status, 200, `HTTP status for ${path}`);
  assert.ok(!response.headers.get("x-robots-tag")?.includes("noindex"), `Indexing header for ${path}`);
  return response.text();
}

const [html, sitemap, robots, ventures, tools] = await Promise.all([
  read(route), read("/sitemap.xml"), read("/robots.txt"), read("/ventures/"), read("/tools/"),
]);
assert.equal(decode(html.match(/<title>(.*?)<\/title>/s)?.[1] || ""), title);
const metas = [...html.matchAll(/<meta\b[^>]*>/g)].map(match => attributes(match[0]));
function meta(name) {
  const matches = metas.filter(item => item.name === name || item.property === name);
  assert.equal(matches.length, 1, `Expected one ${name} tag`);
  return matches[0].content;
}
assert.equal(meta("description"), description);
assert.equal(meta("og:title"), title);
assert.equal(meta("og:description"), description);
assert.equal(meta("og:url"), canonical);
assert.equal(meta("twitter:title"), title);
assert.equal(meta("twitter:description"), description);
assert.equal(meta("twitter:card"), "summary_large_image");
assert.equal(meta("og:image"), meta("twitter:image"));
assert.ok(meta("robots").includes("index, follow"));
const canonicals = [...html.matchAll(/<link\b[^>]*>/g)].map(match => attributes(match[0])).filter(link => link.rel === "canonical");
assert.deepEqual(canonicals.map(link => link.href), [canonical]);
const body = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "");
assert.equal((body.match(/<h1\b/g) || []).length, 1);
assert.ok(body.includes("Free QR Code Generator</h1>"));
for (const heading of headings) assert.match(body, new RegExp(`<h2[^>]*>${heading.replace(/[?]/g, "\\?")}</h2>`));
assert.ok(body.indexOf('aria-label="QR code generator"') < body.indexOf('id="qr-how-to"'));
assert.ok(body.includes("A linked website must remain accessible"));
const schemas = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(match => JSON.parse(match[1]));
assert.equal(schemas.length, 1);
const application = schemas[0];
assert.equal(application["@context"], "https://schema.org");
assert.equal(application["@type"], "WebApplication");
assert.equal(application.url, canonical);
assert.equal(application.description, description);
assert.equal(application.applicationCategory, "UtilitiesApplication");
assert.equal(application.creator.name, "John Semblante");
assert.equal(application.offers.price, "0");
assert.equal(application.offers.priceCurrency, "USD");
assert.ok(!application.aggregateRating && !application.review);
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => decode(match[1]));
assert.equal(new Set(urls).size, urls.length);
assert.ok(urls.includes(canonical));
assert.ok(urls.includes("https://johnsemblante.com/tools/"));
assert.ok(robots.includes("Allow: /"));
assert.ok(!/Disallow:\s*\/(?:tools)?(?:\/|\s|$)/.test(robots));
assert.ok(robots.includes("Sitemap: https://johnsemblante.com/sitemap.xml"));
for (const listing of [ventures, tools]) assert.ok(listing.includes(`href="${route}"`));
console.log(`QR SEO audit passed for ${origin || "static export"}. Metadata, HTML headings, canonical, JSON-LD properties, sitemap, robots and directory links checked.`);

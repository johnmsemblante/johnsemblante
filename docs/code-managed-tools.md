# Code-managed tools

Utilities live in `src/config/tool-ventures.ts` with routes under `src/app/(portfolio)/tools/`. Published entries appear in tool cards and the sitemap. Keep them out of the managed venture registry, venture store, Firestore, and editable page catalog. `ToolVentureCards` uses plain links/text to bypass admin page editing. The Ventures page retains its original live cards and adds a separate tools section using the same card classes. Future tools reuse this registry without altering admin schemas.

## Homepage showcase

`HomeToolsShowcase` renders immediately after the homepage hero. To feature a tool, add `featuredOnHome: true` to its existing registry entry. `featuredOrder` controls homepage order and defaults to the directory's `order`. Optional `shortName`, `homeDescription`, `ctaLabel` and `iconImage` customize the card. Otherwise it uses the existing name, description and icon, with an Open tool link label.

Only published, featured entries appear. The selection removes duplicate IDs and routes, keeps the first four tools in display order, and omits the entire section when none qualify. One tool uses a wide featured card. Multiple tools use a two-column grid that stacks below 850px. The section renders static links and copy from source, without admin-editable fields or tool functionality imports. The QR illustration is a small decorative SVG with reserved dimensions.

Run `node --test tests/home-tools.test.cjs` for registry filtering, ordering, deduplication, limits, empty behavior and card rendering. Local review uses `npm.cmd run dev` at `http://localhost:3000/`, or `npm.cmd run preview` at `http://127.0.0.1:3100/` after a successful build.

## QR generator

`/tools/qr-code-generator/` supports HTTP(S), text, Wi-Fi (WPA/WPA2, WEP, open, hidden), email, and phone numbers. Settings include two colors, square/rounded dots, 512/1024/2048px output, reset and PNG/SVG downloads. Input stays in React state; generation and Blob downloads run locally, with no requests, uploads, persistent storage, logging or scan analytics. Recipients can read the data in a downloaded code, including Wi-Fi passwords.

`qr-code-styling` 1.9.2 (MIT) is dynamically imported in a client effect, keeping browser APIs out of static rendering. Its single-byte encoder needs explicit UTF-8 bytes (`qrByteString`); retain the Unicode decode check when upgrading. The generator uses Q correction, a 10% margin per side (at least four modules), a conservative 1,600 UTF-8 byte limit, a 250ms debounce and cancellation of stale results. Downloads are disabled until the current preview is ready. Weak contrast/inverted colors show a scanning warning.

Static codes have no built-in expiry; linked destinations can still disappear. Test downloaded codes on target devices before printing. Logo uploads, vCards, bulk generation, templates and payments are deferred. Future payload types belong in `qr-content.ts`, independently of rendering/export code.

## Check and release

```powershell
npm.cmd run test:qr
npm.cmd run typecheck
node --test tests/*.test.cjs tests/live-seo.test.mjs
npm.cmd run build
npm.cmd run audit:seo
npm.cmd run preview
```

Review `/ventures/`, `/tools/`, and the generator at desktop/tablet/mobile widths. Generate and scan PNG/SVG files for all content types, including Unicode and escaped Wi-Fi delimiters. Check invalid input, reset, keyboard focus, contrast warnings and final printed output.

Use the existing Hosting-only release after successful validation:

```powershell
firebase deploy --only hosting --project johnmsemblanteapp
npm.cmd run audit:seo:live
```

No Firebase configuration, rules, domain, worker or storage changes are needed. Never deploy stale `out/` files after a failed build.

## Implementation verification (12 November 2026)

The static production build and TypeScript checks passed. The 131 existing Node regression tests and six added QR tests passed. The exported-site SEO audit passed with zero errors or editorial warnings. Automated Edge checks verified payloads by decoding downloaded PNG/SVG files with jsQR (SVG rasterized with sharp), including all five types, Unicode/emoji, escaped Wi-Fi names/passwords, open Wi-Fi, rounded colored output and 2048px dimensions. Browser checks also covered invalid/empty/over-capacity content, reset, contrast warning, 1440/768/390px overflow, keyboard order, canonical/title, venture links, empty local/session storage and absence of input contents in requests. Test artifacts are in ignored `tmp/qr-*` files.

No authenticated production CRUD or physical-phone/printed-code scan was performed. Existing admin, blog and work behavior is supported by regression tests and unchanged implementation, not a claim of an exhaustive live audit. There is no configured lint command. Releases use the established Hosting-only CLI deployment command with an authorized login; no credentials should be copied into the repository.

## QR SEO readiness audit, 12 November 2026

The QR page uses the requested title and description, with an introduction covering customization and PNG/SVG downloads. Five guide sections cover generation, use cases, static-code expiry, Wi-Fi setup and FAQs. The generator follows the introduction. The expiry explanation specifies that linked websites must remain accessible and changing a static destination requires a new image.

The existing canonical, inherited index/follow directive, Open Graph/Twitter tags and branded 1200×630 social image remain in use. A single WebApplication JSON-LD object describes the free browser tool. JSON syntax and expected property values are checked locally. Google's Rich Results Test and Search Console URL Inspection have not been run. Google's software-app rich result has additional eligibility requirements, including review/rating information. This tool has no published ratings to mark up. [Google software-app documentation](https://developers.google.com/search/docs/appearance/structured-data/software-app)

Run `npm.cmd run audit:seo:qr` after building, or `node scripts/check-qr-seo.mjs https://johnsemblante.com` against production. This checks exact metadata, canonical uniqueness, initial-HTML headings, JSON-LD properties, sitemap membership, robots and links from Ventures and Tools. The full export audit, TypeScript check, 137 regression tests and browser QR decode checks passed. A JavaScript-disabled browser verified static content and working FAQ expansion. An XML parser verified the sitemap and preservation of all 37 entries. Homepage title, description, canonical and structured data matched the pre-change export.

Public HTTP checks found a 200 response for the canonical tool, 301 redirects for HTTP and the slashless URL, and a 404 for a missing tool route. Robots allows crawling and references the canonical sitemap. The www hostname failed resolution, with NXDOMAIN independently confirmed using Google's public DNS resolver. Configuring www requires DNS and Hosting domain setup. The preferred non-www URL is accessible. No domain configuration was changed during this audit.

Search Console submission, Google's selected canonical, indexing, rankings and field Core Web Vitals remain unverified. For the indexing handoff, inspect `https://johnsemblante.com/tools/qr-code-generator/` in the verified Search Console property, run its live URL test and request indexing. Submit `https://johnsemblante.com/sitemap.xml` through the property's Sitemaps screen if it has not already been submitted.

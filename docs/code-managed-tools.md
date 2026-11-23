# Code-managed tools

Free PDF Editor is the third published/featured tool at `/tools/pdf-editor/`, with the shared donation widget enabled. See [PDF editor](pdf-editor.md) for its private browser workflow, limits, dependencies, coordinate model and generated worker assets. It uses the same registry and remains excluded from admin CRUD.

Utilities live in `src/config/tool-ventures.ts` with routes under `src/app/(portfolio)/tools/`. Published entries appear in tool cards and the sitemap. Keep them out of the managed venture registry, venture store, Firestore, and editable page catalog. `ToolVentureCards` uses plain links/text to bypass admin page editing. The Ventures page retains its original live cards and adds a separate tools section using the same card classes. Future tools reuse this registry without altering admin schemas.

The fourth featured entry is [Negosyo Startup Calculator PH](negosyo-calculator.md). It uses browser storage for plans and the native print dialog for reports.

## Homepage showcase

After the service overview and full-width project gallery, Home pairs the online tools and ventures. Tool thumbnails use iconImage from the registry and venture thumbnails use the published venture logo. The bundled venture logos use 96px WebP copies in the homepage list, and the largest bundled project covers use 640px WebP copies. Regenerate the matching thumbnail when replacing an image at the same path. New image URLs use the published asset directly. The tools column takes up to three published entries with `featuredOnHome` enabled, deduplicated by ID and route. Give each new release a higher `featuredOrder` (falling back to directory order). The work and venture columns use public document creation time where available. Legacy works use project year and legacy ventures use reverse registry order. Each column links to its full directory. On narrow screens the lists stack. Below Working together, the full-width blog preview uses each published article?s featured image. The FAQ closes the homepage.

Run `node --test tests/home-tools.test.cjs` for registry filtering, ordering, deduplication, limits, empty behavior and card rendering. Local review uses `npm.cmd run dev` at `http://localhost:3000/`, or `npm.cmd run preview` at `http://127.0.0.1:3100/` after a successful build.

## Optional support widget

Payment setup lives in `src/config/donations.ts`. GCash uses the owner-supplied `public/images/donations/gcash.jpg`; PayPal remains available for international support. With no complete payment method, no donation button appears. Every tool detail route under `/tools/` (including Negosyo) and every published venture detail shows Support automatically. The directories, homepage and admin do not display it.

To activate GCash, add the official receiving QR image under `public/images/donations/`, set `gcash.qrImagePath` to its public path, and set `gcash.enabled` to `true`. Accepted formats are PNG, JPG/JPEG and WebP. For example, an approved file named `gcash-receive.png` uses `/images/donations/gcash-receive.png`. Optional `displayName` and `instructions` are displayed publicly. `allowDownload` controls the Save GCash QR image link. The build checks the local asset exists and omits GCash if its path is invalid or the file is missing. A failed image request after deployment shows an error and removes the download link. Review the actual QR's recipient information before publishing because the provider may reveal the receiving identity.

To activate international support, set the official `international.providerName` and HTTPS `international.url`, then set `international.enabled` to `true`. URLs with embedded credentials or unsafe schemes are rejected. Contributions take place on the configured external provider, opened with `noopener noreferrer`. Set either method's `enabled` flag to `false` to disable it, then rebuild and redeploy.

`DonationSupport` validates payment configuration on the server. The tools layout excludes the directory by path; both exported and live-query venture detail routes render the widget only when a published venture resolves. One `DonationWidget` opens a native dialog on explicit activation. The dialog supports close, Maybe Later, Escape, backdrop dismissal, keyboard focus wrapping/restoration, background inertness and scroll locking. The trigger temporarily yields when a page control overlaps its fixed position. The modal uses a static receiving image and external links, with no payment SDK, transaction collection or analytics events.

Run `node --test tests/donations.test.cjs` for configuration, unsafe/missing destinations, exact route gating and admin separation. Modal edge cases were tested in a local isolated fixture using a nonpayment image and a reserved test-domain URL. No test payment destination or fixture is included in the production application. The owner-supplied image is displayed at readable width with its original proportions and can be saved unchanged. Actual payment completion and provider-side account verification remain manual checks. The optional post-download entry point is omitted.

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
## Work showcase

Neon Dash appears first. The slider uses a clipped track instead of a horizontal scrollbar. Browse with the buttons, swipe, or use Left and Right with the slider focused.

Work shows linked screenshot cards in a swipeable slider under What I build beyond WordPress. Previous and Next move one card at a time. The slider shows four cards above 991px, three through 991px, two through 767px, and one through 567px. Names, descriptions and destinations come from the published tool registry. The screenshot mapping in `src/components/work-tool-showcase.tsx` opts individual published entries into the gallery. The cards do not create Works or Ventures records.

Build the static export, then run `node scripts/capture-work-previews.mjs "<Chromium executable>"` with the preview and browser-debugging ports free. The script captures local demo screens in a temporary browser profile and writes optimized WebP files to `public/images/work-previews/`. Review each crop before publishing and never use customer data or private files in captures.

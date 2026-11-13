# Free Image Compressor

Venture #2 lives at `/tools/image-compressor/`. Its single entry in `src/config/tool-ventures.ts` feeds the homepage showcase, Tools directory, public Ventures cards, sitemap and existing donation layout. QR remains first. No admin schema, managed venture store, payment configuration, Firebase configuration or database records were changed.

The server page supplies crawlable guides, FAQs, the requested title/description, canonical, Open Graph/Twitter metadata and one accurate WebApplication JSON-LD object. The existing sitemap reads the registry automatically. QR has a reciprocal link without metadata changes.

## Processing

Still JPG, PNG and WebP inputs and outputs are supported. Header signatures and dimensions are checked before decoding; decoding must also succeed. Limits are 20,000,000 bytes, 24 megapixels and 12,000 pixels per side. Animated PNG/WebP are rejected. KB means 1,000 bytes; MB means 1,000,000 bytes. Custom targets accept 1 KB–20 MB.

The client starts a lazily instantiated Webpack worker with OffscreenCanvas and createImageBitmap where available. Other browsers use asynchronous Canvas encoding with yields between attempts. Each operation decodes once inside the engine and closes the bitmap in `finally`. Original preview decoding is separately required to validate and display the selected file. No compression package was added.

Target mode tries quality 0.95 then 0.35 for JPG/WebP, with up to six binary-search steps when a satisfactory result is found. Otherwise it progressively reduces dimensions over at most eight rounds. PNG uses lossless encoding and dimension reduction. A 15-second budget bounds further attempts; the worker also has a 30-second watchdog. Individual native encodes on the main-thread fallback cannot be forcibly interrupted. Cancel, replacement, settings changes and unmount invalidate pending results; workers terminate and fallback results are ignored after cancellation.

Re-encoded images are capped at 4,096 pixels on the longest side. Quality mode accepts 10–100% for JPG/WebP. PNG quality mode is disabled with an explanation. Original-format images already below their target are returned byte-for-byte after validation. An explicit format change still re-encodes them. PNG/WebP retain alpha; explicitly selecting JPG composites over white. Browser MIME fallback is rejected instead of producing mislabeled files. Metadata may be stripped; preserve original files separately.

Actual Blob sizes determine achievement and reduction messages. Unachievable targets retain the smallest candidate and show an honest warning. Downloads reference the exact preview Blob with matching extension and sanitized filename. Source/result object URLs are revoked on replacement, invalidation and unmount. No fetch, upload, analytics event or persistent image storage is used by the compressor. The surrounding portfolio retains its existing public-content traffic.

## Validation and release

Use existing commands: `npm.cmd run typecheck`, `node --test tests/*.test.cjs tests/live-seo.test.mjs`, `npm.cmd run build`, `npm.cmd run audit:seo`, and `npm.cmd run audit:seo:qr`. No lint script exists. Engine tests cover actual byte comparisons with deterministic encoder mocks; browser QA must additionally exercise real native encoders and downloaded files.

Browser QA uses the existing ignored Playwright/Edge test tooling, with sharp inspecting downloads. Test artifacts stay in ignored `tmp/`. Physical mobile Safari/Firefox and authenticated production CRUD require separate manual checks; unchanged code and Node regression coverage are not an exhaustive live admin audit.

Validation on 13 November 2026: all 160 Node tests and TypeScript passed. The production export succeeded. The global SEO audit found zero errors and one existing 73-character blog-title warning; the QR SEO audit passed unchanged. Edge real-encoder tests verified all four presets, a custom MB target, quality mode, all input/output formats, decoded download dimensions, exact file sizes, filename extensions, preserved PNG/WebP alpha, explicit opaque JPEG conversion, unchanged already-small originals, unsupported/empty/oversized files, stale-result invalidation and removal. Desktop/tablet/mobile viewport checks (1440/768/390px) found no horizontal overflow. A forced fallback without OffscreenCanvas or createImageBitmap passed target encoding, corrupt-image decode rejection and an actual 1KB target-not-achieved case. Public registry links and existing QR generation passed. Existing portfolio background requests remained present; no image content or filenames were sent by the compressor.

Deploy through the existing `main` push workflow (`.github/workflows/publish-site.yml`), which reads public content, builds the static export and deploys only the existing Firebase Hosting site. Do not deploy a failed or stale export.

After verifying production, inspect `https://johnsemblante.com/tools/image-compressor/` in the verified Google Search Console property, run Test Live URL, then Request Indexing. Submit `https://johnsemblante.com/sitemap.xml` in Sitemaps if needed. In Bing Webmaster Tools, inspect and submit the same canonical URL through URL Submission and confirm the sitemap is registered. Submission does not guarantee indexing or ranking; no indexing request is sent by this implementation.

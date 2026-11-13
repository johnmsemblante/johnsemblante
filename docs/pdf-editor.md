# Free PDF Editor

`/tools/pdf-editor/` extends the existing static Next.js/Firebase Hosting site. Its source-managed entry in `src/config/tool-ventures.ts` supplies Tools, public Ventures, homepage featuring, navigation, sitemap and donation eligibility. There are no admin CRUD records or backend changes. Canonical/social metadata and WebApplication JSON-LD use existing helpers; robots already allows this public route.

## Owner workflow

The public guide displays numbered instructions and extra space above its headings. Its `.pdf-guide ol` explicitly restores decimal markers after Tailwind Preflight's intentional global unstyled-list reset. Keep that reset in place: navigation, breadcrumbs and other custom list layouts use it. These overrides apply only to the PDF guide, not other site lists. Guide headings use 32px of top margin in addition to the section's existing padding.

Choose/drop one PDF, add one-line text (up to 200 characters), or draw a signature and place it on the page. Select an element to drag, nudge with buttons/arrow keys, update text settings using Apply text, size and color, resize a signature proportionally, or remove it. Navigate using page selection, Previous/Next or nearby previews; rotate left/right and confirm deletion. Undo/redo retains up to 20 editing states. Keep at least one page. Download Edited PDF and inspect the result before sharing. Keep the original. Replacing/clearing requires confirmation and resets document-specific state. Reloading or leaving loses edits.

## Architecture and coordinates

PDF.js 6.5.438 (Apache-2.0) and pdf-lib 1.17.1 (MIT) are pinned in npm. Libraries load dynamically after file selection; unrelated routes do not import processing libraries. PDF.js 6 requires Node >=22.13 (existing CI uses Node 22), a current browser and module workers. API verification used installed declarations and https://mozilla.github.io/pdf.js/examples/ and https://pdf-lib.js.org/docs/api/classes/pdfpage. In PDF.js 6, permissions are a Set and document disposal uses loadingTask.destroy().

`pdf-editor-model.ts` separates immutable original bytes, stable source-page IDs, current page order/rotation and per-page annotations. Viewer zoom/selection and bounded undo/redo snapshots are independent. PDF.js receives a copy because worker transfer can detach its buffer. Export reloads a copy of the original with pdf-lib, embeds additions, sets rotations, then removes deleted pages in descending source-index order. Untouched original page content remains vector content; the document is not flattened into screenshots. Page reordering is deferred (the current export retains source order).

Annotation anchors are top-left points in PDF user space, not screen pixels. PageViewport converts pointer positions and preview coordinates, accounting for CropBox offsets, rotation and user-unit scaling. Stored annotation angle is the page rotation when placed. CSS rotation is current page rotation minus annotation angle. Export converts the top-left anchor to the bottom-left image origin using the rotated height vector. Width/height remain PDF units. Canvas device pixel ratio only affects preview resolution. Portrait, landscape, crop offsets, rotations and zoom need placement coverage when changing this code.

New text uses browser Canvas Arial and a transparent PNG at twice its nominal size; the same PNG appears in preview and export. This provides device-consistent visual placement and supported browser Unicode glyphs, but added text is rasterized, not searchable/selectable. Signature drawing is transparent and pointer-based with touch support. Signatures and document data are never uploaded, logged, persisted or sent to analytics. State stays in tab memory. Output Blob URLs are revoked after download; PDF loading tasks and rendering tasks are destroyed/canceled on replacement/unmount. At most the current page and five nearby small previews render, with a maximum 8-megapixel main canvas and device ratio capped at two.

## Assets and deployment

`scripts/prepare-pdf-assets.cjs` copies the installed matching versioned worker, CMaps, standard fonts, WASM and license notices to `public/tools/pdf-editor/`. Generated assets are ignored by Git. npm `predev` and `prebuild:prepared` hooks prepare them for local development and the existing CI static export, including the normal `npm run build` path. Use the npm scripts rather than invoking Next directly. No CDN or PDF server is involved. Worker upgrades require rebuilding both code and assets. Verify the versioned worker URL and auxiliary directories in `out/tools/pdf-editor/` after build.

## Limits and troubleshooting

Limits: 20,000,000 input bytes, 100 pages, positive page dimensions up to 14,400 units at scale one, text sizes 8–96 and zoom 25–200%. These bounds reduce memory pressure but cannot guarantee every complex PDF works on every phone. Header sniffing is followed by decoding with both libraries and page-count consistency checks. Reject encryption/password protection and editing restrictions rather than ignoring them. Exceptions produce visible messages; failed exports preserve the current edits. A bad replacement clears the previous confirmed document.

This adds content; it does not replace original text, redact, fill forms, merge/split, cryptographically sign or sanitize PDFs. Interactive form widgets are intentionally omitted from the static preview; advanced forms, layers and other PDF features may save differently. Existing document signatures can be invalidated by edits. Ask owners for unrestricted copies instead of bypassing protection. Review every exported page. Browser text glyphs/emoji depend on installed fonts; keep additions within page boundaries.

## Validation

Run `npm.cmd run test:pdf`, `npm.cmd run typecheck`, the Node regression suites and `npm.cmd run build:prepared`. PDF tests should exercise real saved/reopened PDFs and rendering of annotations across page orientations, source rotations and CropBox offsets. Check loading/error states, replacement, clear, selection, touch drawing, drag/nudge, text changes, signature resizing, deletion/undo, navigation, zoom/fit and export at desktop/mobile widths. No production publishing is required to review the code locally.

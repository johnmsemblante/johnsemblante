# Pages administration

Open **Pages** in `/adminauth/` to edit Home, About, Work, Blog, Ventures, or Contact. Selecting a page opens the shared editor drawer from the left. Fields are grouped by the sections/components currently used on that page; search finds a field by its section or original text.

The editor supports page copy, headings, button labels/destinations, contact links, services, workflow, FAQs, experience, education, skills, venture landing cards, and illustration/image fields. Work and Blog entries continue to use their existing editors. Individual venture routes use the dedicated [Ventures editor](ventures-admin.md). Shared site navigation/footer and functional form configuration remain in code.

Existing image URLs and local assets remain the defaults. Replace an image with a local path, an HTTPS URL, or the same Cloudinary upload control used by Blog and Works. Add up to five additional images, each with a required description and optional caption, in a gallery after the page content. Uploads use the existing `NEXT_PUBLIC_MEDIA_UPLOAD_URL` configuration and worker; no new media credentials are needed.

**Save page** publishes changes. A field's **Reset to code default** button removes its override. There is no draft workflow for Pages. Unsaved edits prompt before closing/leaving, uploads block closing/saving, and transactions reject conflicting saves from another tab while preserving the editor's input.

## Deployment and metadata

1. Deploy the reviewed Firestore rules first: `firebase deploy --only firestore:rules --project johnmsemblanteapp`.
2. Run `npm run build` and deploy Hosting using the existing release workflow.

The new public-readable `pages/{id}` documents accept writes only from verified, enabled admins, for the six allowed IDs. Public collection listing, deletion, arbitrary page IDs, and stale revisions are denied. No migration or initial document creation is required. A missing document uses the page's existing code content.

Text, image and link overrides update open public pages through a Firestore listener. Loading/refreshing a page also explicitly reads from the server, as do window focus and the dashboard's site-wide refresh request. Offline/error states retain the last available content and show a retry notice. Every production build runs `scripts/sync-pages.cjs` anonymously and writes the ignored `.generated/pages.json` snapshot. The build fails if a configured document cannot be read or is invalid, instead of silently publishing old content.

Each page has an optional meta title (160 characters) and description (500 characters). Leaving either blank retains that field's existing metadata. Overrides update the exported title, description, Open Graph and Twitter metadata. Canonical URLs remain controlled by the routes. **Rebuild and deploy after metadata changes** so crawlers and social previews receive the updated HTML; live content saves alone cannot replace files on static Hosting.

## Maintaining fields

`src/content/page-fields.json` lists the editor fields, grouped by page. `PageText`, `PageImage`, and `PageLink` read the corresponding override through `PageContent`; outside a managed landing page they render their source defaults. No stored HTML is executed. URL rendering validates destinations.

Field keys combine the explicit source scope and a hash of the original value, allowing repeated components to have separate page overrides. When changing source copy or adding a section in code, update the associated catalog entry/key along with the component fallback. Existing overrides for a changed default need an explicit key migration if they should be preserved. Blog/Work record content stays authoritative in its own editor.

Verification: `npm run typecheck`, `npm run test:pages`, the existing unit suites, and `npm run test:rules` against the local demo-project emulator. The Pages tests exercise rendering, metadata, URL validation, source image availability, admin selection/saving/conflict behavior, and public snapshot decoding. Rules tests include authorization/revocation, allowed IDs, revision conflicts, invalid values/metadata, and gallery validation through the final slot.

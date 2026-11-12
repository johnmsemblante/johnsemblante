# Ventures administration

The dashboard order is **Overview, Pages, Blog, Works, Ventures, Job Finder**. Open **Ventures** to manage the individual business/photography sites. **Pages → Ventures** continues to manage the portfolio's Ventures landing page.

Select a venture to open the shared drawer, or choose **New venture**. Edit its name, URL slug, category, layout, hero copy, description, story, images, contact links, SEO title/description and the sections used by its layout. Coffee/travel layouts support offerings, optional prices/images, artwork, vehicles, ordering instructions and FAQs. Photography supports its gallery, image titles, thumbnails and source links. Add/remove repeated entries with the section controls. Existing local/Flickr image paths are preserved until replaced. Uploads use the existing authenticated Cloudinary service, shared with Blog and Works.

Choose **Draft** or **Published**, then **Save venture**. Draft payloads stay in admin-only records. Publishing atomically writes a public copy. Existing source ventures start as published defaults with no migration required. A source venture saved as a draft is hidden from live lists; deleting one leaves a public tombstone so code defaults cannot accidentally reappear. Conflicting edits are rejected without discarding input. Uploads disable save/close until complete, and unsaved changes prompt when closing or unloading.

Published content updates on page load/refresh, focus, the visible refresh interval, or **Refresh live site content**. This includes the Home and Ventures cards, venture illustrations and individual venture pages. Failed reads retain the last available copy with a warning. New ventures receive an immediate `/ventures/view/?venture=slug` link. Build/deploy to create their clean `/ventures/slug/` URLs and sitemap entries. Renaming rejects occupied/source-reserved slugs; configure redirects separately for old shared URLs.

## Release requirements

Deploy the reviewed Firestore rules before building:

```powershell
firebase deploy --only firestore:rules --project johnmsemblanteapp
npm run build
```

Then deploy Hosting using the normal release workflow. The build anonymously reads `publicVentures`, validates every record, writes the ignored `.generated/ventures.json` snapshot and exports only published ventures. `managedVentures` is accessible only to verified, enabled admins. Public copies must match their managed record in the same transaction. No service-account credentials or browser deployment credentials are introduced.

Rebuild/deploy after SEO changes, creating clean routes, renaming, drafting or deletion to update/remove exported HTML and social/search previews. Live readers can hide an unpublished venture after checking Firebase, but its previously exported HTML remains on Hosting until deployment.

Structured editorial data is stored as validated JSON text with a 400,000-character limit. The application validates allowed fields, nested types, URL schemes, image descriptions/dimensions and collection limits before saving and before public rendering. Rules restrict author access, envelope size/schema, revision increments and atomic public visibility. The Golden Travel trip-estimator algorithms, historical reference-rate tables, package definitions and reusable template labels remain in code.

Verification: `npm run test:venture-admin`, `npm run typecheck`, the existing unit suites and the loopback demo-project Firestore emulator suite. The tests cover source compatibility, nested URL safety, publishing/drafts/deletion, conflicts, renames/collisions, anonymous snapshot reads, live server rendering and refresh propagation.

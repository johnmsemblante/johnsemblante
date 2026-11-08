# Works administration

Implemented on 6 November 2026; Cloudinary secrets connected on 8 November 2026. A signed-in real upload remains an owner verification step; automated checks use mocked media delivery.

## Editor

`/adminauth/works/` uses the existing approved Google administrator gate. The sidebar has Overview, Blog, Works and Job Finder; only the old Blog Management sidebar label was shortened.

The full-width library includes existing source projects and saved managed projects. New work opens a blank right-side panel; choosing a project prepopulates it. Changes can be saved as Draft or Published. **URL slug** is editable, with **Generate from title** to use an updated title. New titles generate slugs until you edit the slug manually; saved URLs stay stable when only the title changes. Slugs must use lowercase letters, numbers and single hyphens between words (100 characters maximum). Existing source, managed and deleted-marker slugs cannot be reused for another work; `industry` is reserved for collection routes. Closing a dirty editor or leaving the page asks before discarding edits. Saves and deletes use transactions with revision checks to prevent overwriting a newer edit.

Changing an existing slug asks for confirmation. Saving moves the managed record and public projection together, with a deletion marker at the old slug so an original source project cannot reappear. New record revisions start at 1. Fields, images and draft/published visibility are preserved unless edited. Failed saves keep the input available; deleting while the slug has unsaved edits still targets the saved record.

Renaming does not add a redirect or trigger deployment. Rebuild/deploy to replace old clean pages, metadata and sitemap entries. The new instant URL is `/work/?project=new-slug`. To preserve shared clean links, add an exact permanent redirect in `firebase.json` from the old path to the newly exported path. Update manually supplied case-study/website links, hero slug selections and legacy query links separately where applicable. Editing a venture's Work slug does not rename its independent `/ventures/.../` page.

Fields cover title, introduction, role, year, project type/status, industries, technologies/tags, website, featured image, overview, objectives/features/contributions/capabilities, challenge/approach/outcome, gallery image URLs/descriptions/captions and SEO title/description. Technologies and other lists accept comma-separated chips. Only add factual scope and confirmed outcomes.

Deleting requires confirmation and keeps hosted image files. Deleting a Work entry for a venture does not delete its separate venture page. Draft and delete actions also hide matching source projects from the managed public collection. Source files and local image assets are never overwritten.

## Data and publishing

- `managedWorks/{slug}` contains the editable project, revision and update timestamp. Only approved admins can read/write it.
- `publicWorks/{slug}` contains either the exact published project or a small `{slug, deleted: true}` marker. Draft content is never copied here. The marker prevents a source entry from reappearing when drafted or deleted.
- Transactions update both documents together. Firestore rules require the public copy to match the saved published record. Anonymous writes, standalone publication changes and stale revisions are denied.
- `/work/`, industry explorers and clean detail views refresh public data on load/focus and every visible minute. New projects can be read at `/work/?project=slug` before their clean static route has been deployed. The homepage, featured/hero sections, initial HTML, social metadata and sitemap update on build/deploy.
- `scripts/sync-works.cjs` anonymously reads public records before every normal build. Failed reads stop the build; they do not silently bring back deleted source entries. No service account or admin credential is used. `.generated/works.json` is ignored.
- A rebuild/deployment is needed after publishing, editing, drafting or deleting to update/remove exported copies. Until then, old initial HTML remains downloadable even when a live browser hides an unpublished project.

The existing projects in `src/content/projects.ts` stay as the source baseline. Dashboard edits override them by slug. For an overridden project, editing its source file will not replace the dashboard record. No production records are imported or altered just by opening the editor.

## Cloudinary signed uploads

Existing `/images/projects/...` paths continue working. New uploads pass through the admin-only Cloudflare Worker to Cloudinary; Firestore stores URLs, not image binaries. The alternative Image URL field remains available. Uploads accept JPG, PNG, WebP or AVIF up to 5 MB, enforced in both the browser and the Worker. The Worker bounds the incoming request body, verifies membership before accepting files, and signs the Cloudinary upload on the server. Only the resulting image URL is returned to the browser. Keep images compressed to reduce storage and delivery usage. Free allowances are quotas, not unlimited storage or traffic; monitor the Cloudinary usage dashboard.

The separate `workers/media-upload/` Worker accepts and signs uploads only after Firestore validates the Firebase bearer token and its enabled admin membership. The Cloudinary secret stays in Worker secrets. The browser never receives it. CORS allows only configured site/local origins. Uploads use unique image identifiers; removing a project does not destroy its images. Blog featured images and article images now use this same service, preset, folder and shared upload control; their usage counts toward the same account allowances. See [blog image uploads](admin-setup.md#blog-image-uploads).

Finish setup locally:

1. In Cloudinary (`dty8edpr`), open Settings > Upload > Upload Presets and create a **signed** upload preset named `portfolio_works`. Set allowed formats to `jpg,jpeg,png,webp,avif`. Leave other options at their defaults. Cloudinary does not support a per-preset file-size limit; this application enforces 5 MB in both its editor and Worker, which does not expose upload signatures to clients. See [Cloudinary upload presets](https://cloudinary.com/documentation/upload_presets).
2. From the repository root, store each credential privately when prompted. Do not paste the values into chat or commit them:

   ```powershell
   node tmp/cloudflare-tools/node_modules/wrangler/bin/wrangler.js secret put CLOUDINARY_API_KEY --config workers/media-upload/wrangler.jsonc
   node tmp/cloudflare-tools/node_modules/wrangler/bin/wrangler.js secret put CLOUDINARY_API_SECRET --config workers/media-upload/wrangler.jsonc
   ```

   On a new machine, install Wrangler separately; `tmp/` tools are local and ignored.
3. When authorized to release, deploy the Worker using that config, then add its actual `/upload` endpoint to ignored `.env.local`:

   ```dotenv
   NEXT_PUBLIC_MEDIA_UPLOAD_URL=https://johnsemblante-media-upload.john-semblante-portfolio.workers.dev/upload
   ```

4. Restart development or rebuild to enable the upload control. Without this variable, the editor explains that uploads are not connected and allows URL entry.

## Checks and release

Run `npm run test:work-admin`, `npm run test:work`, `npm run test:admin`, `npm run test:ventures`, `npm run test:seo` and `npm run typecheck`. Run the Firestore emulator tests from the admin guide; they cover private drafts, atomic publication, tombstones, stale revisions, unsafe URLs, label limits and slug migrations. Tests use fake upload credentials and mocked responses, without real uploads or production changes. The shared emulator suite also checks source-only Work renames, duplicate/reserved URLs, article timestamp preservation and full label lists during renames.

Before release, review signed-in editing, drawer interactions and a small real authorized image upload after completing the preset. Deploy the reviewed Firestore rules before the first normal build; the public Works collection is not readable under the currently deployed old rules. Then run `npm run build` and `npm run audit:seo`, commit/push reviewed files and deploy Hosting. Keep the existing Google verification and Firebase values in the build environment. No Firebase billing upgrade, Auth change, composite index or Job Finder Worker change is required.

A local Next export may be checked with an explicitly local empty Works snapshot while production rules remain unchanged. That is a compile/export check, not a successful end-to-end production snapshot or upload test. Do not deploy that validation export: run the complete normal build after the rules and media setup are ready.

The media Worker is independent of the Job Finder Worker. Both configured secret names were verified without reading their values. Live media endpoint checks cover CORS preflight, signed-out denial and foreign-origin denial. A real upload and signed-in mobile review are not established by those checks.

# Admin access and blog publishing

`/adminauth/` is the private-workspace gateway and dashboard overview. The shared dashboard provides Blog at `/adminauth/blog/`, Works at `/adminauth/works/` and Job Finder at `/adminauth/jobs/`, with a collapsible mobile sidebar and Logout. Existing blog records and editor workflows are preserved.

The site still exports static files to Firebase Hosting. Firebase Authentication verifies Google accounts; Firestore rules authorize access to stored posts. Admin HTML and JavaScript are publicly downloadable, as on any static site, but contain no drafts or credentials. Private records are fetched only after authorization. Hiding a link or adding `noindex` is not the data-access boundary.

## One-time Firebase setup

Landing-page editing is available under **Pages**. See [Pages administration](pages-admin.md) for editable fields, source defaults, image uploads, rules deployment, and static metadata publishing.

Perform these steps in the existing `johnmsemblanteapp` project. No paid plan or billing change is required by this implementation. Check the Firebase console's current Spark quotas and monitor database reads/writes; quotas and third-party availability still apply.

1. In Firebase Console, register a **Web app** if the project has none, then open its SDK configuration. Do not create or download a service-account key.
2. Google sign-in is configured as code under `auth.providers.googleSignIn` in `firebase.json`. With Firebase CLI 15.35.0 or newer, run `firebase deploy --only auth --project johnmsemblanteapp` to provision it. Alternatively enable Google under Authentication > Sign-in method in the console. Authorize `johnsemblante.com`, `johnmsemblanteapp.web.app`, `johnmsemblanteapp.firebaseapp.com` and `localhost` for development. The current custom domain is `johnsemblante.com`; keep the existing Firebase auth handler domain and Google OAuth configuration. Add only trusted website domains.
3. Create a **Cloud Firestore** database in **production mode**. Select its region carefully; database location is a project decision. Do not use permissive test-mode rules. If the project already has a database, inspect its rules and collections before deploying this repository's rules: unspecified collections are denied by this ruleset.
4. Copy the four public Web app configuration values into an ignored `.env.local` in the repository root:

   ```dotenv
   NEXT_PUBLIC_FIREBASE_API_KEY=your_web_app_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=johnmsemblanteapp
   NEXT_PUBLIC_FIREBASE_APP_ID=your_web_app_id
   ```

   These identifiers are public in browser JavaScript. Access security comes from Authentication and Firestore rules, not from hiding the Firebase Web API key. Never add service-account JSON, private keys, passwords, or unrestricted unrelated API keys. Use Firebase's recommended API/domain restrictions. Do not paste credential values into chat or commit `.env.local`.

5. Review and deploy **only the Firestore rules and indexes** to the intended project:

   ```powershell
   firebase deploy --only firestore --project johnmsemblanteapp
   ```

   Wait for the published-post composite index to finish building. A missing index produces a loading error, not unrestricted access. This step requires Firebase CLI sign-in by an authorized project operator. The implementation does not deploy automatically.

6. Restart `npm run dev`, or build and deploy Hosting with these environment variables present. Public variables are embedded at build time; changing them requires a restart/rebuild. With missing configuration, `/adminauth/` shows a setup message and grants no access. The existing portfolio and build-time blog still work.
7. Open `/adminauth/` and sign in with your intended Google account. Initially it shows **Access not granted**. Copy the displayed Account ID (Firebase UID), or find the user in Firebase Authentication.
8. As a trusted project operator in Firestore Console, create `admins/{that-exact-UID}` with a boolean field `enabled: true`. The approved account must have a verified email. The page rechecks membership automatically. Never add an unauthenticated client-side bootstrap or open admin writes to make setup easier.
9. To revoke access, set `enabled: false` or delete that admin membership document in the console. The access gate listens for membership changes, and rules reject subsequent private reads/writes. Signing in with any other Google account never grants admin access automatically.

Sign-in persists for the browser session, using Firebase's session persistence. Use **Sign out** when finished, especially on shared computers. Sign-out reloads the gateway to clear the browser's in-memory Firestore data; offline disk persistence is not enabled. Google account recovery and account security remain managed by Google/Firebase; this site stores no passwords.

Official references: [Google sign-in](https://firebase.google.com/docs/auth/web/google-signin), [role-based access](https://firebase.google.com/docs/firestore/solutions/role-based-access), [API keys for Firebase](https://firebase.google.com/docs/projects/api-keys), [Firestore quotas](https://firebase.google.com/docs/firestore/quotas).

## Dashboard and Job Finder

All dashboard routes share the existing verified-account/admin-membership gate. Signed-out visitors to an app return to Google sign-in, then to the requested known dashboard route. The static bundles contain app code, but private blog and bookmark operations still require Firestore authorization. Logout clears the session as before; the blog editor retains its unsaved-change warning for dashboard navigation and logout.

Job Finder now targets remote work from the **Philippines (UTC+8)**. Its broader source is the [free Himalayas API](https://himalayas.app/docs/remote-jobs-api), connected through a small Cloudflare Worker because the API did not expose browser CORS headers when checked. [Jobicy](https://github.com/Jobicy/remote-jobs-api) is a second, directly accessible free source for listings published in the last seven days. Both require no job API key. Existing Arbeitnow bookmarks stay readable; that Europe-focused feed is no longer used for discovery.

- Source search sends the selected keyword and Philippines/worldwide eligibility to the provider only on Search or a role shortcut. Himalayas additionally requests UTC+8 and recent ordering. Quick searches cover WordPress, WooCommerce, PHP, front end and full stack. With Himalayas connected, the default is WordPress and Philippines eligibility.
- The Worker independently checks Himalayas country and timezone restrictions, rejecting explicit country conflicts, missing/malformed restrictions, known expired listings and obvious conflicting residence requirements in titles. Empty country restrictions mean worldwide; empty timezone restrictions mean unrestricted. This is a source-metadata check, not employer verification: descriptions can contain additional residence, payroll, visa, office, travel or working-hours conditions. UTC+8 eligibility does not promise daytime Philippine hours.
- Jobicy's Philippines filter can include worldwide and broad APAC/regional labels. Their labels are displayed unchanged; UTC+8 compatibility is not invented for that source.
- Local controls narrow loaded results by keyword, development-role focus and disclosed salary. Skill ordering uses the existing portfolio's WordPress, WooCommerce, PHP, front-end/full-stack and JavaScript focus. Development focus checks role titles so company boilerplate does not turn an unrelated role into a match. Skill keywords explain ordering; they are not a hiring probability or qualification assessment. Newest ordering is also available.
- Listings display summaries, employment type, available pay with original currency/period, location/timezone restrictions and dates. Himalayas dates are labeled Published / updated because its `pubDate` can be an update time. No PHP currency conversion or estimated salary is invented. Apply preserves each provider's canonical application link and source credit.
- Normalized public metadata is cached for 24 hours for Himalayas, matching its daily API refresh, and one hour for Jobicy; at most five responses live in browser storage. Edge caching also lasts 24 hours. Requests deduplicate, failed searches wait at least a minute and rate limits respect `Retry-After`. There is no feed polling or scraping. Offline cached listings are explicitly marked stale, limited to 48 hours for Himalayas or 24 for Jobicy, and stop pagination. Explicit expiry dates hide listings from Browse on the next render/minute; expired saved jobs remain removable. Providers can close listings earlier than the stated date.
- Save job stores metadata under `admins/{your-UID}/savedJobs/{provider-specific-ID}`. Saved jobs displays the latest 100 bookmarks; Remove saved deletes a bookmark. Bookmarks are private to that approved, verified account, including against other approved administrators. Existing IDs and bookmarks are preserved without a bulk migration. Private bookmarks are not written to localStorage.
- Loading, empty, provider-error and bookmark-error states are displayed independently. Saved jobs remains available if the external feed is down. Saved postings can expire at the provider.

For an existing configured installation, build Hosting and deploy the updated Firestore rules together with it:

```powershell
npm run build
firebase deploy --only "firestore:rules,hosting" --project johnmsemblanteapp
```

No new composite indexes or Firebase billing upgrade are needed. Firebase quotas, Cloudflare's free-plan limits and external API availability still apply. This MVP does not send applications or include AI features. Cloudflare deployment tooling is installed separately under ignored `tmp/cloudflare-tools`; no runtime dependencies were added to the portfolio.

### Connecting the free Cloudflare feed

The reviewed Worker is in `workers/job-feed/index.ts`, with configuration in `workers/job-feed/wrangler.jsonc`. It only calls the fixed Himalayas search endpoint, with Philippines/UTC+8 fixed; it cannot proxy arbitrary URLs. It serves public job metadata only. Approved browser origins are restricted to the Firebase domains and local development/preview. This origin allowlist is CORS protection, not authentication; no private data or account tokens belong in this service. Do not send Firebase credentials to it. There is no KV/database, cron schedule, paid API or paid Worker binding.

1. Use a **free Cloudflare account/Workers plan**. The free allowance is currently 100,000 Worker requests per day; exceeding a free allowance can stop service. Do not upgrade billing for this implementation. See [Cloudflare pricing](https://developers.cloudflare.com/workers/platform/pricing/) for current limits.
2. From the project root, sign in and deploy:

   ```powershell
   node tmp/cloudflare-tools/node_modules/wrangler/bin/wrangler.js login
   node tmp/cloudflare-tools/node_modules/wrangler/bin/wrangler.js deploy --config workers/job-feed/wrangler.jsonc
   ```

   On another computer, install Wrangler separately before using its equivalent commands. Do not commit CLI credentials or put Cloudflare API tokens into `NEXT_PUBLIC_*` values.
3. Copy the deployed public endpoint into ignored `.env.local`:

   ```dotenv
   NEXT_PUBLIC_HIMALAYAS_PROXY_URL=https://johnsemblante-job-feed.YOUR-SUBDOMAIN.workers.dev/jobs
   ```

   This is a public URL, not a secret. Use the actual deployed subdomain. Rebuild/restart Next.js after changing it. Without this value, Jobicy remains functional and the Himalayas source is marked not connected; an external Philippines search link is still available. A selected source's failure is shown explicitly rather than silently broadening eligibility or changing providers.
4. Deploy the updated Hosting build and bookmark rules together using the command above. Test both providers while signed in, verify saving/removing each provider's jobs, and confirm that another administrator cannot read those bookmarks. Both the Job Finder and media-upload Workers allow `https://johnsemblante.com` alongside the Firebase addresses. On any future website domain change, update `ALLOWED_ORIGINS` in both Worker configs and redeploy both Workers.

Himalayas search returns 20 rows per page; the Worker continues until a short/empty raw page, without trusting estimated totals. Eligibility checks can make a displayed page shorter or empty even when another raw page exists. Jobicy cursors are echoed unchanged with the original search filters and expire after 24 hours. Neither source's absence of a listing is proof that an employer has closed it.

## Writing and publishing

- Visit `/adminauth/blog/`, then select **New post** or open a saved article.
- New posts generate a slug from the title; automatic duplicates receive numbered suffixes. You can edit **URL slug** or choose **Generate from title**. After manual editing or saving, title changes keep the current slug. Explicitly chosen slugs must be unique and use lowercase letters, numbers and single hyphens between words (100 characters maximum).
- Categories and Tags accept multiple labels: type a label and press Enter or comma, or use Add. Remove individual chips with their remove buttons. At least one category is required (maximum 10); tags are optional (maximum 20). Labels are limited to 80 characters and duplicates are normalized. Both are shown on the public article and its list card.
- Separate paragraphs with blank lines. Use `## Heading`, `- list item` and `> quote`, with blank lines around blocks. Raw HTML is rendered as text.
- Use **Upload featured image** for the article cover. Use the article toolbar's **Image** button or **Insert an image or file** to upload an image or enter an HTTPS/site-relative URL. Add a description, then click **Insert into article**. Images use `![alt description](URL)`; other assets use `[link label](URL)`. Images appear within the article with the description as alt text and a caption; file links open in another tab. Non-image files still use URLs. See the upload steps below.
- **Draft** followed by Save draft stores a private draft.
- **Published** followed by Save and publish records the actual publication date/time with a Firestore server timestamp. There is no manual publication date for immediate publishing. Editing a published article preserves its publication timestamp. Unpublishing to Draft clears it; republishing creates a new publication timestamp.
- **Schedule** reveals a publication date/time input in **Asia/Manila (UTC+8)**. Only future times can be saved, checked in the editor and again by server-side access rules. At release time, the post automatically becomes public on subsequent reads; no editor needs to stay open and no paid scheduled job is used. Public pages refresh while visible approximately every minute, and on window focus, to discover newly released posts. Date/time settings on the reader's device must be accurate for time-bounded queries; a fast device clock cannot bypass server access checks.
- The stored status of a released scheduled post stays `scheduled`; its effective displayed status becomes Published. Opening it after release defaults the editor to Published. Saving it as Published keeps the scheduled release timestamp. Choose a new future time to reschedule instead.
- Optional **Meta title** and **Meta description** fields fall back independently to the post title and short introduction. The editor previews the effective values.
- **Delete article** permanently deletes the selected saved record after confirmation. Unsaved edits are discarded too. The operation checks the loaded revision, so a post changed in another tab is not silently deleted. External image/files referenced by URL are not deleted from their host.
- Another tab's changes cause a revision conflict instead of a silent overwrite. Copy unsaved text before reopening the latest version. Drafts are not persisted in browser local storage.

### Blog image uploads

Blog and Works share the existing Cloudinary service and `NEXT_PUBLIC_MEDIA_UPLOAD_URL` configuration. No new account, API key, preset, Storage bucket or Firebase billing upgrade is needed when Works uploads are already configured. The shared control lives in `src/components/admin/image-upload.tsx`; the existing Works component re-exports it. The Worker and its signed `portfolio_works` preset continue to use the `portfolio/works` Cloudinary folder for both editors. That legacy folder name does not affect where images appear on the site.

1. For a cover, choose **Upload featured image**. A successful upload fills the Featured image URL field and shows a preview. Add an accurate image description and save the post.
2. For an image within the article, use Write mode and position the cursor between paragraphs. Click **Image** to open the media panel, choose **Upload article image**, and provide a description. You can also paste an existing URL.
3. Click **Insert into article**. The image is inserted at the retained cursor position (after any selected text); existing text is preserved. Without a selected position, opening the media panel directly and inserting adds the image at the end. Each image gets its own Markdown block.
4. Choose **Preview** to review images and captions, then save with the intended visibility. Repeat for additional images. PDFs and other files use the File / asset link option with a public URL.

The browser and Worker enforce JPG/PNG/WebP/AVIF and a 5 MB limit per image. The approved-admin check, signed uploads and secret handling are the same as Works. The editor shows progress, blocks saving/closing during uploads, and preserves existing field values on failure. Invalid media descriptions and the 60,000-character article limit are checked before insertion, leaving the uploaded URL available for correction. Uploads do not automatically save or publish the article.

Cloudinary stores a selected image immediately. Cancelling an edit, replacing a URL or deleting an article does not delete hosted images; remove unused assets in Cloudinary when appropriate. Images hosted there are public assets even when the article is a private draft. Free usage allowances are shared with Works, so compress images and monitor the existing usage dashboard. See [Cloudinary setup](works-admin.md#cloudinary-signed-uploads).

The image-upload enhancement uses the already deployed media Worker without new Worker settings or Firestore fields. Slug editing requires the updated Firestore rules before Hosting deployment. Upload tests use mocked delivery; they do not consume Cloudinary storage or publish test posts.

## Public blog and static-export limits

The public `/blog/` fetches published posts and due schedules, starting with the deployed public snapshot. Future schedules and drafts are protected by Firestore rules, including direct document reads. Public views also hide non-public posts when the visitor is an administrator. The instant `/blog/?post=your-slug` view works without a Hosting rebuild; clean `/blog/your-slug/` pages are generated from publicly released posts during production builds.

Stored SEO values update the browser title, description, canonical URL, Open Graph/Twitter fields and BlogPosting structured data after the article loads. Production builds also export article content, individual metadata and sitemap entries for clean article URLs. Share those clean URLs after deployment. Query-string articles still receive generic Blog metadata in their initial HTML. Rebuild and deploy after publishing, editing, unpublishing or deleting to update the exported copies; live browser refresh does not replace that deployment. See [SEO publishing](seo.md) and the live-update section below.

The existing source-based routes (`/blog/slug/`) remain supported and use `src/content/blog.ts`. Source-based articles are edited in source, not automatically imported into the browser editor. Their published slugs are reserved when new managed articles are created. The homepage's build-time writing preview still uses source-based posts.

Existing version-1 Firestore posts remain readable. Saving one upgrades it to schema version 2, keeping its original creation time and existing publication date. Its slug stays unchanged unless explicitly edited. New records use server publication timestamps, category/tag arrays and optional SEO fields. No bulk production migration or deletion runs automatically.

### Changing an article URL

Edit **URL slug**, or update the title and click **Generate from title**, then save. The editor asks for confirmation before changing an existing URL. The save transaction checks the original revision and destination, creates the new record and removes the old one together. It preserves creation time, the existing publication time for published articles, content, labels, media and SEO fields; drafts remain private and future schedules retain their release time. The new document starts at revision 1. A collision or stale edit leaves the original record intact and keeps the editor text available. Source-published article slugs are reserved.

Renaming does **not** create a redirect or deploy the website. The new instant view uses `/blog/?post=new-slug`. Rebuild/deploy to replace clean article pages, metadata and sitemap entries; old exported HTML remains public until then. Old links will stop resolving after that release unless an exact permanent redirect from the old clean path to the new one is added to `firebase.json`. Redirects must target the newly exported page. Update any manually written links, including legacy `?post=` links, separately.

This editor version requires the updated `firestore.rules` for timestamp-preserving renames. Deploy Firestore rules before Hosting when releasing this change. The optional internal `renamedFrom` field identifies the source for rule validation during the move; it is not a public redirect mechanism. No billing upgrade is needed.

Only public article fields live in `blogPosts`; do not add private editorial notes to a document that may be published. Rules enforce a field allowlist. All unrelated collections remain denied.

## Verification

```powershell
npm run typecheck
npm run test:blog
npm run test:admin
npm run build
```

Rules tests use the official local Firestore emulator with a **demo project**, never production. Install Java 21+ and Firebase CLI for repeatable local runs:

```powershell
firebase emulators:exec --only firestore --project demo-portfolio-admin "npm run test:rules"
```

The rules suite checks anonymous draft denial, published reads, non-admin denial, self-approval denial, verified-admin writes, schema/timestamp/revision validation, automatic slugs and collisions, scheduling before/after release, forged clock denial, publishing/unpublishing, deletion, legacy upgrades and revocation. It also checks bookmark CRUD, owner-only access, unverified/revoked-account denial and bookmark field/URL validation. `test:rules` refuses to run without a loopback emulator. These tests do not send email or create production users/posts.

`test:admin` checks dashboard navigation, login-return allowlisting, initial private-content gating, feed normalization, safe provider URLs/pagination, supported filters, caching, request deduplication and offline/storage failures. These checks do not replace signed-in browser testing of navigation, bookmarks, sidebar toggling or mobile layouts.

Before going live, test approved and unapproved Google accounts, direct editor URLs while signed out, popup cancellation, sign-out, admin revocation, a draft's public URL, publishing/unpublishing, two-tab conflicts, mobile layouts and quota/network failures. Code/build checks do not establish that Firebase Console configuration or live OAuth is working.

The Firebase dependency includes a Node-side gRPC dependency override to `1.13.6` to address the certificate-validation advisory in the SDK's older pinned release. Review the override when upgrading Firebase; browser code uses the Web SDK transport.

## Production provisioning - 5 November 2026

The existing `johnmsemblanteapp` project now has a registered Web app named **John Semblante Portfolio**, Google sign-in, and a Standard-edition default Firestore database in **Singapore (`asia-southeast1`)** with deletion protection enabled. The production Firebase domains and localhost are authorized for sign-in. The Web configuration is stored only in ignored `.env.local`, and must be supplied separately on another computer or CI build. No service-account key is committed.

Authentication provider configuration is versioned in `firebase.json`; its support email is the project owner's public address. Rules and indexes are versioned separately. Index creation may take several minutes after first deployment; wait until both blog indexes are **Enabled/Ready** before judging public-list queries. Admin approval remains an explicit database operation for a verified Google account, never an automatic grant to everyone who signs in.

A full release uses the existing build checklist, then deploys the selected resources:

```powershell
firebase deploy --only "auth,firestore,hosting" --project johnmsemblanteapp
```

Review provider, rules and index changes before deploying. Use `--only hosting` for releases that only change website code/content and do not need to change backend configuration.

### Philippines remote Job Finder release - 5 November 2026

The shared dashboard, Philippines-focused Job Finder and owner-only bookmark rules are deployed to the existing Firebase site. The Cloudflare Worker is deployed at the following public endpoint, also configured in this computer's ignored `.env.local`:

```dotenv
NEXT_PUBLIC_HIMALAYAS_PROXY_URL=https://johnsemblante-job-feed.john-semblante-portfolio.workers.dev/jobs
```

Use that value when setting up another computer or CI build; no Cloudflare credentials belong in the website build. Himalayas is the default source, starting with WordPress/Philippines; Jobicy remains selectable. Worker deployment did not add paid bindings or change Firebase billing. Cloudflare CLI authentication stays outside the repository.

Release checks passed: 19 admin/feed/Worker tests, 8 blog tests, 11 Firestore emulator tests, TypeScript and the production build. Live HTTPS checks confirmed a populated Philippines/UTC+8 Himalayas response and rejection of an unapproved browser origin. A Workers-specific redirect-mode issue found during live verification was corrected; upstream redirects remain rejected rather than followed. Signed-in browser interaction/mobile review is still separate from these checks.

### Featured images and label entry

Categories and tags become chips as you type a comma. Pasting a comma-separated list commits every label immediately, including the final label. Duplicates are ignored; invalid or oversized lists stay in the input for correction. Enter, Add and leaving the field also commit a label.

The editor supports optional **Featured image URL** and image description fields, using public HTTPS or site-relative URLs. The preview and article show the image; blog listings use full-width rows with the image on the left and article details on the right, stacking on mobile. Empty or broken card images show the site logo. Older posts need no migration. This uses external image URLs, with no file uploads or additional paid service.

Deploy both updated Firestore rules and Hosting for this revision: the rules allow the optional featured-image fields while retaining existing post access controls.

### Publishing validation fix

Label-heavy posts could exceed Firestore's 1,000-expression rule evaluation limit and return the generic permission-denied message despite valid admin access. Label validation now batches length and whitespace checks across preserved item boundaries, with explicit type checks. The emulator suite covers publishing and editing at the full 10-category/20-tag limits, invalid values at the first/middle/last positions, and 80-character labels. Reserved NUL separators are rejected. This fix only requires deploying Firestore rules; the open editor can retry saving without refreshing or losing unsaved text.

### Article formatting toolbar

The Article field now has Write and Preview modes, plus H2/H3 headings, bold, italic, inline code, bullets, numbered lists, quotes and links. Select text and use a toolbar button; Ctrl/Cmd+B and Ctrl/Cmd+I also work. Preview uses the same renderer as public articles. This is a Markdown editor with a formatted preview, rather than editing HTML directly. Existing paragraphs, headings, lists and image/file URLs remain supported. Formatting is stored in the existing content field; no paid editor service, extra dependency, schema migration or Firestore-rule update is needed. Raw HTML stays escaped.

### Post library and editor panel

Blog Management opens on a full-width list of saved articles with introductions, categories, visibility and publication dates. New post opens a blank editor in a panel that slides in from the right; selecting an article first loads its saved fields. The panel fills smaller screens. Close, Escape and clicking the backdrop all respect unsaved-change confirmation, and closing restores focus to the invoking control. Saving keeps the panel open and updates the list; deleting returns to the list. Closing is disabled during saves or deletion.

Public blog cards now use full-width horizontal rows, ordered as category, title, date, introduction, compact Work-style tags, and Read article. Images remain on the left with the existing logo fallback. On mobile the image sits above the details.

### SEO export publishing workflow

See [SEO setup and editing](seo.md) for the current workflow. Production builds now export published managed articles to `/blog/slug/` with initial HTML, SEO metadata and sitemap entries. The instant `/blog/?post=slug` view remains available. **Older notes about managed articles having no static pages are superseded by this workflow.** Rebuild and deploy after publishing, editing, unpublishing or deleting: an exported public article remains publicly accessible until its next deployment removes or changes it. Future schedules are excluded from the snapshot until released, and then require a new build for their clean page. The build reads only public posts with anonymous queries, not admin credentials, and does not publish drafts.

### Live article updates and dashboard refresh

Clean `/blog/slug/` pages retain their deployed article HTML for SEO, then anonymously check Firestore for the latest published revision when opened. Visible pages also check on focus, visibility changes and every 60 seconds. A successful save/delete notifies other public blog tabs in the same browser; the listing explicitly reads from the server. Draft, deleted and future-scheduled articles hide their old rendered copy after a successful public availability check. Network failures show a warning while keeping the last available copy.

The Overview at `/adminauth/` includes **Refresh live site content** under **Site-wide content refresh**. It requests fresh managed page, blog, work and venture content in local tabs and writes a timestamped public version signal to `siteState/content`. Connected visitors in other browsers/devices receive the request through a listener. It does not clear sign-in data, bookmarks or job-feed preferences, and does not reload an unsaved editor. The UI reports a failed global signal separately from its local notification. Offline visitors receive current content on their next successful load/focus/read. Deploy the reviewed Firestore rules to enable the new signal.

This control is not a Firebase CDN purge or a deployment trigger. Search crawlers without JavaScript, social previews and the initial HTML continue to use the deployed snapshot. Rebuild and redeploy for those copies, newly created clean article URLs, sitemap updates and removal of previously published HTML. Clearing browser storage cannot replace that deployment. Live refresh uses public reads under the existing rules; no billing upgrade or admin credentials are needed, and normal Firestore read quotas apply.

Firebase Hosting also revalidates Home, About, Contact, Ventures, Blog and Work HTML using `Cache-Control: public,max-age=0,must-revalidate`. Fingerprinted Next.js assets keep their existing immutable cache policy. This header prevents a browser from treating article HTML as fresh for an hour; it still cannot generate new HTML from Firestore without a deployment.

## Works editor

The Works sidebar entry manages portfolio projects using the same approved-admin gate. See [Works administration](works-admin.md) for source overrides, private drafts, atomic published copies, Cloudinary image uploads and static export limitations. The media upload endpoint is configured by the public `NEXT_PUBLIC_MEDIA_UPLOAD_URL` build variable; Cloudinary credentials belong only in Worker secrets. Deploy the reviewed Works rules before the normal build so its anonymous snapshot can load. Existing blog and bookmark access rules remain covered by the shared emulator suite.

## Ventures editor

Manage individual venture pages under **Ventures**. See [Ventures administration](ventures-admin.md) for drafts, publishing, structured sections, uploads, live views, clean URLs, SEO and rules deployment.

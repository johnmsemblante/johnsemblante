# Admin access and blog publishing

`/adminauth/` is the private-workspace gateway. `/adminauth/blog/` provides the blog editor. The job hunt app is not implemented.

The site still exports static files to Firebase Hosting. Firebase Authentication verifies Google accounts; Firestore rules authorize access to stored posts. Admin HTML and JavaScript are publicly downloadable, as on any static site, but contain no drafts or credentials. Private records are fetched only after authorization. Hiding a link or adding `noindex` is not the data-access boundary.

## One-time Firebase setup

Perform these steps in the existing `johnmsemblanteapp` project. No paid plan or billing change is required by this implementation. Check the Firebase console's current Spark quotas and monitor database reads/writes; quotas and third-party availability still apply.

1. In Firebase Console, register a **Web app** if the project has none, then open its SDK configuration. Do not create or download a service-account key.
2. Google sign-in is configured as code under `auth.providers.googleSignIn` in `firebase.json`. With Firebase CLI 15.35.0 or newer, run `firebase deploy --only auth --project johnmsemblanteapp` to provision it. Alternatively enable Google under Authentication > Sign-in method in the console. Authorize `johnmsemblanteapp.web.app`, `johnmsemblanteapp.firebaseapp.com` and `localhost` for development. Add a custom domain when actually used; do not authorize untrusted origins.
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

## Writing and publishing

- Visit `/adminauth/blog/`, then select **New post** or open a saved article.
- The slug is generated from the title. Duplicate titles receive numbered suffixes. Saved slugs remain fixed when titles change, preserving shared links.
- Categories and Tags accept multiple labels: type a label and press Enter or comma, or use Add. Remove individual chips with their remove buttons. At least one category is required (maximum 10); tags are optional (maximum 20). Labels are limited to 80 characters and duplicates are normalized. Both are shown on the public article and its list card.
- Separate paragraphs with blank lines. Use `## Heading`, `- list item` and `> quote`, with blank lines around blocks. Raw HTML is rendered as text.
- Use **Insert an image or file** to insert an HTTPS or site-relative URL at the article cursor. Images use `![alt description](URL)`; other assets use `[link label](URL)`. An image description is required. Images display within the article; file links open in another tab. Only URLs are supported in this revision. No Storage bucket, billing upgrade or direct file upload is enabled.
- **Draft** followed by Save draft stores a private draft.
- **Published** followed by Save and publish records the actual publication date/time with a Firestore server timestamp. There is no manual publication date for immediate publishing. Editing a published article preserves its publication timestamp. Unpublishing to Draft clears it; republishing creates a new publication timestamp.
- **Schedule** reveals a publication date/time input in **Asia/Manila (UTC+8)**. Only future times can be saved, checked in the editor and again by server-side access rules. At release time, the post automatically becomes public on subsequent reads; no editor needs to stay open and no paid scheduled job is used. Public pages refresh while visible approximately every minute, and on window focus, to discover newly released posts. Date/time settings on the reader's device must be accurate for time-bounded queries; a fast device clock cannot bypass server access checks.
- The stored status of a released scheduled post stays `scheduled`; its effective displayed status becomes Published. Opening it after release defaults the editor to Published. Saving it as Published keeps the scheduled release timestamp. Choose a new future time to reschedule instead.
- Optional **Meta title** and **Meta description** fields fall back independently to the post title and short introduction. The editor previews the effective values.
- **Delete article** permanently deletes the selected saved record after confirmation. Unsaved edits are discarded too. The operation checks the loaded revision, so a post changed in another tab is not silently deleted. External image/files referenced by URL are not deleted from their host.
- Another tab's changes cause a revision conflict instead of a silent overwrite. Copy unsaved text before reopening the latest version. Drafts are not persisted in browser local storage.

## Public blog and static-export limits

The public `/blog/` fetches published posts and due schedules. Future schedules and drafts are protected by Firestore rules, including direct document reads. Public views also hide non-public posts when the visitor is an administrator. Managed article URLs remain `/blog/?post=your-slug` and publishing requires no Hosting rebuild.

Stored SEO values update the browser title, description, canonical URL, Open Graph/Twitter fields and BlogPosting structured data after the article loads. **The site is still a static export:** query-string articles do not have individual server-rendered metadata or sitemap entries. Crawlers/social preview services that do not execute JavaScript still receive the shared Blog metadata. These SEO fields do not remove that hosting limitation. Dedicated crawler-visible article HTML requires server rendering or a controlled content-to-build pipeline in a separate change.

The existing source-based routes (`/blog/slug/`) remain supported and use `src/content/blog.ts`. Source-based articles are edited in source, not automatically imported into the browser editor. Their published slugs are reserved when new managed articles are created. The homepage's build-time writing preview still uses source-based posts.

Existing version-1 Firestore posts remain readable. Saving one upgrades it in place to schema version 2, keeping its slug, original creation time and existing publication date. New records use server publication timestamps, category/tag arrays and optional SEO fields. No bulk production migration or deletion runs automatically.

Only public article fields live in `blogPosts`; do not add private editorial notes to a document that may be published. Rules enforce a field allowlist. All unrelated collections remain denied.

## Verification

```powershell
npm run typecheck
npm run test:blog
npm run build
```

Rules tests use the official local Firestore emulator with a **demo project**, never production. Install Java 21+ and Firebase CLI for repeatable local runs:

```powershell
firebase emulators:exec --only firestore --project demo-portfolio-admin "npm run test:rules"
```

The rules suite checks anonymous draft denial, published reads, non-admin denial, self-approval denial, verified-admin writes, schema/timestamp/revision validation, automatic slugs and collisions, scheduling before/after release, forged clock denial, publishing/unpublishing, deletion, legacy upgrades and revocation. `test:rules` refuses to run without a loopback emulator. These tests do not send email or create production users/posts.

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

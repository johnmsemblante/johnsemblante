# Admin access and blog publishing

`/adminauth/` is the private-workspace gateway. `/adminauth/blog/` provides the blog editor. The job hunt app is not implemented.

The site still exports static files to Firebase Hosting. Firebase Authentication verifies Google accounts; Firestore rules authorize access to stored posts. Admin HTML and JavaScript are publicly downloadable, as on any static site, but contain no drafts or credentials. Private records are fetched only after authorization. Hiding a link or adding `noindex` is not the data-access boundary.

## One-time Firebase setup

Perform these steps in the existing `johnmsemblanteapp` project. No paid plan or billing change is required by this implementation. Check the Firebase console's current Spark quotas and monitor database reads/writes; quotas and third-party availability still apply.

1. In Firebase Console, register a **Web app** if the project has none, then open its SDK configuration. Do not create or download a service-account key.
2. Enable **Authentication → Sign-in method → Google**. Choose the support email requested by Firebase. Under Authentication settings, authorize the production domain (`johnmsemblanteapp.web.app`) and `localhost` for development. Add a custom domain when actually used. Do not authorize untrusted origins.
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

- Visit `/adminauth/blog/`, then select **New post** or open a saved post.
- Enter a title, unique lowercase slug, introduction, category, and article. Slugs become immutable after saving to preserve shared links.
- Separate paragraphs with blank lines. `## Heading`, `- list item` and `> quote` support simple formatting. Separate these blocks with blank lines. Preview is available before saving. HTML, images, scripts, arbitrary links and advanced Markdown are rendered as text or unsupported, never executed.
- **Draft — private** followed by **Save draft** stores a private draft. Valid publication dates are optional for drafts.
- Choose **Published — public**, enter a real date, then **Save and publish**. The complete stored article becomes publicly readable. Publication is immediate even for future dates; there is no scheduled-publishing feature.
- To unpublish, choose **Draft — private** and save. Subsequent public reads are denied. Previously public content cannot be recalled from readers who have already seen or copied it.
- Editing a published post and saving publishes the updated version immediately. There is no separate pending revision of an already published article.
- Another tab's changes cause a revision conflict instead of a silent overwrite. Copy any unsaved text before reopening the latest post. Duplicate slugs are also rejected. The editor warns before common navigation actions that would discard unsaved edits. Draft text is not stored in browser local storage.
- The editor lists 25 posts at a time; the public list loads 20 at a time. Use **Load more** for older posts. There is deliberately no permanent-delete action.

## Public blog and static-export limits

The public `/blog/` fetches only `status == published` records. A new managed post uses `/blog/?post=your-slug`; publishing it needs no Hosting rebuild. Public detail reads also enforce published status, including for an administrator viewing the public site.

The existing source-based article routes (`/blog/slug/`) remain supported and use `src/content/blog.ts`. The starter source draft has not been imported into Firestore or exposed through admin page HTML. Real source-based articles, if added later, are edited in source; they are not automatically migrated into the admin editor. Their published slugs are reserved in the editor UI.

Managed articles currently render in the browser. They do **not** have build-time per-article Open Graph metadata or sitemap entries; the `/blog/` metadata remains the shared metadata for query-string articles. Article titles update in the browser after loading. For dedicated SEO article URLs and social previews, add server rendering or a controlled content-to-static-build pipeline later. The homepage's build-time writing preview still uses source-based posts.

Only public article fields live in `blogPosts`. Do not add private editorial notes to a document that may be published: Firestore reads return complete documents. Rules enforce an explicit field allowlist. All unrelated collections are denied until separately implemented.

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

The rules suite checks anonymous draft denial, published reads, non-admin denial, self-approval denial, verified-admin writes, schema/timestamp/revision validation, publishing/unpublishing, revocation and default-denied private collections. `test:rules` refuses to run without a loopback emulator. These tests do not send email or create production users/posts.

Before going live, test approved and unapproved Google accounts, direct editor URLs while signed out, popup cancellation, sign-out, admin revocation, a draft's public URL, publishing/unpublishing, two-tab conflicts, mobile layouts and quota/network failures. Code/build checks do not establish that Firebase Console configuration or live OAuth is working.

The Firebase dependency includes a Node-side gRPC dependency override to `1.13.6` to address the certificate-validation advisory in the SDK's older pinned release. Review the override when upgrading Firebase; browser code uses the Web SDK transport.

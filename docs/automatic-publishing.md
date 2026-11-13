# Automatic publishing on Firebase Spark

The site remains a static Next.js export hosted on Firebase Spark. No Cloud Run, billing account, Cloud Functions, Cloudflare publishing endpoint or browser deployment token is required.

After a save in Blog, Works, Ventures or Pages, GitHub Actions checks the current public Firestore content on a five-minute schedule. Changed content triggers a build and live Firebase Hosting deployment. New clean URLs, initial article HTML, canonical/Open Graph metadata and sitemap entries are generated together. The existing database view is available immediately while a new clean page waits for deployment. Existing exported HTML is only changed or removed after a successful deployment.

GitHub schedules can be delayed or skipped; allow the next check plus build/deployment time. This is not an instant publishing guarantee. The dashboard links to [publishing runs](https://github.com/johnmsemblante/johnsemblante/actions/workflows/publish-site.yml), including GitHub's **Run workflow** button, which works from a phone. Scheduled blog posts are picked up by the first successful check after release (the snapshot reader uses a one-minute clock safety margin).

## Activation status

The project owner manually configured the dedicated service account, GitHub deployment secret and five public build variables. Their presence was verified. Publishing is activated by the workflow on `main`; check the latest GitHub Actions run for deployment status.

## One-time account setup

Target repository: `johnmsemblante/johnsemblante`, public, default branch `main`.

1. Create service account `github-hosting-publish@johnmsemblanteapp.iam.gserviceaccount.com` in the existing Firebase project. Grant `roles/firebasehosting.admin`, `roles/serviceusage.apiKeysViewer` and `roles/serviceusage.serviceUsageConsumer`. Do not grant Owner, Editor, Authentication admin, Firestore admin or Cloud Functions permissions. This identity can deploy Hosting; it cannot use admin-only Firestore reads with the supplied roles. Public snapshots use anonymous REST reads.
2. Generate its JSON credential and encrypt it directly into repository Actions secret `FIREBASE_SERVICE_ACCOUNT_JOHNMSEMBLANTEAPP`. The prepared setup script keeps the credential in memory, encrypts it with GitHub's repository public key and writes no private-key file. If storing the secret fails, it revokes the newly created key. This is a long-lived deployment credential: keep it in GitHub Secrets, revoke/rotate it when needed, and never commit it, embed it in `NEXT_PUBLIC_*`, or paste it into chat.
3. Copy these existing public values from local build configuration to repository **Actions variables**: `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_APP_ID`, `NEXT_PUBLIC_MEDIA_UPLOAD_URL`, `NEXT_PUBLIC_HIMALAYAS_PROXY_URL`. The workflow fixes the project to `johnmsemblanteapp`. The validation step prevents publishing a build with missing sign-in/upload/job-feed configuration.
4. Push the tested changes, including `.github/workflows/publish-site.yml`, to `main`. Enable GitHub Actions if disabled. The push runs an initial build/deployment. It deploys only Hosting, using the existing `out/` configuration; it does not deploy Firestore rules, Authentication settings or billing changes.
5. Verify the initial run succeeds. Open `/content-deployment.json`, a public receipt containing only a content hash and build timestamp. Open a clean article URL and inspect its raw HTML for the heading, canonical, Open Graph metadata and Article JSON-LD. Check `/sitemap.xml`.
6. Save a public change from `/adminauth/` on a phone. Close the editor after the save succeeds. Confirm a subsequent scheduled run detects it, deploys successfully and changes the clean page without any local build. Delete/unpublish a temporary test record and verify the next deployment removes its exported page. Do not use a real article for destructive verification.

The preparation script is in ignored `tmp/setup-publish-accounts.cjs`; its `inspect` mode performs read-only access checks. Run `configure` only after approving the specific account, role and credential changes above. It reuses an existing secret rather than rotating it unexpectedly. Existing Firebase/GitHub sign-ins are available on this machine; no additional plugin is required for this setup.

## What the workflow does

`sync:content` reads only public content for blogs, works, pages and ventures. `content-deployment.cjs check` compares its SHA-256 fingerprint with the currently hosted receipt. Generation timestamps do not affect the fingerprint, so unchanged scheduled checks skip the expensive build and deployment. Draft-only edits do not produce public snapshots. Release times, publishing, editing, renaming, unpublishing and deleting affect the public snapshot and are detected automatically.

The build consumes the exact snapshots used for the comparison (`build:prepared`), then writes the receipt into `out/`. The receipt is deployed with the HTML, never updated separately. Failed reads, builds or deployments therefore leave the previous live site and receipt intact; the next successful check retries. A manually run workflow or push always builds, even if the public hash matches, so code/configuration changes are not skipped.

Deployments are serialized without interrupting the active release. A later check picks up edits made during an existing build. Deployments do not clear browser storage, sign-in sessions, drafts or bookmarks. Social networks/search engines manage their own cached copies.

## Free-plan limits and maintenance

The verified repository is public. Standard GitHub-hosted runners for public repositories are free; this workflow uses `ubuntu-latest`, not a larger runner. If repository visibility changes, review Actions allowances before keeping the five-minute schedule. Firebase Spark's existing Firestore/Hosting quotas still apply. Each scheduled check performs public collection reads even if it skips the build. At five-minute intervals there are up to 288 checks per day; usage grows with content size. Scheduled runs in public repositories can be disabled after 60 days without repository activity; check Actions and re-enable the workflow when needed. No automatic keep-alive commits are added.

References: [Firebase Hosting GitHub integration](https://firebase.google.com/docs/hosting/github-integration), [GitHub scheduled workflow limits](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule), [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Local commands remain `npm run build` and `npm run preview`. The build now also writes the content receipt. `npm run test:publish` verifies fingerprint changes and publishing notices. The previously proposed server/Docker deployment files were removed; do not follow Cloud Run setup instructions for this Spark implementation.

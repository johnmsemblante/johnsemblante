# Digital HQ test deployment

Reviewed 27 November 2026. The owner authorized committing and pushing `feature/digital-hq-interactive-portfolio` and deploying a separate test page. Do not merge to main or publish the feature to the live channel. The [handoff note](handoffs/2026-11-27-digital-hq.md) records the actual URL, source commit and latest verification.

## On another computer

Read `AGENTS.md`, the handoff and the Digital HQ architecture/background/character guides first. Fetch and track the feature branch, then run `npm ci`. Restore existing public build configuration through the established secure local setup; never commit `.env.local` or deployment credentials. Use Node 22 as in CI. Sign in to the Firebase CLI using an authorized existing account; CLI installation/sign-in is local tooling, not a production configuration change.

1. Run `npm run sync:content` with network access to refresh only public content snapshots. Do not create test content in the real backend. Check TypeScript, focused tests and the SEO export audit as documented in the handoff.
2. Commit reviewed changes on the feature branch. Both preview commands require a clean worktree and the exact feature branch.
3. Run `npm run preview:hq:build`. It prepares PDF/social assets and runs the installed Next static build with `NEXT_PUBLIC_DIGITAL_HQ_PREVIEW=true`. This explicitly includes the temporary character. It does not persist that flag in an environment file or change the ordinary production build.
4. Only after a successful exit, run `npm run preview:hq:deploy -- --firebase-cli path/to/firebase-tools/lib/bin/firebase.js`. Use an installed Firebase CLI JavaScript entry point. The helper invokes only `hosting:channel:deploy digital-hq` for `johnmsemblanteapp`, requests 30-day expiry and disables Auth-domain synchronization. It never runs `firebase deploy`, changes rules/Auth configuration or clones to live.
5. Verify the returned URL, `X-Robots-Tag: noindex, nofollow` response and `/digital-hq-preview.json` source commit. Test automatic startup, the absence of an entry button, content labels, Classic and responsive layouts. Add the URL, source SHA, exact expiry and results to the handoff, commit the verification notes and push this same branch.

Feature pushes do not deploy the test page automatically. Repeat this workflow to update the same channel. Repeat deployments renew the channel expiry; its URL remains stable while the channel exists. An expired channel must be redeployed. The URL is shareable and publicly reachable; noindex is not authentication.

## Build and release isolation

The helper invalidates its old build receipt before starting. A failed build therefore cannot fall through to a previous export. Successful output is copied into a fresh ignored `tmp/digital-hq-preview/build-*` directory. Its generated config contains only the copied Hosting configuration with global noindex/no-store headers and that unique public directory. Production `firebase.json`, `.firebaserc`, workflow and canonical metadata remain unchanged. A public manifest records only branch, commit, build time and preview flags. The unrelated production content receipt is excluded from this staged copy.

Deploy requires the same clean source commit as the successful build receipt. If source changes, rebuild. Generated files and CLI credentials are not committed. Existing Next advisory-related build failures must be reported and the unchanged build retried explicitly; a nonzero exit is never treated as deployment success. Run `node --test tests/digital-hq-preview.test.cjs` to check branch, configuration and command boundaries.

This preview shares the existing real Firebase project and other backend integrations. Do not submit forms or write test records. The temporary hostname is not automatically added to Firebase Auth or external origin allowlists; sign-in or restricted integrations may fail there. Use the established live admin URL for administration. There are no database/rule, account, billing or production-domain changes in this workflow.

## Verification tooling

The existing browser checker accepts a hosted URL: `node scripts/check-digital-hq-browser.cjs --url https://RETURNED-PREVIEW-HOST --playwright path/to/playwright --axe path/to/axe.min.js --output tmp/digital-hq-hosted-check`. Use already installed local test tools. It checks UI behavior without submitting forms or changing public records. The local chunk-file exclusion check is skipped for a hosted build; other mode/resource checks remain active.

Before and after deploying, compare the Firebase live channel release/version and remote main SHA. Verify the feature push separately with `git ls-remote`. A later documentation-only commit can record a deployment made from the preceding implementation commit; the public manifest must retain the actual built source SHA.

References: [Firebase preview deployment](https://firebase.google.com/docs/hosting/test-preview-deploy), [channel lifecycle and expiry](https://firebase.google.com/docs/hosting/manage-hosting-resources). The installed CLI also documents the 30-day maximum and `--no-authorized-domains` option.

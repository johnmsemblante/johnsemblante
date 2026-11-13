# PDF editor pre-release regression review

Reviewed 13 November 2026. Scope: new PDF editor, its code-managed listing, homepage three-column tool cards, PDF guide numbering and heading spacing. No commit or deployment was performed during verification.

## Results

- `node --test tests/*.test.cjs tests/live-seo.test.mjs`: 181 tests, 180 passed, zero failed, one skipped. The skipped test renders PDF annotation pixels through native Canvas, which Windows Application Control blocks on this host.
- Added `tests/admin-auth-flow.test.cjs` to the regular `test:admin` command. Tests execute the actual gate with simulated Firebase boundaries: verified server-confirmed approval, cached approval denial, unverified/missing/revoked admin denial, popup cancellation/retry, protected-route redirects, logout, subscription cleanup and service errors. They do not authenticate with Google or write production records.
- Existing Blog, Works, Pages and Ventures model/store/editor tests passed, including draft/publish behavior, stale revisions, source overrides, uploads and authorization checks. Form tests cover validation, duplicate-submit blocking, clearing only after acknowledgement, retaining input on failure, POST payload/abort propagation, provider rejection, rate limiting, malformed acknowledgements and interrupted requests. No real inquiry was submitted.
- `npm.cmd run typecheck`: passed.
- `npm.cmd run build`: passed, including current public-content synchronization, PDF asset preparation, all 55 static pages and deployment-receipt generation. The first sandboxed sync could not access the network; rerunning with approved network access succeeded. This command builds but does not deploy.
- `npm.cmd run audit:seo`: 40 public pages, zero errors. One editorial warning concerns the length of an existing blog title. Admin noindex and robots checks passed.
- `git diff --check`: passed.

## Scope checks and practical limits

The implementation does not modify the auth gate, Firebase client setup, admin editor components/stores, inquiry component/transport, Firestore rules or Firebase Hosting configuration. Existing locked package versions remain unchanged; PDF dependencies are additions. Homepage grid selectors are scoped to tool cards, and decimal list markers/heading spacing are scoped to `.pdf-guide`. Tailwind's global list reset remains intact.

The automated checks support regression confidence, not a guarantee of live third-party availability. A real Google popup sign-in, signed-in production admin save and delivered inquiry were not performed. Firestore emulator integration tests were not run because Java/Firebase CLI are unavailable on this host; the existing rules are unchanged. Browser visual/touch checks of the PDF editor remain outstanding from the earlier interrupted computer-use review. Review a test deployment with an approved owner session before treating the full release as manually verified; avoid modifying published records or sending inquiries solely for a regression check without an agreed test workflow.

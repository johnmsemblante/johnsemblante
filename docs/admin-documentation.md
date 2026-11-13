# Admin documentation handbook

Open **Documentation** from the dashboard menu or Overview card at `/adminauth/documentation/`. The existing shared admin gate and noindex layout apply. No new database collection, authentication flow, dependency or content editor is introduced.

`src/content/admin-documentation.ts` is the curated owner-facing source of truth. It contains current operating instructions, explanations, troubleshooting, related routes, source references and an individual reviewed date for each guide. The handbook intentionally does not dump raw repository documents: those include historical checkpoints, implementation details and operator setup information that can be misleading in a current user guide. No private records or credentials belong in this static content.

Search matches the entire guide: title, summary, category, tags, section headings, paragraphs, steps and related-link labels. Matching is case/diacritic insensitive. Every whitespace-separated query token must occur somewhere in the same guide. Category filtering combines with search; title and tag matches rank first, preserving source order for equal scores. Native details/summary disclosures support keyboard expansion, with Expand/Collapse results and a clear no-results state. No search request or persistent query storage is used.

## Required maintenance workflow

1. When changing behavior, identify affected owner guides and technical notes. Add a guide when introducing a new operational workflow.
2. Verify the actual implementation and current UI labels. Explain what the owner does, how the feature works, its limits and what to check when it fails. Avoid promises about third-party availability or automatic indexing.
3. Update the appropriate typed guide and its `updated` date using the current review date. Include `sources` pointing to relevant repo notes/implementation for future maintenance. Keep code references out of the owner’s required workflow.
4. Update the corresponding `docs/` note in the same change. Do not refresh unrelated guide dates or present old release notes as current status.
5. Run `node --test tests/admin-documentation.test.cjs tests/admin-dashboard.test.cjs` and the relevant feature tests, `npm.cmd run typecheck`, and the established build before releasing.
6. Check search for a title and a phrase found only in the body; combined topic filters; clearing; no results; keyboard disclosures; mobile overflow; and the signed-out route gate. Use an isolated component fixture for authenticated UI review if a verified live admin session is unavailable. Never bypass the production auth gate to test the screen.

The repository's `AGENTS.md` requires this workflow for future feature and operational changes. Documentation is maintained alongside implementation, not automatically generated after content saves or inferred from deployments. Dashboard content edits alone do not change the handbook; source changes reach it after the normal code deployment. Its route remains outside the public sitemap.

The existing Hosting deployment uses static assets. The admin gate prevents displaying the dashboard before access is verified, while Firestore rules protect private records. Static handbook text is not confidential and must remain safe for public download.

Validation on 13 November 2026: all 164 Node regression tests, TypeScript and the production build passed. The documentation suite is included in `npm.cmd run test:admin`. An isolated Edge fixture with the real documentation component and dashboard shell verified all 20 guides, body-text search, combined category/query filtering, no-results/reset states, keyboard disclosures, expand/collapse controls, active/mobile navigation and 1440/768/390px layouts without horizontal overflow. The mobile screenshot was inspected. This fixture does not bypass the production authentication gate or read private records; a signed-in production owner session was not used for its UI checks.

# Digital HQ Phase 1 validation

Historical baseline before the background/automatic-start enhancement. See [the current enhancement review](digital-hq-background-autostart.md) for the latest startup behavior and screenshots.

Review date: 27 November 2026. Local only; no deployment or remote push.

The original office remains at `feature/interactive-office` / `ed0020d`. Current work is `feature/digital-hq-interactive-portfolio`. The initial worktree was clean, so there was no office WIP to stash. See [audit and architecture](../digital-hq.md) and [character contract](../digital-hq-character.md). Production likeness and reference-level artist rendering are not achieved by this procedural art pass.

## Baseline

The original `build:prepared` compiled, typechecked and exported 62 pages, then the installed Next.js dependency security audit returned a nonzero upgrade recommendation. Exported files were retained for comparison. This is an existing dependency finding, separate from the scene implementation.

Before-change local Lighthouse, headless Edge, static export on port 3100:

| Metric | Desktop | Mobile |
| --- | --- | --- |
| Performance | 100 | 74 |
| Accessibility | 100 | 100 |
| SEO | 100 | 100 |
| LCP | 482 ms | 6753 ms |
| CLS | 0.00588 | 0.00025 |
| TBT | 0 ms | 74 ms |
| Total resource bytes | 1,565,112 | 1,533,871 |

These are single local lab runs, not field Core Web Vitals. The old network-idle baseline helper timed out because existing content listeners retain network activity; Lighthouse completed separately. SEO copies are in ignored `tmp/digital-hq/before-*`; raw Lighthouse results are in ignored `tmp/office/digital-hq-before-*`.

## After-change measurements

The final comparison was run after compilation finished, without a simultaneous build/browser suite. An earlier concurrent run measured 61 mobile and was repeated to remove that test interference. The isolated result was 73; it must not be described as a field improvement.

| Metric | Desktop before → after | Mobile before → after |
| --- | --- | --- |
| Performance | 100 → 100 | 74 → 73 |
| Accessibility | 100 → 100 | 100 → 100 |
| SEO | 100 → 100 | 100 → 100 |
| LCP | 482 → 481 ms | 6753 → 8536 ms |
| CLS | 0.00588 → 0.01798 | 0.00025 → 0 |
| TBT | 0 → 3 ms | 74 → 102 ms |
| Total resource bytes | 1,565,112 → 1,601,499 | 1,533,871 → 1,564,945 |
| Initial JavaScript body bytes | See metrics JSON | 1,221,806 → 1,234,859 |

The mobile score is similar, but LCP remains above target and worsened in this single-run comparison. The existing initial application payload is substantial; the new renderer is absent from passive arrival. Do not enable this branch in production on the strength of these measurements. More mobile loading work and repeated device tests remain necessary before release. No field INP or real-user percentile is claimed. The local preview's preexisting Next route-segment prefetch 404 appears in both baseline and after Lighthouse console reports; best-practices scores are 96 in both. No uncaught application page errors occurred in the feature browser suite.

AVIF previews are 58,428 bytes desktop and 22,200 bytes mobile without a character, or 60,635 / 22,608 bytes for development previews. Essential furniture uses generated local geometry/textures, so there is no downloaded environment GLB or external asset host. No final character payload can be measured yet. The standalone High renderer reports 172 draw calls / 269,620 triangles without a character and 188 / 340,020 with the temporary rig, including shadow-pass work. This is frame accounting, not a unique-polygon asset count.

Raw metrics are summarized in [digital-hq-metrics.json](digital-hq-metrics.json). Gzip savings are not presented as actual transfer measurements: the local static server does not compress responses.

## Verification results

- `npm run test:digital-hq`: 7/7 passed. Covers catalogue/destinations, quality/preferences, shared data, real skinned rig, interruption/idle return, reduced motion, preview exclusion, cancellation, valid embedded GLB loading/bounds and failed loading.
- Full `node --test "tests/*.test.cjs"`: 228 passed, 2 failed out of 230 reported tests. The failures are existing and outside this change: `job-feed-worker.test.cjs` expects an en dash while unchanged code returns “to”; `venture-admin.test.cjs` has a loader that cannot resolve the existing JSON import in `page-model.ts`. A diff against `ed0020d` confirmed those tests and relevant implementations were unchanged. They were not silently rewritten to pass.
- `tests/live-seo.test.mjs`: 3/3 passed. Relevant Pages/SEO tests also passed (23); handbook/dashboard/publishing checks passed (10).
- TypeScript passed. No standalone lint script exists. Firestore emulator tests were not run; no database rules or authentication behavior changed.
- Static compilation, TypeScript and all 62 page exports completed. The installed Next.js security audit intermittently stops the command afterward with an upgrade advisory. One retry exited 0; the final export command exited 1 for that advisory. This is not an unqualified green production build. Dependency remediation remains separate release work.
- The SEO export audit checked 43 public pages with **0 errors**, plus one existing long-article-title editorial warning. A direct before/after comparison found identical homepage title, description, canonical/social metadata, JSON-LD, sitemap URL set and robots.txt. The H1 remains exactly **Cebu Web Developer**; the Digital HQ greeting is separate visible text.
- Browser QA covered 1920×1080, 1440×900, 768×1024 and 390×844, with no horizontal overflow or overlapping object labels and one H1. Mobile deliberately allows vertical scrolling to reach the lower utility controls.
- All eight sections work by keyboard; native dialogs contain focus, Escape closes them and focus returns to the trigger. Help exposes all destinations. Modified clicks retain canonical href behavior.
- Physical SD-card raycasting, camera zoom/rotation/reset, hidden-tab pause, WebGL context release on Classic, remembered mode, repeated mode switching, context loss, unsupported WebGL and reduced-motion navigation passed. Fresh internal About navigation did not request the HQ renderer. The default production export omits the temporary character.
- Axe WCAG 2/2.1/2.2 A/AA checks found zero violations in all four HQ layouts and the Works panel. This is automated coverage, not a full screen-reader audit.

The browser suite and render utility use an already installed local Playwright/Edge setup, not a new runtime dependency. The in-app browser host was unavailable, so no in-app preview handoff is claimed. Existing local development remains available at the normal Next.js URL.

## Reviewed screenshots

These are actual local implementation captures, not the supplied mockup. Desktop captures show the **development-only temporary figure** with a likeness-pending notice. Tablet/mobile captures show the actual static scene render and responsive navigation. The model is deliberately stylized; it does not achieve the supplied reference's facial likeness or offline rendering quality.

- [1920×1080 live development scene](digital-hq-1920.webp)
- [1440×900 live development scene](digital-hq-1440.webp)
- [768×1024 tablet preview](digital-hq-768.webp)
- [390×844 mobile preview](digital-hq-390.webp)
- [Works panel](digital-hq-works.webp)
- [Preserved Classic homepage](digital-hq-classic.webp)

Desktop composition, readable labels, mobile framing and character scale were visually inspected and adjusted. A production artist should refine the character, plant forms, materials, furniture proportions and baked lighting in later phases. The approved character GLB and full interactive section experiences remain pending.

## Files and dependency changes

New runtime modules are under `src/components/digital-hq/`: `assets.ts`, `environment.ts`, `lighting.ts`, `canvas.tsx`, `objects.ts`, `character.ts`, `character-config.ts`, `home-experience.tsx`, `mode.tsx`, `icon.tsx` and `digital-hq.css`. The public-data adapter is `src/lib/build-hq-content.ts`.

The homepage only changes its wrapper imports/content adapter; the Classic JSX is unchanged. `header-navigation.tsx` and `portfolio-frame.tsx` point to the shared new mode module. `site-wordmark.tsx` adds an optional reset-click handler while retaining the same original logo markup. `scripts/check-seo.mjs` recognizes the generic professional-title marker as well as the archived marker.

`package.json`/lockfile add React Three Fiber 9.8.2 and its normal transitive dependencies, plus the feature-test script. Existing Three.js remains the renderer; no Drei, GSAP, physics package, paid service or second animation system was added. Fiber 9 is the React 19 family; the installed package's peer requirements were checked. Three.js AnimationMixer provides character blending.

New maintenance/QA scripts are `render-digital-hq-preview.cjs` and `check-digital-hq-browser.cjs`; new tests are `digital-hq.test.cjs` and `digital-hq-character.test.cjs`. Existing Pages/SEO mocks follow the renamed module. Eight generated preview files are under `public/images/digital-hq/`. The old office components, adapter, test/render scripts and four public preview assets are removed from this branch, preserved by the archived office commit. Historical review screenshots stay in docs.

The owner/technical guide collections, README and affected publishing, Pages, portrait, design and branch notes were updated alongside this feature. New maintenance and character-contract documents contain the source-managed workflow and exact replacement requirements. Only affected handbook dates changed.

## Release limits and rollback

No commit, push, merge, Firebase deployment or production data write was performed. Source changes remain reviewable on the new local feature branch. Classic, existing tools, game progression/backend, contact logic, donations, admin and publishing rules were not replaced.

Keep this local until the approved character, mobile loading work, dependency advisory and broader release checks are resolved. Phase 2 should supply and approve the GLB and real animation clips; Phase 3/4 should add history-aware sections and embedded experiences without duplicating existing logic. Asset provenance and license notes are in [the implementation guide](../digital-hq.md); model acceptance is in [the character contract](../digital-hq-character.md).

Save the new source before `git switch feature/interactive-office` to revisit the old concept, or `git switch main` for production source. Never deploy the stale local export, reset shared history or delete unrelated stashes. See [branch/release instructions](../production-classic.md).

# Digital HQ background and automatic startup review

Review date: 27 November 2026. Local feature work only; no deployment.

The background now follows the supplied reference with a dark studio wall, tall framed window, detailed sunset skyline, hanging greenery, amber ceiling/baseboard light and a reflective room floor. The workspace and temporary character retain their existing geometry and navigation; this enhancement targets the background and startup behavior.

Interactive now starts live 3D automatically. The entry button has been removed. The preview remains during loading and errors; Retry 3D appears only after failure. Remembered Classic remains available and should continue to skip the scene engine.

Source, provenance, generation prompt and maintenance details are in [background maintenance](../digital-hq-background.md). This report records current checks separately from the historical manually activated [Phase 1 baseline](digital-hq-phase-1.md).

## Validation

- **37 focused Node tests passed:** HQ data/quality, skinned character/loading, Pages, SEO, owner handbook and dashboard.
- **15 browser checks passed** in the exported build: automatic live rendering at 1920×1080, 1440×900, 768×1024 and 390×844; no entry button; one H1; no horizontal overflow or overlapping labels; all eight panels and keyboard/focus behavior; help; physical SD-card picking; camera controls; hidden-tab pause; actual context release on Classic; remembered mode; repeated switches; context loss; unsupported WebGL/reduced-motion navigation; fresh internal-route isolation; and cancellation during pending construction/shader warmup.
- A fresh remembered Classic visit was checked against the actual Three.js renderer-core chunk and did **not** request it.
- **Zero uncaught page errors** and **zero axe violations** in all four layouts and the Works panel. Automated axe checks do not replace a full assistive-technology audit.
- TypeScript and whitespace checks passed. The static build compiled/exported all 62 pages; the existing Next.js dependency advisory appeared on the first attempt, and an unchanged retry completed with exit **0**. No framework upgrade was made in this enhancement.
- The export SEO audit checked **43 public pages with zero errors** and the existing article-title editorial warning. Homepage metadata remained unchanged, and initial HTML contains no entry-button markup.

The original full Node-suite results and unrelated preexisting failures are preserved in the historical Phase 1 report; this enhancement used the focused test set above. No database/rules or contact/game business logic changed.

## Startup performance

Automatic startup intentionally includes renderer download, geometry construction and shader initialization. The historical manually activated baseline excluded those costs on passive arrival, so its score is not a like-for-like automatic-start result.

The first automatic run exposed long construction tasks. Construction now yields between object groups, keyboard rows and shelf rows, checks cancellation, and prewarms shaders asynchronously before revealing the scene. The final run was measured after build/browser work finished.

| Local Lighthouse metric | Desktop | Mobile |
| --- | --- | --- |
| Performance | 99 | 59 |
| Accessibility | 100 | 100 |
| SEO | 100 | 100 |
| LCP | 482 ms | 8253 ms |
| CLS | 0.02435 | 0 |
| Total Blocking Time | 34 ms | 579 ms |
| Total resource bytes | 2,855,229 | 2,799,138 |

Before the construction optimization, automatic-start performance was 73 desktop / 44 mobile, with 704 / 1779 ms TBT. Raw values for both runs are retained in [startup metrics](digital-hq-autostart-metrics.json). These are single local lab runs, not field Web Vitals. The static preview server does not compress responses. Its preexisting route-segment prefetch 404 still accounts for the Lighthouse console/best-practices finding (96 in both cases).

Desktop automatic startup is now close to the old passive-arrival score, while **mobile remains below the prior manual-start score of 73 and needs further loading/bundle work before production release**. Mobile LCP remains above target. Low quality, reduced-motion behavior and usable HTML fallback remain in place; no field INP result or production-readiness claim is made.

The background asset is 213,230 bytes. Updated ordinary scene AVIF previews are approximately 88 KB desktop / 32 KB mobile. Environment details are generated locally, with no additional model download. The standalone High capture reports 173 draw calls / 196,706 triangles without a character, or 189 / 267,106 with the temporary rig, including shadow-pass work.

## Actual captures

These development captures include the unchanged, clearly labeled temporary character. Its final likeness and the wider foreground art pass remain separate work.

- [1920×1080](digital-hq-background-1920.webp)
- [1440×900](digital-hq-background-1440.webp)
- [768×1024](digital-hq-background-768.webp)
- [390×844](digital-hq-background-390.webp)
- [Browser check record](digital-hq-background-browser.json)

## Implementation and release boundary

New modules: `background-config.ts` and `background.ts`. Updated modules: `environment.ts`, `canvas.tsx`, `home-experience.tsx`, `lighting.ts`, quality defaults and the scene CSS. The preview/browser utilities and current handbook/technical guides were updated alongside the implementation. No dependencies were added for this enhancement.

The runtime plate and its generated source are saved in the repository; the full built-in-tool prompt and paths are in [background maintenance](../digital-hq-background.md). The reference applies to every future enhancement. The city/window is a scenic background layer; the workspace, figure and additional foliage remain real 3D objects.

The entry button is removed, while a failure-only Retry 3D action remains. Existing Classic preference, original branding, URLs and public content are preserved. No commit, push, merge or deployment was performed. Save the feature work before switching to the archived office or production branch; do not deploy this local export until the remaining character/performance release work is reviewed.

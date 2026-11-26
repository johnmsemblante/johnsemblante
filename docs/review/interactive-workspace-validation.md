# Interactive workspace validation, 26 November 2026

The homepage implementation is complete for local review. It includes a real, explorable Three.js office, eight room panels, the preserved Classic hero, adaptive previews and the existing server-rendered content. This record covers local implementation and validation; no deployment was performed.

The result is an original stylized interpretation of the reference. Reference-level art fidelity and all performance targets are not claimed. Mobile Lighthouse LCP remains above the requested target, and the existing Next.js security advisory needs maintenance before release.

## Features, architecture and changed files

The default office presentation uses the same canonical homepage URL. Its matching preview and HTML room controls work immediately; suitable desktops start live rendering on pointer exploration or room selection. Enable 3D view starts it explicitly. This is an intentional loading tradeoff to protect passive arrival. Phones and constrained preferences default to the lightweight view. Classic preserves the original portrait, copy, calls to action and shared sections and releases the renderer. Mode choice stays in browser storage, with a session fallback when storage is blocked.

The cutaway includes reception, library, lounge, development studio, innovation lab, tools, arcade, servers, meeting room, court, parking, vehicles, planting and streetlights. Camera focus, bounded rotation/zoom, reset, hover highlights and native HTML modal panels connect to actual existing records and routes. No new contact system, game implementation, analytics provider, database or hosting service was introduced.

| Files | Purpose |
| --- | --- |
| `src/components/office/{home-experience,mode,rooms,icon,model,renderer}.tsx/.ts`, `office.css` | Controller, validated preference, room configuration, HTML UI, original model, rendering lifecycle and responsive styles |
| `src/lib/build-office-content.ts` | Adapts existing public Works, Ventures, tools, game, blog and profile data |
| `src/app/(portfolio)/page.tsx` | Keeps metadata/shared sections and passes the original hero as the Classic slot |
| `src/components/{header-navigation,site-shell,hero-portrait,page-content}.tsx`, `src/app/globals.css` | Header switch/branding, conditional portrait preload and a stable homepage refresh notice |
| `public/images/office/` | Desktop/mobile AVIF previews and WebP fallbacks |
| `scripts/{render-office-preview,check-office-browser}.cjs` | Reproducible rendering and production browser checks using an installed Playwright package |
| `scripts/check-seo.mjs`, `tests/{office,pages,seo}.test.cjs` | Supported-heading/profession checks, room/source validation and both-mode content regression coverage |
| Owner/technical handbook sources, README and affected `docs/` guides | Current operation, maintenance, results and rollback instructions |

No project dependency or lockfile changed. Existing Three.js 0.187.0, Next.js 16.4.3 and React 19.3.1 were used. Lighthouse 13.6.0 was installed only in ignored temporary test tooling. All new geometry, textures and office previews are original procedural assets; no external model pack or attribution obligation was added. Three.js retains its MIT licence. Panel images use existing public portfolio assets. Monitor art is original decorative artwork; actual project screenshots appear in the Works panel.

See [implementation and owner workflow](../interactive-workspace.md) for module responsibilities, exact maintenance commands, data refresh behavior and asset regeneration.

## SEO preservation

The original title, every meta tag, canonical and JSON-LD were compared with the captured production baseline and are identical. Sitemap and robots files are byte-identical. All 20 original initial-HTML link destinations remain. Six shared section blocks match after normalizing React comments. One initial-HTML H1 reads **Cebu Web Developer & creative technologist.**; Classic retains **Cebu Web Developer**. The original introduction is visible below the office. All important destinations remain ordinary HTML links even without JavaScript.

`npm.cmd run audit:seo` checked 43 public pages with **0 errors**. The existing 73-character blog title produces one editorial warning. Admin routes retain noindex and stay outside the sitemap. No duplicate presentation URL, fictional schema or ranking guarantee was introduced.

## Production performance comparison

Both versions were production exports served by the same repository preview server at 127.0.0.1:3100. Lighthouse used the standard simulated desktop/mobile presets in installed headless Edge. The server serves uncompressed responses without production CDN caching. Each result is a lab sample, not field Core Web Vitals, and should not be interpreted as a guaranteed score. Existing Firebase refresh connections were unavailable in these browser sessions in both versions; the built public snapshots remained usable.

| Lighthouse | Before desktop | After desktop | Before mobile | After mobile |
| --- | ---: | ---: | ---: | ---: |
| Performance score | 93 | 90 | 70 | 68 |
| Accessibility score | 100 | 100 | 100 | 100 |
| SEO score | 100 | 100 | 100 | 100 |
| Best practices score | 96 | 96 | 96 | 96 |
| LCP (ms) | 1,642 | 1,956 | 6,648 | 6,908 |
| FCP (ms) | 485 | 483 | 1,954 | 2,255 |
| TBT (ms) | 13.5 | 15.5 | 249.5 | 267.5 |
| CLS | 0.0479 | 0.0045 | 0.0000 | 0.0000 |
| Total transfer, uncompressed local server (B) | 1,753,183 | 1,854,426 | 1,646,190 | 1,697,575 |

Desktop performance moved from 93 to 90 and mobile from 70 to 68 in these samples. Layout stability improved, while simulated mobile loading is still slow. This does not establish the requested good real-user LCP/INP thresholds. A compressed Firebase preview and physical-device measurements should precede performance sign-off. Shared critical CSS/fonts and existing live-content hydration remain worth profiling.

The after audit measures default arrival: the interactive preview/HTML layer. Live WebGL starts with exploration, so its startup cost is additional to those arrival metrics. Earlier automatic-start trials showed variable blocking, which motivated the intent-based policy. Scene construction now yields between groups/merges, compiles shaders asynchronously and can be cancelled.

| Unthrottled Edge observation | Before desktop | After desktop | Before mobile | After mobile |
| --- | ---: | ---: | ---: | ---: |
| LCP (ms) | 204 | 464 | 144 | 148 |
| CLS | 0.0351 | 0.0000 | 0.0960 | 0.0000 |
| Observed long-task blocking above 50 ms (ms) | 8 | 7 | 27 | 0 |
| Arrival JavaScript, decoded (B) | 1,212,047 | 1,221,922 | 1,212,047 | 1,221,922 |
| Same JavaScript, gzip estimate (B) | 369,670 | 373,271 | 369,670 | 373,271 |
| Requested image bytes (B) | 100,329 | 112,412 | 21,131 | 16,725 |

Those observations used 1672 × 941 and 390 × 844 contexts, device scale 1, navigation plus three seconds after network idle. Their long-task blocking column is an observation window, not Lighthouse TBT. JavaScript includes existing deferred Firebase requests. Gzip is computed from the downloaded build files. Both before and after had one H1 and no horizontal overflow.

AVIF previews measure **62,025 B desktop** and **14,638 B mobile**; WebP fallbacks are 133,212 B and 24,408 B. Only the selected viewport/format downloads. After engagement the renderer requires 588,321 B of additional JavaScript, approximately 150,186 B gzip. No external model or texture payload is required. The high-tier overview measured **86 draw calls**, 382,814 triangles and 14 textures. GPU geometry is generated locally and batched by material.

The renderer caps pixel ratio, uses one optional 1024px shadow map, downgrades sustained slow frames, renders on demand, pauses offscreen/in hidden tabs, and disposes its context/resources in Classic or on navigation. Native sampling found no WebGL during passive arrival. Raw numeric evidence is in [the metrics record](interactive-workspace-metrics.json); full local traces and baseline HTML remain in ignored `tmp/office/`.

## Accessibility, responsive and regression results

**26 production browser checks passed** in Edge. They cover passive arrival, all eight room panels, keyboard opening/closing, focus containment/restoration, camera reset, idle/offscreen behavior, simulated hidden-tab pausing, saved/blocked preferences, repeated mounting, cancellation during construction, context loss/retry, missing WebGL, failed renderer downloads, reduced motion and no-JavaScript navigation. Home did not fetch the Neon Dash engine, and a fresh About visit did not fetch office renderer chunks.

Scoped axe WCAG A/AA checks found **0 violations** for the desktop hero/header, Works dialog and mobile hero/header. Decorative canvas objects are hidden from assistive technology; the same eight HTML controls reflow into a grid on small screens. This is not a full WCAG conformance or screen-reader hardware audit.

Responsive checks passed at 320 × 844, 390 × 844, 768 × 1024, 1024 × 1024, 1440 × 1024 and 1672 × 941. Additional 844 × 390 landscape testing verified touch selection, panel scrolling and no horizontal overflow; 1920 × 1080 also had no overflow. These are emulated viewports/touch events, not physical phone tests. Firefox, Safari and a separate Chrome installation were not tested.

TypeScript, the production export, affected handbook/office/Pages/SEO tests and whitespace checks passed. The broad CJS run has **224 tests: 222 pass, 2 fail in unchanged code**. The failures are the job-feed salary-format expectation (en dash versus the current “to” wording) and the venture-admin test loader failing on an existing JSON import. Separate mocked live-SEO tests passed 3/3. No lint script is configured. Existing Works, project, venture, tool, game/progression, blog, mocked contact and admin/gate regression cases were included in the broad run. Real email delivery and authenticated production admin actions were not exercised; no authentication gate was bypassed.

## Actual implementation screenshots

- [Desktop, live scene, 1672 × 941](interactive-workspace-desktop.webp)
- [Works panel and focused camera](interactive-workspace-works.webp)
- [Mobile, 390 × 844](interactive-workspace-mobile.webp)
- [Tablet, 768 × 1024](interactive-workspace-tablet.webp)
- [Wide preview, 1920 × 1080](interactive-workspace-wide.webp)
- [Preserved Classic presentation](interactive-workspace-classic.webp)

## Known limits and next work

The scene is functional and detailed, but it does not match the reference's offline global illumination, bespoke furniture, organic foliage and character detail. A dedicated asset/material pass with baked lighting and optimized custom models is the clearest route toward that fidelity. Decorative screens could later use locally optimized public project textures; current project screenshots remain in the HTML panel. Environmental simulation and continuous character animation are not included.

Office panels/counts reflect the last successful public build; existing lower sections keep their live readers. Browser-local mode preference cannot change the server's initial HTML, so a saved Classic visit may still request the office preview before hydration. First live-renderer startup has a CPU/GPU cost. There is no real-user Core Web Vitals, INP or search-ranking evidence.

The build reports an existing Next.js security advisory. Dependency upgrades were deliberately outside this homepage change; resolve the advisory before release. The two existing test failures and remaining browser/device coverage also need maintenance. **Readiness: suitable for local functional/design review; full production performance/security sign-off remains conditional.**

## Rollback

Visitors can select Classic immediately. For a source rollback, revert this changeset and run the existing build/deployment workflow. A smaller rollback can replace the HomeExperience wrapper with its preserved Classic hero and remove the header mode/office branding additions. The [maintenance guide](../interactive-workspace.md#troubleshooting-and-rollback) describes that path. No URL, database record or game-save migration is involved.

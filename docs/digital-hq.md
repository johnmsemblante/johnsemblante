# John's Digital HQ — Phase 1

Reviewed 27 November 2026. Development on `feature/digital-hq-interactive-portfolio`. The owner authorized committing/pushing this branch and a separate test-channel deployment on 27 November 2026; main and live publication remain prohibited. See [preview workflow](digital-hq-preview.md) and [current handoff](handoffs/2026-11-27-digital-hq.md). The immediate scope is the visual foundation. Dedicated interactive content experiences, a production likeness and full release readiness belong to later phases.

## Branch preservation

The checkout was clean at `ed0020d`. All office work was already committed on `feature/interactive-office`, which remains intact. No new stash was needed; unrelated existing stashes were left alone. The new branch reuses the shared mode/content foundation while replacing the multi-room office. `main` remains production Classic. This change does not push or merge a branch.

## Audit and implementation plan

The application is Next.js 16.4.3, React 19 and TypeScript, with App Router, trailing slashes and static export in production. The installed Next.js client-component and lazy-loading guides were read before implementation. Existing Three.js 0.187.0 remains; React Three Fiber 9.8.2 was added for React 19 scene ownership. No competing animation or physics libraries were added.

The homepage is `src/app/(portfolio)/page.tsx`. Its Classic slot retains the original portrait hero, services, live work previews, tools, ventures, workflow, articles and FAQ. `SiteShell`, `PortfolioFrame`, `HeaderNavigation` and `SiteWordmark` provide shared chrome; only the root Interactive presentation omits header/footer/chat. The original logo is the existing `SiteWordmark` markup, `js.` with its teal dot, rather than a separate image asset. Both modes reuse that exact component; clicking it in HQ resets the camera. No generated logo is used on clothing or props.

Content and functional boundaries inspected:

| Destination | Existing source / implementation | Physical navigation object |
| --- | --- | --- |
| Works | `buildWorks`, project/industry catalogue, `/work/` and detail routes | Bevelled SD card |
| Skills | `profile.languages`, `skills`, `tools`, `/about/` | Dual monitors |
| Ventures | `buildVentures`, public venture store and existing venture routes | Rocket on a plinth |
| Blog | Source published posts and public snapshot; existing article route | Illuminated bookshelf |
| Tools | `publishedTools`, existing QR, startup calculator, image compressor and PDF editor | Digital toolbox |
| Games | Neon Dash registration and existing lazy game route | Arcade cabinet |
| Contact | Existing contact route, inquiry validation/submission and public email | Smartphone |
| About | Existing public profile and portrait references | Skinned figure and miniature city |

The inquiry backend, game engine/progression keys, donations, admin gate, Firebase rules and content publishing remain in their existing modules. No Digital HQ database collection or admin editor is introduced. No GA/GTM integration was found in the inspected source, so this phase adds no analytics provider or synthetic page views. Metadata helpers, homepage metadata/JSON-LD, sitemap, robots and canonical URLs are retained. GitHub publishing is still limited to main. Verification uses existing Node tests, TypeScript, static export, local Edge, axe and Lighthouse.

Implementation sequence: baseline build/SEO capture; preserve Classic; replace office with the Digital HQ scene and object catalogue; connect camera/HTML navigation and character loading; generate actual scene previews; verify responsive/fallback behavior; update both documentation collections.

## Scene architecture

`src/components/digital-hq/objects.ts` defines stable IDs, labels, canonical hrefs, source names, physical models/transforms, projected anchors, hover/selection intents, camera positions/targets and character actions. Nothing depends on an external asset host.

`environment.ts` creates an elliptical layered platform, custom bevelled curved desk, padded gaming chair, laptop, monitors, keyboard, mouse, lamp, coffee, books, plants, miniature city, rocket, SD card, shelf, toolbox, arcade and phone. Rounded/extruded geometry, seeded wood/screen textures and material batching provide the first art pass. The current background uses a locally hosted reference-derived room/city plate behind the transparent 3D canvas, with modeled hanging greenery and a real shadow receiver. See [background maintenance](digital-hq-background.md). `assets.ts` batches static parts and disposes shared GPU resources. `lighting.ts` supplies the same lighting to previews and the live scene; only the key casts shadows.

`canvas.tsx` uses React Three Fiber, a perspective camera, bounded drag/yaw and zoom, pointer parallax, raycast selection, small hover lifts/tilts and selection focus. No wheel handler captures page scrolling. `character.ts` handles local GLB loading, one mixer, named states, crossfades, interruption and return to idle. See [character requirements](digital-hq-character.md).

`home-experience.tsx` owns optional audio, fullscreen, HTML labels, native dialogs, focus restoration and fallback. Panels derive from `build-hq-content.ts`; they do not duplicate records or tool/form logic. In Phase 1, full content, tools, forms and Neon Dash open their original canonical pages. Their existing logo returns to HQ without changing the saved mode. Embedded experiences and history-aware section navigation are deferred.

## Loading and fallback

1. Initial HTML includes branding, verified professional positioning, one H1, an actual scene AVIF/WebP preview and eight real links.
2. Labels and panels work after hydration. Without JavaScript their hrefs reach the existing pages.
3. Interactive automatically loads the dynamic Canvas after hydration and mode resolution. There is no entry button or global loading wall. Remembered Classic visits and unrelated routes do not request the Fiber/Three.js renderer.
4. High/Medium/Low cap DPR at 1.5/1.2/1. Low omits shadows. Device constraints choose the initial tier; sustained slow CPU frame work can downgrade it. This heuristic is not a GPU benchmark.
5. Hidden/offscreen scenes stop scheduling. Low/reduced-motion scenes settle on demand. A visible animated rig keeps frames running only at higher tiers. No per-frame React state updates are used.
6. Initialization/context loss unmounts live rendering; preview, dialogs and Classic remain usable. Retry creates a fresh canvas. Unmounting cancels loading, removes observers/listeners, disposes buffers/textures/skeletons/animation bindings and releases the context.

Sound starts muted and uses short, original, gesture-triggered synthesized tones. It is locally remembered, suspends when hidden and closes when leaving HQ. Fullscreen failures retain the normal viewport. Mobile uses a center crop, automatic low-tier live 3D and a two-column touch grid; tablet uses four columns. Native modal focus containment, visible focus, Escape and real links support keyboard use. Reduced motion disables camera interpolation/parallax and character updates. Initial server HTML cannot read local storage and uses Interactive on this branch.

## Regenerate and verify

Use an already installed Playwright package; it is not a production dependency:

```powershell
node scripts/render-digital-hq-preview.cjs --playwright tmp/qr-test-tools/node_modules/playwright
npm run test:digital-hq
node --test tests/pages.test.cjs tests/seo.test.cjs tests/admin-documentation.test.cjs tests/admin-dashboard.test.cjs
npm run typecheck
npm run build:prepared
npm run preview
node scripts/check-digital-hq-browser.cjs --playwright tmp/qr-test-tools/node_modules/playwright --axe tmp/office/audit-tools/node_modules/axe-core/axe.min.js
```

Preview generation renders actual scene modules at 1920×1080 and 1000×720, writing AVIF/WebP variants under `public/images/digital-hq/`. `workspace*` omits the temporary character; `preview*` is development-only. Generated `tmp/digital-hq/scene-metadata.json` contains exact anchors and geometry counts. Regenerate after camera/model/lighting changes and synchronize the preview percentages in `objects.ts`. Development displays the temporary rig; ordinary static builds omit it. An explicit local preview build may set `NEXT_PUBLIC_DIGITAL_HQ_PREVIEW=true`; never publish that build.

The build needs network access for Google Fonts. `build:prepared` uses existing public snapshots; `npm run build` also refreshes public content. No private record is read or written for this feature. There is no standalone lint script; TypeScript and existing tests are used. See [current validation](review/digital-hq-background-autostart.md).

## Provenance, limits and next phase

Scene geometry, wood/screen textures and synthesized tones are original procedural assets authored here. The new background plate was generated with the built-in image tool from the supplied reference, with its foreground and text removed; provenance and the full prompt are in [background maintenance](digital-hq-background.md). No external furniture pack, portrait-generation service or runtime generation API is used. The attached mockup remains the visual reference for every enhancement. Existing portfolio images retain their existing ownership. Three.js and Fiber are MIT; transitive dependencies retain their distributed licenses.

This is a functional stylized foundation, not the reference's artist-rendered photorealism. Missing production assets include a likeness-approved rigged character, refined hair/skin/clothing and artist-led environment polish/baked lighting. The labeled temporary figure is excluded from ordinary builds. It supports seated idle, wave and introduction only. Typing, reading, drinking, stretching and blinking require actual supported clips; they are not faked or claimed.

Next: review the final GLB, align its seated pose/chair, validate animation support, then build dedicated section experiences and history. Before default production release, finish device performance, assistive-technology and browser compatibility reviews. Local Lighthouse does not measure field INP or guarantee search rankings.

## Rollback

Save work before switching. `git switch feature/interactive-office` restores the committed old concept; `git switch main` returns to production source. Existing stashes remain untouched. After committing, revert the new commit normally if needed; do not reset shared history or deploy stale `out/`. Browser preferences do not publish or roll back production.

# Read first: Digital HQ handoff — 27 November 2026

This is the continuation note for work on John's Digital HQ. Read this file before making the next enhancement. The checkpoint was written before the commit, branch push and test deployment requested by the owner; verification details are recorded at the end once those actions finish.

## Branch and release boundary

- Continue on `feature/digital-hq-interactive-portfolio` in `johnmsemblante/johnsemblante`.
- **Do not merge to main or deploy production.** The owner authorized committing/pushing this feature branch and deploying a separate test preview only.
- Production `johnsemblante.com` stays Classic from main. Its main-only publishing workflow must remain intact.
- The abandoned multi-room office remains committed on `feature/interactive-office` at `ed0020d`. It was already committed, with a clean starting checkout, so no new stash was needed. Existing unrelated stashes were untouched.

## What was completed today

1. Created the Digital HQ branch and replaced the old cutaway-office presentation with a character-centered workspace foundation.
2. Preserved the original Classic homepage JSX, public URLs, branding, content adapters, tools, game progression, contact behavior, donations and admin boundary.
3. Added a real Three.js/React Three Fiber scene: rounded illuminated platform, curved wood desk, gaming chair, laptop/monitors, keyboard/mouse, lamp, coffee, books, plants and eight navigation objects.
4. Connected Works to an SD card, Skills to monitors, Ventures to a rocket, Blog to a bookshelf, Tools to a toolbox, Games to an arcade cabinet, Contact to a phone, and About to the figure/miniature city. HTML labels, keyboard-accessible dialogs and real canonical links remain available.
5. Added bounded camera focus/rotation/zoom/reset, pointer parallax, basic object hover/selection, optional muted-by-default tones, fullscreen, Help, responsive framing, reduced motion and WebGL fallback.
6. Added a genuine temporary skinned character rig and local GLB/animation-loading architecture. Supported preview clips are seated idle, wave and introduction. It is **not an approved facial likeness**. Ordinary production builds omit it; development and explicitly configured preview builds show the notice identifying it as temporary.
7. Enhanced the background from the owner's attached mockup: dark studio wall, tall framed window, detailed violet/pink sunset city, hanging foliage, warm ceiling/baseboard light and room-floor atmosphere. The local background plate is combined with actual 3D foreground objects, modeled foliage and a shadow receiver.
8. Made live 3D start automatically after hydration in Interactive mode. Removed the Enter 3D workspace button. A saved Classic preference remains respected. A failure-only Retry 3D action remains.
9. Split construction into cancellable tasks between scene groups and detailed rows, and added asynchronous shader warmup. The static scene preview stays visible during startup. Hidden/offscreen rendering pauses; mobile/reduced-motion/data-saving configurations choose Low quality.
10. Updated the owner handbook and technical notes, generated actual scene previews and saved reviewed screenshots and measurements.
11. Wrote this cross-computer handoff before committing/pushing/deploying, added a guarded Firebase test-channel build/deploy command and a practical owner preview guide. Refreshed public content snapshots; 47 focused tests (including preview/publishing guards), TypeScript and whitespace checks passed before the commit.

## The visual reference is mandatory for every enhancement

Use the owner's full attached Digital HQ mockup as the primary reference for each future change. Match its composition, warm/cool lighting, dark room, city window, detailed props and character-centered focus. Keep the exact original `js.` wordmark, not the fictional mockup logo. Do not claim the current procedural foreground/temporary figure matches the reference's final asset quality.

The saved background source is a background-only derivative, not a replacement for the full mockup. Review the full mockup again for future character/furniture work.

## Start on another computer

Preserve any unrelated local work first. From this repository:

```powershell
git status --short
git fetch origin
git switch feature/digital-hq-interactive-portfolio
git pull --ff-only origin feature/digital-hq-interactive-portfolio
npm ci
```

On a new checkout, Git can create the local tracking branch from the single matching origin branch. If automatic tracking is unavailable, use `git switch --track origin/feature/digital-hq-interactive-portfolio` instead.

Use the Node 22 version used by this repository's CI, or another version verified against the installed Next.js package. Restore local configuration through the existing secure setup process; `.env.local`, credentials and `.generated/` snapshots are intentionally not committed. Never put credential values in this note or paste them into chat. Follow the repository setup documentation for required variable names.

With the public build configuration available:

```powershell
npm run sync:content
npm run dev
```

Open the localhost URL printed by Next.js. Choose Interactive once if this browser remembers Classic; 3D starts automatically. The public content sync restores admin-managed public snapshots on the new computer without copying private records. No production build is needed for ordinary local development.

Suggested instruction for the next assistant:

> Read AGENTS.md and docs/handoffs/2026-11-27-digital-hq.md, then the current Digital HQ maintenance/background/character guides. Continue on feature/digital-hq-interactive-portfolio. Use the attached Digital HQ mockup for every enhancement. Preserve Classic and production; do not merge or deploy main. Inspect the current worktree and latest handoff verification before changing files.

## Important files

| Responsibility | Location |
| --- | --- |
| Main architecture and workflow | `docs/digital-hq.md` |
| Background asset, full generation prompt and automatic startup | `docs/digital-hq-background.md` |
| Production character requirements | `docs/digital-hq-character.md` |
| Current validation and screenshots | `docs/review/digital-hq-background-autostart.md` |
| Earlier Phase 1 baseline | `docs/review/digital-hq-phase-1.md` |
| Scene and controls | `src/components/digital-hq/` |
| Public content adapter | `src/lib/build-hq-content.ts` |
| Original Classic slot and shared metadata | `src/app/(portfolio)/page.tsx` |
| Owner and technical handbook | `src/content/admin-documentation.ts`, `src/content/technical-documentation.ts` |
| Generated background source / runtime asset | `docs/assets/digital-hq/city-room-v1-source.png`, `public/images/digital-hq/city-room-v1.webp` |

`background-config.ts` contains only the local image URL so the HTML entry point does not import the renderer. `background.ts` contains additional foliage/shadow geometry. The city/window is a scenic matte; the foreground remains actual WebGL geometry. Essential assets are locally hosted.

## Validation at the visual checkpoint

- 37 focused Node tests passed; TypeScript passed; 15 exported browser checks passed.
- Automatic startup was verified at 1920×1080, 1440×900, 768×1024 and 390×844, with no entry button, horizontal overflow or overlapping labels.
- Keyboard/focus, Help, physical SD-card picking, camera controls, remembered Classic, renderer-core exclusion from fresh Classic/internal routes, repeated switches, context release/loss, fallback and cancellation during initialization passed.
- Zero uncaught application page errors and zero axe violations in the checked layouts/panel. A full assistive-technology audit remains future work.
- Static export compiled 62 pages. The existing Next.js security advisory sometimes makes the first build return nonzero; an unchanged retry completed with exit 0. Dependency remediation is still release work.
- SEO export audit: 43 public pages, zero errors, one existing article-title editorial warning. Homepage title/description/canonicals/social metadata/JSON-LD, sitemap URLs and robots were preserved. The H1 remains Cebu Web Developer.
- Latest automatic-start Lighthouse: desktop 99 performance / mobile 59; accessibility and SEO 100 in both. Desktop LCP ~482 ms, mobile ~8253 ms; TBT ~34 / 579 ms. These are local lab runs, not field Web Vitals. Mobile loading remains a production-release limitation.
- The broader earlier CJS run had 228/230 reported tests passing. Existing failures are the salary-format expectation in `job-feed-worker.test.cjs` and the JSON-import loader in `venture-admin.test.cjs`. Relevant source/tests were unchanged; they were not rewritten to conceal the failures.

Use the saved reports for exact metrics. The local static server's existing route-segment prefetch 404 appears in Lighthouse; it is separate from uncaught application errors.

## What remains / recommended next work

1. Continue targeted visual enhancements against the full reference. The foreground props, vegetation, materials and proportions remain a first procedural art pass.
2. Supply and approve the real portrait-based rigged GLB, refine likeness, align its seated pose/chair and validate actual supported animation clips. Do not fake typing, reading, coffee drinking or facial animation without authored clips.
3. Reduce mobile startup/bundle cost before production. Preserve automatic startup as the current owner preference; keep Low quality, reduced motion and functional fallback.
4. Build dedicated section experiences and history integration in later phases. Current Phase 1 panels link to existing full pages/tools/game; no business logic should be duplicated.
5. Resolve dependency/security and broader release checks before any future production approval.

## Test deployment and final verification

The owner authorized a separate test preview on 27 November 2026. The intended channel is `digital-hq` on the existing Firebase Hosting site. It must use the explicit preview-character flag and preview-only noindex headers. Main/production publication remains prohibited. The actual URL, source commit, expiry and verification receipt are added here after deployment succeeds.

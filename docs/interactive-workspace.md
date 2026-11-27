# Interactive homepage workspace

This guide describes the local `interactive-office-wip` preview. Production has been restored to the Classic portrait homepage from `main`; see [branch and release separation](production-classic.md). Keep office refinements local until the final design is approved.

In this local preview, the homepage opens as an isometric office. **Interactive / Classic** in the header switches presentation at `/`, without a reload or a second indexable URL. Classic preserves the portrait hero; services, works, tools, ventures, workflow, writing and questions remain shared.

## Owner workflow

1. Open Home and choose a room label, or a room button below the preview on a phone. On suitable desktops, moving the pointer inside the workspace or selecting a room starts the live renderer in an idle callback. The panel is available immediately and links to the existing destination, not a duplicate tool, game, contact form or portfolio.
2. Close the panel with its close button, Back to the workspace, Escape, or its backdrop. The overview returns and focus goes back to the invoking control.
3. On desktop, use the bottom-left buttons to rotate, zoom or reset. Ordinary page scrolling never zooms the camera. Quality offers High, Medium and Low.
4. Use Classic for the portrait presentation. The choice stays in this browser; clearing site data returns the default. If storage is blocked, the choice lasts for the current page session.
5. On phones, reduced-motion devices, data-saving connections and detected slow connections, the office preview loads with working room buttons. **Enable 3D view** explicitly opts into a low-quality live view. A graphics failure retains the preview and room navigation. Classic is also always available.

Home name, title and professional-title fields still use their existing Pages overrides. The existing introduction appears visibly beneath the office. The new room layout, visual copy, lighting, model, preview and quality policy are source-managed, outside admin Ventures and Pages. The original Classic hero keeps its other Pages fields. Portrait artwork does not control the office. If the live Pages refresh fails, Home shows its existing retry notice as an overlay, so it does not move the hero; other pages retain their existing notice placement.

Panels and counts are assembled at build time from `buildWorks`, `buildVentures`, the published tool registry, current profile, industry definitions and the homepage's existing latest-article selection. Their information is the latest successful build snapshot; it does not independently subscribe to Firestore. Publish through the existing workflow after content changes. The normal sections below the hero retain their existing live refresh behavior. The build currently contains 17 projects, three ventures, four tools and one game; these numbers are computed, not maintained in this document or duplicated in room configuration.

## Codebase audit and implementation plan

Audit before implementation identified Next.js 16.4.3, React 19.3.1, TypeScript, App Router and Firebase static export with trailing slashes. The homepage is a Server Component wrapped in the existing Pages content provider. The original portrait is a responsive static image. The shared SiteShell/HeaderNavigation owns navigation and theme preferences. Styling uses Tailwind plus CSS and existing light/dark custom properties. Three.js 0.187.0 and its types were already installed; no dependency was added.

Works and ventures merge source defaults with public build snapshots. Tools/games are source-managed in `src/config/tool-ventures.ts`. Blog previews combine published source articles with the public snapshot. Contact uses the existing Formspree integration. The admin dashboard uses its existing Firebase gate; the office introduces no authentication, collection, service or permission.

Metadata, canonicals, WebSite/Person structured data, robots and sitemap remain in their established modules. No GA/GTM implementation was found, so no tracking provider or invented events were introduced. Hosting remains the Firebase static export with the existing GitHub publishing workflow. There is no new host or paid service.

The implementation sequence was: record production baseline and HTML; preserve Classic as a server-rendered slot; add a client presentation controller and matching preview; build original batched procedural geometry; add camera/HTML room interactions; adapt mobile/quality/lifecycle; validate export, accessibility and existing features. The installed Next.js lazy-loading, server/client component and static-export guides were read before changes.

## Architecture and assets

- `src/components/office/home-experience.tsx`: presentation controller, delayed dynamic renderer import, preview, native modal dialog, accessible controls and fallback boundary.
- `src/components/office/mode.tsx`: validated browser preference and header switch. There are no URL changes or mode page views.
- `src/components/office/rooms.ts`: stable room identities, world anchors, destinations and initial capability policy.
- `src/lib/build-office-content.ts`: adapter over existing public data. Confidential experience is not turned into monitor screenshots or room records.
- `src/components/office/model.ts`: original architectural/furniture assets, seeded procedural wood/carpet/screen textures, baked local contact shadows and material batching.
- `src/components/office/renderer.ts`: orthographic camera, lights, projection/raycasting, on-demand scheduling, adaptive quality and disposal.
- `src/components/office/office.css`: scoped hero/header, panels and mobile layout. Other routes keep their existing presentation.
- `public/images/office/`: desktop and mobile AVIF previews with WebP fallbacks rendered from the same model and camera.

All office geometry, procedural textures and preview images were created for this repository. No external model pack, licence, attribution or runtime asset host is required. Three.js and its bundled geometry utilities retain their existing MIT licence. Project/venture/article images in panels use their existing public sources. Decorative monitor art is original; it is not presented as a client deliverable. There are no GLB downloads or game-engine imports on Home.

To regenerate previews after model, material or camera changes, use an installed Playwright package and Chromium browser:

```powershell
node scripts/render-office-preview.cjs --playwright <absolute-or-relative-playwright-package-directory>
```

On this checkout the existing test installation is `tmp/qr-test-tools/node_modules/playwright`. The helper defaults to installed Windows Edge; set `OFFICE_BROWSER` to the executable path on another machine. It serves a narrow local fixture, renders the same model, writes desktop/mobile AVIF and WebP files, prints anchor percentages and renderer counts, and closes its browser/server. Review `tmp/office/scene-desktop.png` and the full homepage. If room anchors changed, update `preview` percentages in `rooms.ts` from the helper output. The static-label manager accounts for cover-image cropping; live labels project directly from world anchors. The helper's files stay under ignored `tmp/`; it does not start a public preview route or change the sitemap.

## Performance and lifecycle

HTML, copy, links and preview render before the 3D engine. Suitable desktop browsers request the renderer in an idle callback after the visitor starts pointer exploration or selects a room. This is an intentional performance tradeoff: the default office presentation and room panels are interactive on arrival, while passive visits avoid WebGL startup. Enable 3D view also starts it explicitly. Construction yields between furniture groups and material merges, and shaders compile asynchronously. The matching preview is preloaded with a viewport media condition. Pending construction checks an abort signal when switching modes or leaving Home. The old portrait is not preloaded in Interactive Mode. Static/mobile/Classic and passive arrival sessions do not request the renderer. The scene contains no external model payload. The previews currently measure approximately 62 KB desktop and 15 KB mobile in AVIF, with 133 KB and 24 KB WebP fallbacks. Textured geometry is merged by material: the high-tier overview measured 86 draw calls and approximately 383,000 triangles, including decorative geometry. These are measurements of this original procedural scene, not a claim of visual parity with the reference's architectural render.

High uses one 1024px shadow map and caps device pixel ratio at 1.5; Medium disables that map and caps at 1.2; Low disables it and caps at 1. Nine sustained render frames over 48 ms cause a resolution/shadow downgrade. The camera renders only when a view, highlight, quality or layout changes. No perpetual animation loop runs. Intersection and document visibility pause updates outside the visible hero. Switching to Classic or leaving Home disconnects observers/listeners, cancels work and disposes model geometry, materials, textures, shadow resources and the WebGL context. A lost context returns to the preview.

## SEO, accessibility and regression verification

The original title, description, canonical, robots, social metadata and JSON-LD are preserved. One visible H1 retains Cebu Web Developer and adds the creative-technologist wording. Essential content and links stay in the initial HTML. The unchanged homepage sections share the same content sources and existing clean routes. Modes do not produce a duplicate URL. The default office and the original hero are rendered conditionally, so there are not two H1 elements in the document.

HTML labels, visible mobile room buttons, regular navigation and stats links supplement canvas picking. Panels use native `dialog` focus containment, Escape handling and focus restoration. Decorative canvas content is hidden from assistive technology. Reduced motion defaults to the static experience and suppresses camera interpolation when explicitly enabled. This does not assert a full WCAG conformance audit.

See `docs/review/interactive-workspace-validation.md` for measured production comparisons, browser evidence, regression checks and limitations. Real-user Core Web Vitals and search rankings require post-release field observation; no improvement or ranking guarantee is claimed.

## Troubleshooting and rollback

If 3D cannot start, explore the preview's room controls or choose Classic. If the preview and live view differ after an edit, regenerate all preview variants and check the CSS anchors. If panels show old records, confirm the normal public-content build/deployment completed. A managed Pages refresh warning is the existing content provider's separate network warning; public build content remains available.

The smallest source rollback is to replace the `HomeExperience` wrapper with its Classic hero in `src/app/(portfolio)/page.tsx`, remove the `HomeModeToggle` from HeaderNavigation, and remove the office brand span. Rebuild and deploy using the existing workflow. No URL, database record or game save needs migration. A visitor can use Classic immediately without any source rollback.

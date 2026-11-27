# Interactive homepage workspace

Reviewed 27 November 2026. This describes the feature/interactive-office development branch. Production remains Classic on main. Push/pull the feature branch to continue on another computer without publishing; see [branch setup and release separation](production-classic.md).

## Owner workflow

The homepage fills the screen with a cutaway office and uses rooms as navigation. The shared js. wordmark matches Classic. Interactive omits the conventional header, footer, theme switch, chat widget and lower homepage sections. The exterior basketball court, roads and cars are removed; interior recreation remains.

1. Select a floating room link on desktop or a link beneath the preview on a phone. Panel links open existing About, Works, Ventures, Tools, Neon Dash, Blog and Contact destinations. Modified clicks and no-JavaScript visits can follow the room anchors directly.
2. Close with the close button, Back to the workspace, Escape or backdrop. Focus returns to the invoking link. Destination pages retain their usual header and footer.
3. Mouse movement gently tilts live 3D; opening a room also tilts and focuses the camera. Bottom-right controls rotate, zoom, reset and select quality. Page scrolling never zooms the camera. Reduced motion suppresses tilt.
4. The top-right Interactive / Classic switch restores the complete portrait homepage, normal shell and lower sections at the same URL. The choice persists in this browser; blocked storage limits it to the page session.
5. Phones, reduced motion, data saving and detected slow connections start with a functional static preview. Enable 3D view opts into low-tier rendering. Graphics failures retain the preview and room links; Classic remains available.

Pages edits the name, title and professional title shared by both modes. The original introduction and remaining hero fields appear in Classic. Layout, lighting, preview and room definitions are source-managed. Portrait artwork does not control the office. A live Pages refresh failure retains the existing Home retry overlay.

Panels adapt published works, ventures, tool registry, profile, industries and selected latest articles from the last successful build snapshot. They do not independently subscribe to Firestore. Classic sections retain their live readers. Production content publishing still uses main, without releasing the feature branch.

## Architecture and assets

The stack is Next.js 16.4.3, React 19.3.1, TypeScript, App Router and Firebase static export with trailing slashes. Three.js 0.187.0 was already installed; no dependency or hosting provider was added. Installed Next.js lazy-loading and server/client guides were read before this revision.

- src/components/portfolio-frame.tsx mounts the conventional shell only in Classic or on destination pages.
- src/components/site-wordmark.tsx shares logo markup between modes.
- src/components/office/home-experience.tsx owns the delayed renderer, preview, real HTML room anchors, modal and fallback. mode.tsx stores a validated browser preference without URL changes.
- rooms.ts defines identities, world/static anchors, overview framing, bounded tilt and initial capability policy.
- src/lib/build-office-content.ts adapts existing public sources. Confidential work is not converted into monitor art.
- model.ts and renderer.ts build original furniture/textures, batch geometry, project anchors, pick rooms, move the camera and manage on-demand rendering/disposal.
- office.css supplies the immersive layout and smaller-screen link grids. public/images/office contains matching AVIF and WebP previews.

All office geometry, procedural screen art and previews were created for this repository. No external model pack, attribution or runtime asset host is required. Existing Three.js MIT licensing applies; panel images retain their public sources. Home imports no game engine or GLB. Authentication, contact integration, records and game saves are unchanged.

## Regenerate and verify

~~~powershell
node scripts/render-office-preview.cjs --playwright <playwright-package-directory>
node scripts/check-office-browser.cjs --playwright <playwright-package-directory> --url http://localhost:3000 --axe <axe.min.js>
~~~

This checkout has Playwright at tmp/qr-test-tools/node_modules/playwright and axe at tmp/office/audit-tools/node_modules/axe-core/axe.min.js. Helpers default to Windows Edge; set OFFICE_BROWSER on another machine. These ignored installations are test tools, not production dependencies.

The preview helper serves a local fixture, writes four images and prints anchors/counts, then closes its browser/server. Inspect tmp/office/scene-desktop.png and full homepage screenshots. Copy changed percentages to rooms.ts. Static desktop labels account for cover cropping; below 1100px the links use a grid and images use contain. Live desktop links project from world anchors.

Run office, Pages, SEO and handbook tests plus TypeScript during development. Before approved release, run the established production export and release audit. No production build or deployment was run for this revision. See the [27 November check record](review/interactive-office-immersive.md). The [26 November baseline](review/interactive-workspace-validation.md) is historical and describes the previous layout.

## Performance and accessibility

HTML headings, destination anchors and preview arrive before the engine. Passive visits avoid GPU startup. Desktop exploration or room selection starts the dynamic renderer in an idle callback; explicit enablement also works. Construction yields between groups and shaders compile asynchronously. Pending work aborts on mode/route changes. Classic and static sessions skip renderer downloads.

Desktop/mobile previews measure approximately 43/12 KB AVIF and 92/22 KB WebP. The high-tier overview measured 75 draw calls, 267,508 triangles and 13 textures. These are local renderer measurements, not production Core Web Vitals or a claim of reference-render parity.

High caps DPR at 1.5 with one 1024px shadow map; Medium caps at 1.2 without that map; Low caps at 1. Slow frames downgrade quality. Rendering stops after camera/tilt settles and pauses when hidden. Cleanup removes listeners/observers, cancels work, disposes GPU resources and releases the context. Context loss retains the preview.

Native dialogs contain focus, support Escape and restore focus. Canvas is decorative and hidden from assistive technology. Links work without WebGL or JavaScript. Reduced motion starts static and disables tilt/interpolation if live rendering is enabled. Scoped automated WCAG checks supplement keyboard review; they are not a full conformance audit.

## Search and troubleshooting

Metadata, canonical, JSON-LD, robots and sitemap remain shared at /. Each mode has one Cebu Web Developer H1. Interactive initial HTML contains compact identity and room links. The long introduction and traditional sections now render only in Classic at the owner's request, changing content exposure from the previous design. Check the final export and search implications before release; no ranking guarantee is claimed.

If 3D fails, use preview links or Classic. If preview/live framing differs, regenerate every variant and anchors. If cards look old, check the public snapshot used locally; do not deploy this branch to refresh production. Check the shared preference and PortfolioFrame when diagnosing shell/mode behavior. Follow the branch guide before any production restoration or release.

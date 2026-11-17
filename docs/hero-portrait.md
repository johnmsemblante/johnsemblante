# Homepage portrait

The homepage hero places a large graphite portrait between the introduction and supporting copy. Existing `home_1` through `home_7` and button destination keys are preserved. Retired Home `browser_illustration` fields are removed from the editor catalog only; saved records are not rewritten. Work and Ventures retain their illustrations. Supporting labels and experience copy are code-managed.

## Asset and limitations

`public/images/profile/john-hero-graphite.webp` is a 1000 × 1250 transparent WebP (about 281 KiB), generated using the built-in image generation tool from `john-doodle-sketch.webp`. Prompt: front-facing, recognizable graphite head-and-shoulders bust, neutral gaze, gray blazer, soft studio lighting, transparent background, no text. The original is preserved. This artwork was optimized with Sharp; no runtime image-generation service is used.

The active portrait remains a single-view depth reconstruction, not an anatomically scanned or fully rigged head. The unseen sides and back are absent. Do not increase its turning angles to simulate profile or 360-degree rotation. A full GLB renderer is prepared but disabled (`src/content/hero-portrait.json` has `modelUrl: null`). The free TRELLIS.2 attempt produced previews on 16 November 2026, but its export hit the anonymous GPU quota. No downloaded portrait GLB was found on 17 November. Activation and real-model visual review remain pending.

## Rendering and interaction

`portrait-model.ts` fits a static depth surface to the artwork. `portrait-renderer.ts` rotates the entire head rigidly around a lower neck pivot; only the neck (texture y 0.74–0.87) blends to stationary shoulders. Orthographic projection preserves the source silhouette and facial proportions at rest. Yaw is limited to 0.15 radians (8.6 degrees); pitch to 0.065 radians (3.7 degrees). UVs stay fixed: there is no pupil warping or fake skin-based blinking. Relative lighting is deliberately slight.

`HeroPortrait` dynamically loads the WebGL renderer only with a fine hover pointer, motion allowed, and a visible portrait. Cursor targeting uses a stable layout rectangle and bounded angular mapping. A critically damped response smooths motion without continuous spring oscillation. Scroll and resize recalculate the target; leaving the browser or losing focus resets it. Keyboard focus on hero links also sets a target. Animation frames stop when settled, offscreen or hidden. ResizeObserver redraws a settled canvas after size changes. Pixel density is capped at 1.75.

The high-priority semantic image remains the static/no-JS fallback. The caption and Pause/Resume control were removed at the owner's request on 17 November 2026. There is no empty caption area; reduced-motion settings remain the way to disable the effect. Reduced motion and coarse pointers do not load WebGL. Context loss, decode failure or initialization errors return to the image. Listeners, observers, animation requests and GPU allocations are cleaned up on unmount. No pointer telemetry, camera access, storage or generation backend is added. Three.js and its types support the optional GLB path; its runtime is dynamically imported only when a model is configured and animation is eligible.

## Free model workflow

1. Sign in at [Hugging Face](https://huggingface.co/login) and open [Microsoft TRELLIS.2](https://huggingface.co/spaces/microsoft/TRELLIS.2).
2. Upload `public/images/profile/john-hero-graphite.webp`. Use a single object image, not the turnaround sheet. Select Resolution **1024**, Decimation Target **100000**, Texture Size **2048**.
3. Choose **Generate** once; review front and side previews. Choose **Extract GLB**, then **Download GLB**. These are separate GPU operations; preview generation does not guarantee remaining export quota. Follow the service's sign-in/reset instructions instead of repeatedly submitting.
4. On `site_enhancement`, run `npm run portrait:import -- "C:\path\to\download.glb"`. The importer validates GLB headers, binary bounds, embedded textures, supported required extensions, unrigged triangle meshes, a 150,000-triangle ceiling and a 12 MiB ceiling before writing. It saves a content-addressed model under `public/models/portrait/` and sets `modelUrl` in `src/content/hero-portrait.json`. This enables local preview, not deployment or likeness approval.
5. Start `npm run dev -- --port 3101`. Adjust `rotation` (XYZ radians) in the JSON so the model is upright and facing +Z. Calibrate the neck transition/pivot in `portrait-rig.ts` against the actual mesh. Review the face at rest and all cursor extremes; shoulders must remain fixed and facial proportions rigid.
6. Run `npm run test:portrait`, relevant Pages/SEO/admin tests, TypeScript and the build. Review desktop, mobile, reduced motion, keyboard links, scrolling, resizing and failed model loading before release. Visitors need no generation credentials, Hugging Face quota or fal credits.

The optional GLB renderer centers the mesh and normalizes its height to 2.2 units. Two bones keep the torso fixed and rotate the head; weights blend only between heights -0.64 and -0.32, around pivot `(0, -0.48, 0)`. Limits are 22.5 degrees yaw and 7.5 degrees pitch. These provisional values require visual fitting to the exported portrait. There is no independent eye or mouth animation.

Rendering uses orthographic framing, soft lights, sRGB output and ACES tone mapping. Fetches abort on ineligibility/unmount; completed stale loads dispose their resources. Geometry, materials, textures, skeleton textures and image bitmaps are released on disposal. Textures must be embedded; external runtime texture URLs are rejected.

For rollback, set `modelUrl` to `null` and rebuild. This restores the prior shallow surface; the static fallback remains the graphite image. Keep the GLB for later review.

## Validation status

Release preparation on 17 November 2026: removed the entire caption and Pause control, including their state and CSS. The 37 portrait, Pages, SEO, handbook, dashboard and publishing checks passed. A full `npm run build` refreshed public content and exported 56 pages. Exported HTML confirms the portrait asset is present and caption/control markup is absent. The full GLB remains disabled. The build reported a moderate Next.js cache advisory; this static export does not use the named `unstable_cache`/`use cache` APIs. A separate dependency update is recommended.

On 17 November 2026, all six portrait tests and TypeScript passed, and `npm run build:prepared` exported all 56 pages using existing content snapshots. Import tests use a synthetic triangle GLB parsed by the actual GLTFLoader plus invalid-format/resource/budget cases. These checks do not establish real-portrait visual quality. The release build must still sync current content; no deployment was run.

## Maintenance and preview

Keep artwork, landmarks, neck weighting and depth geometry together when replacing the portrait. Pages controls the existing main hero copy, not the fitted portrait. Keep the owner's other portrait slots separate. Update the Pages handbook and this note with behavior changes.

The current shallow portrait is the approved release; the experimental full GLB remains disabled. Development was prepared on `site_enhancement` for merge into `main`. Preview with `npm run dev -- --port 3101`; inspect both extreme pointer directions, neck/shoulder stability, keyboard links, scrolling, resizing, reduced motion and touch. Run the portrait, Pages, homepage, SEO and admin documentation tests, TypeScript and `npm run build`. Use the existing `main` push workflow for the owner-authorized production deployment. Commit or stash branch changes before switching to `main`, because uncommitted files can follow a branch switch.

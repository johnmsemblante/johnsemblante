# Digital HQ background and automatic startup

Reviewed 27 November 2026. Development remains on `feature/digital-hq-interactive-portfolio`; no deployment is authorized.

## Art direction for every enhancement

The owner's attached Digital HQ mockup remains the primary visual reference for every enhancement. Follow its dark studio interior, tall steel-framed city window, violet/pink sunset, amber lighting, hanging tropical greenery and balanced character-centered composition. Keep the original portfolio wordmark rather than replacing it with the mockup's fictional logo. Improve one requested area at a time; the character likeness and foreground asset refinement remain separate work.

This enhancement replaces the previous flat procedural skyline/wall with a local reference-derived architectural background plate. The supplied mockup was edited with the built-in image generation tool to remove its people, foreground furniture, navigation graphics and lettering, retaining and extending the room/city atmosphere. This is a distant background layer behind the independently rendered workspace. No external runtime image service or new package is required.

## Assets and composition

- Selected generated source: `docs/assets/digital-hq/city-room-v1-source.png`.
- Optimized runtime plate: `public/images/digital-hq/city-room-v1.webp`.
- URL definition: `src/components/digital-hq/background-config.ts`. It contains only the URL so the HTML entry point does not import Three.js.
- Curved, veined 3D hanging foliage, rear accent lighting and floor shadow receiver: `background.ts`, attached through `environment.ts`.
- Shared warm/cool scene lighting: `lighting.ts`.
- Live Canvas uses a transparent clear color; the local plate is painted behind it by the visual container. The window/city is a scenic matte, while workspace objects, character and additional foliage remain WebGL geometry.

Both the rendered loading previews and the live composition use the same plate and lighting. The obsolete modeled window, simple skyline, repeated oval vines and opaque tile floor were removed. The transparent shadow receiver grounds the platform on the illustrated room floor. On smaller screens the scene retains its dedicated framing and navigation grid; the intro stays above the visual area.

## Automatic live 3D

Interactive starts the dynamically imported Canvas automatically after hydration. A zero-delay scheduled task lets the remembered Classic mode resolve first and cancels when the HQ unmounts. The **Enter 3D workspace** button is removed. Loading progress appears as status text; camera controls appear when the first scene frame is ready. The preview stays visible throughout startup. Geometry construction yields between furniture groups, keyboard rows and shelf rows, and shaders compile asynchronously before the live scene is revealed. Switching to Classic cancels pending construction and releases its resources.

First-time visitors still default to Interactive. A deliberately saved Classic choice remains respected; choosing Interactive then starts 3D automatically too. Classic and unrelated routes should not request the renderer. The original mode storage key and game/form storage are unchanged.

Mobile, reduced-motion, Save Data and detected slow connections choose Low quality rather than requiring manual activation. Reduced motion suppresses camera easing/parallax and character animation. High/Medium retain their existing resolution caps and live character behavior. Hidden/offscreen rendering still pauses.

If WebGL fails or startup exceeds 25 seconds while visible, the live Canvas unmounts and the preview, links, section panels and Classic remain available. Only that failure state offers **Retry 3D**. The startup timeout pauses while the tab or visual area is hidden. It does not repeatedly retry automatically.

## Maintain and verify

1. Use the original mockup as the continuing visual reference. For a background revision, retain an original source and generate a new versioned runtime asset. Keep foreground navigation/branding out of the background image.
2. Update `background-config.ts` if the runtime filename changes. Keep it free of renderer imports so Classic stays lightweight.
3. Regenerate both ordinary and development previews with `scripts/render-digital-hq-preview.cjs`. The utility serves the local background and captures the transparent scene over it.
4. Run the feature, Pages, SEO and handbook tests, TypeScript, static export and the updated browser suite. Verify automatic arrival at all four viewport sizes, no entry button, remembered Classic, cleanup, reduced motion, WebGL failure and retry.
5. Compare current performance separately from the original manually activated Phase 1 baseline: automatic mode intentionally loads the engine on arrival. Do not describe the old passive-arrival measurements as current startup measurements.

See [enhancement validation](review/digital-hq-background-autostart.md). The original [Phase 1 report](review/digital-hq-phase-1.md) remains a historical baseline.

## Generation recipe

Mode: built-in `image_gen.imagegen`, editing the latest owner-supplied mockup as the sole reference, opaque background. The source output was copied into this workspace and optimized to WebP with Sharp. No CLI/API fallback was used.

Final prompt:

> Use case: precise-object-edit. Asset type: background-only plate for a real interactive 3D portfolio room. Edit the attached Digital HQ reference image to isolate and extend ONLY its architectural background. Preserve its premium cinematic stylized 3D-rendered atmosphere: dark navy/slate studio walls at left and right, a huge tall black steel mullioned window primarily in the central/right two thirds, a richly detailed distant Cebu-inspired city skyline at dusk, layered towers with glowing amber/cyan/lavender windows, pink-orange sunset at the horizon, deep violet clouds overhead, tasteful hanging tropical foliage framing upper corners, a slim warm amber ceiling strip. Eye-level camera, nearly frontal, wide landscape 16:9. Remove ALL foreground content: remove man, desk, platform, chair, laptop, monitors, SD card, rocket, bookshelf/books, toolbox, arcade, smartphone, coffee, plants sitting on desk, all floating labels, all UI, all writing, all logos. Fill their former areas with continuous background architecture, distant skyline, and a dark understated room floor along the bottom 10 percent. Keep the center lower area visually calm and unobstructed so independently rendered 3D furniture can sit in front. No people, furniture, interface graphics, lettering, logos or watermark anywhere. This is only an atmospheric background layer; the real workspace will be rendered separately in WebGL. High-quality environment artwork, believable materials, warm/cool lighting balance matching the reference. Deliver a clean high-resolution landscape background plate.

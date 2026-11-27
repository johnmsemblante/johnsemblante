# Digital HQ character asset contract

Reviewed 27 November 2026. No production character GLB is supplied. `public/images/profile/john-home-black-smile.webp` is the existing identity reference inspected for Phase 1. A portrait does not automatically produce a rig and is never used as the final character billboard.

The temporary procedural figure has a real Three.js Skeleton and rigid-weight SkinnedMesh segments. It demonstrates model lifetime, seated idle, wave and introduction. Dark clothing, curly hair and chin hair are reference cues, not an approved likeness. Its visible notice identifies that limitation. Ordinary production builds omit this rig and select the matching empty-chair preview.

## Deliver to the developer

- An optimized binary glTF 2.0 `.glb` under `public/models/digital-hq/`, with all textures and clips embedded. External buffers/textures are outside the supported contract.
- An original or licensed adult character matching John's facial proportions, skin tone, curly black hair and chin beard. Review front, three-quarter and profile renders with John before marking likeness complete.
- A consistent humanoid skeleton, skinned meshes, Y-up, +Z facing and neutral transforms. Supply a natural seated rest pose. The loader normalizes bounding height to configured scene units; verify alignment because standing and seated bounds differ.
- Black hoodie, dark trousers, sneakers, neck headphones and optional watch. Use the official logo only with suitable supplied artwork; omit rather than invent lettering. The page already reuses the original wordmark component.
- A seamless `SeatedIdle` clip. Optional exact names: `Wave`, `Introduce`, `Typing`, `Read`, `Point`, `Game`, `LookPhone`. Map alternatives in `character-config.ts`. Blinking/expressions need actual rig or morph-target clips; this phase does not synthesize them.
- Artist/source, commercial portfolio permission, license, attribution and modification notes. Do not include unlicensed models/textures.

Start with a character transfer target of 0.5–1.5 MB and initial combined 3D asset transfer near 3 MB, excluding renderer code. These are targets, not measured GLB results: no final GLB exists. Prefer restrained polygon counts, a texture atlas and 1K maps where sufficient. The loader supports ordinary embedded GLB. Draco, Meshopt and KTX2 decoders are not configured; add and test local support before using those encodings.

## Integrate

1. Add the licensed file and set `characterConfig.modelUrl` to `/models/digital-hq/<name>.glb`. Adjust height/rotation and named clips.
2. Remove the preview flag from release builds. A configured GLB takes precedence even in development; failure shows the workspace with a status notice rather than silently substituting the temporary rig.
3. Verify success/failure, invalid URLs, cancellation during Classic switching, bounds, skinning, seated alignment, crossfades, interruption and idle return. Unsupported actions must use real idle.
4. Check About selection by keyboard and character raycasting, reduced motion and hidden-tab behavior.
5. Extend preview generation to load the approved GLB, then regenerate production/development images from its actual pose. Currently `workspace*` deliberately has no character and `preview*` uses the temporary rig.

Production likeness, typing, coffee drinking and a facial rig remain future asset work. No such result is claimed by Phase 1.

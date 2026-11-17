# Full head model preparation

Updated 17 November 2026 on `site_enhancement`.

## Current state

The owner selected the free [Microsoft TRELLIS.2 demo](https://huggingface.co/spaces/microsoft/TRELLIS.2). On 16 November its public Gradio API generated multi-angle previews, but the separate GLB extraction was refused by the anonymous ZeroGPU quota. The owner subsequently signed in; browser automation did not complete the upload/export. No downloaded portrait GLB was found on 17 November. The local model renderer is prepared but disabled with `modelUrl: null` in `src/content/hero-portrait.json`.

The earlier fal attempt stopped at billing-blocked upload initiation. No fal generation was submitted. Paid credits are not required for the selected free workflow.

## Generation provenance

Input: `public/images/profile/john-hero-graphite.webp`, the full-size transparent portrait. Endpoint: `https://microsoft-trellis-2.hf.space`, Gradio `image_to_3d`, seed **104729**, resolution **1024**. Sparse guidance/rescale/steps/rescale-t: **7.5 / 0.7 / 12 / 5**; shape: **7.5 / 0.5 / 12 / 3**; texture: **1 / 0 / 12 / 3**. The rejected export requested **100000** triangles and **2048** texture size. The free demo's minimum export target differs from fal's planned settings.

Ignored `tmp/portrait/` contains the preview response and extracted render images. These are not meshes and are not used by the website. Ignored `tmp/portrait-tools/` contains the temporary Gradio client and attempt script. Do not rerun that script to recover an expired session or evade quota. Follow the signed-in demo's allowance/reset instructions; generation and extraction are separate GPU operations.

## Complete the export

Use the signed-in demo with the same front portrait. Select Resolution **1024**, Decimation Target **100000**, Texture Size **2048**. Choose **Generate**, review, **Extract GLB**, then **Download GLB**. Keep the session open until download completes. Follow [the local import and review steps](../hero-portrait.md#free-model-workflow). Actual model orientation, front likeness, side texture seams, neck weighting and browser performance require review before release.

## Turnaround reference

`john-turnaround-reference.png` is an AI-generated visual reference from 16 November, not a 3D model. It shows inferred left profile, left three-quarter, front and right profile. The built-in image tool generated it from the graphite portrait, requesting consistent rounded face, curly hair, broad nose, subtle moustache, longer goatee and even lighting. Side anatomy and likeness are unverified. Do not feed this multi-head sheet to a single-object image-to-3D generator; use the front portrait as the identity source. The sheet is not loaded by the site.

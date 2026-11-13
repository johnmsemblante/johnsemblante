# Visual direction

Homepage portrait review, 13 November 2026: the original homepage browser illustration uses the transparent doodle sketch portrait. Its portrait frame has no background fill, so transparent image areas show the browser canvas without a white rectangle. The original hero copy and layout remain in place; the broader doodle/preloader experiment is parked in a local Git stash. Replacing this portrait in Pages should use an image with genuine transparency if the same appearance is wanted.

The lower homepage About section now reuses `public/images/profile/john-doodle-sketch.webp` (640 x 827). The About page uses its own transparent graphite sketch of the gray-blazer pose, `public/images/profile/john-about-doodle-sketch.webp` (768 x 1152), preserving the smile and hands. The original photographs remain available. All three portrait fields remain independently editable through Pages; their defaults and description keys in `src/content/page-fields.json` match the new image paths. Dimensions reserve each asset's space, and the existing responsive layouts remain in place. These portrait updates use the existing static build and publishing workflow; the separate scroll-reveal experiment is confined to doodle_theme.

All three displayed sketches have transparent image backgrounds and use multiply blending on the existing light canvas. This lets pale paper tones within the artwork blend into the site background while retaining graphite lines. The homepage hero frame remains transparent. This presentation is intended for the current light theme; review blending if a dark theme or colored portrait backgrounds are introduced. New replacement photos in these same slots inherit the blending, so check their appearance after a Pages image change.

The About sketch was created using the built-in imagegen tool. Prompt: convert the existing About photo into a realistic graphite doodle portrait matching the homepage sketch; preserve facial identity, smile, gray checked blazer, white shirt, pose and hands; use expressive outlines and sparse crosshatching on a truly transparent background. A follow-up edit requested removal of the surrounding haze while retaining fine pencil edges. The generated PNG's alpha was preserved when resizing and encoding to WebP.

Chosen after John preferred Adham Dannaway’s portfolio and authorized moving forward with a simpler interpretation.

Use a prominent personal introduction, a two-part developer / entrepreneur composition, restrained black-and-white framing, and generous space. The career portfolio leads; ventures follow with independent brand palettes. Use an original typographic monogram until a real portrait is supplied. Do not copy reference artwork, source, or personal content.

The split composition collapses into a readable vertical sequence on mobile. Keep links permanently visible, avoid hover-only content, honor reduced motion, and use server-rendered content. Project cards must contain verified projects; keep an honest empty state until supplied.

References: https://www.adhamdannaway.com/ (personal introduction and hierarchy), https://brittanychiang.com/ (career clarity), https://paco.me/ (restraint).

The actual four wireframe images were subsequently inspected through the user's shared ChatGPT link. The user authorized adopting their page concepts while preserving these fonts and colors. The newer hero and section structure is documented in `review/wireframe-implementation.md` and supersedes the original split introduction.

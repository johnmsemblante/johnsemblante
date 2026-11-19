# Homepage portrait

The hero uses the transparent 640 ? 827 `public/images/profile/john-doodle-sketch.webp`, also used by default in the lower Home About section. Its canvas shares the image proportions and the existing hero footprint.

## Pencil drawing

On each homepage mount, the moving pencil traces the hair, facial features and jacket. Short, overlapping shading passes reveal the original graphite texture. The pencil lifts away and the full-resolution source image takes over. Move the portrait out of view or switch tabs to pause the drawing. Return to resume. After completion it stays still until the next homepage mount. Reduced motion presents the finished portrait immediately.

The opening builds the eyes, brows and nose first, then the hair and jaw in shorter passes. A local contrast filter extracts pencil marks from the source sketch. The contour paths and shading regions in `src/lib/portrait-sketch.ts` use the source image coordinates. Tune contour speed, shading-pass duration, pencil appearance and final blend there. If the source changes, review stroke alignment with the eyes, mouth, hairline and lapels. The renderer loads on demand after image decode. The image also serves as the fallback for missing canvas support or JavaScript.

## Portfolio cursor

The public portfolio uses a black dot and trailing ring for desktop mouse input. The ring expands over links. The dot and ring stay visible over the portrait during drawing and after completion. Form fields, touch, forced colours and reduced motion retain native pointer behaviour.

## Comparing versions locally

With a clean checkout, use `git switch particle_effect` to preview the saved interactive particle portrait or `git switch sketch_effect` for the drawing. Rebuild when comparing static exports.

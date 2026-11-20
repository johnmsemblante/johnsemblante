# Homepage portrait

## Particle formation and reveal

The hero uses the existing transparent `/images/profile/john-doodle-sketch.webp` artwork. The portrait has 25px vertical margins. Its layout discounts the transparent rows above the hair so the gap is measured from the visible sketch. Reload Home to replay the roughly four-second formation. After the particles settle, the entire graphite sketch fades in and stays visible on desktop and touch devices. Reduced motion, disabled JavaScript and unavailable canvas show the source sketch.

The renderer in `src/lib/portrait-particles.ts` uses Canvas 2D. It scales grain area by pixel opacity and samples the sketch at jittered intervals, groups the grains by brightness and distributes them across a transparent canvas covering the hero. Some grains are visible from the first frame. The rest gain opacity as they gather toward the portrait on overlapping paths. Nearby sketch samples start in overlapping wisps with feathered tails that can extend beyond the canvas. Their staggered arrival lets individual features emerge while other grains are still moving. During the second half of assembly, the target scales from 89% to its final size around the image center. A ResizeObserver maps the destination pixels to the displayed image after layout changes. On motion-enabled visits, CSS hides the source image from first paint while the renderer loads. The final frame triggers an 850ms crossfade from canvas to the original image. Renderer initialization failures select the static fallback. The component pauses offscreen or in a hidden tab and disposes its listeners on unmount. Change the sampling step for density, FORMATION_MS for assembly timing and the CSS opacity transition for the final reveal. Use a transparent portrait in the same aspect ratio when replacing the source.

## Site-wide cursor

The root layout, shared by the main portfolio, venture pages, tools and dashboard, provides a black dot and trailing ring for desktop mouse input. The ring expands over links. The dot and ring stay visible over the portrait during formation and after completion. Form fields, touch, forced colours and reduced motion retain native pointer behaviour.

## Comparing versions locally

With a clean checkout, use `git switch particle_effect` to preview the particle formation or `git switch sketch_effect` for the drawing. Rebuild when comparing static exports.

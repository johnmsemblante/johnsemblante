# Homepage portrait

## Particle formation and hover

On the particle_effect branch the hero uses a transparent cutout derived from the existing john-enhanced.webp photograph. The lower Home About portrait remains independently editable. Reload Home to replay the roughly four-second formation. On desktop, move over a feature to reveal its original colour and detail, then move away to return to the point portrait. Touch devices show the formation. Reduced motion, disabled JavaScript and unavailable canvas show the source photograph.

The renderer in `src/lib/portrait-particles.ts` uses Canvas 2D. It samples opaque pixels at jittered intervals, groups the grains by brightness and places them in an irregular band. Staggered eased paths carry them to their sampled coordinates. The settled point field is cached. A feathered brush composites the matching area of the photograph as the pointer moves. The component pauses offscreen or in a hidden tab and disposes its listeners on unmount. Change the sampling step for density, FORMATION_MS for timing and the brush gradients for reveal size. Use a transparent portrait in the same aspect ratio when replacing the source.

## Site-wide cursor

The root layout, shared by the main portfolio, venture pages, tools and dashboard, provides a black dot and trailing ring for desktop mouse input. The ring expands over links. The dot and ring stay visible over the portrait during formation and after completion. Form fields, touch, forced colours and reduced motion retain native pointer behaviour.

## Comparing versions locally

With a clean checkout, use `git switch particle_effect` to preview the saved interactive particle portrait or `git switch sketch_effect` for the drawing. Rebuild when comparing static exports.

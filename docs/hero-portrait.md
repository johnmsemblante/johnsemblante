# Homepage portrait

The homepage hero uses the existing transparent 1000 × 1250 `public/images/profile/john-hero-graphite.webp` between the introduction and supporting copy. The hero portrait is managed in code. Pages provides the existing Home copy, location and button fields plus a separate image field for the lower Home About section.

## Particle dispersion

The viewer-left hair, face and jacket stay intact. A ragged fracture runs through the viewer-right forehead, cheek and shoulder, shedding angular fragments into fine dust. Dust thins toward the upper right, with smaller, fainter grains farther from their source. The full-resolution image keeps the facial features sharp. Move the mouse along the hair or shoulders to push dust away, then move away and watch it settle. On a tablet the renderer uses fewer particles and less force. Phones at 760 CSS pixels or narrower and visitors with reduced motion see the original image.

The client component loads the Canvas 2D renderer after the image decodes and the portrait enters view. A grain-textured alpha mask uses a curved boundary and several scales of noise to define the breakup. Particles sample colour from visible pixels in the eroded region and use spring motion to return to their scattered resting positions. Pointer displacement lifts fragments diagonally and reduces opacity until they settle. The renderer sleeps at rest, offscreen and in hidden tabs. If rendering is unavailable the portrait remains visible.

Tune particle count, size, fracture position and width, scatter, interaction radius, displacement, spring and damping in `dispersionSettings` in `src/lib/portrait-dispersion.ts`. Fracture position and width are fractions of portrait width. Scatter uses sampling-grid pixels. Particle sizes and cursor distances use CSS pixels. Review hair and jacket edges, touch scrolling, resizing and reduced motion before publishing.

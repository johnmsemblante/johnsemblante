/** Single-view portrait reconstruction. Coordinates are fitted to john-hero-graphite.webp.
 * This is a textured depth surface, not a scanned/fully rigged head; keep turns small.
 * Replacing the artwork requires refitting the landmarks and depth profile together.
 */
export const portraitArtwork = "/images/profile/john-hero-graphite.webp";
export const portraitAspect = 1.25;
export const portraitEyes = [[0.398, 0.416], [0.603, 0.416]] as const;
export const portraitLimits = { yaw: 0.15, pitch: 0.065 } as const;
export const portraitNeck = { start: 0.74, end: 0.87, pivotY: -0.70, pivotZ: 0.10 } as const;

/** Target angles use the portrait's stable layout, never its moving mesh. */
export function portraitTarget(x: number, y: number, bounds: { left: number; top: number; width: number; height: number }) {
  const distance = Math.max(240, bounds.width * 1.25);
  return { x: clampPortrait(Math.atan((x - bounds.left - bounds.width / 2) / distance) / 0.8),
    y: clampPortrait(Math.atan((y - bounds.top - bounds.height * 0.416) / distance) / 0.65) };
}

/** Exact critically damped response: no spring oscillation, independent of frame rate. */
export function advancePortrait(position: number, velocity: number, target: number, seconds: number) {
  const dt = Math.max(0, Math.min(seconds, 0.1)), rate = 14;
  const offset = position - target, impulse = velocity + rate * offset, decay = Math.exp(-rate * dt);
  return { position: target + (offset + impulse * dt) * decay, velocity: (velocity - rate * impulse * dt) * decay };
}

export function clampPortrait(value: number) {
  return Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}

function smoothstep(low: number, high: number, value: number) {
  const t = Math.max(0, Math.min(1, (value - low) / (high - low)));
  return t * t * (3 - 2 * t);
}

function mound(u: number, v: number, x: number, y: number, width: number, height: number) {
  return Math.exp(-(((u - x) / width) ** 2 + ((v - y) / height) ** 2) * 2);
}

export function portraitDepth(u: number, v: number) {
  const skull = Math.sqrt(Math.max(0, 1 - ((u - 0.5) / 0.31) ** 2 - ((v - 0.37) / 0.34) ** 2));
  const head = 0.22 * skull
    + 0.085 * mound(u, v, 0.5, 0.508, 0.065, 0.065) // Restrained nose projection.
    + 0.04 * mound(u, v, 0.5, 0.46, 0.045, 0.09) // Nose bridge.
    + 0.04 * mound(u, v, 0.36, 0.51, 0.1, 0.09)
    + 0.04 * mound(u, v, 0.64, 0.51, 0.1, 0.09)
    - 0.035 * mound(u, v, portraitEyes[0][0], portraitEyes[0][1], 0.065, 0.035)
    - 0.035 * mound(u, v, portraitEyes[1][0], portraitEyes[1][1], 0.065, 0.035)
    + 0.035 * mound(u, v, 0.5, 0.63, 0.12, 0.05);
  const torso = 0.12 * mound(u, v, 0.5, 0.84, 0.7, 0.4);
  const neckBlend = smoothstep(0.65, 0.79, v);
  return head * (1 - neckBlend) + torso * neckBlend;
}

export function createPortraitMesh(columns = 112, rows = 140) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 2 || rows < 2
    || (columns + 1) * (rows + 1) > 65535) throw new Error("Unsupported portrait mesh size");
  // Interleaved position (3), normal (3), texture coordinates (2).
  const vertices = new Float32Array((columns + 1) * (rows + 1) * 8);
  const indices = new Uint16Array(columns * rows * 6);
  const delta = 0.001;
  for (let y = 0; y <= rows; y++) {
    for (let x = 0; x <= columns; x++) {
      const u = x / columns, v = y / rows;
      const dx = (portraitDepth(u + delta, v) - portraitDepth(u - delta, v)) / (4 * delta);
      const dy = (portraitDepth(u, v - delta) - portraitDepth(u, v + delta)) / (4 * delta * portraitAspect);
      const length = Math.hypot(dx, dy, 1);
      vertices.set([(u - 0.5) * 2, (0.5 - v) * 2 * portraitAspect, portraitDepth(u, v),
        -dx / length, -dy / length, 1 / length, u, v], (y * (columns + 1) + x) * 8);
      if (x < columns && y < rows) {
        const a = y * (columns + 1) + x, b = a + columns + 1;
        indices.set([a, b, a + 1, a + 1, b, b + 1], (y * columns + x) * 6);
      }
    }
  }
  return { vertices, indices };
}


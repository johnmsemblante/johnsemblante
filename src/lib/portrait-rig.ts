/** Coordinates after centering the model and normalizing its height to 2.2. */
export const portraitRig = {
  height: 2.2,
  neckBottom: -0.64,
  neckTop: -0.32,
  pivot: [0, -0.48, 0] as const,
  yaw: Math.PI / 8,
  pitch: Math.PI / 24,
};

/** The face is rigid; only the narrow neck transition blends into the fixed torso. */
export function portraitHeadWeight(y: number) {
  const t = Math.max(0, Math.min(1, (y - portraitRig.neckBottom) / (portraitRig.neckTop - portraitRig.neckBottom)));
  return t * t * (3 - 2 * t);
}

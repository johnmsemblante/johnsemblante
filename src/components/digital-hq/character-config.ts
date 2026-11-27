// A production model is supplied separately, following docs/digital-hq-character.md.
export const characterConfig = {
  modelUrl: null as string | null,
  height: 4.8,
  rotation: 0,
  clips: { idle: "SeatedIdle", welcome: "Wave", introduce: "Introduce", work: "Typing", typing: "Typing", reading: "Read", point: "Point", gaming: "Game", contact: "LookPhone" } as Record<string, string>,
};
// Temporary geometry is never silently included in a release build.
export const previewCharacterEnabled = process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_DIGITAL_HQ_PREVIEW === "true";

// Coordinates and lengths are PDF user-space units, independent of screen zoom.
export type PdfAnnotation = {
  id: string; kind: "text" | "signature"; x: number; y: number;
  width: number; height: number; angle: number; png: string;
  text?: string; size?: number; color?: string;
};
export type EditorPage = { id: string; sourceIndex: number; rotation: number; annotations: PdfAnnotation[] };
export const PDF_LIMITS = { bytes: 20_000_000, pages: 100, side: 14_400 };
export function validatePdfBytes(bytes: Uint8Array) {
  if (!bytes.length) throw new Error("This file is empty. Choose a PDF containing at least one page.");
  if (bytes.length > PDF_LIMITS.bytes) throw new Error("Choose a PDF smaller than 20 MB.");
  if (!new TextDecoder("ascii").decode(bytes.subarray(0, 1024)).includes("%PDF-")) throw new Error("This file does not contain a PDF header. Choose a valid PDF.");
}
export const normalizeRotation = (angle: number) => ((angle % 360) + 360) % 360;
export function imageOrigin(a: PdfAnnotation) {
  const radians = a.angle * Math.PI / 180;
  return { x: a.x + a.height * Math.sin(radians), y: a.y - a.height * Math.cos(radians) };
}

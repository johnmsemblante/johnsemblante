import { imageOrigin, normalizeRotation, type EditorPage } from "./pdf-editor-model";

export async function exportEditedPdf(original: Uint8Array, pages: EditorPage[]) {
  if (!pages.length) throw new Error("Keep at least one page before downloading.");
  const { PDFDocument, degrees } = await import("pdf-lib");
  const pdf = await PDFDocument.load(original.slice(), { updateMetadata: false });
  const keep = new Set(pages.map(page => page.sourceIndex));
  if (keep.size !== pages.length || pages.some(page => page.sourceIndex < 0 || page.sourceIndex >= pdf.getPageCount())) throw new Error("Invalid page selection. Reload the original PDF.");
  // Edit the original document to retain untouched content and document resources.
  for (const state of pages) {
    const page = pdf.getPage(state.sourceIndex);
    page.setRotation(degrees(normalizeRotation(state.rotation)));
    for (const a of state.annotations) {
      const image = await pdf.embedPng(a.png);
      page.drawImage(image, { ...imageOrigin(a), width: a.width, height: a.height, rotate: degrees(a.angle) });
    }
  }
  for (let index = pdf.getPageCount() - 1; index >= 0; index--) if (!keep.has(index)) pdf.removePage(index);
  return pdf.save();
}

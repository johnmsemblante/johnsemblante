export const pageIds = ["home", "about", "work", "blog", "ventures", "contact"] as const;
export type PageId = typeof pageIds[number];
export type PageField = { key: string; label: string; group: string; kind: "text" | "image" | "url"; value: string };
export type PageImage = { src: string; alt: string; caption: string };
export type PageRecord = { values: Record<string, string>; seoTitle: string; seoDescription: string; images: PageImage[]; revision: number };
export const emptyPage = (): PageRecord => ({ values: {}, seoTitle: "", seoDescription: "", images: [], revision: 0 });
export function fieldKey(scope: string, value: string) {
  // Defaults identify repeated entries independently of their array position.
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return `${scope}_${(hash >>> 0).toString(36)}`;
}
export function pageUrl(value: string, image = false) {
  if (typeof value !== "string" || value.length > 2000 || /[\s<>\\]/.test(value)) return false;
  if (/^\/[^/]/.test(value) || value === "/") return true;
  if (!image && /^(#[\w-]+|mailto:[^@]+@[^@]+|tel:\+?[\d-]+)$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export function validatePage(value: unknown): value is PageRecord {
  if (!value || typeof value !== "object") return false;
  const p = value as PageRecord;
  return !!p.values && typeof p.values === "object" && !Array.isArray(p.values)
    && Object.keys(p.values).length <= 500 && Object.entries(p.values).every(([k,v]) => /^[a-zA-Z0-9_-]{1,100}$/.test(k) && typeof v === "string" && v.length <= 10000 && !v.includes("\0"))
    && Object.values(p.values).join("\0").length <= 200000
    && typeof p.seoTitle === "string" && p.seoTitle.length <= 160 && typeof p.seoDescription === "string" && p.seoDescription.length <= 500
    && Number.isInteger(p.revision) && p.revision >= 0 && Array.isArray(p.images) && p.images.length <= 5
    && p.images.every(i => i && pageUrl(i.src, true) && typeof i.alt === "string" && i.alt.trim().length > 0 && i.alt.length <= 200 && typeof i.caption === "string" && i.caption.length <= 500);
}

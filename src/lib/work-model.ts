import type { Project } from "@/content/site";
import { industries } from "@/content/industries";

export type WorkRecord = { project: Project; revision: number };
export type PublicWork = { slug: string; deleted: boolean; project?: Project };
export const workSlug = (title: string) => title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90).replace(/-$/, "");
export const assetUrl = (url: string) => /^https:\/\/[^\s<>]+$/.test(url) || /^\/[^/\s<>][^\s<>]*$/.test(url);
export function emptyWork(): Project { return { slug: "", title: "", summary: "", role: "", technologies: [], industries: ["other"], projectType: "client", publication: "draft", status: "live" }; }
export function validateWork(p: Project): string {
  if (!p || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(p.slug) || p.slug.length > 100) return "Enter a title that generates a valid project slug.";
  for (const [key, max] of [["title",160],["summary",1000],["role",200]] as const) if (typeof p[key] !== "string" || !p[key].trim() || p[key].length > max) return `Enter ${key} (up to ${max} characters).`;
  if (!["client","venture","concept"].includes(p.projectType) || !["draft","published"].includes(p.publication) || !["archived","live","planned","in-progress"].includes(p.status)) return "Choose a valid project type, status and visibility.";
  if (!Array.isArray(p.industries) || !p.industries.length || p.industries.length > 9 || p.industries.some(i => !industries.some(v => v.slug === i))) return "Select at least one industry.";
  for (const key of ["technologies","tags","capabilities","objectives","features","contributions"] as const) { const values = p[key]; if (values !== undefined && (!Array.isArray(values) || values.length > 20 || values.some(v => typeof v !== "string" || !v.trim() || v.length > 80))) return `${key}: use up to 20 entries of 80 characters each.`; }
  if (!p.technologies?.length) return "Add at least one technology.";
  for (const key of ["description","challenge","approach","outcome"] as const) if (p[key] !== undefined && (typeof p[key] !== "string" || p[key]!.length > 10000)) return `${key} must be at most 10,000 characters.`;
  if (p.year !== undefined && (!Number.isInteger(p.year) || p.year < 1900 || p.year > 2200)) return "Enter a valid year.";
  for (const url of [p.website, p.caseStudyUrl, p.image?.src, ...(p.gallery ?? []).map(i => i.src)]) if (url && (url.length > 2000 || !assetUrl(url))) return "Use HTTPS or site-relative image/website URLs.";
  if (p.image && (!p.image.src || !p.image.alt.trim() || p.image.alt.length > 200)) return "Describe the featured image (up to 200 characters).";
  if (p.gallery && (p.gallery.length > 20 || p.gallery.some(i => !i.src || !i.alt?.trim() || i.alt.length > 200))) return "Gallery images need a URL and description (maximum 20).";
  if ((p.seo?.title?.length ?? 0) > 160 || (p.seo?.description?.length ?? 0) > 500) return "SEO title/description must be at most 160/500 characters.";
  return "";
}
export function mergeWorks(source: Project[], records: PublicWork[]): Project[] {
  const all = new Map(source.filter(p => p.publication === "published").map(p => [p.slug, p]));
  for (const record of records) {
    if (!record.deleted && record.project?.publication === "published" && !validateWork(record.project)) all.set(record.slug, record.project);
    else all.delete(record.slug);
  }
  return [...all.values()];
}

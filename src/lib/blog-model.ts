export type PostStatus = "draft" | "published" | "scheduled";
export type PostInput = {
  slug: string; title: string; excerpt: string; categories: string[]; tags: string[];
  content: string; status: PostStatus; scheduledFor: string; seoTitle: string; seoDescription: string;
};
export type ManagedPost = PostInput & { revision: number; publishedAt: string; schemaVersion: number };

export const emptyPost = (): PostInput => ({ slug: "", title: "", excerpt: "", categories: ["Notes"], tags: [], content: "", status: "draft", scheduledFor: "", seoTitle: "", seoDescription: "" });

export function slugForTitle(title: string) {
  return title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90).replace(/-$/, "") || "post";
}
export function slugCandidate(base: string, attempt: number) { return attempt === 0 ? base : `${base}-${attempt + 1}`; }
export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}
export function manilaDateTime(value: number | Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const part = (key: string) => parts.find(item => item.type === key)?.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
export function scheduleMillis(value: string): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return NaN;
  const instant = Date.parse(`${value}:00+08:00`);
  return Number.isFinite(instant) && manilaDateTime(instant) === value ? instant : NaN;
}
export function normalizeLabels(values: string[]) {
  const unique = new Map<string, string>();
  values.forEach(value => { const label = value.trim(); if (label && !unique.has(label.toLowerCase())) unique.set(label.toLowerCase(), label); });
  return [...unique.values()];
}
export function validatePost(input: PostInput, options: { now?: number; allowDueSchedule?: boolean } = {}): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 100) return "A valid automatically generated slug is required.";
  for (const [name, value, maximum] of [["Title", input.title, 160], ["Excerpt", input.excerpt, 500], ["Article", input.content, 60000]] as const) {
    if (typeof value !== "string" || !value.trim() || value.length > maximum) return `${name} is required and must be at most ${maximum.toLocaleString()} characters.`;
  }
  for (const [name, values, maximum, required] of [["Categories", input.categories, 10, true], ["Tags", input.tags, 20, false]] as const) {
    if (!Array.isArray(values) || values.length > maximum || (required && !values.length) || values.some(value => typeof value !== "string" || !value.trim() || value.length > 80) || normalizeLabels(values).length !== values.length) return `${name} must contain ${required ? "1" : "0"} to ${maximum} unique labels, up to 80 characters each.`;
  }
  if (!["draft", "published", "scheduled"].includes(input.status)) return "Choose draft, published or scheduled visibility.";
  if (typeof input.seoTitle !== "string" || input.seoTitle.length > 160 || typeof input.seoDescription !== "string" || input.seoDescription.length > 500) return "SEO title must be at most 160 characters and description at most 500 characters.";
  if (input.status === "scheduled") {
    const instant = scheduleMillis(input.scheduledFor);
    if (!Number.isFinite(instant)) return "Choose a valid publication date and time in Cebu/Manila time.";
    if (!options.allowDueSchedule && instant <= (options.now ?? Date.now())) return "Scheduled publication must be in the future.";
  }
  return null;
}

export function publicationISO(value: unknown): string {
  if (value && typeof (value as { toDate?: unknown }).toDate === "function") {
    try { return (value as { toDate(): Date }).toDate().toISOString(); } catch { return ""; }
  }
  // Preserve existing source-era date strings while newer records use server timestamps.
  if (typeof value === "string" && validDate(value)) return `${value}T00:00:00.000Z`;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/.test(value) && Number.isFinite(Date.parse(value))) return new Date(value).toISOString();
  return "";
}
export function postFromData(slug: string, value: Record<string, unknown>): ManagedPost | null {
  if (["title", "excerpt", "content", "status"].some(key => typeof value[key] !== "string") || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1) return null;
  const legacy = value.schemaVersion === undefined;
  if (!legacy && value.schemaVersion !== 2) return null;
  const publishedAt = publicationISO(value.publishedAt);
  const post: ManagedPost = {
    slug, title: value.title as string, excerpt: value.excerpt as string, content: value.content as string,
    categories: legacy ? [value.category as string] : value.categories as string[], tags: legacy ? [] : value.tags as string[],
    status: value.status as PostStatus, scheduledFor: value.status === "scheduled" && publishedAt ? manilaDateTime(new Date(publishedAt)) : "",
    seoTitle: legacy ? "" : value.seoTitle as string, seoDescription: legacy ? "" : value.seoDescription as string,
    publishedAt, revision: value.revision as number, schemaVersion: legacy ? 1 : 2,
  };
  if ((post.status === "published" || post.status === "scheduled") && !publishedAt) return null;
  return validatePost(post, { allowDueSchedule: true }) ? null : post;
}
export function editablePost(post: ManagedPost): PostInput {
  return { slug: post.slug, title: post.title, excerpt: post.excerpt, categories: [...post.categories], tags: [...post.tags], content: post.content, status: effectiveStatus(post), scheduledFor: post.scheduledFor, seoTitle: post.seoTitle, seoDescription: post.seoDescription };
}
export function effectiveStatus(post: ManagedPost, now = Date.now()): PostStatus {
  return post.status === "scheduled" && Date.parse(post.publishedAt) <= now ? "published" : post.status;
}
export function postMetadata(post: Pick<PostInput, "title" | "excerpt" | "seoTitle" | "seoDescription">) {
  return { title: post.seoTitle.trim() || post.title, description: post.seoDescription.trim() || post.excerpt };
}
export function safeAssetUrl(value: string): boolean {
  if (/^\/(?!\/)/.test(value)) return !/[\s<>"\\]/.test(value);
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password; } catch { return false; }
}
export type ArticleBlock = { type: "paragraph" | "heading" | "quote" | "list" | "image" | "asset"; text?: string; items?: string[]; url?: string };
export function articleBlocks(content: string): ArticleBlock[] {
  return content.replace(/\r\n/g, "\n").split(/\n\s*\n/).filter(part => part.trim()).map(part => {
    const lines = part.trim().split("\n");
    const media = /^(!?)\[([^\]\n]{1,200})\]\(([^\s()]+)\)$/.exec(part.trim());
    if (media && safeAssetUrl(media[3])) return { type: media[1] ? "image" : "asset", text: media[2], url: media[3] };
    if (lines.every(line => line.startsWith("- "))) return { type: "list", items: lines.map(line => line.slice(2)) };
    if (lines.every(line => line.startsWith("> "))) return { type: "quote", text: lines.map(line => line.slice(2)).join("\n") };
    if (lines.length === 1 && lines[0].startsWith("## ")) return { type: "heading", text: lines[0].slice(3) };
    return { type: "paragraph", text: lines.join("\n") };
  });
}

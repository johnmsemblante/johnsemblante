/** Browser-only résumé data. Never add private owner information to source defaults. */
export const RESUME_VERSION = 1;
export const RESUME_MAX_BYTES = 1024 * 1024;
export const RESUME_MAX_ENTRIES = 20;
export const resumeSectionKeys = ["summary", "experience", "projects", "education", "skills", "certifications"] as const;
export type ResumeSectionKey = typeof resumeSectionKeys[number];
export const resumeSectionLabels: Record<ResumeSectionKey, string> = {
  summary: "Professional summary", experience: "Experience", projects: "Selected projects",
  education: "Education", skills: "Skills", certifications: "Certifications & languages",
};
export type ResumeEntry = { id: string; title: string; organization: string; location: string; dates: string; url: string; highlights: string };
export type Resume = {
  version: 1; name: string; headline: string; email: string; phone: string; location: string;
  website: string; linkedin: string; summary: string; skills: string; certifications: string;
  experience: ResumeEntry[]; education: ResumeEntry[]; projects: ResumeEntry[];
  order: ResumeSectionKey[]; hidden: ResumeSectionKey[];
  template: "modern" | "classic"; paper: "a4" | "letter"; spacing: "comfortable" | "compact";
};

export function emptyResume(): Resume {
  return { version: RESUME_VERSION, name: "", headline: "", email: "", phone: "", location: "", website: "", linkedin: "",
    summary: "", skills: "", certifications: "", experience: [], education: [], projects: [],
    order: [...resumeSectionKeys], hidden: [], template: "modern", paper: "a4", spacing: "comfortable" };
}
export function emptyResumeEntry(): ResumeEntry {
  return { id: crypto.randomUUID(), title: "", organization: "", location: "", dates: "", url: "", highlights: "" };
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
function textField(value: unknown, max: number): string {
  if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw new Error("The backup has invalid or oversized text fields.");
  return value;
}
/** Strict validation also prevents silently overwriting a draft with an unrelated JSON file. */
export function parseResume(value: unknown): Resume {
  if (!record(value) || value.version !== RESUME_VERSION) throw new Error("Choose a version 1 résumé backup exported by this generator.");
  const result = emptyResume();
  for (const key of ["name", "headline", "email", "phone", "location", "website", "linkedin"] as const) result[key] = textField(value[key], 300);
  for (const key of ["summary", "skills", "certifications"] as const) result[key] = textField(value[key], 6000);
  for (const key of ["experience", "education", "projects"] as const) {
    const entries = value[key];
    if (!Array.isArray(entries) || entries.length > RESUME_MAX_ENTRIES) throw new Error("A section can contain up to 20 entries.");
    const ids = new Set<string>();
    result[key] = entries.map(entry => {
      if (!record(entry)) throw new Error("The backup has an invalid entry.");
      const id = textField(entry.id, 100);
      if (!id || ids.has(id)) throw new Error("The backup has missing or duplicate entry identifiers.");
      ids.add(id);
      return { id, title: textField(entry.title, 300), organization: textField(entry.organization, 300), location: textField(entry.location, 300),
        dates: textField(entry.dates, 300), url: textField(entry.url, 300), highlights: textField(entry.highlights, 6000) };
    });
  }
  const isKey = (key: unknown): key is ResumeSectionKey => typeof key === "string" && resumeSectionKeys.includes(key as ResumeSectionKey);
  if (!Array.isArray(value.order) || value.order.length !== resumeSectionKeys.length || !value.order.every(isKey) || new Set(value.order).size !== resumeSectionKeys.length) throw new Error("The backup has an invalid section order.");
  if (!Array.isArray(value.hidden) || !value.hidden.every(isKey) || new Set(value.hidden).size !== value.hidden.length) throw new Error("The backup has invalid hidden sections.");
  result.order = [...value.order]; result.hidden = [...value.hidden];
  if (value.template !== "modern" && value.template !== "classic") throw new Error("The backup has an unsupported template.");
  if (value.paper !== "a4" && value.paper !== "letter") throw new Error("The backup has an unsupported paper size.");
  if (value.spacing !== "comfortable" && value.spacing !== "compact") throw new Error("The backup has unsupported spacing.");
  result.template = value.template; result.paper = value.paper; result.spacing = value.spacing;
  return result;
}
export function readResumeBackup(raw: string): Resume {
  if (new TextEncoder().encode(raw).length > RESUME_MAX_BYTES) throw new Error("Choose a résumé JSON backup up to 1 MB.");
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("This file is not valid JSON. Choose a résumé backup."); }
  return parseResume(value);
}
export const resumeStorageKey = (uid: string) => `portfolio:resume:v1:${uid}`;
export function moveResumeItem<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const next = [...items], destination = index + direction;
  if (index < 0 || index >= items.length || destination < 0 || destination >= items.length) return next;
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}
export function resumeLines(value: string): string[] {
  return value.split(/\r?\n/).map(line => line.trim().replace(/^[•*-]\s+/, "")).filter(Boolean);
}
export function resumeEntryHasContent(entry: ResumeEntry): boolean {
  return [entry.title, entry.organization, entry.location, entry.dates, entry.url, entry.highlights].some(value => value.trim());
}
export function resumeSectionHasContent(resume: Resume, key: ResumeSectionKey): boolean {
  const value = resume[key];
  return typeof value === "string" ? !!value.trim() : value.some(resumeEntryHasContent);
}
export function resumeHasContent(resume: Resume): boolean {
  return [resume.name, resume.headline, resume.email, resume.phone, resume.location, resume.website, resume.linkedin].some(value => value.trim())
    || resumeSectionKeys.some(key => resumeSectionHasContent(resume, key));
}
export function resumeFilename(resume: Resume): string {
  return `${resume.name.trim().replace(/[^\p{L}\p{N} _-]/gu, "").replace(/\s+/g, "-").slice(0, 80) || "my"}-resume`;
}
export function resumeToText(resume: Resume): string {
  const lines = [resume.name, resume.headline, [resume.email, resume.phone, resume.location].filter(value => value.trim()).join(" | "), resume.website, resume.linkedin].filter(value => value.trim());
  for (const key of resume.order) {
    if (resume.hidden.includes(key) || !resumeSectionHasContent(resume, key)) continue;
    lines.push("", resumeSectionLabels[key].toUpperCase());
    const value = resume[key];
    if (typeof value === "string") lines.push(value.trim());
    else for (const entry of value.filter(resumeEntryHasContent)) {
      lines.push([entry.title, entry.organization].filter(value => value.trim()).join(" — "));
      lines.push([entry.location, entry.dates].filter(value => value.trim()).join(" | "));
      if (entry.url.trim()) lines.push(entry.url.trim());
      lines.push(...resumeLines(entry.highlights).map(line => `• ${line}`), "");
    }
  }
  return `${lines.join("\n").trim()}\n`;
}

export const JOB_SOURCE = "Jobicy" as const;
export type Job = {
  sourceId: string; source: "Jobicy" | "Arbeitnow" | "Himalayas"; title: string; company: string; location: string;
  remote: boolean | null; url: string; postedAt: number | null;
  summary?: string; salary?: string; employment?: string; timezone?: string;
  expiresAt?: number;
};
export type JobSearch = { keyword: string; geo: "philippines" | "anywhere"; provider?: "jobicy" | "himalayas" };
export type JobFilters = { keyword: string; focus: "development" | "all"; salaryOnly: boolean; sort: "skills" | "recent" };
export type FeedPage = { jobs: Job[]; nextCursor: string | null; fetchedAt: number; stale: boolean };
const clean = (value: unknown, maximum: number) => typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, maximum) : "";
// Excerpts are plain text in the UI. Never render provider HTML.
const plain = (value: unknown, maximum: number) => clean(value, maximum * 3).replace(/<[^>]*>/g, " ").replace(/&(?:amp|lt|gt|quot|apos|nbsp|hellip|#\d+|#x[0-9a-f]+);/gi, entity => {
  const named: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&apos;": "'", "&nbsp;": " ", "&hellip;": "…" };
  if (named[entity.toLowerCase()]) return named[entity.toLowerCase()];
  const number = entity[2]?.toLowerCase() === "x" ? parseInt(entity.slice(3, -1), 16) : Number(entity.slice(2, -1));
  return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : " ";
}).replace(/\s+/g, " ").trim().slice(0, maximum);

function salaryLabel(min: unknown, max: unknown, code: unknown, interval: unknown) {
  const amount = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 1e12 ? value : null;
  const minimum = amount(min); const maximum = amount(max);
  if (minimum && maximum && maximum < minimum) return "";
  const range = minimum && maximum ? `${minimum.toLocaleString("en-US")}–${maximum.toLocaleString("en-US")}` : minimum ? `From ${minimum.toLocaleString("en-US")}` : maximum ? `Up to ${maximum.toLocaleString("en-US")}` : "";
  const currency = typeof code === "string" && /^[A-Z]{3}$/.test(code) ? code : "Currency not specified";
  const period = clean(interval, 30);
  return range ? `${currency} ${range}${period ? ` / ${period}` : " (period not provided)"}` : "";
}

export function validJobUrl(value: unknown, source: Job["source"] = JOB_SOURCE): value is string {
  if (typeof value !== "string" || value.length > 2000) return false;
  try {
    const url = new URL(value);
    const hosts = source === "Jobicy" ? ["jobicy.com"] : source === "Himalayas" ? ["himalayas.app"] : ["www.arbeitnow.com", "arbeitnow.com"];
    const path = source === "Himalayas" ? /^\/companies\/[a-z0-9-]+\/jobs\/[a-z0-9-]+\/?$/.test(url.pathname) : url.pathname.startsWith("/jobs/");
    return url.protocol === "https:" && hosts.includes(url.hostname) && path && !url.username && !url.password && !url.port && !/\s/.test(value);
  } catch { return false; }
}
export function jobFromApi(value: unknown): Job | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!Number.isSafeInteger(raw.id) || Number(raw.id) <= 0 || !validJobUrl(raw.url)) return null;
  const title = plain(raw.jobTitle, 400);
  if (!title) return null;
  const posted = typeof raw.pubDate === "string" && /(?:Z|[+-]\d{2}:\d{2})$/.test(raw.pubDate) ? Date.parse(raw.pubDate) : NaN;
  return { sourceId: `jobicy-${raw.id}`, source: JOB_SOURCE, title, company: plain(raw.companyName, 200) || "Company not provided", location: plain(raw.jobGeo, 300) || "Location not provided", remote: true, url: raw.url, postedAt: Number.isSafeInteger(posted) && posted > 0 ? posted : null, summary: plain(raw.jobExcerpt, 700), salary: salaryLabel(raw.salaryMin, raw.salaryMax, raw.salaryCurrency, raw.salaryPeriod), employment: Array.isArray(raw.jobType) ? plain(raw.jobType.filter(item => typeof item === "string").join(", "), 120) : "" };
}
export function jobFromSaved(value: unknown): Job | null {
  if (!value || typeof value !== "object") return null;
  const job = value as Record<string, unknown>;
  if (!["Jobicy", "Arbeitnow", "Himalayas"].includes(String(job.source)) || typeof job.sourceId !== "string" || !/^[a-zA-Z0-9-]{1,500}$/.test(job.sourceId) || !validJobUrl(job.url, job.source as Job["source"])) return null;
  if (job.source === "Jobicy" && !/^jobicy-[1-9]\d*$/.test(job.sourceId)) return null;
  if (job.source === "Himalayas" && !/^himalayas-[1-9]\d*-[a-z0-9-]+$/.test(job.sourceId)) return null;
  for (const [key, maximum] of [["title", 400], ["company", 200], ["location", 300]] as const) if (typeof job[key] !== "string" || !(job[key] as string).trim() || (job[key] as string).length > maximum) return null;
  if (job.remote !== null && typeof job.remote !== "boolean") return null;
  if (job.source !== "Arbeitnow" && job.remote !== true) return null;
  if (job.postedAt !== null && (!Number.isSafeInteger(job.postedAt) || Number(job.postedAt) <= 0 || Number(job.postedAt) > 8640000000000000)) return null;
  if (job.expiresAt !== undefined && (!Number.isSafeInteger(job.expiresAt) || Number(job.expiresAt) <= 0 || Number(job.expiresAt) > 8640000000000000)) return null;
  const optional: Pick<Job, "summary" | "salary" | "employment" | "timezone"> = {};
  for (const [key, maximum] of [["summary", 700], ["salary", 200], ["employment", 120], ["timezone", 120]] as const) {
    if (job[key] !== undefined) {
      if (typeof job[key] !== "string" || (job[key] as string).length > maximum) return null;
      optional[key] = job[key] as string;
    }
  }
  return { sourceId: job.sourceId, source: job.source as Job["source"], title: job.title as string, company: job.company as string, location: job.location as string, remote: job.remote as boolean | null, url: job.url, postedAt: job.postedAt as number | null, ...optional, ...(job.expiresAt !== undefined ? { expiresAt: job.expiresAt as number } : {}) };
}

export function himalayasJobFromApi(value: unknown, worldwideOnly = false): Job | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  if (!validJobUrl(raw.applicationLink, "Himalayas") || !validJobUrl(raw.guid, "Himalayas")) return null;
  const path = new URL(raw.guid).pathname;
  if (new URL(raw.applicationLink).pathname !== path) return null;
  const [, companySlug, slug] = path.match(/^\/companies\/([a-z0-9-]+)\/jobs\/([a-z0-9-]+)\/?$/)!;
  const sourceId = `himalayas-${companySlug.length}-${companySlug}-${slug}`;
  if (sourceId.length > 500) return null;
  if (!Array.isArray(raw.locationRestrictions) || !Array.isArray(raw.timezoneRestrictions)) return null;
  const countries = raw.locationRestrictions.map(item => typeof item === "string" ? item : item && typeof item === "object" ? item.name || item.alpha2 : null);
  if (countries.some(item => typeof item !== "string")) return null;
  const worldwide = countries.length === 0;
  if (worldwideOnly && !worldwide) return null;
  if (!worldwide && !countries.some(item => /^(philippines|ph)$/i.test(item))) return null;
  const offsets = raw.timezoneRestrictions.map(item => {
    if (typeof item === "number") return item;
    if (typeof item !== "string") return NaN;
    const match = item.replace(/^UTC/i, "").match(/^([+-]?)(\d{1,2})(?::(\d{2}))?$/);
    return match ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) + Number(match[3] || 0) / 60) : NaN;
  });
  if (offsets.some(offset => !Number.isFinite(offset)) || (offsets.length && !offsets.includes(8))) return null;
  const title = plain(raw.title, 400);
  // Some listings have broad metadata but an explicit conflicting residence requirement in the title.
  if (!title || /\b(?:u\.?s\.?a?|united states|uk|united kingdom|canada|europe)[ -]+(?:only|based)\b/i.test(title)) return null;
  const expiry = typeof raw.expiryDate === "number" ? raw.expiryDate * 1000 : null;
  if (expiry !== null && (!Number.isSafeInteger(expiry) || expiry <= Date.now() || expiry > 8640000000000000)) return null;
  const posted = typeof raw.pubDate === "number" ? raw.pubDate * 1000 : NaN;
  return { sourceId, source: "Himalayas", title, company: plain(raw.companyName, 200) || "Company not provided", location: worldwide ? "Worldwide (source has no country restriction)" : countries.join(", ").slice(0, 300), remote: true, url: raw.applicationLink, postedAt: Number.isSafeInteger(posted) && posted > 0 && posted <= 8640000000000000 ? posted : null, summary: plain(raw.excerpt, 700), salary: salaryLabel(raw.minSalary, raw.maxSalary, raw.currency, raw.salaryPeriod), employment: plain(raw.employmentType, 120), timezone: "UTC+8 included in source restrictions", ...(expiry !== null ? { expiresAt: expiry } : {}) };
}
const searchText = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const skills = [
  ["WordPress", /\bwordpress\b/i], ["WooCommerce", /\bwoocommerce\b/i], ["PHP", /\bphp\b/i],
  ["Front end", /\bfront[ -]?end\b/i], ["Full stack", /\bfull[ -]?stack\b/i], ["JavaScript", /\bjavascript\b/i],
  ["Web development", /\bweb (?:develop|engineer)|\b(?:html|css|tailwind)\b/i],
] as const;
export function isDevelopmentJob(job: Job) {
  return /\b(?:front[ -]?end|full[ -]?stack)\b/i.test(job.title)
    || (/\b(?:developer|engineer|programmer|development|webmaster)\b/i.test(job.title) && /\b(?:wordpress|woocommerce|php|web|software|javascript|react|next[.]?js|ui|application)\b/i.test(job.title));
}
export function matchingSkills(job: Job) {
  // A company's generic "full-stack platform" boilerplate is not evidence that a sales/operations role fits.
  const text = `${job.title} ${isDevelopmentJob(job) ? job.summary || "" : ""}`;
  return skills.filter(([, pattern]) => pattern.test(text)).map(([label]) => label);
}
export function filterJobs(jobs: Job[], filters: JobFilters) {
  const keyword = searchText(filters.keyword.trim());
  return jobs.filter(job => (!keyword || searchText(`${job.title} ${job.company} ${job.summary || ""}`).includes(keyword)) && (filters.focus === "all" || isDevelopmentJob(job)) && (!filters.salaryOnly || !!job.salary))
    .sort((a, b) => (filters.sort === "skills" ? matchingSkills(b).length - matchingSkills(a).length : 0) || (b.postedAt || 0) - (a.postedAt || 0) || a.sourceId.localeCompare(b.sourceId));
}
export function arrangementLabel(remote: boolean | null) { return remote === true ? "Remote" : remote === false ? "Not marked remote" : "Remote status unavailable"; }

export function validCursor(value: unknown): value is string { return typeof value === "string" && /^[A-Za-z0-9_-]{1,1000}$/.test(value); }
export function parseFeed(value: unknown, fetchedAt: number): FeedPage {
  const body = value as { jobs?: unknown; nextCursor?: unknown; hasMore?: unknown; success?: unknown; appliedFilters?: { geo?: unknown; tag?: unknown } } | null;
  if (!body || body.success === false || !Array.isArray(body.jobs)) throw new Error("The job source returned an unsupported response.");
  const jobs = [...new Map(body.jobs.flatMap(item => { const job = jobFromApi(item); return job ? [[job.sourceId, job] as const] : []; })).values()];
  if (body.jobs.length && !jobs.length) throw new Error("The job source returned listings in an unsupported format.");
  if (body.hasMore === true && !validCursor(body.nextCursor)) throw new Error("The job source returned invalid pagination. Start a new search.");
  return { jobs, nextCursor: body.hasMore === true ? body.nextCursor as string : null, fetchedAt, stale: false };
}

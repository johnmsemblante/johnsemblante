"use client";

import { jobFromSaved, parseFeed, validCursor, type FeedPage, type JobSearch } from "./jobs-model";

const TTL = 60 * 60 * 1000;
const PREFIX = "portfolio-jobicy-v1:";
export const HIMALAYAS_PROXY = process.env.NEXT_PUBLIC_HIMALAYAS_PROXY_URL || "";
type CacheStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;

export function searchUrl(search: JobSearch, cursor: string | null = null, proxy = HIMALAYAS_PROXY) {
  const keyword = search.keyword.trim();
  if (!["philippines", "anywhere"].includes(search.geo) || (search.provider && !["jobicy", "himalayas"].includes(search.provider)) || (keyword && (keyword.length < 3 || keyword.length > 50)) || (cursor !== null && !validCursor(cursor))) throw new Error("Use a keyword of 3–50 characters and a supported location.");
  if (search.provider === "himalayas") {
    if (!proxy) throw new Error("The broader feed is not connected yet. Choose Jobicy or use the wider search link.");
    const url = new URL(proxy);
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/jobs") throw new Error("The broader feed address is invalid.");
    if (cursor && (!/^[1-9]\d*$/.test(cursor) || Number(cursor) > 100)) throw new Error("Invalid search page. Start a new search.");
    url.searchParams.set("q", keyword); url.searchParams.set("geo", search.geo); url.searchParams.set("page", cursor || "1");
    return url.href;
  }
  const url = new URL("https://jobicy.com/api/jobs");
  url.searchParams.set("count", "100"); url.searchParams.set("geo", search.geo);
  if (keyword) url.searchParams.set("tag", keyword);
  if (cursor) url.searchParams.set("cursor", cursor);
  return url.href;
}

export function createJobFeedClient(request: typeof fetch = fetch, storage: () => CacheStorage | null = () => typeof window === "undefined" ? null : window.localStorage, now = Date.now, proxy = HIMALAYAS_PROXY) {
  const memory = new Map<string, FeedPage>();
  const pending = new Map<string, Promise<FeedPage>>();
  const attempts = new Map<string, number>();
  const blockedUntil = new Map<string, number>();
  function cached(key: string): FeedPage | null {
    if (memory.has(key)) return memory.get(key)!;
    try {
      const raw = JSON.parse(storage()?.getItem(key) ?? "null");
      if (!raw || !Array.isArray(raw.jobs) || typeof raw.fetchedAt !== "number" || !Number.isFinite(raw.fetchedAt) || raw.fetchedAt < 0 || raw.fetchedAt > now() + 60000 || !(raw.nextCursor === null || validCursor(raw.nextCursor))) return null;
      const source = key.includes("https://jobicy.com/") ? "Jobicy" : "Himalayas";
      const jobs = raw.jobs.map(jobFromSaved).filter((job: ReturnType<typeof jobFromSaved>) => job?.source === source);
      if (jobs.length !== raw.jobs.length) return null;
      const result: FeedPage = { jobs, fetchedAt: raw.fetchedAt, nextCursor: raw.nextCursor, stale: false };
      memory.set(key, result); return result;
    } catch { return null; }
  }
  function remember(key: string, result: FeedPage) {
    memory.set(key, result);
    if (memory.size > 5) memory.delete(memory.keys().next().value!);
    try {
      const target = storage(); if (!target) return;
      target.setItem(key, JSON.stringify(result));
      const keys = Array.from({ length: target.length }, (_, index) => target.key(index)).filter((item): item is string => !!item?.startsWith(PREFIX));
      keys.sort((a, b) => {
        try { return JSON.parse(target.getItem(a)!).fetchedAt - JSON.parse(target.getItem(b)!).fetchedAt; } catch { return 0; }
      }).slice(0, Math.max(0, keys.length - 5)).forEach(item => target.removeItem(item));
    } catch { /* Public metadata caching is optional. Private bookmarks use Firestore. */ }
  }
  async function load(url: string, key: string, existing: FeedPage | null, himalayas: boolean): Promise<FeedPage> {
    attempts.set(key, now());
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await request(url, { headers: { Accept: "application/json" }, credentials: "omit", signal: controller.signal });
      if (response.status === 429) {
        const retry = response.headers?.get("Retry-After");
        const seconds = retry && /^\d+$/.test(retry) ? Number(retry) : NaN;
        const until = Number.isFinite(seconds) ? now() + seconds * 1000 : retry ? Date.parse(retry) : NaN;
        blockedUntil.set(himalayas ? "himalayas" : "jobicy", Math.max(now() + 60000, Number.isFinite(until) ? until : 0));
      }
      if (!response.ok) throw new Error(response.status === 429 ? "The job source is busy. Please wait before trying again." : response.status === 400 ? "This search page has expired. Start a new search." : "The job source could not be reached. Please try again later.");
      const body = await response.json();
      const requested = new URL(url).searchParams;
      if (body?.appliedFilters?.geo !== requested.get("geo") || (himalayas ? body?.appliedFilters?.q !== requested.get("q") || body?.appliedFilters?.country !== "Philippines" || body?.appliedFilters?.timezone !== 8 || body?.appliedFilters?.page !== Number(requested.get("page")) : requested.has("tag") && body?.appliedFilters?.tag !== requested.get("tag"))) throw new Error("The source did not confirm your filters. Open the job board directly or try again later.");
      let result: FeedPage;
      if (himalayas) {
        if (!Array.isArray(body.jobs) || !(body.nextCursor === null || (validCursor(body.nextCursor) && Number(body.nextCursor) === Number(requested.get("page")) + 1 && Number(body.nextCursor) <= 100)) || typeof body.fetchedAt !== "number" || !Number.isFinite(body.fetchedAt) || body.fetchedAt < 0 || body.fetchedAt > now() + 60000) throw new Error("The broader feed returned an unsupported response.");
        const jobs = body.jobs.map(jobFromSaved).filter((job: ReturnType<typeof jobFromSaved>) => job?.source === "Himalayas");
        if (jobs.length !== body.jobs.length) throw new Error("The broader feed returned unsupported listings.");
        result = { jobs, nextCursor: body.nextCursor, fetchedAt: body.fetchedAt, stale: false };
      } else result = parseFeed(body, now());
      remember(key, result); return result;
    } catch (cause) {
      // Cursors expire after 24 hours; never continue an old traversal offline.
      if (existing && now() - existing.fetchedAt < (himalayas ? 48 : 24) * TTL) return { ...existing, nextCursor: null, stale: true };
      if (controller.signal.aborted) throw new Error("The job source timed out. Please try again later.");
      throw cause;
    } finally { clearTimeout(timeout); }
  }
  function get(search: JobSearch, cursor: string | null = null): Promise<FeedPage> {
    let url: string;
    try { url = searchUrl(search, cursor, proxy); } catch (cause) { return Promise.reject(cause); }
    const key = `${PREFIX}${url}`;
    const existing = cached(key);
    const himalayas = search.provider === "himalayas";
    if (existing && now() - existing.fetchedAt < (himalayas ? 24 : 1) * TTL) return Promise.resolve(existing);
    if (pending.has(key)) return pending.get(key)!;
    const maximum = (himalayas ? 48 : 24) * TTL;
    if (now() < (blockedUntil.get(himalayas ? "himalayas" : "jobicy") || 0)) return existing && now() - existing.fetchedAt < maximum ? Promise.resolve({ ...existing, nextCursor: null, stale: true }) : Promise.reject(new Error("The source is rate limited. Please try again later."));
    if (attempts.has(key) && now() - attempts.get(key)! < 60000) return existing && now() - existing.fetchedAt < maximum ? Promise.resolve({ ...existing, nextCursor: null, stale: true }) : Promise.reject(new Error("Please wait a minute before requesting this search again."));
    const promise = load(url, key, existing, himalayas).finally(() => pending.delete(key));
    pending.set(key, promise); return promise;
  }
  return { get };
}

export const jobFeed = createJobFeedClient();

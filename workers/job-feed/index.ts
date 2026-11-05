import { himalayasJobFromApi } from "../../src/lib/jobs-model";

type Env = { ALLOWED_ORIGINS: string };
type Context = { waitUntil(promise: Promise<unknown>): void };
type WorkerCache = { match(request: Request): Promise<Response | undefined>; put(request: Request, response: Response): Promise<void> };
const DAY = 86400;

// This serves public listing metadata only. It never receives Firebase tokens or bookmarks.
export function createHandler(requestUpstream: typeof fetch = (input, init) => globalThis.fetch(input, init), cache?: WorkerCache) {
  let blockedUntil = 0;
  return async function handle(request: Request, env: Env, context: Context): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(item => item.trim());
    const headers = new Headers({ "Content-Type": "application/json; charset=utf-8", "X-Content-Type-Options": "nosniff", "Cache-Control": "no-store", Vary: "Origin" });
    if (origin && !allowed.includes(origin)) return Response.json({ error: "Origin not allowed." }, { status: 403, headers });
    if (origin) headers.set("Access-Control-Allow-Origin", origin);
    const reply = (error: string, status: number) => Response.json({ error }, { status, headers });
    if (url.pathname !== "/jobs") return reply("Not found.", 404);
    if (request.method === "OPTIONS") {
      headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
      headers.set("Access-Control-Allow-Headers", "Accept");
      headers.set("Access-Control-Max-Age", "86400");
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "GET") return reply("Only GET is supported.", 405);
    if (request.headers.has("Authorization") || request.headers.has("Cookie")) return reply("Do not send account credentials to this public feed.", 400);
    const q = (url.searchParams.get("q") || "").trim();
    const geo = url.searchParams.get("geo") || "philippines";
    const page = url.searchParams.get("page") || "1";
    if ([...url.searchParams.keys()].some(key => !["q", "geo", "page"].includes(key)) || q.length > 50 || (q && q.length < 3) || !["philippines", "anywhere"].includes(geo) || !/^[1-9]\d{0,2}$/.test(page) || Number(page) > 100) return reply("Invalid search parameters.", 400);
    const upstream = new URL("https://himalayas.app/jobs/api/search");
    upstream.searchParams.set("country", "Philippines"); upstream.searchParams.set("timezone", "8"); upstream.searchParams.set("sort", "recent"); upstream.searchParams.set("page", page);
    if (q) upstream.searchParams.set("q", q);
    if (geo === "anywhere") upstream.searchParams.set("worldwide", "true");
    const cacheUrl = new URL("/_feed-cache/v1", url.origin);
    cacheUrl.search = new URLSearchParams({ q, geo, page }).toString();
    const key = new Request(cacheUrl.href);
    let result: Response | undefined;
    try { result = await cache?.match(key); } catch { /* An unavailable edge cache must not expose private data or crash the feed. */ }
    if (!result) {
      if (Date.now() < blockedUntil) return reply("Source is rate limited. Try again later or use Jobicy.", 429);
      // Fetch/Response objects belong to this invocation. Cross-request reuse goes through the edge cache.
      const pending = (async () => {
          // Workers supports manual/follow, not the standard browser "error" redirect mode.
          const response = await requestUpstream(upstream.href, { headers: { Accept: "application/json" }, redirect: "manual", signal: AbortSignal.timeout(15000) });
          if (!response.ok) {
            if (response.status === 429) {
              const retry = response.headers.get("Retry-After");
              const until = retry && /^\d+$/.test(retry) ? Date.now() + Number(retry) * 1000 : retry ? Date.parse(retry) : NaN;
              blockedUntil = Math.max(Date.now() + 60000, Number.isFinite(until) ? until : 0);
            }
            return new Response(JSON.stringify({ error: "The remote-job source is unavailable. Try again later or use Jobicy." }), { status: response.status === 429 ? 429 : 502, headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...(response.status === 429 ? { "Retry-After": String(Math.ceil((blockedUntil - Date.now()) / 1000)) } : {}) } });
          }
          const data = await response.json() as { jobs?: unknown };
          if (!Array.isArray(data.jobs)) throw new Error("Unsupported source response");
          const jobs = data.jobs.flatMap(item => { const job = himalayasJobFromApi(item, geo === "anywhere"); return job ? [job] : []; });
          const body = { jobs, nextCursor: data.jobs.length === 20 && Number(page) < 100 ? String(Number(page) + 1) : null, fetchedAt: Date.now(), stale: false, appliedFilters: { geo, q, page: Number(page), country: "Philippines", timezone: 8 } };
          const normalized = Response.json(body, { headers: { "Cache-Control": `public, max-age=${DAY}`, "Content-Type": "application/json; charset=utf-8" } });
          if (cache) context.waitUntil(cache.put(key, normalized.clone()).catch(() => {}));
          return normalized;
        })();
      try { result = (await pending).clone(); } catch (cause) {
        console.warn("Job feed request failed", cause instanceof Error ? `${cause.name}: ${cause.message}` : "Unknown upstream error");
        return reply("The remote-job source could not be loaded. Try Jobicy or try again later.", 502);
      }
    }
    if (result.ok) headers.set("Cache-Control", `public, max-age=${DAY}`);
    if (result.headers.has("Retry-After")) headers.set("Retry-After", result.headers.get("Retry-After")!);
    return new Response(result.body, { status: result.status, headers });
  };
}

let handler: ReturnType<typeof createHandler> | undefined;
export default { fetch(request: Request, env: Env, context: Context) {
  handler ??= createHandler((input, init) => globalThis.fetch(input, init), (caches as unknown as { default: WorkerCache }).default);
  return handler(request, env, context);
} };

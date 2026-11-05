"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { HIMALAYAS_PROXY, jobFeed } from "@/lib/job-feed";
import { arrangementLabel, filterJobs, matchingSkills, type Job, type JobFilters, type JobSearch } from "@/lib/jobs-model";
import { useSavedJobs } from "./use-saved-jobs";

const defaultSearch: JobSearch = { keyword: HIMALAYAS_PROXY ? "WordPress" : "", geo: "philippines", provider: HIMALAYAS_PROXY ? "himalayas" : "jobicy" };
const defaults: JobFilters = { keyword: "", focus: "development", salaryOnly: false, sort: "skills" };
const dateLabel = (value: number) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(new Date(value));
const sourceUrl = (job: Job) => job.source === "Jobicy" ? "https://jobicy.com/" : job.source === "Himalayas" ? "https://himalayas.app/" : "https://www.arbeitnow.com/";

export function JobFinder() {
  const saved = useSavedJobs();
  const [view, setView] = useState<"browse" | "saved">("browse");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [draftSearch, setDraftSearch] = useState<JobSearch>(defaultSearch);
  const [search, setSearch] = useState<JobSearch>(defaultSearch);
  const [filters, setFilters] = useState<JobFilters>(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [fetchedAt, setFetchedAt] = useState<number | null>(null);
  const [stale, setStale] = useState(false);
  const [visible, setVisible] = useState(20);
  const [now, setNow] = useState(Date.now);
  const alive = useRef(true);
  const requestId = useRef(0);
  const savedIds = useMemo(() => new Set(saved.jobs.map(job => job.sourceId)), [saved.jobs]);
  const sourceJobs = useMemo(() => view === "saved" ? saved.jobs : jobs.filter(job => !job.expiresAt || job.expiresAt > now), [view, saved.jobs, jobs, now]);
  const matches = useMemo(() => filterJobs(sourceJobs, view === "saved" ? { ...filters, focus: "all" } : filters), [sourceJobs, filters, view]);

  async function load(query: JobSearch, next: string | null = null) {
    const id = ++requestId.current;
    setLoading(true); setError("");
    if (!next) { setSearch(query); setJobs([]); setCursor(null); setFetchedAt(null); setStale(false); setVisible(20); }
    try {
      const result = await jobFeed.get(query, next);
      if (!alive.current || id !== requestId.current) return;
      setJobs(existing => [...new Map([...(next ? existing : []), ...result.jobs].map(job => [job.sourceId, job])).values()]);
      setCursor(result.nextCursor === next ? null : result.nextCursor); setFetchedAt(result.fetchedAt); setStale(current => next ? current || result.stale : result.stale);
    } catch (cause) { if (alive.current && id === requestId.current) setError(cause instanceof Error ? cause.message : "Jobs could not be loaded. Please try again later."); }
    finally { if (alive.current && id === requestId.current) setLoading(false); }
  }
  useEffect(() => {
    alive.current = true; void load(defaultSearch);
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => { alive.current = false; requestId.current++; clearInterval(timer); };
  }, []);

  function change<Key extends keyof JobFilters>(key: Key, value: JobFilters[Key]) { setFilters(current => ({ ...current, [key]: value })); setVisible(20); }
  const pending = view === "saved" ? saved.loading : loading;
  const broader = search.provider === "himalayas";
  const providerName = broader ? "Himalayas" : "Jobicy";
  return <>
    <div className="admin-heading"><div><p className="eyebrow">Remote work / Philippines / UTC+8</p><h1>Job Finder</h1><p>Find remote opportunities that fit your web development experience.</p></div><a className="text-link" href={broader ? "https://himalayas.app/" : "https://jobicy.com/"} target="_blank" rel="noopener noreferrer">Listings by {providerName} ↗</a></div>
    <div className="job-source-note"><strong>Your search starts in the Philippines</strong><p>{broader ? "Himalayas results are checked for Philippines or worldwide country eligibility and UTC+8 timezone compatibility. Its free feed refreshes daily; dates can reflect listing updates. " : "Jobicy’s free feed covers remote listings published in the last 7 days. Its Philippines filter can include worldwide and broader regional roles. "}Eligibility labels are source data: confirm Philippine hiring, required working hours in UTC+8, and any office or travel requirements in the original posting.</p></div>
    <div className="job-view-switch" role="group" aria-label="Job list"><button type="button" aria-pressed={view === "browse"} onClick={() => { setView("browse"); setVisible(20); }}>Browse remote jobs</button><button type="button" aria-pressed={view === "saved"} onClick={() => { setView("saved"); setVisible(20); }}>Saved jobs{!saved.loading ? ` (${saved.jobs.length})` : ""}</button></div>
    {view === "browse" && <form className="admin-card job-search" onSubmit={event => { event.preventDefault(); void load({ ...draftSearch, keyword: draftSearch.keyword.trim() }); }} aria-label="Search remote jobs">
      <div><label htmlFor="job-provider">Job source</label><select id="job-provider" value={draftSearch.provider} onChange={e => setDraftSearch(current => ({ ...current, provider: e.target.value as JobSearch["provider"] }))}><option value="himalayas" disabled={!HIMALAYAS_PROXY}>Himalayas · broader search{!HIMALAYAS_PROXY ? " (not connected)" : ""}</option><option value="jobicy">Jobicy · last 7 days</option></select></div>
      <div><label htmlFor="job-search">Search the source</label><input id="job-search" type="search" value={draftSearch.keyword} minLength={3} maxLength={50} placeholder="WordPress, PHP, front end…" onChange={e => setDraftSearch(current => ({ ...current, keyword: e.target.value }))} /></div>
      <div><label htmlFor="job-eligibility">Location eligibility</label><select id="job-eligibility" value={draftSearch.geo} onChange={e => setDraftSearch(current => ({ ...current, geo: e.target.value as JobSearch["geo"] }))}><option value="philippines">Philippines eligible</option><option value="anywhere">Worldwide only</option></select></div>
      <button type="submit" className="button" disabled={loading}>Search remote jobs</button>
      <div className="job-quick-search" role="group" aria-label="Quick role searches"><span>Quick search</span>{["WordPress", "WooCommerce", "PHP", "front end", "full stack"].map(keyword => <button type="button" key={keyword} disabled={loading} onClick={() => { const query = { ...draftSearch, keyword }; setDraftSearch(query); void load(query); }}>{keyword}</button>)}<button type="button" disabled={loading} onClick={() => { const query = { ...draftSearch, keyword: "", geo: "philippines" as const }; setDraftSearch(query); void load(query); }}>All PH remote roles</button></div>
      <p className="form-note">Search submits keyword and eligibility filters to the selected source. No requests while you type. Himalayas results are cached for 24 hours; Jobicy for one hour.</p>
    </form>}
    <form className="admin-card job-filters" onSubmit={event => event.preventDefault()} aria-label="Filter loaded jobs">
      <div><label htmlFor="job-keyword">Narrow loaded results</label><input id="job-keyword" type="search" value={filters.keyword} maxLength={150} placeholder="Title, company or summary" onChange={e => change("keyword", e.target.value)} /></div>
      {view === "browse" && <div><label htmlFor="job-focus">Role focus</label><select id="job-focus" value={filters.focus} onChange={e => change("focus", e.target.value as JobFilters["focus"])}><option value="development">Web &amp; software development</option><option value="all">All roles</option></select></div>}
      <div><label htmlFor="job-sort">Order loaded results</label><select id="job-sort" value={filters.sort} onChange={e => change("sort", e.target.value as JobFilters["sort"])}><option value="skills">Your skill keywords first</option><option value="recent">Newest first</option></select></div>
      <label className="job-checkbox"><input type="checkbox" checked={filters.salaryOnly} onChange={e => change("salaryOnly", e.target.checked)} />Salary disclosed</label>
      <button type="button" className="job-clear" onClick={() => { setFilters({ ...defaults, focus: "all" }); setVisible(20); }}>Clear local filters</button>
      <p className="form-note">These controls filter the {sourceJobs.length} loaded {view === "saved" ? "saved" : "remote"} listings. Skill order uses WordPress, WooCommerce, PHP, front-end, full-stack and JavaScript keywords in titles/summaries; it is not a hiring score. {view === "browse" && `Source search: ${search.keyword || "all keywords"}; ${search.geo === "philippines" ? "Philippines eligible" : "worldwide only"}.`}</p>
    </form>
    {view === "browse" && error && <div className="job-feedback" role="alert"><p>{error}</p><button type="button" disabled={loading} onClick={() => load(search, jobs.length ? cursor : null)}>Try again</button><button type="button" disabled={loading} onClick={() => load(search)}>Start new search</button></div>}
    {saved.error && <p role="alert" className="form-error">Saved jobs: {saved.error}</p>}
    {view === "browse" && stale && <p role="status" className="job-feedback">The source could not be refreshed. Showing cached listings from the fetched date below; confirm availability on {providerName}. Start a new search later to refresh.</p>}
    <div className="job-results-heading"><p role="status" aria-live="polite">{pending ? "Loading jobs…" : `${matches.length} ${matches.length === 1 ? "job" : "jobs"} found`}</p>{view === "browse" && fetchedAt !== null && <span>Fetched {dateLabel(fetchedAt)} · Manila time</span>}</div>
    {!pending && !matches.length && !(view === "browse" && error) && !(view === "saved" && saved.error) && <section className="admin-card job-empty"><h2>{view === "saved" && !saved.jobs.length ? "Your shortlist starts here." : "No matching opportunities in this view."}</h2><p>{view === "saved" && !saved.jobs.length ? "Save opportunities from Browse remote jobs to find them here later." : "Try another keyword, load another page, switch Role focus to All roles, or clear local filters. Try the other source or the wider search below too."}</p></section>}
    <div className="job-results" aria-busy={pending}>{matches.slice(0, visible).map(job => {
      const bookmarked = savedIds.has(job.sourceId); const updating = saved.pending.has(job.sourceId); const skills = matchingSkills(job);
      return <article className="admin-card job-card" key={job.sourceId}>
        <div className="job-card-top"><p className="job-company">{job.company}</p><span className={`job-arrangement${job.remote === true ? " is-remote" : ""}`}>{arrangementLabel(job.remote)}</span></div>
        <h2><a href={job.url} target="_blank" rel="noopener noreferrer">{job.title}</a></h2>
        {job.summary && <p className="job-summary">{job.summary}</p>}
        {job.expiresAt && job.expiresAt <= now && <p className="form-error">Expired according to the source. Kept here so you can review or remove your bookmark.</p>}
        {!!skills.length && <ul className="job-skill-tags" aria-label="Matching skill keywords">{skills.map(skill => <li key={skill}>{skill}</li>)}</ul>}
        <dl className="job-details"><div><dt>Location eligibility</dt><dd>{job.location}</dd></div>{job.timezone && <div><dt>Timezone eligibility</dt><dd>{job.timezone}</dd></div>}<div><dt>{job.source === "Himalayas" ? "Published / updated" : "Posted"}</dt><dd>{job.postedAt ? <time dateTime={new Date(job.postedAt).toISOString()}>{dateLabel(job.postedAt)}</time> : "Not provided"}</dd></div><div><dt>Employment</dt><dd>{job.employment || "Not provided"}</dd></div><div><dt>Listed pay</dt><dd>{job.salary || "Not disclosed"}</dd></div><div><dt>Source</dt><dd><a href={sourceUrl(job)} target="_blank" rel="noopener noreferrer">{job.source}</a></dd></div></dl>
        <div className="job-card-actions"><a className="button" href={job.url} target="_blank" rel="noopener noreferrer">{job.expiresAt && job.expiresAt <= now ? `View expired posting on ${job.source}` : `View & apply on ${job.source}`} <span aria-hidden="true">↗</span></a><button type="button" className="job-bookmark" aria-pressed={bookmarked} disabled={!saved.writable || updating} onClick={() => saved.toggle(job)}>{updating ? "Updating…" : bookmarked ? "Remove saved" : "Save job"}</button></div>
      </article>;
    })}</div>
    <div className="job-pagination">{matches.length > visible && <button type="button" className="button secondary" onClick={() => setVisible(value => value + 20)}>Show more matches</button>}{view === "browse" && cursor && <button type="button" className="button secondary" disabled={loading} onClick={() => load(search, cursor)}>{loading ? "Loading listings…" : `Load more from ${providerName}`}</button>}</div>
    {view === "saved" && <p className="form-note">Saved listings may expire; check the original posting before applying. Existing Arbeitnow bookmarks are retained.{saved.jobs.length >= 100 ? " Showing your 100 most recent saved jobs." : ""}</p>}
    <section className="admin-card job-wider-search"><h2>Widen your search</h2><p>Open the full Philippines remote-job board to explore more roles. Review the full description and UTC+8 schedule before applying.</p><a className="text-link" href="https://himalayas.app/jobs/countries/philippines" target="_blank" rel="noopener noreferrer">Browse Philippines remote roles on Himalayas ↗</a><p className="form-note">Opens a separate job board. Jobs viewed there are not automatically saved here.</p></section>
  </>;
}

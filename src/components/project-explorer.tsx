"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/content/site";
import { findIndustry, industries, industryPath, type IndustrySlug } from "@/content/industries";
import { portfolioIndustryGroups, projectTypeOptions } from "@/content/portfolio-filter-groups";
import { filterProjects, projectFacetOptions, projectSearchText, technologyOptions, type FilterGroup } from "@/lib/project-filters";
import { copyFilteredPortfolio, createProjectFilterSession } from "@/lib/project-filter-session";
import { ProjectFilterDropdown } from "./project-filter-dropdown";
import { ProjectGrid } from "./project-grid";

export function ProjectExplorer({ projects, industry }: { projects: Project[]; industry?: IndustrySlug }) {
  const published = useMemo(() => projects.filter(project => project.publication === "published"), [projects]);
  const technologies = useMemo(() => technologyOptions(published), [published]);
  const searchIndex = useMemo(() => new Map(published.map(project => [project.slug, projectSearchText(project)])), [published]);
  const session = useMemo(() => createProjectFilterSession({ href: () => window.location.href, write: (url, mode) => window.history[mode === "push" ? "pushState" : "replaceState"](null, "", url) }, technologies.map(option => option.label), industry), [technologies, industry]);
  const [snapshot, setSnapshot] = useState(session.snapshot);
  const [openGroup, setOpenGroup] = useState<FilterGroup | null>(null);
  const [share, setShare] = useState<{ message: string; url: string; copied: boolean } | null>(null);
  const [copying, setCopying] = useState(false);
  useEffect(() => {
    const stop = session.subscribe(next => { setSnapshot(next); setShare(null); });
    const restore = () => { session.restore(); setOpenGroup(null); };
    restore(); window.addEventListener("popstate", restore);
    return () => { stop(); session.dispose(); window.removeEventListener("popstate", restore); };
  }, [session]);
  const { filters } = snapshot;
  const visible = useMemo(() => filterProjects(published, filters, searchIndex), [published, filters, searchIndex]);
  const groups = useMemo(() => projectFacetOptions(published, filters, "industries", portfolioIndustryGroups), [published, filters]);
  const availableTechnologies = useMemo(() => projectFacetOptions(published, filters, "technologies", technologies), [published, filters, technologies]);
  const typeOptions = useMemo(() => projectFacetOptions(published, filters, "types", projectTypeOptions), [published, filters]);
  const activeCount = filters.industries.length + filters.technologies.length + filters.types.length + (filters.q ? 1 : 0);
  const hasInput = activeCount > 0 || !!snapshot.query;
  const chips = [
    ...filters.industries.map(value => ({ group: "industries" as const, value, label: groups.find(group => group.value === value)?.label || value })),
    ...filters.technologies.map(value => ({ group: "technologies" as const, value, label: technologies.find(option => option.value === value)?.label || value })),
    ...filters.types.map(value => ({ group: "types" as const, value, label: projectTypeOptions.find(option => option.value === value)?.label || value })),
  ];
  async function shareResults() {
    setCopying(true);
    const result = await copyFilteredPortfolio(session, navigator.clipboard?.writeText ? url => navigator.clipboard.writeText(url) : undefined);
    setShare(result); setCopying(false);
  }
  const dropdown = (group: FilterGroup, label: string, options: { value: string; label: string; count?: number; disabled?: boolean }[]) => <ProjectFilterDropdown label={label} options={options} selected={filters[group]} open={openGroup === group} disabled={!snapshot.ready} onOpen={() => setOpenGroup(group)} onClose={() => setOpenGroup(current => current === group ? null : current)} onToggle={value => { if (!options.find(option => option.value === value)?.disabled) session.toggle(group, value); }} onClear={() => session.clearGroup(group)} />;
  return <div className="work-explorer">
    <div className="portfolio-directory-controls">
      <form className="portfolio-search" role="search" aria-label="Search portfolio projects" onSubmit={event => { event.preventDefault(); session.flushSearch(); }}>
        <label htmlFor="portfolio-keyword">Find relevant work</label><div className="portfolio-search-input"><svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5" /></svg><input id="portfolio-keyword" type="search" maxLength={200} placeholder="Search WordPress, React, real estate, dental..." value={snapshot.query} disabled={!snapshot.ready} onFocus={() => session.focusSearch()} onChange={event => session.search(event.target.value)} aria-describedby="portfolio-search-help" /></div>
      </form>
      <div className="portfolio-filter-toolbar" aria-label="Portfolio filters">
        {!industry && dropdown("industries", "Industry", groups)}
        {dropdown("technologies", "Technology", availableTechnologies)}
        {dropdown("types", "Project Type", typeOptions)}
        <button type="button" className="portfolio-clear-all" disabled={!snapshot.ready || !hasInput} onClick={() => { session.clearAll(); setOpenGroup(null); }}>Clear All</button>
        <button type="button" className="portfolio-share" disabled={!snapshot.ready || copying} onClick={shareResults}>{copying ? "Copying…" : "Share these results"}</button>
      </div>
      <p id="portfolio-search-help" className="portfolio-search-help">Type to search all projects in this collection and clear dropdown filters. Choosing a filter clears the search. Unavailable combinations are disabled; counts reflect the other selected groups.</p>
      {industry && <p className="portfolio-fixed-collection">Collection: {findIndustry(industry)?.label} · <Link href="/work/">Explore all industries ↗</Link></p>}
      <div className="portfolio-active-filters" aria-label="Active portfolio filters">
        {filters.q && <button type="button" className="portfolio-filter-chip" aria-label={`Remove search: ${filters.q}`} onClick={() => session.clearSearch()}>Search: {filters.q} <span aria-hidden="true">×</span></button>}
        {chips.map(chip => <button type="button" className="portfolio-filter-chip" key={`${chip.group}-${chip.value}`} aria-label={`Remove ${chip.group === "types" ? "project type" : chip.group === "industries" ? "industry" : "technology"}: ${chip.label}`} onClick={() => session.toggle(chip.group, chip.value)}>{chip.label} <span aria-hidden="true">×</span></button>)}
        {!activeCount && <span className="portfolio-no-filters">{industry ? "All projects in this collection" : "All published projects"}</span>}
      </div>
      <div className="portfolio-share-feedback" aria-live="polite" role="status">{share && <><p>{share.message}</p>{!share.copied && <label>Link to these results<input type="text" readOnly value={share.url} onFocus={event => event.target.select()} /></label>}</>}</div>
    </div>
    <div className="project-results-summary"><p className="project-count" role="status" aria-live="polite">{!snapshot.ready ? "Loading portfolio filters…" : snapshot.searching ? "Searching projects…" : `${visible.length} ${visible.length === 1 ? "project" : "projects"} found`}</p></div>
    <div className="portfolio-results" aria-busy={!snapshot.ready || snapshot.searching}>{snapshot.ready && (visible.length ? <ProjectGrid projects={visible} headingLevel={2} detailed /> : <div className="empty-state project-empty"><h2>No published projects match these selections.</h2><p>Try fewer options, remove a chip, or clear the search. Only documented public work appears here.</p><div className="actions">{snapshot.query && <button type="button" className="button secondary" onClick={() => session.clearSearch()}>Clear search</button>}<button type="button" className="button secondary" onClick={() => session.clearAll()}>Clear All</button><Link className="text-link" href="/contact/?topic=experience#inquiry">Discuss your website ↗</Link></div></div>)}</div>
    <noscript><p>Enable JavaScript to search and filter. Browse the published collection below or open a dedicated industry page.</p>{published.length ? <ProjectGrid projects={published} headingLevel={2} detailed /> : <p>No published projects in this collection yet.</p>}</noscript>
    {!industry && <details className="industry-collection-links"><summary>Browse dedicated industry collections</summary><p>Permanent portfolio pages to explore or share with a client or recruiter.</p><nav aria-label="Industry portfolio collections"><ul>{industries.map(item => <li key={item.slug}><Link href={industryPath(item.slug)}>{item.label} ↗</Link></li>)}</ul></nav></details>}
  </div>;
}

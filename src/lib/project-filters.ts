import { findIndustry, type IndustrySlug } from "@/content/industries";
import { filterValue, normalizeIndustry, portfolioIndustryGroups, projectIndustryGroups, projectTypeOptions, type PortfolioIndustry } from "@/content/portfolio-filter-groups";
import type { Project } from "@/content/site";

export type ProjectFilters = { q: string; industries: PortfolioIndustry[]; technologies: string[]; types: string[] };
export type FilterGroup = "industries" | "technologies" | "types";
export const emptyProjectFilters = (): ProjectFilters => ({ q: "", industries: [], technologies: [], types: [] });
export const cleanKeyword = (value: string) => value.replace(/\s+/g, " ").trim().slice(0, 200);
const unique = (values: string[]) => [...new Set(values)].sort();
const techAliases: Record<string, string> = { wp: "wordpress", nextjs: "next-js", tailwind: "tailwind-css", typescript: "typescript", ts: "typescript", js: "javascript" };
export const technologyValue = (label: string) => techAliases[filterValue(label)] || filterValue(label);
export function technologyOptions(projects: Project[]) {
  return [...new Map(projects.filter(project => project.publication === "published").flatMap(project => project.technologies.map(label => [technologyValue(label), { value: technologyValue(label), label }] as const))).values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function readProjectFilters(search: string, technologies: string[], fixedIndustry?: IndustrySlug): ProjectFilters {
  const query = new URLSearchParams(search);
  const keyword = cleanKeyword(query.get("q") || "");
  // Search and dropdowns are separate modes, including when restoring an older combined URL.
  if (keyword) return { ...emptyProjectFilters(), q: keyword };
  const values = (key: string) => query.getAll(key).flatMap(value => value.split(",")).map(value => value.trim()).filter(Boolean);
  const validTech = new Set(technologies.map(technologyValue));
  const typeValue = (value: string) => projectTypeOptions.find(option => [option.value, option.projectType, filterValue(option.label)].includes(filterValue(value)))?.value;
  return {
    q: "",
    industries: fixedIndustry ? [] : unique(values("industry").flatMap(value => { const industry = normalizeIndustry(value); return industry ? [industry] : []; })) as PortfolioIndustry[],
    technologies: unique(values("technology").map(technologyValue).filter(value => validTech.has(value))),
    types: unique(values("type").flatMap(value => { const type = typeValue(value); return type ? [type] : []; })),
  };
}
export function projectFilterUrl(href: string, filters: ProjectFilters, fixedIndustry?: IndustrySlug) {
  const url = new URL(href);
  const query = new URLSearchParams();
  const q = cleanKeyword(filters.q);
  if (q) query.set("q", q);
  if (!q) {
    if (!fixedIndustry && filters.industries.length) query.set("industry", unique(filters.industries).join(","));
    if (filters.technologies.length) query.set("technology", unique(filters.technologies.map(technologyValue)).join(","));
    if (filters.types.length) query.set("type", unique(filters.types).join(","));
  }
  const pathname = url.pathname.endsWith("/") ? url.pathname : `${url.pathname}/`;
  return `${pathname}${query.size ? `?${query.toString().replace(/%2C/g, ",")}` : ""}`;
}

export function searchableText(value: string) {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\bwp\b/g, "wordpress").replace(/\breal estates?\b/g, "real estate").replace(/\bproperties\b/g, "property")
    .replace(/\bfront end\b/g, "frontend").replace(/\bfull stack\b/g, "fullstack").replace(/\bnext js\b/g, "nextjs")
    .replace(/\be commerce\b/g, "ecommerce").replace(/\bhealth care\b/g, "healthcare").replace(/\borthodontics?\b/g, "orthodontic")
    .replace(/\s+/g, " ").trim();
}
export function projectSearchText(project: Project) {
  const groups = projectIndustryGroups(project).map(value => portfolioIndustryGroups.find(group => group.value === value)!);
  const type = projectTypeOptions.find(option => option.projectType === project.projectType)?.label || "";
  // Only facts in project records are indexed. Industry service-page copy is deliberately excluded.
  return searchableText([project.title, project.summary, project.description || "", project.role, ...project.technologies,
    ...project.industries.map(slug => findIndustry(slug)?.label || slug), ...groups.flatMap(group => [group.label, ...group.aliases]), type,
    ...(project.features || []), ...(project.capabilities || []), ...(project.tags || []), ...(project.contributions || []),
    // Next.js is a React framework; this search alias does not add an unverified React technology option.
    project.technologies.some(value => technologyValue(value) === "next-js") ? "react" : "",
  ].join(" "));
}
export function filterProjects(projects: Project[], filters: ProjectFilters, searchIndex?: Map<string, string>) {
  const tokens = [...new Set(searchableText(filters.q).split(" ").filter(Boolean))];
  return projects.filter(project => project.publication === "published"
    && (tokens.length > 0 || !filters.industries.length || projectIndustryGroups(project).some(value => filters.industries.includes(value)))
    && (tokens.length > 0 || !filters.technologies.length || project.technologies.some(value => filters.technologies.includes(technologyValue(value))))
    && (tokens.length > 0 || !filters.types.length || projectTypeOptions.some(option => option.projectType === project.projectType && filters.types.includes(option.value)))
    && tokens.every(token => (searchIndex?.get(project.slug) || projectSearchText(project)).includes(token)));
}

export function projectFacetOptions<Option extends { value: string; label: string }>(projects: Project[], filters: ProjectFilters, group: FilterGroup, options: readonly Option[]) {
  // Ignore this group's OR choices and the independent keyword search. Count against the other groups only.
  const context = { ...filters, q: "", [group]: [] };
  return options.map(option => {
    const count = filterProjects(projects, { ...context, [group]: [option.value] }).length;
    // A selected option from an old/shared URL must remain removable even if it has no matches.
    const selected = (filters[group] as readonly string[]).includes(option.value);
    return { ...option, count, disabled: count === 0 && !selected };
  });
}
export const projectTypeLabel = (type: Project["projectType"]) => ({ client: "Client project", venture: "Personal venture", concept: "Concept / Demo" })[type];
export const projectStatusLabel = (status: Project["status"]) => ({ archived: "Portfolio archive", live: "Live", planned: "Planned", "in-progress": "In progress" })[status];
export const caseStudyUrl = (project: Project) => project.caseStudyUrl || `/work/${project.slug}/`;

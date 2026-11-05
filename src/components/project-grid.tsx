import Link from "next/link";
import type { Project } from "@/content/site";
import { Arrow } from "./ui";
import { portfolioIndustryGroups, projectIndustryGroups } from "@/content/portfolio-filter-groups";
import { caseStudyUrl, projectTypeLabel } from "@/lib/project-filters";
export function ProjectGrid({ projects, headingLevel = 3, detailed = false }: { projects: Project[]; headingLevel?: 2 | 3; detailed?: boolean }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  if (detailed) return <div className="project-grid">{projects.filter(project => project.publication === "published").map(project => <article className={`project-card project-card-detailed project-type-${project.projectType}`} key={project.slug}>
    <Link href={caseStudyUrl(project)} className="project-cover" aria-label={`${project.title} project`}>{project.image ? <img src={project.image.src} alt={project.image.alt} width={960} height={600} loading="lazy" /> : <span aria-hidden="true">&lt;/&gt;</span>}</Link>
    <div className="project-info"><div className="project-card-meta"><span className={`project-type-label type-${project.projectType}`}>{projectTypeLabel(project.projectType)}</span>{project.year && <span>{project.year}</span>}</div>
      <Heading><Link href={caseStudyUrl(project)}>{project.title} <Arrow /></Link></Heading>
      <ul className="project-industries" aria-label="Industries">{projectIndustryGroups(project).map(value => <li key={value}><Link href={`/work/?industry=${value}`}>{portfolioIndustryGroups.find(group => group.value === value)?.label}</Link></li>)}</ul>
      <p>{project.summary}</p><ul className="tags" aria-label="Technologies">{project.technologies.map(tag => <li key={tag}>{tag}</li>)}</ul>
      <div className="project-card-actions"><Link href={caseStudyUrl(project)} aria-label={`View case study: ${project.title}`}>View case study <Arrow /></Link>{project.website && (project.website.startsWith("/") ? <Link href={project.website} aria-label={`View live website: ${project.title}`}>View live website <Arrow /></Link> : <a href={project.website} target="_blank" rel="noopener noreferrer" aria-label={`View live website: ${project.title}`}>View live website <Arrow /></a>)}</div>
    </div>
  </article>)}</div>;
  return <div className="project-grid">{projects.map(project => <article className="project-card" key={project.slug}>
    <Link href={`/work/${project.slug}/`}><div className="project-cover">{project.image ? <img src={project.image.src} alt={project.image.alt} width={960} height={600} loading="lazy" /> : <span aria-hidden="true">&lt;/&gt;</span>}</div><div className="project-info"><p className="eyebrow">{project.year} / {project.role}</p><Heading>{project.title} <Arrow /></Heading><p>{project.summary}</p><ul className="tags" aria-label="Technologies">{project.technologies.map(tag => <li key={tag}>{tag}</li>)}</ul></div></Link>
  </article>)}</div>;
}

import Link from "next/link";
import type { Project } from "@/content/site";
import { Arrow } from "./ui";
export function ProjectGrid({ projects, headingLevel = 3 }: { projects: Project[]; headingLevel?: 2 | 3 }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <div className="project-grid">{projects.map(project => <article className="project-card" key={project.slug}>
    <Link href={`/work/${project.slug}/`}><div className="project-cover">{project.image ? <img src={project.image.src} alt={project.image.alt} width={960} height={600} loading="lazy" /> : <span aria-hidden="true">&lt;/&gt;</span>}</div><div className="project-info"><p className="eyebrow">{project.year} / {project.role}</p><Heading>{project.title} <Arrow /></Heading><p>{project.summary}</p><ul className="tags" aria-label="Technologies">{project.technologies.map(tag => <li key={tag}>{tag}</li>)}</ul></div></Link>
  </article>)}</div>;
}

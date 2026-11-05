import { ZoomImage } from "@/components/zoom-image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { projects } from "@/content/site";
import { PageIntro } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
import { findIndustry, industryPath } from "@/content/industries";
import { projectStatusLabel, projectTypeLabel } from "@/lib/project-filters";

export const dynamicParams = false;
export function generateStaticParams() { return projects.map(project => ({ slug: project.slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  return project ? pageMetadata(project.seo?.title || project.title, project.seo?.description || project.summary, `/work/${project.slug}/`) : {};
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  if (!project) notFound();
  const facts = [["Project objectives", project.objectives], ["My contributions", project.contributions], ["Features implemented", project.features]] as const;
  return <><PageIntro eyebrow={`Selected work / ${project.year ?? "Project"}`} title={project.title}><p>{project.summary}</p></PageIntro>
    <section className="section project-detail"><div className="project-detail-image">{project.image && <ZoomImage src={project.image.src} alt={project.image.alt} width={960} height={600} />}</div><aside><p className="eyebrow">Project snapshot</p><p className="project-snapshot-type"><span className={`project-type-label type-${project.projectType}`}>{projectTypeLabel(project.projectType)}</span></p><h2>{project.role}</h2><ul className="project-industries" aria-label="Industries">{project.industries.map(slug => <li key={slug}><Link href={industryPath(slug)}>{findIndustry(slug)?.label}</Link></li>)}</ul><ul className="tags" aria-label="Technologies">{project.technologies.map(tag => <li key={tag}>{tag}</li>)}</ul><p className="body-copy">{project.year ? `${project.year} · ` : ""}{projectStatusLabel(project.status)}</p>{project.website && (project.website.startsWith("/") ? <Link className="button secondary" href={project.website}>Visit website <span aria-hidden="true">↗</span></Link> : <a className="button secondary" href={project.website} target="_blank" rel="noopener noreferrer">Visit website <span aria-hidden="true">↗</span></a>)}{project.status === "archived" ? <p className="archive-note">The screenshot records the version featured in my original portfolio. The live website may have changed since this work. Detailed delivery scope and outcomes are not documented here.</p> : project.projectType === "venture" ? <p className="archive-note">Personal venture page within this portfolio, built with the technologies listed above. The preview shows the venture&apos;s supplied brand artwork.</p> : project.projectType === "concept" ? <p className="archive-note">An original fictional concept, not commissioned client work.</p> : null}</aside></section>
    {project.description && <section className="section"><h2>Project overview</h2><p className="lede project-overview-copy">{project.description}</p></section>}
    {facts.some(([, values]) => values?.length) && <section className="section project-facts">{facts.map(([heading, values]) => values?.length ? <article key={heading}><h2>{heading}</h2><ul>{values.map(value => <li key={value}>{value}</li>)}</ul></article> : null)}</section>}
    {!!project.gallery?.length && <section className="section"><div className="section-heading"><h2>Project previews</h2></div><div className="project-gallery">{project.gallery.map(image => <figure key={image.src}><ZoomImage src={image.src} alt={image.alt} width={image.width || 960} height={image.height || 600} gallery={project.gallery} caption={image.caption} />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</div></section>}
    {[['The challenge', project.challenge], ['The approach', project.approach], ['The outcome', project.outcome]].some(([, text]) => text) && <section className="section">{[['The challenge', project.challenge], ['The approach', project.approach], ['The outcome', project.outcome]].map(([heading, text]) => text && <article className="case-section" key={heading}><h2>{heading}</h2><p className="lede">{text}</p></article>)}</section>}
    <section className="contact-band"><Link className="text-link" href="/work/">← All work</Link><Link className="button" href="/contact/">Discuss your website ↗</Link></section></>;
}

import { ZoomImage } from "@/components/zoom-image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { projects } from "@/content/site";
import { PageIntro } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() { return projects.map(project => ({ slug: project.slug })); }
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  return project ? pageMetadata(project.title, project.summary, `/work/${project.slug}/`) : {};
}
export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = projects.find(project => project.slug === slug);
  if (!project) notFound();
  return <><PageIntro eyebrow={`Selected work / ${project.year ?? "Project"}`} title={project.title}><p>{project.summary}</p></PageIntro>
    <section className="section project-detail"><div className="project-detail-image">{project.image && <ZoomImage src={project.image.src} alt={project.image.alt} width={960} height={600} />}</div><aside><p className="eyebrow">Project snapshot</p><h2>{project.role}</h2><ul className="tags" aria-label="Project categories">{project.technologies.map(tag => <li key={tag}>{tag}</li>)}</ul><p className="body-copy">{project.year} · Portfolio archive</p>{project.website && <a className="button secondary" href={project.website} target="_blank" rel="noopener noreferrer">Visit website <span aria-hidden="true">↗</span></a>}<p className="archive-note">The screenshot records the version featured in my original portfolio. The live website may have changed since this work.</p></aside></section>
    {[['The challenge', project.challenge], ['The approach', project.approach], ['The outcome', project.outcome]].some(([, text]) => text) && <section className="section">{[['The challenge', project.challenge], ['The approach', project.approach], ['The outcome', project.outcome]].map(([heading, text]) => text && <article className="case-section" key={heading}><h2>{heading}</h2><p className="lede">{text}</p></article>)}</section>}
    <section className="contact-band"><Link className="text-link" href="/work/">← All work</Link><Link className="button" href="/contact/">Discuss your website ↗</Link></section></>;
}

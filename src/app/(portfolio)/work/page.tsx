import Link from "next/link";
import { projects } from "@/content/site";
import { PageIntro, Button } from "@/components/ui";
import { ProjectExplorer } from "@/components/project-explorer";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("Work", "Web development projects and case studies by John Semblante.", "/work/");
export default function Work() {
  const featured = projects[0];
  return <><div className="route-hero"><PageIntro eyebrow="Portfolio / Web development" title="Selected work."><p>Projects, decisions, and the details behind the build.</p><div className="actions"><Button href="/contact/">Get in touch</Button></div></PageIntro><BrowserIllustration /></div><section className="section">{projects.length ? <ProjectExplorer projects={projects} /> : <div className="empty-state"><p className="eyebrow">Project collection</p><h2>Case studies are on the way.</h2><p>Verified projects will appear here with screenshots, technology filters, and the story behind each build.</p></div>}</section>{featured && <section className="section featured-case"><div><p className="eyebrow">Featured project</p><h2>{featured.title}</h2><p className="lede">{featured.summary}</p><Button href={`/work/${featured.slug}/`} secondary>Explore the project</Button></div><dl><div><dt>My role</dt><dd>{featured.role}</dd></div><div><dt>Technology</dt><dd>{featured.technologies.join(" · ")}</dd></div>{featured.outcome && <div><dt>Outcome</dt><dd>{featured.outcome}</dd></div>}</dl></section>}<Workflow /><section className="contact-band"><div><p className="eyebrow">A new conversation</p><h2>Let’s talk about your idea.</h2></div><Link className="button" href="/contact/">Get in touch ↗</Link></section></>;
}

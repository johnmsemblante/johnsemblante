import { ExperienceSpotlight } from "@/components/experience-spotlight";
import Link from "next/link";
import { projects } from "@/content/site";
import { PageIntro, Button } from "@/components/ui";
import { ProjectExplorer } from "@/components/project-explorer";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("Work", "Explore selected WordPress and front-end projects by John Semblante, plus his approach to confidential professional work.", "/work/");
export default function Work() {
  const featured = projects[0];
  return <><div className="route-hero"><PageIntro eyebrow="Portfolio / Web development" title="Selected work."><p>Selected public projects from my portfolio. Explore the websites, then let’s talk about the development support your project needs.</p><div className="actions"><Button href="/contact/">Discuss your project</Button></div></PageIntro><BrowserIllustration /></div><ExperienceSpotlight /><section className="section">{projects.length ? <><div className="section-heading"><div><p className="eyebrow">The public collection</p><h2>Websites I’ve worked on.</h2></div></div><p className="body-copy">These examples document past work. Screenshots show the versions in my portfolio; live sites may have changed since then.</p><ProjectExplorer projects={projects} /></> : <div className="empty-state"><p className="eyebrow">Project collection</p><h2>Looking for relevant experience?</h2><p>Tell me what you are building and I can discuss the experience relevant to your project.</p></div>}</section>{featured && <section className="section featured-case"><div><p className="eyebrow">From the project collection</p><h2>{featured.title}</h2><p className="lede">{featured.summary}</p><Button href={`/work/${featured.slug}/`} secondary>Explore the project</Button></div><dl><div><dt>Work category</dt><dd>{featured.role}</dd></div><div><dt>Technology</dt><dd>{featured.technologies.join(" · ")}</dd></div>{featured.outcome && <div><dt>Outcome</dt><dd>{featured.outcome}</dd></div>}</dl></section>}<Workflow /><section className="contact-band"><div><p className="eyebrow">A new conversation</p><h2>Let’s talk about your idea.</h2></div><Link className="button" href="/contact/">Discuss your project ↗</Link></section></>;
}

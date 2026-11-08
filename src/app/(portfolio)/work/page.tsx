import { ExperienceSpotlight } from "@/components/experience-spotlight";
import Link from "next/link";
import { buildWorks } from "@/lib/build-works";
import { PageIntro, Button } from "@/components/ui";
import { LiveWorkExplorer } from "@/components/live-works";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { profile } from "@/content/profile";
import { pageMetadata } from "@/lib/metadata";
const workTitle = `${profile.fullName} | WordPress Portfolio & Projects`;
export const metadata = { ...pageMetadata(workTitle, `Explore ${profile.fullName}'s WordPress portfolio: client websites, UI implementation and personal ventures. Browse projects by industry and technology.`, "/work/"), title: { absolute: workTitle } };
const projects = buildWorks();

export default function Work() {
  const featured = projects[0];
  const heroProjects = ["roar-fitness", "perth-cosmetic-surgery"].flatMap(slug => {
    const project = projects.find(item => item.slug === slug);
    return project?.image ? [{ src: project.image.src, name: project.title, width: 516, height: 337 }] : [];
  });
  return <><div className="route-hero"><PageIntro eyebrow={`${profile.fullName} / Selected work`} title="WordPress portfolio & projects."><p>Explore my work as a {profile.title} through selected client websites and personal ventures. Browse the projects, then let’s talk about the development support your project needs.</p><div className="actions"><Button href="/contact/">Discuss your project</Button><Button href="#projects" secondary>Browse by industry</Button></div></PageIntro><BrowserIllustration showcase={{ kind: "work", label: "FROM THE PUBLIC COLLECTION", caption: "Real projects. Thoughtful design, brought to life.", images: heroProjects }} /></div><ExperienceSpotlight /><section className="section" id="projects">{projects.length ? <><div className="section-heading"><div><p className="eyebrow">The public collection</p><h2>Websites I’ve worked on.</h2></div></div><p className="body-copy">Explore historical WordPress and front-end projects alongside my independent ventures. Filter by industry and technology to find relevant examples. Historical screenshots show the versions in my portfolio; live sites may have changed since then.</p><LiveWorkExplorer initial={projects} /></> : <div className="empty-state"><p className="eyebrow">Project collection</p><h2>Looking for relevant experience?</h2><p>Tell me what you are building and I can discuss the experience relevant to your project.</p></div>}</section>{featured && <section className="section featured-case"><div><p className="eyebrow">From the project collection</p><h2>{featured.title}</h2><p className="lede">{featured.summary}</p><Button href={`/work/${featured.slug}/`} secondary>Explore the project</Button></div><dl><div><dt>Work category</dt><dd>{featured.role}</dd></div><div><dt>Technology</dt><dd>{featured.technologies.join(" · ")}</dd></div>{featured.outcome && <div><dt>Outcome</dt><dd>{featured.outcome}</dd></div>}</dl></section>}<Workflow /><section className="contact-band"><div><p className="eyebrow">A new conversation</p><h2>Let’s talk about your idea.</h2></div><Link className="button" href="/contact/">Discuss your project ↗</Link></section></>;
}

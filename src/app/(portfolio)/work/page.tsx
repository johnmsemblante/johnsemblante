import { ExperienceSpotlight } from "@/components/experience-spotlight";
import Link from "next/link";
import { buildWorks } from "@/lib/build-works";
import { PageIntro, Button } from "@/components/ui";
import { LiveWorkExplorer } from "@/components/live-works";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { profile } from "@/content/profile";
import { pageMetadata } from "@/lib/metadata";
const workTitle = `Web Development Portfolio | ${profile.fullName}`;
export const metadata = { ...pageMetadata(workTitle, `View WordPress websites and personal projects by Cebu web developer ${profile.fullName}. Browse screenshots, technologies, and project details.`, "/work/"), title: { absolute: workTitle } };
const projects = buildWorks();

export default function Work() {
  const featured = projects[0];
  const heroProjects = ["roar-fitness", "perth-cosmetic-surgery"].flatMap(slug => {
    const project = projects.find(item => item.slug === slug);
    return project?.image ? [{ src: project.image.src, name: project.title, width: 516, height: 337 }] : [];
  });
  return <><div className="route-hero"><PageIntro eyebrow={`${profile.fullName} / Selected work`} title="WordPress portfolio & projects."><p>These are websites I’ve worked on during my development career, alongside projects for my own ventures in Cebu. Each entry shows the technologies used and the project information I can share publicly.</p><div className="actions"><Button href="/contact/">Discuss your project</Button><Button href="#projects" secondary>Browse by industry</Button></div></PageIntro><BrowserIllustration showcase={{ kind: "work", label: "FROM THE PUBLIC COLLECTION", caption: "Examples from my website development work.", images: heroProjects }} /></div><ExperienceSpotlight /><section className="section" id="projects">{projects.length ? <><div className="section-heading"><div><p className="eyebrow">The public collection</p><h2>Websites I’ve worked on.</h2></div></div><p className="body-copy">Use the industry and technology filters to find examples relevant to your project. The screenshots show the versions in my portfolio; live websites may have changed since I worked on them.</p><LiveWorkExplorer initial={projects} /></> : <div className="empty-state"><p className="eyebrow">Project collection</p><h2>Looking for relevant experience?</h2><p>Tell me what you are building and I can discuss the experience relevant to your project.</p></div>}</section>{featured && <section className="section featured-case"><div><p className="eyebrow">From the project collection</p><h2>{featured.title}</h2><p className="lede">{featured.summary}</p><Button href={`/work/${featured.slug}/`} secondary>Explore the project</Button></div><dl><div><dt>Work category</dt><dd>{featured.role}</dd></div><div><dt>Technology</dt><dd>{featured.technologies.join(" · ")}</dd></div>{featured.outcome && <div><dt>Outcome</dt><dd>{featured.outcome}</dd></div>}</dl></section>}<Workflow /><section className="contact-band"><div><p className="eyebrow">A new conversation</p><h2>Need similar work for your website?</h2></div><Link className="button" href="/contact/">Discuss your project ↗</Link></section></>;
}

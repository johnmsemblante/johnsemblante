import { PageContent } from "@/components/page-content";
import { buildPage, withPageMetadata } from "@/lib/build-pages";

import { PageText, PageLink } from "@/components/page-content";
import { ExperienceSpotlight } from "@/components/experience-spotlight";
import { buildWorks } from "@/lib/build-works";
import { PageIntro, Button } from "@/components/ui";
import { LiveWorkExplorer, LiveFeaturedWork, LiveWorkIllustration } from "@/components/live-works";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { profile } from "@/content/profile";
import { pageMetadata } from "@/lib/metadata";
const workTitle = `Web Development Portfolio | ${profile.fullName}`;
export const metadata = withPageMetadata("work", { ...pageMetadata(workTitle, `View WordPress websites and personal projects by Cebu web developer ${profile.fullName}. Browse screenshots, technologies, and project details.`, "/work/"), title: { absolute: workTitle } });
const projects = buildWorks();

export default function Work() {
  return <PageContent id="work" initial={buildPage("work")}><div className="route-hero"><PageIntro eyebrow={<PageText scope="work_1" fallback={`${profile.fullName} / Selected work`} />} title={<PageText scope="work_2" fallback={"WordPress portfolio & projects."} />}><p><PageText scope="work_3" fallback={"Browse websites I’ve worked on since 2013, along with projects for my own ventures in Cebu. Each entry includes a screenshot, the technologies used, and the details I can share. Use them to get a sense of my work before we discuss your website."} /></p><div className="actions"><Button href="/contact/"><PageText scope="work_4" fallback={"Discuss your project"} /></Button><Button href="#projects" secondary><PageText scope="work_5" fallback={"Browse by industry"} /></Button></div></PageIntro><LiveWorkIllustration initial={projects}/></div><ExperienceSpotlight /><section className="section" id="projects"><><div className="section-heading"><div><p className="eyebrow"><PageText scope="work_6" fallback={"The public collection"} /></p><h2><PageText scope="work_7" fallback={"Websites I’ve worked on."} /></h2></div></div><p className="body-copy"><PageText scope="work_8" fallback={"Search by keyword or use the filters to find a relevant example. The screenshots show my earlier work; live websites may have changed since then."} /></p><LiveWorkExplorer initial={projects} /></></section><LiveFeaturedWork initial={projects}/><Workflow /><section className="contact-band"><div><p className="eyebrow"><PageText scope="work_17" fallback={"A new conversation"} /></p><h2><PageText scope="work_18" fallback={"See something relevant to your website?"} /></h2><p className="body-copy"><PageText scope="work_19" fallback={"Send me the project link and tell me which part interests you, whether it’s the layout, WordPress work, or a feature you need."} /></p></div><PageLink scope="work_20" className="button" href="/contact/"><PageText scope="work_21" fallback={"Discuss your project ↗"} /></PageLink></section></PageContent>;
}

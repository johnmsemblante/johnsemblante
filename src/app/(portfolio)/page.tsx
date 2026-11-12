import { PageContent } from "@/components/page-content";
import { buildPage, withPageMetadata } from "@/lib/build-pages";

import { PageText, PageImage, PageLink } from "@/components/page-content";
import { DevelopmentServices } from "@/components/development-services";
import { Button, Arrow } from "@/components/ui";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { LiveHomeWorks, LiveHomeWriting } from "@/components/live-home-content";
import { LiveVentureCards } from "@/components/live-ventures";
import { buildVentures } from "@/lib/build-ventures";
import { buildWorks } from "@/lib/build-works";
import { profile, homePageTitle } from "@/content/profile";
import { publishedPosts } from "@/content/blog";
import { buildBlogPosts } from "@/lib/build-blog";
import { ProjectQuestions } from "@/components/project-questions";
import { websiteSchema, jsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/content/site";

const homeTitle = homePageTitle;
export const metadata = withPageMetadata("home", { ...pageMetadata(homeTitle, site.description, "/"), title: { absolute: homeTitle } });

const projects = buildWorks();

export default function Home() {
  const writing = [
    ...publishedPosts(),
    ...buildBlogPosts().map(post => ({ ...post, category: post.categories.join(" / ") })),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 2);
  return <PageContent id="home" initial={buildPage("home")}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }} />
    <section className="hero mockup-hero"><div><p className="eyebrow"><PageText scope="home_1" fallback={profile.fullName} /> <PageText scope="home_2" fallback={"/ Philippines"} /></p><h1><PageText scope="home_3" fallback={"Cebu Web Developer"} /></h1><p className="hero-specialty"><PageText scope="home_4" fallback={profile.title} /></p><p className="lede"><PageText scope="home_5" fallback={profile.homeSummary} /></p><div className="actions"><Button href="/contact/"><PageText scope="home_6" fallback={"Discuss your project"} /></Button><Button href="/work/" secondary><PageText scope="home_7" fallback={"View my portfolio"} /></Button></div></div><BrowserIllustration portrait={{ src: profile.portrait, name: profile.fullName }} /></section>
    <div className="portfolio-strip" aria-label="Portfolio focus"><div><span className="strip-symbol" aria-hidden="true"><PageText scope="home_8" fallback={"</>"} /></span><p><strong><PageText scope="home_9" fallback={"From design to website"} /></strong><span><PageText scope="home_10" fallback={"Custom WordPress development from your Figma designs."} /></span></p></div><div><span className="strip-symbol" aria-hidden="true">↗</span><p><strong><PageText scope="home_11" fallback={"Layouts for different screens"} /></strong><span><PageText scope="home_12" fallback={"Responsive layouts and cross-browser improvements."} /></span></p></div><div><span className="strip-symbol" aria-hidden="true">✎</span><p><strong><PageText scope="home_13" fallback={"Help with an existing site"} /></strong><span><PageText scope="home_14" fallback={"UI fixes, integrations, and performance improvements."} /></span></p></div></div>
    <DevelopmentServices /><section className="section"><div className="section-heading"><div><p className="eyebrow"><PageText scope="home_15" fallback={"The portfolio"} /></p><h2><PageText scope="home_16" fallback={"A few websites from my portfolio."} /></h2></div><PageLink scope="home_17" className="text-link" href="/work/"><PageText scope="home_18" fallback={"View all work "} /><Arrow /></PageLink></div><LiveHomeWorks initial={projects} /></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow"><PageText scope="home_22" fallback={"Beyond the screen"} /></p><h2><PageText scope="home_23" fallback={"Independent ventures."} /></h2></div><PageLink scope="home_24" className="text-link" href="/ventures/"><PageText scope="home_25" fallback={"View all ventures "} /><Arrow /></PageLink></div><LiveVentureCards initial={buildVentures()} compact /><p className="section-note"><PageText scope="home_26" fallback={"Take a coffee break with Lazy Barista, plan a Cebu trip with Golden Travel and Tours, or explore the Lapse Hub photography archive."} /></p></section>
    <Workflow />
    <section className="section home-about"><PageImage scope="home_27" className="home-portrait" src={profile.portrait} alt="John Clark Semblante, web developer based in Cebu" width={1103} height={1426} loading="lazy" /><div><p className="eyebrow"><PageText scope="home_28" fallback={"About me"} /></p><h2><PageText scope="home_29" fallback={"Hi, I’m John Semblante."} /></h2><p className="lede"><PageText scope="home_30" fallback={profile.introduction} /></p><p className="body-copy"><PageText scope="home_31" fallback={"Alongside client work, I’ve built websites for my own coffee and travel ventures. You can explore those projects here, along with my earlier WordPress work."} /></p><Button href="/about/" secondary><PageText scope="home_32" fallback={"More about me"} /></Button></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow"><PageText scope="home_33" fallback={"Notes from the work"} /></p><h2><PageText scope="home_34" fallback={"What I’m working on and learning."} /></h2></div><PageLink scope="home_35" className="text-link" href="/blog/"><PageText scope="home_36" fallback={"Visit the blog "} /><Arrow /></PageLink></div><LiveHomeWriting initial={writing} source={publishedPosts().map(({slug,title,excerpt,category,publishedAt})=>({slug,title,excerpt,category,publishedAt}))} /></section>
    <ProjectQuestions />
    <section className="contact-band"><div><p className="eyebrow"><PageText scope="home_39" fallback={"Let’s work together"} /></p><h2><PageText scope="home_40" fallback={"Have a project in mind?"} /></h2><p className="body-copy"><PageText scope="home_41" fallback={"Send me a link and a few lines about what you want to build or improve. If you’re hiring for a remote role, tell me about the team, responsibilities, and working hours."} /></p></div><Button href="/contact/"><PageText scope="home_42" fallback={"Discuss your project"} /></Button></section>
  </PageContent>;
}

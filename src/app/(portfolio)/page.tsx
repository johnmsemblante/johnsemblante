import { PageContent } from "@/components/page-content";
import { buildPage, withPageMetadata } from "@/lib/build-pages";

import { PageText, PageLink } from "@/components/page-content";
import { DevelopmentServices } from "@/components/development-services";
import { Button, Arrow } from "@/components/ui";
import { HeroPortrait } from "@/components/hero-portrait";
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
import { HomeToolsShowcase } from "@/components/home-tools-showcase";

const homeTitle = homePageTitle;
export const metadata = withPageMetadata("home", { ...pageMetadata(homeTitle, site.description, "/"), title: { absolute: homeTitle } });

const projects = buildWorks(true);

export default function Home() {
  const writing = [
    ...publishedPosts(),
    ...buildBlogPosts().map(post => ({ ...post, category: post.categories.join(" / ") })),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 2);
  return <PageContent id="home" initial={buildPage("home")}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }} />
    <section className="hero portrait-hero" aria-labelledby="home-hero-title">
      <div className="portrait-hero-intro">
        <p className="eyebrow"><PageText scope="home_1" fallback={profile.fullName} /></p>
        <h1 id="home-hero-title"><PageText scope="home_3" fallback={"Cebu Web Developer"} /></h1>
        <p className="hero-specialty"><PageText scope="home_4" fallback={profile.title} /></p>
        <div className="actions"><Button href="/work/"><PageText scope="home_7" fallback={"View my portfolio"} /></Button></div>
        <div className="portrait-hero-craft"><span className="eyebrow">Design <span aria-hidden="true">→</span> development</span><ul aria-label="Development specialties"><li>WordPress</li><li>WooCommerce</li></ul></div>
      </div>
      <HeroPortrait />
      <div className="portrait-hero-notes">
        <div className="portrait-hero-location"><p className="eyebrow">Based in Cebu <PageText scope="home_2" fallback={"/ Philippines"} /></p><p>Building for the web<br />since 2013.</p></div>
        <div className="portrait-hero-story"><p className="lede"><PageText scope="home_5" fallback={profile.homeSummary} /></p><Button href="/contact/" secondary><PageText scope="home_6" fallback={"Discuss your project"} /></Button></div>
      </div>
      <div className="portrait-hero-footer"><a href="#services-title">Scroll to explore <span aria-hidden="true">↓</span></a><span>Development &amp; ventures</span></div>
    </section>
    <DevelopmentServices />
    <section className="section home-works">
      <div className="section-heading"><h2>Works</h2><PageLink scope="home_17" className="text-link" href="/work/"><PageText scope="home_18" fallback="View all work " /><Arrow /></PageLink></div>
      <LiveHomeWorks initial={projects} />
    </section>
    <div className="section home-directory">
      <HomeToolsShowcase />
      <section><h2>Ventures</h2><LiveVentureCards initial={buildVentures(true)} homeList /><PageLink scope="home_24" className="text-link" href="/ventures/"><PageText scope="home_25" fallback="View all ventures " /><Arrow /></PageLink></section>
    </div>
    <Workflow />
    <section className="section home-notes">
      <div className="section-heading"><h2><PageText scope="home_33" fallback="Notes from the work" /></h2><PageLink scope="home_35" className="text-link" href="/blog/"><PageText scope="home_36" fallback={"Visit the blog "} /><Arrow /></PageLink></div>
      <LiveHomeWriting initial={writing} source={publishedPosts().map(({slug,title,excerpt,category,publishedAt,featuredImage,featuredImageAlt})=>({slug,title,excerpt,category,publishedAt,featuredImage,featuredImageAlt}))} />
    </section>
    <ProjectQuestions />
  </PageContent>;
}

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
import { HomeExperience } from "@/components/digital-hq/home-experience";
import { buildHQContent } from "@/lib/build-hq-content";

const homeTitle = homePageTitle;
export const metadata = withPageMetadata("home", { ...pageMetadata(homeTitle, site.description, "/"), title: { absolute: homeTitle } });

const projects = buildWorks(true);

export default function Home() {
  const writing = [
    ...publishedPosts(),
    ...buildBlogPosts().map(post => ({ ...post, category: post.categories.join(" / ") })),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 2);
  const ventures = buildVentures(true);
  return <PageContent id="home" initial={buildPage("home")} stableNotice>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }} />
    <HomeExperience content={buildHQContent(projects, ventures, writing)} classic={<><section className="hero portrait-hero" aria-labelledby="home-hero-title">
      <div className="portrait-hero-intro">
        <p className="eyebrow"><PageText scope="home_1" fallback={profile.fullName} /></p>
        <h1 id="home-hero-title"><PageText scope="home_3" fallback={"Cebu Web Developer"} /></h1>
        <p className="hero-specialty"><PageText scope="home_4" fallback={profile.title} /></p>
        <div className="actions"><Button href="/work/"><PageText scope="home_7" fallback={"View my portfolio"} /></Button></div>
        <div className="portrait-hero-craft"><span className="eyebrow"><PageText scope="home_craft_start" fallback="Design" /> <span aria-hidden="true">→</span> <PageText scope="home_craft_end" fallback="development" /></span><ul aria-label="Development specialties"><li><PageText scope="home_skill_one" fallback="WordPress" /></li><li><PageText scope="home_skill_two" fallback="WooCommerce" /></li></ul></div>
      </div>
      <HeroPortrait priority={false} />
      <div className="portrait-hero-notes">
        <div className="portrait-hero-location"><p className="eyebrow"><PageText scope="home_location_prefix" fallback="Based in Cebu" /> <PageText scope="home_2" fallback={"/ Philippines"} /></p><p><PageText scope="home_experience_line" fallback="Building for the web" /><br /><PageText scope="home_experience_year" fallback="since 2013." /></p></div>
        <div className="portrait-hero-story"><p className="lede"><PageText scope="home_5" fallback={profile.homeSummary} /></p><Button href="/contact/" secondary><PageText scope="home_6" fallback={"Discuss your project"} /></Button></div>
      </div>
      <div className="portrait-hero-footer"><PageLink scope="home_scroll_url" href="#services-title"><PageText scope="home_scroll" fallback="Scroll to explore" /> <span aria-hidden="true">↓</span></PageLink><span><PageText scope="home_footer" fallback="Development &amp; ventures" /></span></div>
    </section>
    <DevelopmentServices />
    <section className="section home-works">
      <div className="section-heading"><h2><PageText scope="home_works_title" fallback="Works" /></h2><PageLink scope="home_17" className="text-link" href="/work/"><PageText scope="home_18" fallback="View all work " /><Arrow /></PageLink></div>
      <LiveHomeWorks initial={projects} />
    </section>
    <div className="section home-directory">
      <HomeToolsShowcase />
      <section><h2><PageText scope="home_ventures_title" fallback="Ventures" /></h2><LiveVentureCards initial={ventures} homeList /><PageLink scope="home_24" className="text-link" href="/ventures/"><PageText scope="home_25" fallback="View all ventures " /><Arrow /></PageLink></section>
    </div>
    <Workflow />
    <section className="section home-notes">
      <div className="section-heading"><h2><PageText scope="home_33" fallback="Notes from the work" /></h2><PageLink scope="home_35" className="text-link" href="/blog/"><PageText scope="home_36" fallback={"Visit the blog "} /><Arrow /></PageLink></div>
      <LiveHomeWriting initial={writing} source={publishedPosts().map(({slug,title,excerpt,category,publishedAt,featuredImage,featuredImageAlt})=>({slug,title,excerpt,category,publishedAt,featuredImage,featuredImageAlt}))} />
    </section>
    <ProjectQuestions />
    </>} />
  </PageContent>;
}

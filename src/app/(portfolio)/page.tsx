import { DevelopmentServices } from "@/components/development-services";
import Link from "next/link";
import { Button, Arrow } from "@/components/ui";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { ProjectGrid } from "@/components/project-grid";
import { VentureCards } from "@/ventures/cards";
import { buildWorks } from "@/lib/build-works";
import { profile, homePageTitle } from "@/content/profile";
import { publishedPosts } from "@/content/blog";
import { buildBlogPosts } from "@/lib/build-blog";
import { ProjectQuestions } from "@/components/project-questions";
import { websiteSchema, jsonLd } from "@/lib/seo";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/content/site";

const homeTitle = homePageTitle;
export const metadata = { ...pageMetadata(homeTitle, site.description, "/"), title: { absolute: homeTitle } };

const projects = buildWorks();

export default function Home() {
  const writing = [
    ...publishedPosts(),
    ...buildBlogPosts().map(post => ({ ...post, category: post.categories.join(" / ") })),
  ].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).slice(0, 2);
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(websiteSchema()) }} />
    <section className="hero mockup-hero"><div><p className="eyebrow">{profile.fullName} / Philippines</p><h1>Cebu Web Developer</h1><p className="hero-specialty">{profile.title}</p><p className="lede">{profile.homeSummary}</p><div className="actions"><Button href="/contact/">Discuss your project</Button><Button href="/work/" secondary>View my portfolio</Button></div></div><BrowserIllustration portrait={{ src: profile.portrait, name: profile.fullName }} /></section>
    <div className="portfolio-strip" aria-label="Portfolio focus"><div><span className="strip-symbol" aria-hidden="true">&lt;/&gt;</span><p><strong>From design to website</strong><span>Custom WordPress development from your Figma designs.</span></p></div><div><span className="strip-symbol" aria-hidden="true">↗</span><p><strong>Layouts for different screens</strong><span>Responsive layouts and cross-browser improvements.</span></p></div><div><span className="strip-symbol" aria-hidden="true">✎</span><p><strong>Help with an existing site</strong><span>UI fixes, integrations, and performance improvements.</span></p></div></div>
    <DevelopmentServices /><section className="section"><div className="section-heading"><div><p className="eyebrow">The portfolio</p><h2>A few websites from my portfolio.</h2></div><Link className="text-link" href="/work/">View all work <Arrow /></Link></div>{projects.length ? <ProjectGrid projects={projects.slice(0, 3)} /> : <div className="work-pending"><span className="work-pending-mark" aria-hidden="true">&lt;/&gt;</span><div><h3>Looking for a relevant example?</h3><p>Tell me what you need to build, and I can discuss the experience relevant to your project.</p></div></div>}</section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Beyond the screen</p><h2>Independent ventures.</h2></div><Link className="text-link" href="/ventures/">View all ventures <Arrow /></Link></div><VentureCards compact /><p className="section-note">Take a coffee break with Lazy Barista, plan a Cebu trip with Golden Travel and Tours, or explore the Lapse Hub photography archive.</p></section>
    <Workflow />
    <section className="section home-about"><img className="home-portrait" src={profile.portrait} alt="John Clark Semblante, web developer based in Cebu" width={1103} height={1426} loading="lazy" /><div><p className="eyebrow">About me</p><h2>Hi, I’m John Semblante.</h2><p className="lede">{profile.introduction}</p><p className="body-copy">Alongside client work, I’ve built websites for my own coffee and travel ventures. You can explore those projects here, along with my earlier WordPress work.</p><Button href="/about/" secondary>More about me</Button></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Notes from the work</p><h2>What I’m working on and learning.</h2></div><Link className="text-link" href="/blog/">Visit the blog <Arrow /></Link></div>{writing.length ? <div className="card-grid">{writing.map(post => <article key={post.slug} className="writing-preview"><p className="eyebrow">{post.category}</p><h3><Link href={`/blog/${post.slug}/`}>{post.title} <Arrow /></Link></h3><p>{post.excerpt}</p></article>)}</div> : <p className="body-copy">I share development notes here when there is something useful to write about. In the meantime, you can browse my website projects.</p>}</section>
    <ProjectQuestions />
    <section className="contact-band"><div><p className="eyebrow">Let’s work together</p><h2>Have a project in mind?</h2><p className="body-copy">Send me a link and a few lines about what you want to build or improve. If you’re hiring for a remote role, tell me about the team, responsibilities, and working hours.</p></div><Button href="/contact/">Discuss your project</Button></section>
  </>;
}

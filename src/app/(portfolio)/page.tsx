import { DevelopmentServices } from "@/components/development-services";
import Link from "next/link";
import { Button, Arrow } from "@/components/ui";
import { BrowserIllustration } from "@/components/browser-illustration";
import { Workflow } from "@/components/workflow";
import { ProjectGrid } from "@/components/project-grid";
import { VentureCards } from "@/ventures/cards";
import { projects } from "@/content/site";
import { profile } from "@/content/profile";
import { publishedPosts } from "@/content/blog";

export default function Home() {
  const writing = publishedPosts().slice(0, 2);
  return <>
    <section className="hero mockup-hero"><div><p className="eyebrow">John Semblante / Full Stack Developer</p><h1>Your website.<br />Built for<br /><span className="hero-muted">what’s next.</span></h1><p className="lede">{profile.homeSummary}</p><div className="actions"><Button href="/contact/">Discuss your project</Button><Button href="/work/" secondary>Explore my work</Button></div></div><BrowserIllustration portrait={{ src: profile.portrait, name: "John Semblante" }} /></section>
    <div className="portfolio-strip" aria-label="Portfolio focus"><div><span className="strip-symbol" aria-hidden="true">&lt;/&gt;</span><p><strong>From design to website</strong><span>Custom WordPress development from your Figma designs.</span></p></div><div><span className="strip-symbol" aria-hidden="true">↗</span><p><strong>Better on every screen</strong><span>Responsive layouts and cross-browser improvements.</span></p></div><div><span className="strip-symbol" aria-hidden="true">✎</span><p><strong>Support for the details</strong><span>UI fixes, integrations, and performance improvements.</span></p></div></div>
    <DevelopmentServices /><section className="section"><div className="section-heading"><div><p className="eyebrow">The portfolio</p><h2>Selected public projects.</h2></div><Link className="text-link" href="/work/">View all work <Arrow /></Link></div>{projects.length ? <ProjectGrid projects={projects.slice(0, 3)} /> : <div className="work-pending"><span className="work-pending-mark" aria-hidden="true">&lt;/&gt;</span><div><h3>Project stories are taking shape.</h3><p>Verified projects, screenshots, and case studies will be shared here soon.</p></div></div>}</section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Beyond the screen</p><h2>Independent ventures.</h2></div><Link className="text-link" href="/ventures/">View all ventures <Arrow /></Link></div><VentureCards compact /><p className="section-note">Take a coffee break with Lazy Barista or plan your Cebu trip with Golden Travel and Tours.</p></section>
    <Workflow />
    <section className="section home-about"><img className="home-portrait" src={profile.portrait} alt="John Clark Semblante, web developer based in Cebu" width={1103} height={1426} loading="lazy" /><div><p className="eyebrow">About me</p><h2>Hi, I’m John Semblante.</h2><p className="lede">{profile.introduction}</p><p className="body-copy">Whether you have a design to build or an existing site to improve, I can help you work through the technical details.</p><Button href="/about/" secondary>More about me</Button></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Notes from the work</p><h2>Notes & ideas.</h2></div><Link className="text-link" href="/blog/">Visit the blog <Arrow /></Link></div>{writing.length ? <div className="card-grid">{writing.map(post => <article key={post.slug} className="writing-preview"><p className="eyebrow">{post.category}</p><h3><Link href={`/blog/${post.slug}/`}>{post.title} <Arrow /></Link></h3><p>{post.excerpt}</p></article>)}</div> : <p className="body-copy">Articles are in progress. For examples of my development experience, explore the project collection or get in touch.</p>}</section>
    <section className="contact-band"><div><p className="eyebrow">Let’s work together</p><h2>Have a project in mind?</h2><p className="body-copy">Share your website or design, the help you need, and your target timeline. Let’s discuss the next step.</p></div><Button href="/contact/">Discuss your project</Button></section>
  </>;
}

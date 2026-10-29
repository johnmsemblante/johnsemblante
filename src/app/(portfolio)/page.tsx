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
    <section className="hero mockup-hero"><div><p className="eyebrow">John Semblante / Web developer & entrepreneur</p><h1>Web developer.<br />Builder.<br /><span className="hero-muted">Entrepreneur.</span></h1><p className="lede">{profile.homeSummary}</p><div className="actions"><Button href="/work/">View my work</Button><Button href="/ventures/" secondary>Explore ventures</Button></div></div><BrowserIllustration /></section>
    <div className="portfolio-strip" aria-label="Portfolio focus"><div><span className="strip-symbol" aria-hidden="true">&lt;/&gt;</span><p><strong>Development first</strong><span>A portfolio centered on web development.</span></p></div><div><span className="strip-symbol" aria-hidden="true">↗</span><p><strong>Independent ventures</strong><span>Separate brands, with room to grow.</span></p></div><div><span className="strip-symbol" aria-hidden="true">✎</span><p><strong>Learning through writing</strong><span>A space for ideas and practice.</span></p></div></div>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">The portfolio</p><h2>Featured work.</h2></div><Link className="text-link" href="/work/">View all work <Arrow /></Link></div>{projects.length ? <ProjectGrid projects={projects.slice(0, 3)} /> : <div className="work-pending"><span className="work-pending-mark" aria-hidden="true">&lt;/&gt;</span><div><h3>Project stories are taking shape.</h3><p>Verified projects, screenshots, and case studies will be shared here soon.</p></div></div>}</section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Beyond the screen</p><h2>Independent ventures.</h2></div><Link className="text-link" href="/ventures/">View all ventures <Arrow /></Link></div><VentureCards compact /><p className="section-note">Each venture has its own identity and space to grow.</p></section>
    <Workflow />
    <section className="section home-about"><img className="home-portrait" src={profile.portrait} alt="John Clark Semblante, portrait from his updated résumé" width={247} height={319} loading="lazy" /><div><p className="eyebrow">About me</p><h2>Hi, I’m John Semblante.</h2><p className="lede">{profile.introduction}</p><p className="body-copy">This portfolio brings together my development work, independent ventures, and a space to grow through writing.</p><Button href="/about/" secondary>More about me</Button></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">The writing playground</p><h2>Notes & ideas.</h2></div><Link className="text-link" href="/blog/">Visit the blog <Arrow /></Link></div>{writing.length ? <div className="card-grid">{writing.map(post => <article key={post.slug} className="writing-preview"><p className="eyebrow">{post.category}</p><h3><Link href={`/blog/${post.slug}/`}>{post.title} <Arrow /></Link></h3><p>{post.excerpt}</p></article>)}</div> : <p className="body-copy">The first entry is still in the notebook. This is where I’ll share my writing as it takes shape.</p>}</section>
    <section className="contact-band"><div><p className="eyebrow">Let’s work together</p><h2>Have a project in mind?</h2><p className="body-copy">Start a conversation about an idea, a collaboration, or a venture.</p></div><Button href="/contact/">Get in touch</Button></section>
  </>;
}

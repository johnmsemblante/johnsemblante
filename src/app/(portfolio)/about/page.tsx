import { SkillsToolkit } from "@/components/skills-toolkit";
import { profile } from "@/content/profile";
import { site } from "@/content/site";
import { PageIntro, Button } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("About", "Meet John Clark Semblante, a senior front-end and WordPress developer based in Mandaue City, Cebu.", "/about/");
export default function About() {
  return <><div className="about-intro"><PageIntro eyebrow={`${profile.title} / ${profile.location}`} title="A developer who cares about the details."><p>{profile.introduction}</p><div className="actions"><Button href="/work/">Explore my work</Button><Button href="/contact/" secondary>Discuss your project</Button></div></PageIntro><img className="profile-portrait" src={profile.portrait} alt="John Clark Semblante, web developer based in Cebu" width={247} height={319} /></div>
    <section className="section two-columns"><h2>Design to code.<br />Ideas to experiences.</h2><div><p className="lede">{profile.biography}</p><p className="body-copy">Running Lazy Barista and Golden Travel and Tours also gives me a business owner’s perspective: customers need clear information and an easy way to take the next step. I bring that same focus to my development work.</p><Button href="/ventures/" secondary>Meet the ventures</Button></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">The toolkit</p><h2>Skills & technologies.</h2></div></div><SkillsToolkit /></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">My background</p><h2>Experience.</h2></div></div><div className="experience-list">{profile.experience.map(job => <article key={job.company}><p className="experience-date">{job.dates}</p><div><h3>{job.role}</h3><p className="experience-company">{job.company}</p><ul>{job.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></div></article>)}</div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Foundations</p><h2>Education.</h2></div></div><div className="education-list">{profile.education.map(item => <article key={item.school}><p className="eyebrow">{item.dates}</p><h3>{item.qualification}</h3><p>{item.school}</p></article>)}</div></section>
    <section className="contact-band"><div><p className="eyebrow">Let’s work together</p><h2>Need a developer for your next step?</h2><p className="body-copy">Tell me about your website, design, or technical challenge at <a href={`mailto:${site.email}`}>{site.email}</a>.</p></div><Button href="/contact/">Start a project inquiry</Button></section></>;
}

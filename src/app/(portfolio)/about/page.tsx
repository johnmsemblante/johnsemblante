import { SkillsToolkit } from "@/components/skills-toolkit";
import { profile } from "@/content/profile";
import { site } from "@/content/site";
import { PageIntro, Button } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
const aboutTitle = `About ${profile.fullName} | Cebu Web Developer`;
export const metadata = { ...pageMetadata(aboutTitle, `Meet ${profile.fullName}, a web developer in Cebu with experience since 2013. Explore my WordPress skills, work history, and independent projects.`, "/about/"), title: { absolute: aboutTitle } };
export default function About() {
  return <><div className="about-intro"><PageIntro eyebrow={`${profile.title} / ${profile.location}`} title="I’m John, a web developer based in Cebu."><p>{profile.introduction}</p><div className="actions"><Button href="/work/">Explore my work</Button><Button href="/contact/" secondary>Discuss your project</Button></div></PageIntro><img className="profile-portrait" src={profile.portrait} alt="John Clark Semblante, web developer based in Cebu" width={1103} height={1426} /></div>
    <section className="section two-columns"><h2>WordPress work,<br />from designs to fixes.</h2><div><p className="lede">{profile.biography}</p><p className="body-copy">My own ventures have given me another reason to keep websites straightforward. On Lazy Barista, visitors need to find the menu and ordering details. On Golden Travel and Tours, they need to explain their trip and request a quote. Those are the kinds of practical questions I think about when building a page.</p><Button href="/ventures/" secondary>Meet the ventures</Button></div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">The toolkit</p><h2>Skills & technologies.</h2></div></div><SkillsToolkit /></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">My background</p><h2>Experience.</h2></div></div><div className="experience-list">{profile.experience.map(job => <article key={job.company}><p className="experience-date">{job.dates}</p><div><h3>{job.role}</h3><p className="experience-company">{job.company}</p><ul>{job.responsibilities.map(item => <li key={item}>{item}</li>)}</ul></div></article>)}</div></section>
    <section className="section"><div className="section-heading"><div><p className="eyebrow">Foundations</p><h2>Education.</h2></div></div><div className="education-list">{profile.education.map(item => <article key={item.school}><p className="eyebrow">{item.dates}</p><h3>{item.qualification}</h3><p>{item.school}</p></article>)}</div></section>
    <section className="contact-band"><div><p className="eyebrow">Let’s work together</p><h2>Looking for help with a website?</h2><p className="body-copy">Tell me about your website, design, or technical challenge at <a href={`mailto:${site.email}`}>{site.email}</a>.</p></div><Button href="/contact/">Start a project inquiry</Button></section></>;
}

import Link from "next/link";

export function ExperienceSpotlight() {
  return <section className="section experience-spotlight" aria-labelledby="experience-spotlight-title">
    <div className="experience-spotlight-intro">
      <p className="eyebrow">Beyond the public portfolio</p>
      <h2 id="experience-spotlight-title">Some work stays<br />behind the scenes.</h2>
      <p className="body-copy">I can’t publish every project I’ve worked on because some work is covered by confidentiality agreements. The examples below are the ones I can share publicly.</p>
    </div>
    <div className="experience-spotlight-card">
      <p className="experience-spotlight-label"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg>Confidential professional work</p>
      <h3>Ask about the experience<br />your project needs.</h3>
      <p>I can discuss my development approach and the experience relevant to your project, while respecting client confidentiality.</p>
      <ul className="experience-spotlight-skills" aria-label="Areas of experience"><li>Custom WordPress</li><li>Responsive interfaces</li><li>Performance & quality</li></ul>
      <Link className="button" href="/contact/?topic=experience#inquiry">Discuss relevant experience <span aria-hidden="true">↗</span></Link>
    </div>
  </section>;
}

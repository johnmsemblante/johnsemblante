import { PageText, PageLink } from "@/components/page-content";

export function ExperienceSpotlight() {
  return <section className="section experience-spotlight" aria-labelledby="experience-spotlight-title">
    <div className="experience-spotlight-intro">
      <p className="eyebrow"><PageText scope="experience_spotlight_1" fallback={"Beyond the public portfolio"} /></p>
      <h2 id="experience-spotlight-title"><PageText scope="experience_spotlight_2" fallback={"Some work stays"} /><br /><PageText scope="experience_spotlight_3" fallback={"behind the scenes."} /></h2>
      <p className="body-copy"><PageText scope="experience_spotlight_4" fallback={"Some of my professional work is covered by confidentiality agreements, so it isn’t shown here. I can still talk about the kinds of development problems I work on and how that experience relates to your project."} /></p>
    </div>
    <div className="experience-spotlight-card">
      <p className="experience-spotlight-label"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" /><path d="m8 12 3 3 5-6" /></svg><PageText scope="experience_spotlight_5" fallback={"Confidential professional work"} /></p>
      <h3><PageText scope="experience_spotlight_6" fallback={"Ask about the experience"} /><br /><PageText scope="experience_spotlight_7" fallback={"your project needs."} /></h3>
      <p><PageText scope="experience_spotlight_8" fallback={"Tell me about the WordPress customization, responsive layout, or performance issue you’re facing. We can discuss my approach without sharing another client’s private information."} /></p>
      <ul className="experience-spotlight-skills" aria-label="Areas of experience"><li><PageText scope="experience_spotlight_9" fallback={"Custom WordPress"} /></li><li><PageText scope="experience_spotlight_10" fallback={"Responsive interfaces"} /></li><li><PageText scope="experience_spotlight_11" fallback={"Performance & quality"} /></li></ul>
      <PageLink scope="experience_spotlight_12" className="button" href="/contact/?topic=experience#inquiry"><PageText scope="experience_spotlight_13" fallback={"Discuss relevant experience "} /><span aria-hidden="true">↗</span></PageLink>
    </div>
  </section>;
}

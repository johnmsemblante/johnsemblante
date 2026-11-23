import { aboutDevelopment, workDevelopment } from "@/content/development-story";
import { PageText } from "./page-content";
import { Button } from "./ui";

function StoryText({ field }: { field: { scope: string; value: string } }) {
  return <PageText scope={field.scope} fallback={field.value} />;
}

export function AboutDevelopment() {
  return <section className="section work-context">
    <h2><StoryText field={aboutDevelopment.heading} /></h2>
    <div className="work-context-grid">
      <div className="work-context-card"><p className="body-copy"><StoryText field={aboutDevelopment.background} /></p></div>
      <div className="work-context-card"><p className="body-copy"><StoryText field={aboutDevelopment.practice} /></p></div>
    </div>
    <Button href="/work/#independent-builds" secondary><StoryText field={aboutDevelopment.link} /></Button>
  </section>;
}

export function WorkDevelopment({ showcase }: { showcase: React.ReactNode }) {
  return <section className="section work-context" id="independent-builds">
    <h2><StoryText field={workDevelopment.heading} /></h2>
    <div className="work-context-grid">
      <article className="work-context-card">
        <h3><StoryText field={workDevelopment.portfolioTitle} /></h3>
        <p className="body-copy"><StoryText field={workDevelopment.portfolio} /></p>
      </article>
      <article className="work-context-card">
        <h3><StoryText field={workDevelopment.appTitle} /></h3>
        <p className="body-copy"><StoryText field={workDevelopment.app} /></p>
      </article>
    </div>
    {showcase}
    <Button href="/contact/" secondary><StoryText field={workDevelopment.contact} /></Button>
  </section>;
}

import Link from "next/link";

const services = [
  ["Figma to WordPress", "Send me your Figma designs and the pages you need. I build custom WordPress themes and adapt the layouts for desktop, tablet, and mobile screens.", "Design implementation · Custom themes"],
  ["WooCommerce development", "I customize product and shop layouts, adjust theme behavior, and connect third-party tools. We’ll review your existing store and agree on the changes it needs.", "Storefronts · Theme customization · Integrations"],
  ["Website fixes & improvements", "A layout breaks on mobile, a plugin causes a problem, or a page loads slowly. I investigate the cause, explain the fix, and check the affected pages after making changes.", "UI debugging · Mobile usability · Performance"],
];

export function DevelopmentServices() {
  return <section className="section" aria-labelledby="services-title">
    <div className="section-heading"><div><p className="eyebrow">How I can help</p><h2 id="services-title">WordPress development & website support.</h2></div></div>
    <div className="service-copy-grid">{services.map(([title, description, scope]) => <article key={title}><h3>{title}</h3><p>{description}</p><p className="service-scope">{scope}</p></article>)}</div>
    <p className="service-copy-cta">Have a website that needs work, but aren’t sure where to start? Send me the link and describe what’s getting in the way. I’m based in Cebu and welcome project inquiries and remote development opportunities. <Link className="text-link" href="/contact/">Discuss your website <span aria-hidden="true">↗</span></Link></p>
  </section>;
}

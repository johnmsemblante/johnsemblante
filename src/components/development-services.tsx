import Link from "next/link";

const services = [
  ["Figma to WordPress", "Have a design ready to build? I turn Figma layouts into custom WordPress themes, with responsive behavior and reusable components.", "Design implementation · Custom themes"],
  ["WooCommerce development", "Need to improve your online store? I work on storefront interfaces, theme customizations, and integrations that support the shopping experience.", "Storefronts · Theme customization · Integrations"],
  ["Website fixes & improvements", "Dealing with broken layouts, mobile issues, or slow pages? I investigate the problem and improve the code behind the experience.", "UI debugging · Mobile usability · Performance"],
];

export function DevelopmentServices() {
  return <section className="section" aria-labelledby="services-title">
    <div className="section-heading"><div><p className="eyebrow">How I can help</p><h2 id="services-title">Build it. Improve it. Keep it working.</h2></div></div>
    <div className="service-copy-grid">{services.map(([title, description, scope]) => <article key={title}><h3>{title}</h3><p>{description}</p><p className="service-scope">{scope}</p></article>)}</div>
    <p className="service-copy-cta">For business owners and teams who need hands-on development support. <Link className="text-link" href="/contact/">Tell me what you need <span aria-hidden="true">↗</span></Link></p>
  </section>;
}

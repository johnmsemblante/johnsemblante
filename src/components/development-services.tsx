import { PageText, PageLink } from "@/components/page-content";

const services = [
  ["Figma to WordPress", "I turn Figma designs into responsive WordPress themes you can edit yourself."],
  ["WooCommerce development", "I tailor product pages, checkout flows and integrations to the way your store sells."],
  ["Website fixes & improvements", "I diagnose slow pages, broken layouts and plugin conflicts, then fix the affected parts."],
];

export function DevelopmentServices() {
  return <section className="section" aria-labelledby="services-title">
    <div className="section-heading"><div><p className="eyebrow"><PageText scope="development_services_1" fallback={"How I can help"} /></p><h2 id="services-title"><PageText scope="development_services_2" fallback={"WordPress development & website support."} /></h2></div></div>
    <div className="service-copy-grid">{services.map(([title, description]) => <article key={title}><h3><PageText scope="development_services_3" fallback={title} /></h3><p><PageText scope="development_services_4" fallback={description} /></p></article>)}</div>
    <p className="service-copy-cta"><PageLink scope="development_services_7" className="text-link" href="/contact/"><PageText scope="development_services_8" fallback={"Tell me about your website "} /><span aria-hidden="true">↗</span></PageLink></p>
  </section>;
}

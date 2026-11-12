import { PageText, PageLink } from "@/components/page-content";

const services = [
  ["Figma to WordPress", "Have a design ready to build? I turn Figma layouts into custom WordPress themes, including the pages and reusable sections your site needs. We’ll review how the design should work on smaller screens and which content you need to edit yourself.", "Design implementation · Custom themes"],
  ["WooCommerce development", "If your store’s theme doesn’t quite fit the way you sell, I can help with product pages, shop layouts, theme behavior, and third-party integrations. Start by showing me the current store and what you want customers to be able to do.", "Storefronts · Theme customization · Integrations"],
  ["Website fixes & improvements", "You don’t always need a new website. I investigate broken layouts, plugin conflicts, and slow pages, then work on the affected parts. Send the page link and a description of the problem so we can decide where to start.", "UI debugging · Mobile usability · Performance"],
];

export function DevelopmentServices() {
  return <section className="section" aria-labelledby="services-title">
    <div className="section-heading"><div><p className="eyebrow"><PageText scope="development_services_1" fallback={"How I can help"} /></p><h2 id="services-title"><PageText scope="development_services_2" fallback={"WordPress development & website support."} /></h2></div></div>
    <div className="service-copy-grid">{services.map(([title, description, scope]) => <article key={title}><h3><PageText scope="development_services_3" fallback={title} /></h3><p><PageText scope="development_services_4" fallback={description} /></p><p className="service-scope"><PageText scope="development_services_5" fallback={scope} /></p></article>)}</div>
    <p className="service-copy-cta"><PageText scope="development_services_6" fallback={"Not sure which service fits? Tell me what you want visitors to do and what is getting in their way. A website link or screenshot is a useful starting point. "} /><PageLink scope="development_services_7" className="text-link" href="/contact/"><PageText scope="development_services_8" fallback={"Tell me about your website "} /><span aria-hidden="true">↗</span></PageLink></p>
  </section>;
}

import { ventures } from "@/ventures/registry";
import { PageIntro, Button } from "@/components/ui";
import { BrowserIllustration } from "@/components/browser-illustration";
import { VentureCards } from "@/ventures/cards";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("Ventures", "Explore Lazy Barista, Golden Travel and Tours, and Lapse Hub, John Semblante's independent coffee, travel and photography ventures.", "/ventures/");
const principles = [["Find what you need", "Explore coffee, travel services or the Lapse Hub photography archive."], ["Talk to the team", "Use each venture’s contact links for orders, quotes, and practical questions."], ["Confirm the details", "Check availability, pricing, and arrangements with the team before paying or booking."], ["Explore a collaboration", "Have an idea that fits one of the businesses? Get in touch to discuss it."]];
export default function Ventures() {
  const heroBrands = ["golden-travel-and-tours", "lazy-barista"].flatMap(slug => {
    const venture = ventures.find(item => item.slug === slug);
    return venture?.logo ? [{ ...venture.logo, name: venture.name }] : [];
  });
  return <><div className="route-hero"><PageIntro eyebrow="Outside my development work" title="Ventures."><p>My interests outside web development have led to coffee, travel, and photography ventures. Here you’ll find Lazy Barista’s menu, Golden Travel and Tours’ Cebu trip inquiries, and photographs from my Lapse Hub archive.</p></PageIntro><BrowserIllustration showcase={{ kind: "ventures", label: "COFFEE, TRAVEL AND PHOTOGRAPHY", caption: "A look at my interests outside development.", images: heroBrands }} /></div><section className="section"><VentureCards headingLevel={2} compact /><p className="section-note">For orders and travel quotes, use the contact links on each venture’s page.</p></section><section className="section"><div className="section-heading"><div><p className="eyebrow">Your next step</p><h2>Find the details for your visit.</h2></div></div><div className="process-grid">{principles.map(([title, description], i) => <article key={title}><span className="step-number">0{i + 1}</span><h3>{title}</h3><p>{description}</p></article>)}</div></section><section className="contact-band"><div><p className="eyebrow">Partnerships and collaborations</p><h2>Start a conversation.</h2><p className="body-copy">For partnerships or collaboration ideas, tell me which venture you have in mind and how we could work together.</p></div><Button href="/contact/">Get in touch</Button></section></>;
}

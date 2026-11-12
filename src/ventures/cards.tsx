
import { PageText, PageImage, PageLink } from "@/components/page-content";
import { ventures } from "./registry";
import { Arrow } from "@/components/ui";
import type { Venture } from "./types";

export function VentureCards({ headingLevel = 3, compact = false, items = ventures, linkFor = v => `/ventures/${v.slug}/` }: { headingLevel?: 2 | 3; compact?: boolean; items?: Venture[]; linkFor?: (venture: Venture) => string }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <div className={`card-grid ${compact ? "compact-ventures" : ""}`}>{items.map(v =>
    <PageLink scope="venture_cards_1" key={v.slug} href={linkFor(v)} className={`venture-card ${v.theme}`}>
      <div className="venture-visual" aria-hidden="true">{v.logo ? <PageImage scope="venture_cards_2" className="venture-card-logo" src={v.logo.src} alt="" width={v.logo.width} height={v.logo.height} loading="lazy" /> : v.theme === "photography" ? <span className="photography-monogram"><PageText scope="venture_cards_3" fallback={"LH"} /><span><PageText scope="venture_cards_4" fallback={"PHOTOGRAPHY"} /></span></span> : null}</div>
      <div className="venture-info"><p className="eyebrow"><PageText scope="venture_cards_5" fallback={v.category} /> <PageText scope="venture_cards_6" fallback={"/ Independent venture"} /></p><Heading className="venture-card-title"><PageText scope="venture_cards_7" fallback={v.name} /> <Arrow /></Heading><p><PageText scope="venture_cards_8" fallback={v.theme === "coffee" ? "Browse the menu & order" : v.theme === "photography" ? "Explore the photography archive" : "Explore services & request a quote"} /></p></div>
    </PageLink>
  )}</div>;
}

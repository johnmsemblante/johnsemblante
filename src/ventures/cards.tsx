import Link from "next/link";
import { ventures } from "./registry";
import { Arrow } from "@/components/ui";

export function VentureCards({ headingLevel = 3, compact = false }: { headingLevel?: 2 | 3; compact?: boolean }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <div className={`card-grid ${compact ? "compact-ventures" : ""}`}>{ventures.map(v =>
    <Link key={v.slug} href={`/ventures/${v.slug}/`} className={`venture-card ${v.theme}`}>
      <div className="venture-visual" aria-hidden="true">{v.theme === "coffee" ? <div className="coffee-symbol">lb<span>⌁</span></div> : <div className="travel-symbol"><span>G</span><i /></div>}</div>
      <div className="venture-info"><p className="eyebrow">{v.category} / Independent venture</p><Heading className="venture-card-title">{v.name} <Arrow /></Heading><p>Discover the venture</p></div>
    </Link>
  )}</div>;
}

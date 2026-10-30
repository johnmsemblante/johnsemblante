import Link from "next/link";
import { ventures } from "./registry";
import { Arrow } from "@/components/ui";

export function VentureCards({ headingLevel = 3, compact = false }: { headingLevel?: 2 | 3; compact?: boolean }) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return <div className={`card-grid ${compact ? "compact-ventures" : ""}`}>{ventures.map(v =>
    <Link key={v.slug} href={`/ventures/${v.slug}/`} className={`venture-card ${v.theme}`}>
      <div className="venture-visual" aria-hidden="true">{v.logo ? <img className="venture-card-logo" src={v.logo.src} alt="" width={v.logo.width} height={v.logo.height} loading="lazy" /> : null}</div>
      <div className="venture-info"><p className="eyebrow">{v.category} / Independent venture</p><Heading className="venture-card-title">{v.name} <Arrow /></Heading><p>{v.theme === "coffee" ? "Browse the menu & order" : "Explore services & request a quote"}</p></div>
    </Link>
  )}</div>;
}

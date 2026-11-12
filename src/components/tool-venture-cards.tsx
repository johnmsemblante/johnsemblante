import Link from "next/link";
import { publishedTools } from "@/config/tool-ventures";
import { Arrow } from "./ui";

// Plain links and text deliberately bypass admin-editable PageContent fields.
export function ToolVentureCards() {
  return <div className="card-grid compact-ventures">{publishedTools.map(tool => <Link key={tool.id} href={tool.route} className="venture-card travel">
    <div className="venture-visual" aria-hidden="true"><span style={{ fontSize: 100 }}>{tool.icon}</span></div>
    <div className="venture-info"><p className="eyebrow">{tool.category} / Built by John Semblante</p><h2 className="venture-card-title">{tool.name} <Arrow /></h2><p>{tool.description}</p></div>
  </Link>)}</div>;
}

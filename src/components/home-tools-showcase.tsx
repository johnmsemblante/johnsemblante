import { PageLink, PageText } from "@/components/page-content";
import Link from "next/link";
import { featuredHomeTools } from "@/config/tool-ventures";
import { Arrow } from "./ui";

export function HomeToolsShowcase() {
  const tools = featuredHomeTools();
  if (!tools.length) return null;

  return <section aria-labelledby="home-tools-title">
    <h2 id="home-tools-title"><PageText scope="home_tools_title" fallback="Free Online Tools" /></h2>
    <ul className="home-index">{tools.map(tool => <li key={tool.id}><Link href={tool.route}><span className="directory-logo" aria-hidden="true">{tool.iconImage ? <img src={tool.iconImage} alt="" width={48} height={48} loading="lazy" /> : tool.icon}</span>{tool.shortName ?? tool.name}<Arrow /></Link></li>)}</ul>
    <PageLink scope="home_tools_url" className="text-link" href="/tools/"><PageText scope="home_tools_cta" fallback="Explore All Tools" /> <Arrow /></PageLink>
  </section>;
}

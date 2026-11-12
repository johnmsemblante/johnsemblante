import Link from "next/link";
import { featuredHomeTools } from "@/config/tool-ventures";
import { Arrow } from "./ui";

export function HomeToolsShowcase() {
  const tools = featuredHomeTools();
  if (!tools.length) return null;

  return <section className="section home-tools" aria-labelledby="home-tools-title">
    <div className="section-heading">
      <div>
        <h2 id="home-tools-title">Free Online Tools</h2>
        <p className="home-tools-intro">Explore simple, useful online tools I've built to make everyday tasks easier. Completely free to use, with no sign-up required.</p>
      </div>
      <Link className="text-link home-tools-directory" href="/tools/">Explore All Tools <Arrow /></Link>
    </div>
    <div className={`home-tool-grid${tools.length === 1 ? " home-tool-grid-single" : ""}`}>
      {tools.map(tool => <Link
        key={tool.id}
        className="home-tool-card"
        href={tool.route}
        aria-labelledby={`home-tool-${tool.id}-title home-tool-${tool.id}-cta`}
        aria-describedby={`home-tool-${tool.id}-description`}
      >
        <span className="home-tool-icon" aria-hidden="true">
          {tool.iconImage ? <img src={tool.iconImage} alt="" width={88} height={88} loading="lazy" /> : tool.icon}
        </span>
        <div className="home-tool-copy">
          <h3 id={`home-tool-${tool.id}-title`}>{tool.shortName ?? tool.name}</h3>
          <p id={`home-tool-${tool.id}-description`}>{tool.homeDescription ?? tool.description}</p>
        </div>
        <span className="button home-tool-cta" id={`home-tool-${tool.id}-cta`}>{tool.ctaLabel ?? "Open tool"} <Arrow /></span>
      </Link>)}
    </div>
  </section>;
}

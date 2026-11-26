import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNavigation } from "./site-navigation";
import { profile } from "@/content/profile";
import { buildNavigation } from "@/lib/build-navigation";
import { PortfolioBreadcrumbs } from "./portfolio-breadcrumbs";
import { VisitorChat } from "./visitor-chat";

export function SiteShell({ children }: { children: ReactNode }) {
  const { ventureLinks, breadcrumbRoutes } = buildNavigation();
  return <div className="portfolio-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link href="/" className="wordmark" title="John Semblante home">js<span>.</span><span className="office-brand">John Semblante<small>{profile.title}</small></span></Link>
      <SiteNavigation ventureLinks={ventureLinks} />
    </header>
    <main id="main" tabIndex={-1}><PortfolioBreadcrumbs routes={breadcrumbRoutes} />{children}</main>
    <footer className="site-footer"><Link href="/">John Semblante<span className="muted"> / Development & ventures</span></Link><span>{profile.title} · Cebu, Philippines</span></footer>
    <VisitorChat />
  </div>;
}

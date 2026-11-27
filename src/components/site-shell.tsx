import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNavigation } from "./site-navigation";
import { profile } from "@/content/profile";
import { buildNavigation } from "@/lib/build-navigation";
import { PortfolioBreadcrumbs } from "./portfolio-breadcrumbs";
import { VisitorChat } from "./visitor-chat";
import { PortfolioFrame } from "./portfolio-frame";
import { SiteWordmark } from "./site-wordmark";

export function SiteShell({ children }: { children: ReactNode }) {
  const { ventureLinks, breadcrumbRoutes } = buildNavigation();
  return <PortfolioFrame header={<header className="site-header">
      <SiteWordmark />
      <SiteNavigation ventureLinks={ventureLinks} />
    </header>} footer={<footer className="site-footer"><Link href="/">John Semblante<span className="muted"> / Development & ventures</span></Link><span>{profile.title} · Cebu, Philippines</span></footer>} chat={<VisitorChat />}>
    <PortfolioBreadcrumbs routes={breadcrumbRoutes} />{children}
  </PortfolioFrame>;
}

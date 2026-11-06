import Link from "next/link";
import type { ReactNode } from "react";
import { SiteNavigation } from "./site-navigation";
import { profile } from "@/content/profile";

export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="portfolio-shell">
    <a className="skip-link" href="#main">Skip to content</a>
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="John Semblante home">js<span>.</span></Link>
      <SiteNavigation />
    </header>
    <main id="main" tabIndex={-1}>{children}</main>
    <footer className="site-footer"><Link href="/">John Semblante<span className="muted"> / Development & ventures</span></Link><span>{profile.title} · Cebu, Philippines</span></footer>
  </div>;
}

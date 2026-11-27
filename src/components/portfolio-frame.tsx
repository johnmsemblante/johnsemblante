"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { usePortfolioMode } from "./digital-hq/mode";

export function PortfolioFrame({ header, footer, chat, children }: { header: ReactNode; footer: ReactNode; chat: ReactNode; children: ReactNode }) {
  const pathname = usePathname();
  const mode = usePortfolioMode();
  const immersive = pathname === "/" && mode === "interactive";
  return <div className="portfolio-shell" data-immersive={immersive}>
    <a className="skip-link" href="#main">Skip to content</a>
    {!immersive && header}
    <main id="main" tabIndex={-1}>{children}</main>
    {!immersive && footer}
    {!immersive && chat}
  </div>;
}

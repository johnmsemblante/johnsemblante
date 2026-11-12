import type { ReactNode } from "react";
import { PageLink } from "./page-content";
export function Arrow() { return <span aria-hidden="true">↗</span>; }
export function Button({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <PageLink scope="button_href" className={`button ${secondary ? "secondary" : ""}`} href={href}>{children}<Arrow /></PageLink>;
}
export function PageIntro({ eyebrow, title, children }: { eyebrow: ReactNode; title: ReactNode; children: ReactNode }) {
  return <header className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="lede">{children}</div></header>;
}

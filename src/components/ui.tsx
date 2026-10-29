import Link from "next/link";
import type { ReactNode } from "react";
export function Arrow() { return <span aria-hidden="true">↗</span>; }
export function Button({ href, children, secondary = false }: { href: string; children: ReactNode; secondary?: boolean }) {
  return <Link className={`button ${secondary ? "secondary" : ""}`} href={href}>{children}<Arrow /></Link>;
}
export function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return <header className="page-intro"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><div className="lede">{children}</div></header>;
}

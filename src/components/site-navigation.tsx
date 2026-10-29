"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  ["Work", "/work/"],
  ["About", "/about/"],
  ["Ventures", "/ventures/"],
  ["Blog", "/blog/"],
  ["Contact", "/contact/"],
];

export function SiteNavigation() {
  const pathname = usePathname();
  return <nav aria-label="Main navigation">{links.map(([label, href]) => {
    const active = `${pathname.replace(/\/$/, "")}/`.startsWith(href);
    return <Link key={href} href={href} aria-current={active ? "page" : undefined}>{label}</Link>;
  })}</nav>;
}

"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs, type BreadcrumbItem } from "./breadcrumbs";

export function PortfolioBreadcrumbs({ routes }: { routes: BreadcrumbItem[] }) {
  const pathname = usePathname();
  const path = `${pathname.replace(/\/+$/, "")}/`;
  if (path === "/" || !routes.some(route => route.href === path)) return null;
  const items = routes.filter(route => route.href === "/" || path.startsWith(route.href))
    .sort((a, b) => a.href.length - b.href.length);
  return <Breadcrumbs items={items} />;
}

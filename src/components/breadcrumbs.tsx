import Link from "next/link";
import { site } from "@/content/site";
import { jsonLd } from "@/lib/seo";

export type BreadcrumbItem = { label: string; href: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length < 2) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem", position: index + 1, name: item.label,
      item: new URL(item.href, site.url).href,
    })),
  };
  return <>
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>{items.map((item, index) => <li key={item.href}>
        {index > 0 && <span className="breadcrumb-separator" aria-hidden="true">›</span>}
        {index === items.length - 1 ? <span aria-current="page">{item.label}</span> : <Link href={item.href}>{item.label}</Link>}
      </li>)}</ol>
    </nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
  </>;
}

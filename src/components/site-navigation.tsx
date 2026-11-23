import { HeaderNavigation } from "./header-navigation";

const links = [
  { label: "Work", href: "/work/" },
  { label: "About", href: "/about/" },
  { label: "Blog", href: "/blog/" },
  { label: "Contact", href: "/contact/" },
];

export function SiteNavigation({ ventureLinks }: { ventureLinks: { label: string; href: string }[] }) {
  const ventures = {
    label: "Ventures", href: "/ventures/",
    groups: [{ links: [...ventureLinks, { label: "Free Tools", href: "/tools/" }] }],
  };
  return <HeaderNavigation links={[...links.slice(0, 2), ventures, ...links.slice(2)]} />;
}

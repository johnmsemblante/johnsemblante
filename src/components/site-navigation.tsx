import { HeaderNavigation } from "./header-navigation";
import { publishedTools } from "@/config/tool-ventures";

const links = [
  { label: "Work", href: "/work/" },
  { label: "About", href: "/about/" },
  { label: "Blog", href: "/blog/" },
  { label: "Contact", href: "/contact/" },
];

export function SiteNavigation({ ventureLinks }: { ventureLinks: { label: string; href: string }[] }) {
  const ventures = {
    label: "Ventures", href: "/ventures/",
    groups: [
      { links: ventureLinks },
      { label: "Free Tools", href: "/tools/", links: publishedTools.map(tool => ({ label: tool.navigationLabel ?? tool.shortName ?? tool.name, href: tool.route })) },
    ],
  };
  return <HeaderNavigation links={[...links.slice(0, 2), ventures, ...links.slice(2)]} />;
}

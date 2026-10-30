import { HeaderNavigation } from "./header-navigation";

const links = [
  { label: "Work", href: "/work/" },
  { label: "About", href: "/about/" },
  { label: "Ventures", href: "/ventures/" },
  { label: "Blog", href: "/blog/" },
  { label: "Contact", href: "/contact/" },
];

export function SiteNavigation() {
  return <HeaderNavigation links={links} />;
}

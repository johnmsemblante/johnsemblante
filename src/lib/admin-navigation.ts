export const adminLinks = [
  { href: "/adminauth/", label: "Overview", icon: "overview" },
  { href: "/adminauth/pages/", label: "Pages", icon: "pages" },
  { href: "/adminauth/blog/", label: "Blog", icon: "blog" },
  { href: "/adminauth/works/", label: "Works", icon: "works" },
  { href: "/adminauth/ventures/", label: "Ventures", icon: "ventures" },
  { href: "/adminauth/jobs/", label: "Job Finder", icon: "jobs" },
  { href: "/adminauth/documentation/", label: "Documentation", icon: "documentation" },
] as const;

export function activeAdminLink(pathname: string, href: string) {
  const path = `${pathname.replace(/\/$/, "")}/`;
  return href === "/adminauth/" ? path === href : path.startsWith(href);
}
export function safeAdminDestination(value: string | null): string | null {
  if (!value) return null;
  const path = value.endsWith("/") ? value : `${value}/`;
  return adminLinks.some(link => link.href === path) ? path : null;
}

import { buildVentures } from "./build-ventures";
import { buildWorks } from "./build-works";
import { buildBlogPosts } from "./build-blog";
import { publishedPosts } from "@/content/blog";
import { industries, industryPath } from "@/content/industries";
import { publishedTools } from "@/config/tool-ventures";

export function buildNavigation() {
  const ventures = buildVentures();
  const ventureOrder = ["golden-travel-and-tours", "lazy-barista", "lapse-hub"];
  const rank = (slug: string) => { const index = ventureOrder.indexOf(slug); return index < 0 ? ventureOrder.length : index; };
  const ventureLinks = [...ventures].sort((a, b) => rank(a.slug) - rank(b.slug)).map(venture => ({
    label: venture.slug === "golden-travel-and-tours" ? "Golden Travel & Tours" : venture.name,
    href: `/ventures/${venture.slug}/`,
  }));
  const breadcrumbRoutes = [
    { label: "Home", href: "/" },
    { label: "Work", href: "/work/" },
    { label: "About", href: "/about/" },
    { label: "Ventures", href: "/ventures/" },
    { label: "Free Tools", href: "/tools/" },
    { label: "Blog", href: "/blog/" },
    { label: "Contact", href: "/contact/" },
    ...buildWorks().map(project => ({ label: project.title, href: `/work/${project.slug}/` })),
    ...industries.map(industry => ({ label: industry.label, href: industryPath(industry.slug) })),
    ...[...publishedPosts(), ...buildBlogPosts()].map(post => ({ label: post.title, href: `/blog/${post.slug}/` })),
    ...publishedTools.map(tool => ({ label: tool.shortName ?? tool.name, href: tool.route })),
  ];
  return { ventureLinks, breadcrumbRoutes };
}

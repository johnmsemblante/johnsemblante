import type { MetadataRoute } from "next";
import { site } from "@/content/site";
import { buildWorks } from "@/lib/build-works";
import { ventures } from "@/ventures/registry";
import { publishedPosts } from "@/content/blog";
import { industries, industryPath } from "@/content/industries";
import { buildBlogPosts } from "@/lib/build-blog";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap { return ["/", "/work/", "/about/", "/ventures/", "/blog/", "/contact/", ...publishedPosts().map(post => `/blog/${post.slug}/`), ...buildBlogPosts().map(post => `/blog/${post.slug}/`), ...ventures.map(v => `/ventures/${v.slug}/`), ...buildWorks().map(p => `/work/${p.slug}/`), ...industries.map(industry => industryPath(industry.slug))].map(path => ({ url: `${site.url}${path}` })); }

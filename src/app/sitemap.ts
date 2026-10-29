import type { MetadataRoute } from "next";
import { site, projects } from "@/content/site";
import { ventures } from "@/ventures/registry";
import { publishedPosts } from "@/content/blog";
export const dynamic = "force-static";
export default function sitemap(): MetadataRoute.Sitemap { return ["/", "/work/", "/about/", "/ventures/", "/blog/", "/contact/", ...publishedPosts().map(post => `/blog/${post.slug}/`), ...ventures.map(v => `/ventures/${v.slug}/`), ...projects.map(p => `/work/${p.slug}/`)].map(path => ({ url: `${site.url}${path}` })); }

import { site } from "@/content/site";

export function jsonLd(value: unknown): string { return JSON.stringify(value).replace(/</g, "\\u003c"); }
export function articleSchema(post: { title: string; description: string; publishedAt: string; url: string; image?: string; tags?: string[]; categories?: string[] }) {
  return { "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: post.description,
    image: [new URL(post.image || site.socialImage, site.url).href], datePublished: post.publishedAt,
    author: { "@type": "Person", "@id": `${site.url}/#person`, name: site.name, url: `${site.url}/about/` },
    mainEntityOfPage: post.url, ...(post.tags?.length ? { keywords: post.tags.join(", ") } : {}), ...(post.categories?.length ? { articleSection: post.categories } : {}) };
}
export function websiteSchema() {
  return { "@context": "https://schema.org", "@graph": [
    { "@type": "WebSite", "@id": `${site.url}/#website`, url: `${site.url}/`, name: site.name, description: site.description, publisher: { "@id": `${site.url}/#person` } },
    { "@type": "Person", "@id": `${site.url}/#person`, name: site.name, url: `${site.url}/about/`, jobTitle: "WordPress and front-end developer" },
  ] };
}

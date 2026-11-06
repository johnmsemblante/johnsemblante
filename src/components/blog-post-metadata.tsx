"use client";

import { useEffect } from "react";
import { postMetadata, type ManagedPost } from "@/lib/blog-model";
import { site } from "@/content/site";
import { articleSchema } from "@/lib/seo";

export function BlogPostMetadata({ post, canonicalPath }: { post: ManagedPost; canonicalPath?: string }) {
  useEffect(() => {
    const metadata = postMetadata(post);
    const previousTitle = document.title;
    const cleanup: (() => void)[] = [];
    document.title = metadata.title;
    const canonicalUrl = `${site.url}${canonicalPath || `/blog/?post=${encodeURIComponent(post.slug)}`}`;
    const imageUrl = new URL(post.featuredImage || site.socialImage, site.url).href;
    function meta(attribute: "name" | "property", key: string, value: string) {
      const existing = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
      const element = existing ?? document.createElement("meta");
      const previous = element.getAttribute("content");
      element.setAttribute(attribute, key); element.content = value;
      if (!existing) document.head.appendChild(element);
      cleanup.push(() => { if (!existing) element.remove(); else if (previous === null) element.removeAttribute("content"); else element.content = previous; });
    }
    meta("name", "description", metadata.description);
    meta("property", "og:title", metadata.title); meta("property", "og:description", metadata.description);
    meta("property", "og:type", "article"); meta("property", "og:url", canonicalUrl);
    meta("property", "article:published_time", post.publishedAt);
    meta("name", "twitter:title", metadata.title); meta("name", "twitter:description", metadata.description);
    meta("property", "og:image", imageUrl); meta("property", "og:image:alt", post.featuredImageAlt || post.title);
    meta("name", "twitter:card", "summary_large_image"); meta("name", "twitter:image", imageUrl); meta("name", "twitter:image:alt", post.featuredImageAlt || post.title);
    const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonical = existing ?? document.createElement("link");
    const previousHref = canonical.getAttribute("href");
    canonical.rel = "canonical"; canonical.href = canonicalUrl;
    if (!existing) document.head.appendChild(canonical);
    cleanup.push(() => { if (!existing) canonical.remove(); else if (previousHref === null) canonical.removeAttribute("href"); else canonical.setAttribute("href", previousHref); });
    const structured = document.createElement("script");
    structured.type = "application/ld+json";
    structured.textContent = JSON.stringify(articleSchema({ title: post.title, description: metadata.description, image: imageUrl, publishedAt: post.publishedAt, tags: post.tags, categories: post.categories, url: canonicalUrl }));
    document.head.appendChild(structured);
    return () => { document.title = previousTitle; cleanup.forEach(fn => fn()); structured.remove(); };
  }, [post, canonicalPath]);
  return null;
}

"use client";

import { useEffect } from "react";
import { postMetadata, type ManagedPost } from "@/lib/blog-model";

export function BlogPostMetadata({ post }: { post: ManagedPost }) {
  useEffect(() => {
    const metadata = postMetadata(post);
    const previousTitle = document.title;
    const cleanup: (() => void)[] = [];
    document.title = metadata.title;
    const canonicalUrl = `${window.location.origin}/blog/?post=${encodeURIComponent(post.slug)}`;
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
    const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const canonical = existing ?? document.createElement("link");
    const previousHref = canonical.getAttribute("href");
    canonical.rel = "canonical"; canonical.href = canonicalUrl;
    if (!existing) document.head.appendChild(canonical);
    cleanup.push(() => { if (!existing) canonical.remove(); else if (previousHref === null) canonical.removeAttribute("href"); else canonical.setAttribute("href", previousHref); });
    const structured = document.createElement("script");
    structured.type = "application/ld+json";
    structured.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: post.title, description: metadata.description, datePublished: post.publishedAt, keywords: post.tags.join(", "), articleSection: post.categories, author: { "@type": "Person", name: "John Semblante" }, mainEntityOfPage: canonicalUrl });
    document.head.appendChild(structured);
    return () => { document.title = previousTitle; cleanup.forEach(fn => fn()); structured.remove(); };
  }, [post]);
  return null;
}

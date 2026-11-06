import type { ReactNode } from "react";
import { BlogFeaturedImage } from "./blog-featured-image";

export function BlogCard({ title, excerpt, href, image, imageAlt, children }: {
  title: string; excerpt: string; href: string; image?: string; imageAlt?: string; children: ReactNode;
}) {
  return <article className="blog-preview">
    <a href={href} aria-label={`Read ${title}`} className="blog-image-link"><BlogFeaturedImage src={image} alt={imageAlt || title} /></a>
    <div className="blog-card-content">{children}<h2><a href={href}>{title} →</a></h2><p>{excerpt}</p><a className="text-link" href={href}>Read article →</a></div>
  </article>;
}

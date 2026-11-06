import Link from "next/link";
import { site } from "@/content/site";
import { postMetadata, type ManagedPost } from "@/lib/blog-model";
import { articleSchema, jsonLd } from "@/lib/seo";
import { BlogArticleContent } from "./blog-article-content";
import { BlogFeaturedImage } from "./blog-featured-image";

export function PublishedBlogArticle({ post }: { post: ManagedPost }) {
  const metadata = postMetadata(post);
  const schema = articleSchema({ title: post.title, description: metadata.description, publishedAt: post.publishedAt, url: `${site.url}/blog/${post.slug}/`, image: post.featuredImage, tags: post.tags, categories: post.categories });
  return <article className="blog-article">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
    <Link className="text-link" href="/blog/">← All posts</Link>
    <header><ul className="article-categories" aria-label="Categories">{post.categories.map(category => <li key={category}>{category}</li>)}</ul><h1>{post.title}</h1><p className="lede">{post.excerpt}</p><div className="blog-meta"><Link href="/about/">{site.name}</Link><time dateTime={post.publishedAt}>{new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(post.publishedAt))} (Cebu)</time></div></header>
    {post.featuredImage && <BlogFeaturedImage src={post.featuredImage} alt={post.featuredImageAlt || post.title} />}
    <BlogArticleContent content={post.content} />
    {post.tags.length > 0 && <ul className="article-tags tags" aria-label="Tags">{post.tags.map(tag => <li key={tag}>{tag}</li>)}</ul>}
    <footer><Link className="text-link" href="/blog/">← Back to the blog</Link></footer>
  </article>;
}

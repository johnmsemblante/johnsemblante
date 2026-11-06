import { BlogCard } from "@/components/blog-card";
import { ManagedBlog } from "@/components/managed-blog";
import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedPosts, formatPostDate } from "@/content/blog";
import { PageIntro, Arrow } from "@/components/ui";
import { buildBlogPosts } from "@/lib/build-blog";
import { postMetadata } from "@/lib/blog-model";
import { PublishedBlogArticle } from "@/components/published-blog-article";
import { articleSchema, jsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug?: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  // The index is always generated, even before the first article is published.
  return [{ slug: [] }, ...[...publishedPosts(), ...buildBlogPosts()].map(post => ({ slug: [post.slug] }))];
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (!slug?.length) return pageMetadata("Web Development Notes & Articles", "Notes on web development, building businesses, and lessons from the work by John Semblante.", "/blog/");
  const managed = buildBlogPosts().find(post => slug.length === 1 && post.slug === slug[0]);
  if (managed) {
    const seo = postMetadata(managed);
    const metadata = pageMetadata(seo.title, seo.description, `/blog/${managed.slug}/`, managed.featuredImage ? { url: managed.featuredImage, alt: managed.featuredImageAlt || managed.title } : undefined);
    return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: managed.publishedAt, authors: [site.name] } };
  }
  const post = publishedPosts().find(post => slug.length === 1 && post.slug === slug[0]);
  if (!post) notFound();
  const metadata = pageMetadata(post.seoTitle?.trim() || post.title, post.seoDescription?.trim() || post.excerpt, `/blog/${post.slug}/`, post.featuredImage ? { url: post.featuredImage, alt: post.featuredImageAlt || post.title } : undefined);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: `${post.publishedAt}T00:00:00Z`, authors: ["John Semblante"] } };
}
export default async function Blog({ params }: Props) {
  const { slug } = await params;
  const posts = publishedPosts();
  const managed = buildBlogPosts();
  if (!slug?.length) return <ManagedBlog hasStaticPosts={posts.length > 0} initialPosts={managed}>
    <PageIntro eyebrow="Notes from the work" title="Development notes & lessons learned."><p>A place for practical ideas on websites, development, and building businesses.</p></PageIntro>
    <section className="section" aria-label="Blog posts">{posts.length ? <div className="blog-list">{posts.map(post => <BlogCard key={post.slug} title={post.title} excerpt={post.excerpt} href={`/blog/${post.slug}/`} image={post.featuredImage} imageAlt={post.featuredImageAlt} date={<time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>}><ul className="article-categories" aria-label="Categories"><li>{post.category}</li></ul></BlogCard>)}</div> : <div className="empty-state"><p className="eyebrow">A fresh page</p><h2>The first article is in progress.</h2><p>In the meantime, explore my projects or get in touch about a website you want to build or improve.</p></div>}</section>
  </ManagedBlog>;
  const managedPost = managed.find(post => slug.length === 1 && post.slug === slug[0]);
  if (managedPost) return <PublishedBlogArticle post={managedPost} />;
  const post = posts.find(post => slug.length === 1 && post.slug === slug[0]);
  if (!post) notFound();
  return <article className="blog-article">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema({ title: post.title, description: post.seoDescription?.trim() || post.excerpt, publishedAt: `${post.publishedAt}T00:00:00Z`, url: `${site.url}/blog/${post.slug}/`, image: post.featuredImage, categories: [post.category] })) }} />
    <Link className="text-link" href="/blog/">← All posts</Link>
    <header><p className="eyebrow">{post.category}</p><h1>{post.title}</h1><p className="lede">{post.excerpt}</p><div className="blog-meta"><span>John Semblante</span><time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time></div></header>
    <div className="blog-prose">{post.body.map((block, index) => {
      switch (block.type) {
        case "heading": return <h2 key={index}>{block.text}</h2>;
        case "quote": return <blockquote key={index}><p>{block.text}</p></blockquote>;
        case "list": return <ul key={index}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
        default: return <p key={index}>{block.text}</p>;
      }
    })}</div><footer><Link className="text-link" href="/blog/">← Back to the blog</Link></footer>
  </article>;
}

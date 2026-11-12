import { PageContent } from "@/components/page-content";
import { buildPage, withPageMetadata } from "@/lib/build-pages";

import { PageText, PageLink } from "@/components/page-content";
import { BlogCard } from "@/components/blog-card";
import { ManagedBlog } from "@/components/managed-blog";
import { notFound } from "next/navigation";
import { publishedPosts, formatPostDate } from "@/content/blog";
import { PageIntro, Arrow } from "@/components/ui";
import { buildBlogPosts } from "@/lib/build-blog";
import { postMetadata } from "@/lib/blog-model";
import { LivePublishedBlogArticle } from "@/components/live-published-blog-article";
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
  if (!slug?.length) return withPageMetadata("blog", pageMetadata("Web Development Notes & Articles", "Read notes from John Clark Semblante, a web developer in Cebu, on his development career, website projects, and independent ventures.", "/blog/"));
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
  if (!slug?.length) return <PageContent id="blog" initial={buildPage("blog")}><ManagedBlog hasStaticPosts={posts.length > 0} initialPosts={managed}>
    <PageIntro eyebrow={<PageText scope="blog_1" fallback={"Notes from the work"} />} title={<PageText scope="blog_2" fallback={"Development notes & lessons learned."} />}><p><PageText scope="blog_3" fallback={"Notes from my work as a web developer in Cebu: how I got started, what I’m learning, and the decisions behind the websites I build. For project screenshots and details, you can also explore my portfolio."} /></p></PageIntro>
    <section className="section" aria-label="Blog posts">{posts.length ? <div className="blog-list">{posts.map(post => <BlogCard key={post.slug} title={post.title} excerpt={post.excerpt} href={`/blog/${post.slug}/`} image={post.featuredImage} imageAlt={post.featuredImageAlt} date={<time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>}><ul className="article-categories" aria-label="Categories"><li>{post.category}</li></ul></BlogCard>)}</div> : <div className="empty-state"><p className="eyebrow"><PageText scope="blog_4" fallback={"A fresh page"} /></p><h2><PageText scope="blog_5" fallback={"The first article is in progress."} /></h2><p><PageText scope="blog_6" fallback={"In the meantime, explore my projects or get in touch about a website you want to build or improve."} /></p></div>}</section>
  </ManagedBlog></PageContent>;
  const managedPost = managed.find(post => slug.length === 1 && post.slug === slug[0]);
  if (managedPost) return <LivePublishedBlogArticle key={managedPost.slug} initialPost={managedPost} />;
  const post = posts.find(post => slug.length === 1 && post.slug === slug[0]);
  if (!post) notFound();
  return <article className="blog-article">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(articleSchema({ title: post.title, description: post.seoDescription?.trim() || post.excerpt, publishedAt: `${post.publishedAt}T00:00:00Z`, url: `${site.url}/blog/${post.slug}/`, image: post.featuredImage, categories: [post.category] })) }} />
    <PageLink scope="blog_7" className="text-link" href="/blog/"><PageText scope="blog_8" fallback={"← All posts"} /></PageLink>
    <header><p className="eyebrow">{post.category}</p><h1>{post.title}</h1><p className="lede">{post.excerpt}</p><div className="blog-meta"><span><PageText scope="blog_9" fallback={"John Semblante"} /></span><time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time></div></header>
    <div className="blog-prose">{post.body.map((block, index) => {
      switch (block.type) {
        case "heading": return <h2 key={index}>{block.text}</h2>;
        case "quote": return <blockquote key={index}><p>{block.text}</p></blockquote>;
        case "list": return <ul key={index}>{block.items.map((item, i) => <li key={i}>{item}</li>)}</ul>;
        default: return <p key={index}>{block.text}</p>;
      }
    })}</div><footer><PageLink scope="blog_10" className="text-link" href="/blog/"><PageText scope="blog_11" fallback={"← Back to the blog"} /></PageLink></footer>
  </article>;
}

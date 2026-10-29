import Link from "next/link";
import { notFound } from "next/navigation";
import { publishedPosts, formatPostDate } from "@/content/blog";
import { PageIntro, Arrow } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";

type Props = { params: Promise<{ slug?: string[] }> };
export const dynamicParams = false;
export function generateStaticParams() {
  // The index is always generated, even before the first article is published.
  return [{ slug: [] }, ...publishedPosts().map(post => ({ slug: [post.slug] }))];
}
export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  if (!slug?.length) return pageMetadata("Blog", "Writing, ideas, and learning notes from John Semblante.", "/blog/");
  const post = publishedPosts().find(post => slug.length === 1 && post.slug === slug[0]);
  if (!post) notFound();
  const metadata = pageMetadata(post.title, post.excerpt, `/blog/${post.slug}/`);
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: `${post.publishedAt}T00:00:00Z`, authors: ["John Semblante"] } };
}
export default async function Blog({ params }: Props) {
  const { slug } = await params;
  const posts = publishedPosts();
  if (!slug?.length) return <>
    <PageIntro eyebrow="The writing playground" title="Notes, ideas, and things I’m learning."><p>A space to practice writing, explore ideas, and share along the way.</p></PageIntro>
    <section className="section" aria-label="Blog posts">{posts.length ? <div className="blog-list">{posts.map(post => <article className="blog-preview" key={post.slug}><div className="blog-meta"><span>{post.category}</span><time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time></div><h2><Link href={`/blog/${post.slug}/`}>{post.title} <Arrow /></Link></h2><p>{post.excerpt}</p><Link className="text-link" href={`/blog/${post.slug}/`} aria-label={`Read ${post.title}`}>Read article <Arrow /></Link></article>)}</div> : <div className="empty-state"><p className="eyebrow">A fresh page</p><h2>The first post is still in the notebook.</h2><p>This is where I’ll share my writing as it takes shape. Check back for the first entry.</p></div>}</section>
  </>;
  const post = posts.find(post => slug.length === 1 && post.slug === slug[0]);
  if (!post) notFound();
  return <article className="blog-article">
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

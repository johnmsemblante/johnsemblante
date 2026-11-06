"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { collection, getDocs, limit, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { firebaseConfigured, getFirebase } from "@/lib/firebase-client";
import { effectiveStatus, postFromData, type ManagedPost } from "@/lib/blog-model";
import { readPublicArticle } from "@/lib/public-blog-store";
import { BlogArticleContent } from "./blog-article-content";
import { BlogPostMetadata } from "./blog-post-metadata";
import { BlogCard } from "./blog-card";
import { BlogFeaturedImage } from "./blog-featured-image";
import { PageIntro } from "./ui";

const dateLabel = (date: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(date));
type Pages = { published: QueryDocumentSnapshot | null; scheduled: QueryDocumentSnapshot | null; morePublished: boolean; moreScheduled: boolean };
const firstPages = (): Pages => ({ published: null, scheduled: null, morePublished: true, moreScheduled: true });
function BlogIntro() {
  return <PageIntro eyebrow="Notes from the work" title="Development notes & lessons learned."><p>A place for practical ideas on websites, development, and building businesses.</p></PageIntro>;
}

function Categories({ post }: { post: ManagedPost }) {
  return <ul className="article-categories" aria-label="Categories">{post.categories.map(category => <li key={category}>{category}</li>)}</ul>;
}
function Tags({ post }: { post: ManagedPost }) {
  return post.tags.length > 0 ? <ul className="article-tags tags" aria-label="Tags">{post.tags.map(tag => <li key={tag}>{tag}</li>)}</ul> : null;
}
function Labels({ post }: { post: ManagedPost }) { return <><Categories post={post} /><Tags post={post} /></>; }
function BlogCards({ posts, staticSlugs }: { posts: ManagedPost[]; staticSlugs: string[] }) {
  return <div className="blog-list">{posts.map(post => <BlogCard key={post.slug} title={post.title} excerpt={post.excerpt} href={staticSlugs.includes(post.slug) ? `/blog/${post.slug}/` : `/blog/?post=${encodeURIComponent(post.slug)}`} image={post.featuredImage} imageAlt={post.featuredImageAlt} date={<time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)} (Cebu)</time>} tags={<Tags post={post} />}><Categories post={post} /></BlogCard>)}</div>;
}
export function ManagedBlog({ children, hasStaticPosts, initialPosts = [] }: { children: ReactNode; hasStaticPosts: boolean; initialPosts?: ManagedPost[] }) {
  const staticSlugs = initialPosts.map(post => post.slug);
  const [posts, setPosts] = useState<ManagedPost[]>(initialPosts);
  const [article, setArticle] = useState<ManagedPost | null>(null);
  const [detail, setDetail] = useState(false);
  const [routeReady, setRouteReady] = useState(false);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [error, setError] = useState("");
  const [pages, setPages] = useState<Pages>(firstPages);
  const busy = useRef(false);
  const alive = useRef(true);
  const requested = useRef({ published: 20, scheduled: 20 });

  async function loadList(reset: boolean) {
    if (busy.current) return;
    busy.current = true;
    if (!reset) setLoading(true);
    try {
      const { db } = getFirebase();
      const state = reset ? firstPages() : pages;
      const source = collection(db, "blogPosts");
      const cutoff = Date.now() - 1000;
      const sizes = reset ? { ...requested.current } : { published: 20, scheduled: 20 };
      const snapshots = await Promise.all((["published", "scheduled"] as const).map(status => {
        if (!(status === "published" ? state.morePublished : state.moreScheduled)) return Promise.resolve(null);
        const clauses = [where("status", "==", status), ...(status === "scheduled" ? [where("releaseAt", ">=", 0), where("releaseAt", "<=", cutoff)] : []), orderBy(status === "scheduled" ? "releaseAt" : "publishedAt", "desc"), ...(state[status] ? [startAfter(state[status])] : []), limit(sizes[status])];
        return getDocs(query(source, ...clauses));
      }));
      if (!alive.current) return;
      const found = snapshots.flatMap(snapshot => snapshot?.docs.flatMap(item => { const post = postFromData(item.id, item.data()); return post && effectiveStatus(post) === "published" ? [post] : []; }) ?? []);
      setPosts(existing => [...new Map([...(reset ? [] : existing), ...found].map(post => [post.slug, post])).values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
      setPages({ published: snapshots[0]?.docs.at(-1) ?? state.published, scheduled: snapshots[1]?.docs.at(-1) ?? state.scheduled, morePublished: snapshots[0]?.size === sizes.published, moreScheduled: snapshots[1]?.size === sizes.scheduled });
      if (!reset) { requested.current.published += snapshots[0]?.size ?? 0; requested.current.scheduled += snapshots[1]?.size ?? 0; }
      setError("");
    } catch { if (alive.current) setError("Articles could not be loaded. Check your connection and device date/time, then refresh."); }
    finally { busy.current = false; if (alive.current) setLoading(false); }
  }

  useEffect(() => {
    alive.current = true;
    let disposed = false;
    const slug = new URLSearchParams(window.location.search).get("post");
    setDetail(slug !== null);
    setRouteReady(true);
    if (!firebaseConfigured) {
      if (slug !== null) setError("This article is currently unavailable.");
      return () => { alive.current = false; };
    }
    async function loadArticle() {
      if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) { setLoading(false); setError("This article is unavailable."); return; }
      try {
        const { db } = getFirebase();
        const post = await readPublicArticle(db, slug);
        if (disposed) return;
        if (post && effectiveStatus(post) === "published") { setArticle(post); setError(""); }
        else { setArticle(null); setError("This article is unavailable. It may be unpublished or scheduled for later."); }
      } catch { if (!disposed) { setArticle(null); setError("This article is unavailable. It may be unpublished, scheduled for later, or temporarily unreachable."); } }
      finally { if (!disposed) setLoading(false); }
    }
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      if (slug !== null) void loadArticle();
      else void loadList(true);
    };
    refresh();
    // Time-based rules do not push a change event when the clock passes a schedule.
    // Refresh visible pages to discover newly released posts, even with the editor closed.
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { disposed = true; alive.current = false; window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
    // Initial page selection is fixed by the URL; links navigate to a new page.
  }, []);

  if (firebaseConfigured && !routeReady) return <>{hasStaticPosts ? children : <BlogIntro />}<section className="section" aria-label="Blog" aria-busy="true"><BlogCards posts={initialPosts} staticSlugs={staticSlugs} /><p role="status">Loading blog…</p><noscript><p>JavaScript is needed to load the latest articles.</p></noscript></section></>;
  if (detail) return <article className="blog-article">
    <Link className="text-link" href="/blog/">← All posts</Link>
    {loading && <p role="status">Loading article…</p>}
    {error && <><h1>Article unavailable</h1><p role="status">{error}</p></>}
    {article && <><BlogPostMetadata post={article} canonicalPath={staticSlugs.includes(article.slug) ? `/blog/${article.slug}/` : undefined} /><header><Labels post={article} /><h1>{article.title}</h1><p className="lede">{article.excerpt}</p><div className="blog-meta"><span>John Semblante</span><time dateTime={article.publishedAt}>{dateLabel(article.publishedAt)} (Cebu)</time></div></header>{article.featuredImage && <BlogFeaturedImage src={article.featuredImage} alt={article.featuredImageAlt || article.title} />}<BlogArticleContent content={article.content} /></>}
  </article>;
  return <>
    {hasStaticPosts || (!firebaseConfigured && !initialPosts.length) ? children : <BlogIntro />}
    {(loading || error || posts.length > 0 || (firebaseConfigured && !hasStaticPosts)) && <section className="section" aria-label="Latest blog articles" aria-busy={loading}>
      <BlogCards posts={posts} staticSlugs={staticSlugs} />
      {loading && <p role="status">Loading latest articles…</p>}{error && <p role="status">{error}</p>}
      {!loading && !error && !posts.length && !hasStaticPosts && <div className="empty-state"><h2>No articles published yet.</h2><p>Check back for new notes from the work.</p></div>}
      {posts.length > 0 && (pages.morePublished || pages.moreScheduled) && !loading && <button type="button" className="button secondary" onClick={() => loadList(false)}>Load more articles</button>}
    </section>}
  </>;
}

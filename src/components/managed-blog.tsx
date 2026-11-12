"use client";

import { PageText, PageLink } from "@/components/page-content";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { collection, getDocsFromServer, limit, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { firebaseConfigured, getFirebase } from "@/lib/firebase-client";
import { effectiveStatus, postFromData, type ManagedPost } from "@/lib/blog-model";
import { readPublicArticle } from "@/lib/public-blog-store";
import { articleRefresher, subscribeBlogRefresh } from "@/lib/blog-refresh";
import { BlogArticleContent } from "./blog-article-content";
import { BlogPostMetadata } from "./blog-post-metadata";
import { BlogCard } from "./blog-card";
import { BlogFeaturedImage } from "./blog-featured-image";
import { ArticleShareLink } from "./article-share-link";
import { site } from "@/content/site";
import { PageIntro } from "./ui";

const dateLabel = (date: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "long", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(date));
type Pages = { published: QueryDocumentSnapshot | null; scheduled: QueryDocumentSnapshot | null; morePublished: boolean; moreScheduled: boolean };
const firstPages = (): Pages => ({ published: null, scheduled: null, morePublished: true, moreScheduled: true });
function BlogIntro() {
  return <PageIntro eyebrow={<PageText scope="blog_1" fallback={"Notes from the work"} />} title={<PageText scope="blog_2" fallback={"Development notes & lessons learned."} />}><p><PageText scope="blog_3" fallback={"Notes from my work as a web developer in Cebu: how I got started, what I’m learning, and the decisions behind the websites I build. For project screenshots and details, you can also explore my portfolio."} /></p></PageIntro>;
}

function Categories({ post }: { post: ManagedPost }) {
  return <ul className="article-categories" aria-label="Categories">{post.categories.map(category => <li key={category}><PageText scope="managed_blog_4" fallback={category} /></li>)}</ul>;
}
function Tags({ post }: { post: ManagedPost }) {
  return post.tags.length > 0 ? <ul className="article-tags tags" aria-label="Tags">{post.tags.map(tag => <li key={tag}>{tag}</li>)}</ul> : null;
}
function Labels({ post }: { post: ManagedPost }) { return <><Categories post={post} /><Tags post={post} /></>; }
function BlogCards({ posts, staticSlugs }: { posts: ManagedPost[]; staticSlugs: string[] }) {
  return <div className="blog-list">{posts.map(post => <BlogCard key={post.slug} title={post.title} excerpt={post.excerpt} href={staticSlugs.includes(post.slug) ? `/blog/${post.slug}/` : `/blog/?post=${encodeURIComponent(post.slug)}`} image={post.featuredImage} imageAlt={post.featuredImageAlt} date={<time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)} <PageText scope="managed_blog_5" fallback={"(Cebu)"} /></time>} tags={<Tags post={post} />}><Categories post={post} /></BlogCard>)}</div>;
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
  const listRefreshPending = useRef(false);
  const alive = useRef(true);
  const requested = useRef({ published: 20, scheduled: 20 });

  async function loadList(reset: boolean) {
    if (busy.current) { if (reset) listRefreshPending.current = true; return; }
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
        return getDocsFromServer(query(source, ...clauses));
      }));
      if (!alive.current) return;
      const found = snapshots.flatMap(snapshot => snapshot?.docs.flatMap(item => { const post = postFromData(item.id, item.data()); return post && effectiveStatus(post) === "published" ? [post] : []; }) ?? []);
      setPosts(existing => [...new Map([...(reset ? [] : existing), ...found].map(post => [post.slug, post])).values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)));
      setPages({ published: snapshots[0]?.docs.at(-1) ?? state.published, scheduled: snapshots[1]?.docs.at(-1) ?? state.scheduled, morePublished: snapshots[0]?.size === sizes.published, moreScheduled: snapshots[1]?.size === sizes.scheduled });
      if (!reset) { requested.current.published += snapshots[0]?.size ?? 0; requested.current.scheduled += snapshots[1]?.size ?? 0; }
      setError("");
    } catch { if (alive.current) setError("Articles could not be loaded. Check your connection and device date/time, then refresh."); }
    finally {
      busy.current = false;
      if (alive.current) setLoading(false);
      if (listRefreshPending.current && alive.current) { listRefreshPending.current = false; void loadList(true); }
    }
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
    const articleController = articleRefresher(async () => {
      if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
      return readPublicArticle(getFirebase().db, slug);
    }, post => {
      if (disposed) return;
      setArticle(post); setLoading(false);
      setError(post ? "" : "This article is unavailable. It may be unpublished or scheduled for later.");
    }, () => { if (!disposed) { setLoading(false); setError("This article is temporarily unreachable. Check your connection and try again."); } });
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      if (slug !== null) void articleController.refresh();
      else void loadList(true);
    };
    refresh();
    const unsubscribeRefresh = subscribeBlogRefresh(refresh);
    // Time-based rules do not push a change event when the clock passes a schedule.
    // Refresh visible pages to discover newly released posts, even with the editor closed.
    const timer = window.setInterval(refresh, 60000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { disposed = true; alive.current = false; articleController.dispose(); unsubscribeRefresh(); window.clearInterval(timer); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
    // Initial page selection is fixed by the URL; links navigate to a new page.
  }, []);

  if (firebaseConfigured && !routeReady) return <>{hasStaticPosts ? children : <BlogIntro />}<section className="section" aria-label="Blog" aria-busy="true"><BlogCards posts={initialPosts} staticSlugs={staticSlugs} /><p role="status"><PageText scope="managed_blog_6" fallback={"Loading blog…"} /></p><noscript><p><PageText scope="managed_blog_7" fallback={"JavaScript is needed to load the latest articles."} /></p></noscript></section></>;
  if (detail) return <article className="blog-article">
    <PageLink scope="managed_blog_8" className="text-link" href="/blog/"><PageText scope="managed_blog_9" fallback={"← All posts"} /></PageLink>
    {loading && <p role="status"><PageText scope="managed_blog_10" fallback={"Loading article…"} /></p>}
    {error && <>{!article && <h1><PageText scope="managed_blog_11" fallback={"Article unavailable"} /></h1>}<p role="status">{error}</p></>}
    {article && <><BlogPostMetadata post={article} canonicalPath={staticSlugs.includes(article.slug) ? `/blog/${article.slug}/` : undefined} /><header><Labels post={article} /><h1>{article.title}</h1><p className="lede">{article.excerpt}</p><div className="blog-meta"><span><PageText scope="managed_blog_12" fallback={"John Semblante"} /></span><time dateTime={article.publishedAt}>{dateLabel(article.publishedAt)} <PageText scope="managed_blog_13" fallback={"(Cebu)"} /></time></div></header>{article.featuredImage && <BlogFeaturedImage src={article.featuredImage} alt={article.featuredImageAlt || article.title} />}<BlogArticleContent content={article.content} /></>}
    {article && staticSlugs.includes(article.slug) && <footer><ArticleShareLink url={`${site.url}/blog/${article.slug}/`} /><p className="form-note"><PageText scope="managed_blog_14" fallback={"Use this article link for its own social preview title and image."} /></p></footer>}
  </article>;
  return <>
    {hasStaticPosts || (!firebaseConfigured && !initialPosts.length) ? children : <BlogIntro />}
    {(loading || error || posts.length > 0 || (firebaseConfigured && !hasStaticPosts)) && <section className="section" aria-label="Latest blog articles" aria-busy={loading}>
      <BlogCards posts={posts} staticSlugs={staticSlugs} />
      {loading && <p role="status"><PageText scope="managed_blog_15" fallback={"Loading latest articles…"} /></p>}{error && <p role="status">{error}</p>}
      {!loading && !error && !posts.length && !hasStaticPosts && <div className="empty-state"><h2><PageText scope="managed_blog_16" fallback={"No articles published yet."} /></h2><p><PageText scope="managed_blog_17" fallback={"Check back for new notes from the work."} /></p></div>}
      {posts.length > 0 && (pages.morePublished || pages.moreScheduled) && !loading && <button type="button" className="button secondary" onClick={() => loadList(false)}><PageText scope="managed_blog_18" fallback={"Load more articles"} /></button>}
    </section>}
  </>;
}

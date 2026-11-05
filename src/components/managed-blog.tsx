"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { collection, doc, getDocFromServer, getDocs, limit, orderBy, query, startAfter, where, type QueryDocumentSnapshot } from "firebase/firestore";
import { firebaseConfigured, getFirebase } from "@/lib/firebase-client";
import { postFromData, type ManagedPost } from "@/lib/blog-model";
import { BlogArticleContent } from "./blog-article-content";
import { PageIntro } from "./ui";

const dateLabel = (date: string) => new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));

export function ManagedBlog({ children, hasStaticPosts }: { children: ReactNode; hasStaticPosts: boolean }) {
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [article, setArticle] = useState<ManagedPost | null>(null);
  const [detail, setDetail] = useState(false);
  const [loading, setLoading] = useState(firebaseConfigured);
  const [error, setError] = useState("");
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);

  useEffect(() => {
    let disposed = false;
    const slug = new URLSearchParams(window.location.search).get("post");
    setDetail(slug !== null);
    if (!firebaseConfigured) {
      if (slug !== null) setError("This article is currently unavailable.");
      return;
    }
    const { db } = getFirebase();
    if (slug !== null) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) { setLoading(false); setError("This article is unavailable."); return; }
      getDocFromServer(doc(db, "blogPosts", slug)).then(snapshot => {
        if (disposed) return;
        const post = snapshot.exists() ? postFromData(snapshot.id, snapshot.data()) : null;
        // Even an authenticated admin sees only published articles on the public site.
        if (post?.status === "published") { setArticle(post); document.title = `${post.title} | John Semblante`; }
        else setError("This article is unavailable. It may have been unpublished.");
      }).catch(() => { if (!disposed) setError("This article is unavailable. It may be unpublished, or the connection may be interrupted."); }).finally(() => { if (!disposed) setLoading(false); });
    } else {
      getDocs(query(collection(db, "blogPosts"), where("status", "==", "published"), orderBy("publishedAt", "desc"), limit(20))).then(snapshot => {
        if (disposed) return;
        setPosts(snapshot.docs.flatMap(item => { const post = postFromData(item.id, item.data()); return post?.status === "published" ? [post] : []; }));
        setCursor(snapshot.docs.at(-1) ?? null); setMore(snapshot.size === 20);
      }).catch(() => { if (!disposed) setError("The latest articles could not be loaded. Please refresh to try again."); }).finally(() => { if (!disposed) setLoading(false); });
    }
    return () => { disposed = true; };
  }, []);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true); setError("");
    try {
      const { db } = getFirebase();
      const snapshot = await getDocs(query(collection(db, "blogPosts"), where("status", "==", "published"), orderBy("publishedAt", "desc"), startAfter(cursor), limit(20)));
      const next = snapshot.docs.flatMap(item => { const post = postFromData(item.id, item.data()); return post?.status === "published" ? [post] : []; });
      setPosts(values => [...values, ...next.filter(item => !values.some(existing => existing.slug === item.slug))]);
      setCursor(snapshot.docs.at(-1) ?? null); setMore(snapshot.size === 20);
    } catch { setError("More articles could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }

  if (detail) return <article className="blog-article">
    <Link className="text-link" href="/blog/">← All posts</Link>
    {loading && <p role="status">Loading article…</p>}
    {error && <><h1>Article unavailable</h1><p role="status">{error}</p></>}
    {article && <><header><p className="eyebrow">{article.category}</p><h1>{article.title}</h1><p className="lede">{article.excerpt}</p><div className="blog-meta"><span>John Semblante</span><time dateTime={article.publishedAt}>{dateLabel(article.publishedAt)}</time></div></header><BlogArticleContent content={article.content} /></>}
  </article>;
  return <>
    {hasStaticPosts || !posts.length ? children : <PageIntro eyebrow="Notes from the work" title="Development notes & lessons learned."><p>A place for practical ideas on websites, development, and building businesses.</p></PageIntro>}
    {(loading || error || posts.length > 0) && <section className="section" aria-label="Latest blog articles">
      <div className="blog-list">{posts.map(post => <article className="blog-preview" key={post.slug}><div className="blog-meta"><span>{post.category}</span><time dateTime={post.publishedAt}>{dateLabel(post.publishedAt)}</time></div><h2><a href={`/blog/?post=${encodeURIComponent(post.slug)}`}>{post.title} →</a></h2><p>{post.excerpt}</p><a className="text-link" href={`/blog/?post=${encodeURIComponent(post.slug)}`}>Read article →</a></article>)}</div>
      {loading && <p role="status">Loading latest articles…</p>}{error && <p role="status">{error}</p>}{more && <button type="button" className="button secondary" disabled={loading} onClick={loadMore}>Load more articles</button>}
    </section>}
  </>;
}

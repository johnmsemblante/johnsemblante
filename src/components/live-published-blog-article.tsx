"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { type ManagedPost } from "@/lib/blog-model";
import { firebaseConfigured, getFirebase } from "@/lib/firebase-client";
import { readPublicArticle } from "@/lib/public-blog-store";
import { articleRefresher, subscribeBlogRefresh } from "@/lib/blog-refresh";
import { BlogPostMetadata } from "./blog-post-metadata";
import { PublishedBlogArticle } from "./published-blog-article";

function UnavailableMetadata() {
  useEffect(() => {
    const previous = document.title;
    const existing = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    const element = existing ?? document.createElement("meta");
    const content = element.getAttribute("content");
    element.name = "robots"; element.content = "noindex, follow";
    if (!existing) document.head.appendChild(element);
    document.title = "Article unavailable | John Semblante";
    return () => { document.title = previous; if (!existing) element.remove(); else if (content === null) element.removeAttribute("content"); else element.content = content; };
  }, []);
  return null;
}

/** Pre-render the public snapshot, then refresh the reader's view anonymously. */
export function LivePublishedBlogArticle({ initialPost }: { initialPost: ManagedPost }) {
  const [post, setPost] = useState<ManagedPost | null>(initialPost);
  const [error, setError] = useState(false);
  const retry = useRef<() => void>(() => {});
  useEffect(() => {
    setPost(initialPost); setError(false);
    if (!firebaseConfigured) return;
    const controller = articleRefresher(() => readPublicArticle(getFirebase().db, initialPost.slug), value => { setPost(value); setError(false); }, () => setError(true));
    const refresh = () => { if (document.visibilityState !== "hidden") void controller.refresh(); };
    retry.current = refresh;
    refresh();
    const unsubscribe = subscribeBlogRefresh(refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    const interval = window.setInterval(refresh, 60000);
    return () => { controller.dispose(); retry.current = () => {}; unsubscribe(); window.clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [initialPost]);
  return <>
    {error && <div className="article-refresh-notice" role="status">The latest version could not be checked. {post ? "Showing the last available copy. " : ""}<button type="button" onClick={() => retry.current()}>Try again</button></div>}
    {post ? <><BlogPostMetadata post={post} canonicalPath={`/blog/${post.slug}/`} includeStructuredData={false} /><PublishedBlogArticle post={post} /></> : <article className="blog-article"><UnavailableMetadata /><Link href="/blog/" className="text-link">← All posts</Link><h1>Article unavailable</h1><p>This article is no longer public. It may have been unpublished, deleted or scheduled for later.</p></article>}
  </>;
}

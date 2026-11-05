"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { collection, doc, getDocFromServer, getDocs, limit, orderBy, query, runTransaction, serverTimestamp, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import { BlogArticleContent } from "@/components/blog-article-content";
import { firebaseMessage } from "@/lib/firebase-client";
import { postFromData, validatePost, type ManagedPost, type PostInput } from "@/lib/blog-model";
import { AdminGate, useAdmin } from "./admin-gate";

const emptyPost = (): PostInput => ({ slug: "", title: "", excerpt: "", category: "Notes", content: "", publishedAt: "", status: "draft" });

export function AdminBlog({ reservedSlugs = [] }: { reservedSlugs?: string[] }) {
  return <AdminGate><BlogEditor reservedSlugs={reservedSlugs} /></AdminGate>;
}

function BlogEditor({ reservedSlugs }: { reservedSlugs: string[] }) {
  const { db } = useAdmin();
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [input, setInput] = useState<PostInput>(emptyPost);
  const [saved, setSaved] = useState<ManagedPost | null>(null);
  const [baseline, setBaseline] = useState(() => JSON.stringify(emptyPost()));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const mounted = useRef(true);
  const saving = useRef(false);
  const dirty = JSON.stringify(input) !== baseline;

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!dirty) return;
    function unload(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    function leave(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a,button") : null;
      const link = target instanceof HTMLAnchorElement && target.target !== "_blank" && !target.getAttribute("href")?.startsWith("#");
      const logout = target instanceof HTMLButtonElement && target.dataset.adminSignout === "true";
      if ((link || logout) && !window.confirm("Leave this editor and discard unsaved changes?")) { event.preventDefault(); event.stopPropagation(); }
    }
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", leave, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", leave, true); };
  }, [dirty]);

  useEffect(() => {
    let disposed = false;
    getDocs(query(collection(db, "blogPosts"), orderBy("updatedAt", "desc"), limit(25))).then(snapshot => {
      if (disposed) return;
      setPosts(snapshot.docs.flatMap(item => { const post = postFromData(item.id, item.data()); return post ? [post] : []; }));
      setCursor(snapshot.docs.at(-1) ?? null); setMore(snapshot.size === 25); setLoading(false);
    }).catch(cause => { if (!disposed) { setError(firebaseMessage(cause)); setLoading(false); } });
    return () => { disposed = true; };
  }, [db]);

  async function loadMore() {
    if (!cursor || loading) return;
    setLoading(true); setError("");
    try {
      const snapshot = await getDocs(query(collection(db, "blogPosts"), orderBy("updatedAt", "desc"), startAfter(cursor), limit(25)));
      if (!mounted.current) return;
      const next = snapshot.docs.flatMap(item => { const post = postFromData(item.id, item.data()); return post ? [post] : []; });
      setPosts(values => [...values, ...next.filter(item => !values.some(existing => existing.slug === item.slug))]);
      setCursor(snapshot.docs.at(-1) ?? null); setMore(snapshot.size === 25);
    } catch (cause) { if (mounted.current) setError(firebaseMessage(cause)); }
    finally { if (mounted.current) setLoading(false); }
  }

  function canDiscard() { return !dirty || window.confirm("Discard the unsaved changes to this post?"); }
  function newPost() {
    if (!canDiscard()) return;
    const next = emptyPost(); setInput(next); setSaved(null); setBaseline(JSON.stringify(next)); setError(""); setNotice("");
  }
  async function editPost(slug: string) {
    if (busy || !canDiscard()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const snapshot = await getDocFromServer(doc(db, "blogPosts", slug));
      const post = snapshot.exists() ? postFromData(snapshot.id, snapshot.data()) : null;
      if (!post) { setError("This post could not be loaded. Refresh the page and try again."); return; }
      if (!mounted.current) return;
      const { revision: _revision, ...next } = post;
      // Keep only editable fields; database timestamps are never part of the form.
      const fields: PostInput = { slug: next.slug, title: next.title, excerpt: next.excerpt, category: next.category, content: next.content, publishedAt: next.publishedAt, status: next.status };
      setSaved(post); setInput(fields); setBaseline(JSON.stringify(fields));
    } catch (cause) { if (mounted.current) setError(firebaseMessage(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const next: PostInput = { ...input, title: input.title.trim(), excerpt: input.excerpt.trim(), category: input.category.trim(), content: input.content.trim() };
    const problem = validatePost(next);
    if (problem) { setError(problem); return; }
    if (reservedSlugs.includes(next.slug)) { setError("This slug belongs to a build-time article. Choose a different slug."); return; }
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const reference = doc(db, "blogPosts", next.slug);
      await runTransaction(db, async transaction => {
        const current = await transaction.get(reference);
        if (!saved && current.exists()) throw new Error("slug-conflict");
        if (saved && (!current.exists() || current.data().revision !== saved.revision)) throw new Error("revision-conflict");
        transaction.set(reference, { ...next, revision: (saved?.revision ?? 0) + 1, createdAt: current.exists() ? current.data().createdAt : serverTimestamp(), updatedAt: serverTimestamp() });
      });
      if (!mounted.current) return;
      const updated: ManagedPost = { ...next, revision: (saved?.revision ?? 0) + 1 };
      setInput(next); setSaved(updated); setBaseline(JSON.stringify(next));
      setPosts(values => [updated, ...values.filter(item => item.slug !== updated.slug)]);
      setNotice(next.status === "published" ? "Post published. It is now available on the public blog." : "Draft saved. It is not available on the public blog.");
    } catch (cause) {
      if (!mounted.current) return;
      const reason = (cause as Error).message;
      setError(reason === "slug-conflict" ? "That slug is already in use. Choose another slug." : reason === "revision-conflict" ? "This post changed in another tab. Copy your unsaved text before reopening the post to load the latest version." : firebaseMessage(cause));
    } finally { saving.current = false; if (mounted.current) setBusy(false); }
  }

  function field<Key extends keyof PostInput>(key: Key, value: PostInput[Key]) { setInput(current => ({ ...current, [key]: value })); setNotice(""); setError(""); }
  return <>
    <div className="admin-heading"><div><p className="eyebrow">Publishing</p><h1>Blog posts</h1><p>Write, preview and publish your articles.</p></div><button type="button" className="button secondary" disabled={busy} onClick={newPost}>New post</button></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <p role="status" className="admin-notice">{busy ? "Working…" : notice}</p>
    <div className="admin-editor-layout">
      <aside className="admin-card admin-post-list" aria-label="Saved posts"><h2>Your posts</h2>{!loading && !posts.length && <p>No posts saved yet. Start your first draft.</p>}<ul>{posts.map(post => <li key={post.slug}><button type="button" disabled={busy} aria-current={saved?.slug === post.slug ? "true" : undefined} onClick={() => editPost(post.slug)}>{post.title}<small>{post.status === "published" ? "Published" : "Draft"} · {post.slug}</small></button></li>)}</ul>{loading && <p role="status">Loading posts…</p>}{more && <button type="button" disabled={loading || busy} onClick={loadMore}>Load more posts</button>}</aside>
      <section className="admin-card"><h2>{saved ? "Edit post" : "New post"}</h2><p className="form-note">{dirty ? "You have unsaved changes." : saved ? "All changes saved." : "Start writing below."}</p>
        <form onSubmit={save} aria-busy={busy}><fieldset disabled={busy}>
          <label htmlFor="post-title">Title</label><input id="post-title" value={input.title} required maxLength={160} onChange={e => field("title", e.target.value)} />
          <label htmlFor="post-slug">URL slug</label><input id="post-slug" value={input.slug} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" disabled={!!saved} aria-describedby="post-slug-help" onChange={e => field("slug", e.target.value)} /><p id="post-slug-help" className="form-note">For example: building-better-websites. The slug is fixed after the first save to preserve links.</p>
          <label htmlFor="post-excerpt">Short introduction</label><textarea id="post-excerpt" value={input.excerpt} rows={3} required maxLength={500} onChange={e => field("excerpt", e.target.value)} />
          <div className="form-row"><div><label htmlFor="post-category">Category</label><input id="post-category" value={input.category} required maxLength={80} onChange={e => field("category", e.target.value)} /></div><div><label htmlFor="post-date">Publication date</label><input id="post-date" type="date" value={input.publishedAt} required={input.status === "published"} onChange={e => field("publishedAt", e.target.value)} /></div></div>
          <label htmlFor="post-content">Article</label><textarea id="post-content" value={input.content} rows={18} required maxLength={60000} aria-describedby="post-format-help" onChange={e => field("content", e.target.value)} /><p id="post-format-help" className="form-note">Separate paragraphs with a blank line. Use ## for a heading, - for list items, and &gt; for a quote. Put blank lines around these blocks. HTML, images and advanced Markdown are not supported.</p>
          <label htmlFor="post-status">Visibility after saving</label><select id="post-status" value={input.status} onChange={e => field("status", e.target.value as PostInput["status"])}><option value="draft">Draft — private</option><option value="published">Published — public</option></select><p className="form-note">Publishing makes the complete article public immediately after saving. Future dates do not schedule publication. Saving a published post as a draft removes public access.</p>
          <button type="submit" className="button">{input.status === "published" ? "Save and publish" : "Save draft"}</button>
          {saved?.status === "published" && <Link className="text-link" href={`/blog/?post=${encodeURIComponent(saved.slug)}`} target="_blank" rel="noopener noreferrer">View published post ↗</Link>}
        </fieldset></form>
        <details className="admin-preview"><summary>Preview article</summary><article><p className="eyebrow">{input.category}</p><h2>{input.title || "Untitled article"}</h2><p className="lede">{input.excerpt}</p><BlogArticleContent content={input.content} /></article></details>
      </section>
    </div>
  </>;
}

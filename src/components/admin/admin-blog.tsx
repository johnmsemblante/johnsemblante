"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { collection, doc, getDocFromServer, getDocs, limit, orderBy, query, startAfter, type QueryDocumentSnapshot } from "firebase/firestore";
import { BlogArticleContent } from "@/components/blog-article-content";
import { firebaseMessage } from "@/lib/firebase-client";
import { editablePost, effectiveStatus, emptyPost, manilaDateTime, normalizeLabels, postFromData, postMetadata, safeAssetUrl, slugForTitle, validatePost, type ManagedPost, type PostInput } from "@/lib/blog-model";
import { deleteManagedPost, saveManagedPost } from "@/lib/blog-store";
import { useAdmin } from "./admin-gate";
import { BlogFeaturedImage } from "@/components/blog-featured-image";
import { ArticleEditor } from "./article-editor";
import { TokenInput } from "./token-input";

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export function AdminBlog({ reservedSlugs = [] }: { reservedSlugs?: string[] }) {
  return <BlogEditor reservedSlugs={reservedSlugs} />;
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
  const [clock, setClock] = useState(Date.now);
  const [mediaType, setMediaType] = useState("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaLabel, setMediaLabel] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const mounted = useRef(true);
  const saving = useRef(false);
  const dirty = JSON.stringify(input) !== baseline;
  const seo = postMetadata(input);

  useEffect(() => {
    mounted.current = true;
    const timer = window.setInterval(() => setClock(Date.now()), 30000);
    return () => { mounted.current = false; window.clearInterval(timer); };
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
    window.addEventListener("beforeunload", unload); document.addEventListener("click", leave, true);
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
  function reset() {
    const next = emptyPost(); setInput(next); setSaved(null); setBaseline(JSON.stringify(next)); setMediaUrl(""); setMediaLabel(""); setError("");
  }
  function newPost() { if (canDiscard()) { reset(); setNotice(""); } }
  async function editPost(slug: string) {
    if (busy || !canDiscard()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const snapshot = await getDocFromServer(doc(db, "blogPosts", slug));
      const post = snapshot.exists() ? postFromData(snapshot.id, snapshot.data()) : null;
      if (!post) { setError("This post could not be loaded. Refresh the page and try again."); return; }
      if (!mounted.current) return;
      const next = editablePost(post);
      setSaved(post); setInput(next); setBaseline(JSON.stringify(next)); setMediaUrl(""); setMediaLabel("");
    } catch (cause) { if (mounted.current) setError(firebaseMessage(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }

  function operationError(cause: unknown) {
    const reason = (cause as Error).message;
    return reason === "revision-conflict" ? "This post changed in another tab. Copy unsaved text before reopening its latest version." : reason === "slug-conflict" ? "A unique slug could not be generated. Adjust the title and try again." : reason === "save-unconfirmed" ? "The save may have succeeded, but could not be verified. Copy your text and reload the post before saving again." : firebaseMessage(cause);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const next: PostInput = { ...input, slug: saved?.slug ?? slugForTitle(input.title), title: input.title.trim(), excerpt: input.excerpt.trim(), content: input.content.trim(), categories: normalizeLabels(input.categories), tags: normalizeLabels(input.tags), featuredImage: input.featuredImage.trim(), featuredImageAlt: input.featuredImageAlt.trim(), seoTitle: input.seoTitle.trim(), seoDescription: input.seoDescription.trim() };
    const problem = validatePost(next);
    if (problem) { setError(problem); return; }
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const updated = await saveManagedPost(db, next, saved, reservedSlugs);
      if (!mounted.current) return;
      const fields = editablePost(updated);
      setInput(fields); setSaved(updated); setBaseline(JSON.stringify(fields));
      setPosts(values => [updated, ...values.filter(item => item.slug !== updated.slug)]);
      setNotice(updated.status === "scheduled" ? `Scheduled for ${dateLabel(updated.publishedAt)} (Cebu/Manila).` : updated.status === "published" ? "Post published. It is now available on the public blog." : "Draft saved. It is private.");
    } catch (cause) { if (mounted.current) setError(operationError(cause)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }

  async function remove() {
    if (!saved || busy || !window.confirm(`Permanently delete "${saved.title}"? This removes the saved article and any unsaved edits. This cannot be undone.`)) return;
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      await deleteManagedPost(db, saved);
      if (!mounted.current) return;
      setPosts(values => values.filter(post => post.slug !== saved.slug)); reset(); setNotice("Article deleted.");
    } catch (cause) { if (mounted.current) setError(operationError(cause)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }

  function field<Key extends keyof PostInput>(key: Key, value: PostInput[Key]) {
    setInput(current => ({ ...current, [key]: value, ...(key === "title" && !saved ? { slug: slugForTitle(String(value)) } : {}) }));
    setNotice(""); setError("");
  }
  function insertMedia() {
    const raw = mediaUrl.trim();
    if (!safeAssetUrl(raw) || !mediaLabel.trim()) { setError("Enter an HTTPS or site-relative URL and a description for the image/file."); return; }
    const url = (raw.startsWith("/") ? raw : new URL(raw).href).replace(/\(/g, "%28").replace(/\)/g, "%29");
    const label = mediaLabel.trim().replace(/[\[\]\r\n]/g, " ");
    const snippet = `\n\n${mediaType === "image" ? "!" : ""}[${label}](${url})\n\n`;
    const start = textarea.current?.selectionStart ?? input.content.length;
    const end = textarea.current?.selectionEnd ?? start;
    const content = input.content.slice(0, start) + snippet + input.content.slice(end);
    if (content.length > 60000) { setError("The article exceeds 60,000 characters."); return; }
    field("content", content); setMediaUrl(""); setMediaLabel("");
    requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(start + snippet.length, start + snippet.length); });
  }

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Publishing</p><h1>Blog posts</h1><p>Write, preview, publish or schedule your articles.</p></div><button type="button" className="button secondary" disabled={busy} onClick={newPost}>New post</button></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    <p role="status" className="admin-notice">{busy ? "Working…" : notice}</p>
    <div className="admin-editor-layout">
      <aside className="admin-card admin-post-list" aria-label="Saved posts"><h2>Your posts</h2>{!loading && !posts.length && <p>No posts saved yet. Start your first draft.</p>}<ul>{posts.map(post => <li key={post.slug}><button type="button" disabled={busy} aria-current={saved?.slug === post.slug ? "true" : undefined} onClick={() => editPost(post.slug)}>{post.title}<small>{effectiveStatus(post, clock)} · {post.slug}</small></button></li>)}</ul>{loading && <p role="status">Loading posts…</p>}{more && <button type="button" disabled={loading || busy} onClick={loadMore}>Load more posts</button>}</aside>
      <section className="admin-card"><h2>{saved ? "Edit post" : "New post"}</h2><p className="form-note">{dirty ? "You have unsaved changes." : saved ? "All changes saved." : "Start writing below."}</p>
        <form onSubmit={save} aria-busy={busy}><fieldset disabled={busy}>
          <label htmlFor="post-title">Title</label><input id="post-title" value={input.title} required maxLength={160} onChange={e => field("title", e.target.value)} />
          <p className="form-note">Automatic slug: <code>{input.slug || "Generated from the title"}</code>. Duplicate titles get a number; saved slugs stay fixed.</p>
          <label htmlFor="post-excerpt">Short introduction</label><textarea id="post-excerpt" value={input.excerpt} rows={3} required maxLength={500} onChange={e => field("excerpt", e.target.value)} />
          <label htmlFor="post-featured-image">Featured image URL (optional)</label><input id="post-featured-image" value={input.featuredImage} maxLength={2000} aria-describedby="post-image-help" placeholder="https://example.com/photo.webp or /images/photo.webp" onChange={e => field("featuredImage", e.target.value)} />
          <p id="post-image-help" className="form-note">Use a public HTTPS or site-relative image URL. The blog card uses the site logo when this is empty or the image cannot load.</p>
          <label htmlFor="post-featured-image-alt">Featured image description (optional)</label><input id="post-featured-image-alt" value={input.featuredImageAlt} maxLength={200} placeholder={input.title || "Describe the image"} onChange={e => field("featuredImageAlt", e.target.value)} />
          <TokenInput key={`categories-${saved?.slug ?? "new"}`} id="post-categories" label="Categories" values={input.categories} maximum={10} onChange={values => field("categories", values)} />
          <TokenInput key={`tags-${saved?.slug ?? "new"}`} id="post-tags" label="Tags" values={input.tags} maximum={20} onChange={values => field("tags", values)} />
          <label htmlFor="post-content">Article</label><ArticleEditor value={input.content} onChange={value => field("content", value)} textareaRef={textarea} />
          <details className="article-insert"><summary>Insert an image or file</summary><label htmlFor="media-type">Insert</label><select id="media-type" value={mediaType} onChange={e => setMediaType(e.target.value)}><option value="image">Image</option><option value="asset">File / asset link</option></select><label htmlFor="media-url">Image or file URL</label><input id="media-url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://… or /images/…" /><label htmlFor="media-label">{mediaType === "image" ? "Image description (alt text)" : "Link label"}</label><input id="media-label" value={mediaLabel} maxLength={200} onChange={e => setMediaLabel(e.target.value)} /><button type="button" onClick={insertMedia}>Insert into article</button></details>
          <label htmlFor="post-status">Visibility after saving</label><select id="post-status" value={input.status} onChange={e => { field("status", e.target.value as PostInput["status"]); setClock(Date.now()); }}><option value="draft">Draft — private</option><option value="published">Published — public</option><option value="scheduled">Schedule</option></select>
          {input.status === "scheduled" ? <><label htmlFor="post-date">Publish date and time</label><input id="post-date" type="datetime-local" value={input.scheduledFor} min={manilaDateTime(clock + 60000)} required onFocus={() => setClock(Date.now())} onChange={e => field("scheduledFor", e.target.value)} /><p className="form-note">Cebu/Manila time (UTC+8). Choose a future date and time. The article remains private until then.</p></> : <p className="form-note">{input.status === "published" ? "Publication date and time are recorded automatically when you first publish. Editing keeps the original publication time." : "Drafts are private. Publishing records the publication date automatically."}</p>}
          {saved?.publishedAt && <p className="form-note">{effectiveStatus(saved, clock) === "published" ? "Published" : "Scheduled"}: {dateLabel(saved.publishedAt)} (Cebu/Manila).</p>}
          {input.status === "scheduled" && saved && effectiveStatus(saved, clock) === "published" && <p className="form-note">This schedule has already reached its publication time. Select Published to save edits without rescheduling, or choose a new future date.</p>}
          <fieldset className="seo-fields"><legend>SEO metadata</legend><label htmlFor="post-seo-title">Meta title (optional)</label><input id="post-seo-title" value={input.seoTitle} maxLength={160} placeholder={input.title || "Uses the post title"} onChange={e => field("seoTitle", e.target.value)} /><label htmlFor="post-seo-description">Meta description (optional)</label><textarea id="post-seo-description" value={input.seoDescription} maxLength={500} rows={3} placeholder={input.excerpt || "Uses the short introduction"} onChange={e => field("seoDescription", e.target.value)} /><p className="form-note">Blank fields use the title and short introduction. Preview: <strong>{seo.title || "Post title"}</strong> — {seo.description || "Short introduction"}</p></fieldset>
          <button type="submit" className="button">{input.status === "scheduled" ? "Save schedule" : input.status === "published" ? "Save and publish" : "Save draft"}</button>
          {saved && effectiveStatus(saved, clock) === "published" && <Link className="text-link" href={`/blog/?post=${encodeURIComponent(saved.slug)}`} target="_blank" rel="noopener noreferrer">View published post ↗</Link>}
        </fieldset></form>
        {saved && <button type="button" className="delete-article" disabled={busy} onClick={remove}>Delete article</button>}
        <details className="admin-preview"><summary>Preview article</summary><article><BlogFeaturedImage src={input.featuredImage} alt={input.featuredImageAlt || input.title} /><p className="eyebrow">{input.categories.join(" · ")}</p><h2>{input.title || "Untitled article"}</h2><p className="lede">{input.excerpt}</p><BlogArticleContent content={input.content} /><ul className="article-tags" aria-label="Tags">{input.tags.map(tag => <li key={tag}>#{tag}</li>)}</ul></article></details>
      </section>
    </div>
  </>;
}

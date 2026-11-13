"use client";

import { notifySitePublish } from "@/lib/site-publish";
import { useAdminActivity, useAdminMessage } from "./use-admin-feedback";

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
import { ImageUpload } from "./image-upload";
import { insertArticleMedia } from "@/lib/article-media";
import { BlogEditorDrawer } from "./blog-editor-drawer";
import { TokenInput } from "./token-input";
import { ArticleShareLink } from "@/components/article-share-link";
import { site } from "@/content/site";
import { requestBlogRefresh } from "@/lib/blog-refresh";

const dateLabel = (value: string) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" }).format(new Date(value));

export function AdminBlog({ reservedSlugs = [], exportedSlugs = [] }: { reservedSlugs?: string[]; exportedSlugs?: string[] }) {
  return <BlogEditor reservedSlugs={reservedSlugs} exportedSlugs={exportedSlugs} />;
}

function BlogEditor({ reservedSlugs, exportedSlugs }: { reservedSlugs: string[]; exportedSlugs: string[] }) {
  const { db } = useAdmin();
  const [editorOpen, setEditorOpen] = useState(false);
  const [posts, setPosts] = useState<ManagedPost[]>([]);
  const [input, setInput] = useState<PostInput>(emptyPost);
  const [saved, setSaved] = useState<ManagedPost | null>(null);
  const [customSlug, setCustomSlug] = useState(false);
  const [baseline, setBaseline] = useState(() => JSON.stringify(emptyPost()));
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useAdminMessage("error");
  const [notice, setNotice] = useAdminMessage("success");
  useAdminActivity(busy || loading, loading ? "Loading articles…" : "Working on your article…");
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [more, setMore] = useState(false);
  const [clock, setClock] = useState(Date.now);
  const [mediaType, setMediaType] = useState<"image" | "asset">("image");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaLabel, setMediaLabel] = useState("");
  const textarea = useRef<HTMLTextAreaElement>(null);
  const mediaPanel = useRef<HTMLDetailsElement>(null);
  const mediaCaret = useRef<number | null>(null);
  const uploading = useRef(false);
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
    if (!dirty && !uploading.current) return;
    function unload(event: BeforeUnloadEvent) { event.preventDefault(); event.returnValue = ""; }
    function leave(event: MouseEvent) {
      const target = event.target instanceof Element ? event.target.closest("a,button") : null;
      const link = target instanceof HTMLAnchorElement && target.target !== "_blank" && !target.getAttribute("href")?.startsWith("#");
      const logout = target instanceof HTMLButtonElement && target.dataset.adminSignout === "true";
      if ((link || logout) && !window.confirm("Leave this editor and discard unsaved changes?")) { event.preventDefault(); event.stopPropagation(); }
    }
    window.addEventListener("beforeunload", unload); document.addEventListener("click", leave, true);
    return () => { window.removeEventListener("beforeunload", unload); document.removeEventListener("click", leave, true); };
  }, [dirty, busy]);

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
    mediaCaret.current = null; setMediaType("image");
    const next = emptyPost(); setInput(next); setSaved(null); setCustomSlug(false); setBaseline(JSON.stringify(next)); setMediaUrl(""); setMediaLabel(""); setError("");
  }
  function newPost() { if (!busy && canDiscard()) { reset(); setNotice(""); setEditorOpen(true); } }
  function closeEditor() { if (!busy && canDiscard()) { reset(); setNotice(""); setEditorOpen(false); } }
  async function editPost(slug: string) {
    if (busy || !canDiscard()) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const snapshot = await getDocFromServer(doc(db, "blogPosts", slug));
      const post = snapshot.exists() ? postFromData(snapshot.id, snapshot.data()) : null;
      if (!post) { setError("This post could not be loaded. Refresh the page and try again."); return; }
      if (!mounted.current) return;
      const next = editablePost(post);
      mediaCaret.current = null; setMediaType("image");
      setSaved(post); setInput(next); setCustomSlug(true); setBaseline(JSON.stringify(next)); setMediaUrl(""); setMediaLabel(""); setEditorOpen(true);
    } catch (cause) { if (mounted.current) setError(firebaseMessage(cause)); }
    finally { if (mounted.current) setBusy(false); }
  }

  function operationError(cause: unknown) {
    const reason = (cause as Error).message;
    if (reason === "slug-in-use") return "That URL slug is already in use or reserved for a source article. Choose another slug; your edits are still here.";
    return reason === "revision-conflict" ? "This post changed in another tab. Copy unsaved text before reopening its latest version." : reason === "slug-conflict" ? "A unique slug could not be generated. Adjust the title and try again." : reason === "save-unconfirmed" ? "The save may have succeeded, but could not be verified. Copy your text and reload the post before saving again." : firebaseMessage(cause);
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current || uploading.current) return;
    const next: PostInput = { ...input, slug: input.slug.trim(), title: input.title.trim(), excerpt: input.excerpt.trim(), content: input.content.trim(), categories: normalizeLabels(input.categories), tags: normalizeLabels(input.tags), featuredImage: input.featuredImage.trim(), featuredImageAlt: input.featuredImageAlt.trim(), seoTitle: input.seoTitle.trim(), seoDescription: input.seoDescription.trim() };
    const problem = validatePost(next);
    if (problem) { setError(problem); return; }
    const renaming = saved && next.slug !== saved.slug;
    if (renaming && !window.confirm(`Change the article URL from /blog/${saved.slug}/ to /blog/${next.slug}/? Old links will need a redirect. Automatic publishing will update the exported pages and sitemap after the next check and build.`)) return;
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const updated = await saveManagedPost(db, next, saved, reservedSlugs, customSlug || saved ? { slug: next.slug } : {});
      if (!mounted.current) return;
      const fields = editablePost(updated);
      setInput(fields); setSaved(updated); setCustomSlug(true); setBaseline(JSON.stringify(fields));
      setPosts(values => [updated, ...values.filter(item => item.slug !== updated.slug && item.slug !== saved?.slug)]);
      requestBlogRefresh(); notifySitePublish();
      setNotice(updated.status === "scheduled" ? `Scheduled for ${dateLabel(updated.publishedAt)} (Cebu/Manila).` : updated.status === "published" ? "Post saved and available in the live blog view. Its clean URL and SEO HTML update after deployment. Check Automatic website publishing above for build status." : "Draft saved. Check Automatic website publishing above for the build that removes any previously exported public copy.");
      if (renaming) setNotice(`Slug changed to ${updated.slug}. The next automated build replaces the old exported page and updates the sitemap. Add a redirect for any shared old URL.`);
    } catch (cause) { if (mounted.current) setError(operationError(cause)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }

  async function remove() {
    if (!saved || busy || !window.confirm(`Permanently delete "${saved.title}"? This removes the saved article and any unsaved edits. This cannot be undone.`)) return;
    saving.current = true; setBusy(true); setError(""); setNotice("");
    try {
      await deleteManagedPost(db, saved);
      if (!mounted.current) return;
      setPosts(values => values.filter(post => post.slug !== saved.slug)); requestBlogRefresh(); notifySitePublish(); reset(); setEditorOpen(false); setNotice("Article deleted from Firestore. The next automated build removes any previously exported public page.");
    } catch (cause) { if (mounted.current) setError(operationError(cause)); }
    finally { saving.current = false; if (mounted.current) setBusy(false); }
  }

  function field<Key extends keyof PostInput>(key: Key, value: PostInput[Key]) {
    setInput(current => ({ ...current, [key]: value, ...(key === "title" && !saved && !customSlug ? { slug: slugForTitle(String(value)) } : {}) }));
    setNotice(""); setError("");
  }
  function uploadBusy(value: boolean) { uploading.current = value; setBusy(value); }
  function openImagePanel() {
    mediaCaret.current = textarea.current?.selectionEnd ?? input.content.length;
    setMediaType("image");
    if (mediaPanel.current) mediaPanel.current.open = true;
    document.getElementById("media-label")?.focus();
  }
  function insertMedia() {
    if (busy || uploading.current) return;
    try {
      const next = insertArticleMedia(input.content, mediaCaret.current ?? input.content.length, mediaType, mediaUrl, mediaLabel);
      field("content", next.content); setMediaUrl(""); setMediaLabel(""); mediaCaret.current = next.caret;
      if (mediaPanel.current) mediaPanel.current.open = false;
      setNotice("Image or link inserted. Choose Preview to review it, then save the article.");
      requestAnimationFrame(() => { textarea.current?.focus(); textarea.current?.setSelectionRange(next.caret, next.caret); });
    } catch (cause) { setError((cause as Error).message); }
  }

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Publishing</p><h1>Blog posts</h1><p>Write, preview, publish or schedule your articles.</p></div><button type="button" id="new-blog-post" aria-haspopup="dialog" className="button secondary" disabled={busy} onClick={newPost}>New post</button></div>
    {!editorOpen && <>{error && <p role="alert" className="form-error">{error}</p>}<p role="status" className="admin-notice">{busy ? "Loading article?" : notice}</p></>}
    <section className="admin-card admin-post-library" aria-labelledby="post-library-heading">
      <div className="post-library-heading"><div><h2 id="post-library-heading">Your articles</h2><p>Choose an article to edit, or start a new post.</p></div><span>{posts.length}{more ? "+" : ""} articles</span></div>
      {!loading && !posts.length && <div className="empty-state"><h3>No posts saved yet.</h3><p>Create your first draft with New post.</p></div>}
      <ul className="post-library-list">{posts.map(post => <li key={post.slug}><button type="button" disabled={busy} aria-haspopup="dialog" onClick={() => editPost(post.slug)}><span className="post-library-copy"><strong>{post.title}</strong><span>{post.excerpt}</span><small>{post.categories.join(" ? ")}</small></span><span className="post-library-meta"><span className={`post-status post-status-${effectiveStatus(post, clock)}`}>{effectiveStatus(post, clock)}</span><small>{post.publishedAt ? dateLabel(post.publishedAt) : "Not published"}</small><span className="post-library-action">Edit article <span aria-hidden="true">?</span></span></span></button></li>)}</ul>
      {loading && <p role="status">Loading posts?</p>}{more && <button type="button" className="button secondary" disabled={loading || busy} onClick={loadMore}>Load more posts</button>}
    </section>
    {editorOpen && <BlogEditorDrawer title={saved ? "Edit post" : "New post"} busy={busy} onClose={closeEditor}>
        <p className="form-note">{dirty ? "You have unsaved changes." : saved ? "All changes saved." : "Start writing below."}</p>
        {error && <p role="alert" className="form-error">{error}</p>}
        <p role="status" className="admin-notice">{busy ? "Working?" : notice}</p>
        <p className="form-note">Readers automatically check for saved public edits on article pages. Saving also refreshes open blog tabs in this browser. Automatic checks pick up saved public changes and build the initial article HTML, search/social previews and sitemap. See Automatic website publishing above for timing. Previously exported HTML stays public until that deployment, even after unpublishing or deleting.</p>
        <form onSubmit={save} aria-busy={busy}><fieldset disabled={busy}>
          <label htmlFor="post-title">Title</label><input id="post-title" value={input.title} required maxLength={160} onChange={e => field("title", e.target.value)} />
          <label htmlFor="post-slug">URL slug</label><input id="post-slug" value={input.slug} required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="post-slug-help" onChange={e => { setCustomSlug(true); field("slug", e.target.value); }} />
          <button type="button" disabled={!input.title.trim()} onClick={() => { setCustomSlug(true); field("slug", slugForTitle(input.title)); }}>Generate from title</button>
          <p id="post-slug-help" className="form-note">Use lowercase letters, numbers and hyphens. URL: <code>/blog/{input.slug || "your-slug"}/</code>. Changing a saved title keeps its URL unless you edit the slug or generate it again. Renaming is picked up by automatic publishing; old links need a redirect configured separately.</p>
          <label htmlFor="post-excerpt">Short introduction</label><textarea id="post-excerpt" value={input.excerpt} rows={3} required maxLength={500} onChange={e => field("excerpt", e.target.value)} />
          <label htmlFor="post-featured-image">Featured image URL (optional)</label><input id="post-featured-image" value={input.featuredImage} maxLength={2000} aria-describedby="post-image-help" placeholder="https://example.com/photo.webp or /images/photo.webp" onChange={e => field("featuredImage", e.target.value)} />
          <p id="post-image-help" className="form-note">Upload a featured image below, or use a public HTTPS or site-relative image URL. The blog card uses the site logo when this is empty or the image cannot load.</p>
          <ImageUpload label="Upload featured image" onUpload={url => field("featuredImage", url)} onBusy={uploadBusy} disabled={busy} />
          <label htmlFor="post-featured-image-alt">Featured image description (optional)</label><input id="post-featured-image-alt" value={input.featuredImageAlt} maxLength={200} placeholder={input.title || "Describe the image"} onChange={e => field("featuredImageAlt", e.target.value)} />
          {input.featuredImage && safeAssetUrl(input.featuredImage) && <img className="work-editor-preview" src={input.featuredImage} alt={input.featuredImageAlt || input.title || "Featured image preview"} />}
          <TokenInput key={`categories-${saved?.slug ?? "new"}`} id="post-categories" label="Categories" values={input.categories} maximum={10} onChange={values => field("categories", values)} />
          <TokenInput key={`tags-${saved?.slug ?? "new"}`} id="post-tags" label="Tags" values={input.tags} maximum={20} onChange={values => field("tags", values)} />
          <label htmlFor="post-content">Article</label><ArticleEditor value={input.content} onChange={value => field("content", value)} textareaRef={textarea} onImage={openImagePanel} onSelectionChange={position => { mediaCaret.current = position; }} />
          <details ref={mediaPanel} className="article-insert"><summary>Insert an image or file</summary>
            <p className="form-note">Place the cursor in the article, then upload an image or paste a URL below. Add a description and choose Insert into article. Selected text is kept; the image is placed after it. With no cursor selected, it is added at the end.</p>
            <label htmlFor="media-type">Insert</label><select id="media-type" value={mediaType} onChange={e => { setMediaType(e.target.value as "image" | "asset"); setMediaUrl(""); setMediaLabel(""); }}><option value="image">Image</option><option value="asset">File / asset link</option></select>
            <label htmlFor="media-label">{mediaType === "image" ? "Image description (alt text)" : "Link label"}</label><input id="media-label" value={mediaLabel} maxLength={200} onChange={e => setMediaLabel(e.target.value)} />
            {mediaType === "image" ? <ImageUpload label="Upload article image" successMessage="Image uploaded. Add its description, then choose Insert into article." onUpload={url => { setMediaUrl(url); setError(""); }} onBusy={uploadBusy} disabled={busy} /> : <p className="form-note">For PDFs and other files, paste an existing public URL below.</p>}
            <label htmlFor="media-url">Image or file URL</label><input id="media-url" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="https://… or /images/…" />
            {mediaType === "image" && mediaUrl && safeAssetUrl(mediaUrl) && <img className="work-editor-preview" src={mediaUrl} alt={mediaLabel || "Uploaded image preview"} />}
            <button type="button" onClick={insertMedia}>Insert into article</button>
          </details>
          <label htmlFor="post-status">Visibility after saving</label><select id="post-status" value={input.status} onChange={e => { field("status", e.target.value as PostInput["status"]); setClock(Date.now()); }}><option value="draft">Draft — private</option><option value="published">Published — public</option><option value="scheduled">Schedule</option></select>
          {input.status === "scheduled" ? <><label htmlFor="post-date">Publish date and time</label><input id="post-date" type="datetime-local" value={input.scheduledFor} min={manilaDateTime(clock + 60000)} required onFocus={() => setClock(Date.now())} onChange={e => field("scheduledFor", e.target.value)} /><p className="form-note">Cebu/Manila time (UTC+8). Choose a future date and time. The article remains private until then.</p></> : <p className="form-note">{input.status === "published" ? "Publication date and time are recorded automatically when you first publish. Editing keeps the original publication time." : "Drafts are private. Publishing records the publication date automatically."}</p>}
          {saved?.publishedAt && <p className="form-note">{effectiveStatus(saved, clock) === "published" ? "Published" : "Scheduled"}: {dateLabel(saved.publishedAt)} (Cebu/Manila).</p>}
          {input.status === "scheduled" && saved && effectiveStatus(saved, clock) === "published" && <p className="form-note">This schedule has already reached its publication time. Select Published to save edits without rescheduling, or choose a new future date.</p>}
          <fieldset className="seo-fields"><legend>SEO metadata</legend><label htmlFor="post-seo-title">Meta title (optional)</label><input id="post-seo-title" value={input.seoTitle} maxLength={160} placeholder={input.title || "Uses the post title"} onChange={e => field("seoTitle", e.target.value)} /><label htmlFor="post-seo-description">Meta description (optional)</label><textarea id="post-seo-description" value={input.seoDescription} maxLength={500} rows={3} placeholder={input.excerpt || "Uses the short introduction"} onChange={e => field("seoDescription", e.target.value)} /><p className="form-note">Blank fields use the title and short introduction. Preview: <strong>{seo.title || "Post title"}</strong> — {seo.description || "Short introduction"}</p></fieldset>
          <button type="submit" className="button">{input.status === "scheduled" ? "Save schedule" : input.status === "published" ? "Save and publish" : "Save draft"}</button>
          {saved && effectiveStatus(saved, clock) === "published" && <div className="admin-post-sharing">
            {exportedSlugs.includes(saved.slug) ? <><Link className="text-link" href={`/blog/${saved.slug}/`} target="_blank" rel="noopener noreferrer">View published post ↗</Link><ArticleShareLink url={`${site.url}/blog/${saved.slug}/`} /><p className="form-note">Use the copied article URL for social previews. The automatic build updates its title, image and content after saved edits.</p></> : <p className="form-note">The automatic build creates this article’s shareable page with its own preview title and image. See Automatic website publishing above for timing.</p>}
            <Link className="text-link" href={`/blog/?post=${encodeURIComponent(saved.slug)}`} target="_blank" rel="noopener noreferrer">View latest database version ↗</Link>
          </div>}
        </fieldset></form>
        {saved && <button type="button" className="delete-article" disabled={busy} onClick={remove}>Delete article</button>}
        <details className="admin-preview"><summary>Preview article</summary><article><BlogFeaturedImage src={input.featuredImage} alt={input.featuredImageAlt || input.title} /><p className="eyebrow">{input.categories.join(" · ")}</p><h2>{input.title || "Untitled article"}</h2><p className="lede">{input.excerpt}</p><BlogArticleContent content={input.content} /><ul className="article-tags tags" aria-label="Tags">{input.tags.map(tag => <li key={tag}>{tag}</li>)}</ul></article></details>
    </BlogEditorDrawer>}
  </>;
}

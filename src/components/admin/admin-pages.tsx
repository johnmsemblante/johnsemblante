"use client";

import { notifySitePublish } from "@/lib/site-publish";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { doc, getDocFromServer, runTransaction } from "firebase/firestore";
import { pageCatalog } from "@/lib/page-catalog";
import { emptyPage, pageUrl, validatePage, type PageId, type PageRecord } from "@/lib/page-model";
import { firebaseMessage } from "@/lib/firebase-client";
import { useAdmin } from "./admin-gate";
import { BlogEditorDrawer } from "./blog-editor-drawer";
import { ImageUpload } from "./image-upload";

export function AdminPages() {
  const { db } = useAdmin();
  const [selected, setSelected] = useState<PageId | null>(null);
  const [input, setInput] = useState<PageRecord | null>(null);
  const [baseline, setBaseline] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const lock = useRef(false);
  const mounted = useRef(true);
  const dirty = !!input && JSON.stringify(input) !== baseline;
  const blocked = busy || uploads > 0;
  const page = pageCatalog.find(p => p.id === selected);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || blocked) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, blocked]);
  async function open(id: PageId) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(""); setNotice("");
    try {
      const snapshot = await getDocFromServer(doc(db, "pages", id));
      const record = snapshot.exists() ? snapshot.data() : emptyPage();
      if (!validatePage(record)) throw new Error("This page has invalid saved data. Check its Firestore record before editing.");
      if (mounted.current) { setSelected(id); setInput(record); setBaseline(JSON.stringify(record)); setSearch(""); }
    } catch (e) { if (mounted.current) setError((e as { code?: string }).code ? firebaseMessage(e) : (e as Error).message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  function close() {
    if (blocked || (dirty && !window.confirm("Discard your unsaved page changes?"))) return;
    setSelected(null); setInput(null); setError("");
  }
  function value(key: string, next: string) {
    setInput(current => current && ({ ...current, values: { ...current.values, [key]: next } }));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!input || !selected || !page || blocked || lock.current) return;
    setError(""); setNotice("");
    if (!validatePage(input)) { setError("Check your image URLs, descriptions, and field lengths before saving."); return; }
    for (const field of page.fields) {
      const next = input.values[field.key];
      if (next !== undefined && (field.kind === "url" || field.kind === "image") && !pageUrl(next, field.kind === "image")) {
        setError(`Enter a valid ${field.kind === "image" ? "image path or HTTPS URL" : "link destination"} for ${field.label}.`); return;
      }
    }
    lock.current = true; setBusy(true);
    const next = { ...input, revision: input.revision + 1 };
    // Store only overrides; removing a field restores its source-code default.
    next.values = Object.fromEntries(Object.entries(next.values).filter(([key, v]) => page.fields.find(f => f.key === key)?.value !== v));
    try {
      await runTransaction(db, async tx => {
        const ref = doc(db, "pages", selected), snapshot = await tx.get(ref);
        if ((snapshot.exists() ? snapshot.data().revision : 0) !== input.revision) throw new Error("This page changed in another tab. Copy your edits, close the editor, and reopen it before saving.");
        tx.set(ref, next);
      });
      if (mounted.current) { setInput(next); setBaseline(JSON.stringify(next)); notifySitePublish(); setNotice("Page saved. Content updates live. Automatic publishing updates exported HTML, search metadata, and social previews after the next check and build."); }
    } catch (e) { if (mounted.current) setError((e as { code?: string }).code ? firebaseMessage(e) : (e as Error).message); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  }
  const uploadBusy = (active: boolean) => setUploads(count => Math.max(0, count + (active ? 1 : -1)));
  const groups = page ? [...new Set(page.fields.map(f => f.group))] : [];
  return <>
    <div className="admin-heading"><div><p className="eyebrow">Website content</p><h1>Pages</h1><p>Edit page copy, images, links, and search metadata. Individual blogs, works, and ventures keep their own content.</p></div></div>
    {!selected && error && <p className="form-error" role="alert">{error}</p>}
    <div className="page-admin-list">{pageCatalog.map(p => <button id={`edit-page-${p.id}`} key={p.id} className="page-admin-row" disabled={blocked} onClick={() => void open(p.id)}><span><strong>{p.title}</strong><small>{p.path}</small></span><span>{p.fields.length} fields</span><span>Edit page →</span></button>)}</div>
    {selected && input && page && <BlogEditorDrawer title={`Edit ${page.title}`} editorLabel="page" returnFocusId={`edit-page-${selected}`} side="left" busy={blocked} onClose={close}>
      <form className="work-editor page-editor" onSubmit={save}>
        <p className="form-note">Fields start with the current code defaults. Reset a field to restore its default. Blog posts and project records are edited in Blog and Works.</p>
        <a className="text-link" href={page.path} target="_blank" rel="noopener noreferrer">View public page ↗</a>
        <fieldset disabled={blocked}>
          <h3>Search metadata</h3>
          <label>Meta title<input value={input.seoTitle} maxLength={160} placeholder="Use the current page title" onChange={e => setInput({ ...input, seoTitle: e.target.value })} /></label>
          <label>Meta description<textarea value={input.seoDescription} maxLength={500} placeholder="Use the current page description" onChange={e => setInput({ ...input, seoDescription: e.target.value })} /></label>
          <p className="form-note">Leave these blank to use the code defaults. Search engines and social previews receive changes after rebuilding and deploying.</p>
          <label>Find a content field<input type="search" value={search} placeholder="Search current text or section" onChange={e => setSearch(e.target.value)} /></label>
        </fieldset>
        {groups.map(group => {
          const fields = page.fields.filter(f => f.group === group && `${f.label} ${f.value} ${group}`.toLowerCase().includes(search.toLowerCase()));
          return fields.length > 0 && <details className="page-field-group" key={group} open={!!search || group === page.id}><summary>{group.replaceAll("_", " ")} <small>{fields.length} fields</small></summary>
            <fieldset disabled={blocked}>{fields.map(field => <div key={field.key} className="page-content-field">
              <label htmlFor={field.key}>{field.label || "Text"}</label>
              {field.kind === "text" ? <textarea id={field.key} rows={field.value.length > 160 ? 4 : 2} maxLength={10000} value={input.values[field.key] ?? field.value} onChange={e => value(field.key, e.target.value)} /> : <input id={field.key} maxLength={2000} value={input.values[field.key] ?? field.value} onChange={e => value(field.key, e.target.value)} />}
              {field.kind === "image" && <><ImageUpload disabled={blocked} onBusy={uploadBusy} onUpload={url => value(field.key, url)} /><img className="work-editor-preview" src={pageUrl(input.values[field.key] ?? field.value, true) ? input.values[field.key] ?? field.value : field.value} alt="Current page image preview" /></>}
              <button type="button" disabled={input.values[field.key] === undefined} onClick={() => setInput(current => { if (!current) return current; const values = { ...current.values }; delete values[field.key]; return { ...current, values }; })}>Reset to code default</button>
            </div>)}</fieldset>
          </details>;
        })}
        <fieldset disabled={blocked}>
          <h3>Additional images</h3><p className="form-note">Insert images in a gallery after this page’s content. Existing page images stay in their original sections.</p>
          {input.images.map((image, index) => <div className="work-gallery-edit" key={index}>
            <label>Image URL<input required maxLength={2000} value={image.src} onChange={e => setInput({ ...input, images: input.images.map((v,i) => i === index ? { ...v, src: e.target.value } : v) })} /></label>
            <ImageUpload disabled={blocked} onBusy={uploadBusy} onUpload={src => setInput(current => current && ({ ...current, images: current.images.map((v,i) => i === index ? { ...v, src } : v) }))} />
            <label>Image description<input required maxLength={200} value={image.alt} onChange={e => setInput({ ...input, images: input.images.map((v,i) => i === index ? { ...v, alt: e.target.value } : v) })} /></label>
            <label>Caption<textarea maxLength={500} value={image.caption} onChange={e => setInput({ ...input, images: input.images.map((v,i) => i === index ? { ...v, caption: e.target.value } : v) })} /></label>
            {pageUrl(image.src, true) && <img className="work-editor-preview" src={image.src} alt={image.alt} />}
            <button type="button" onClick={() => setInput({ ...input, images: input.images.filter((_,i) => i !== index) })}>Remove image</button>
          </div>)}
          <button type="button" disabled={input.images.length >= 5} onClick={() => setInput({ ...input, images: [...input.images, { src: "", alt: "", caption: "" }] })}>Add image</button>
        </fieldset>
        {error && <p role="alert" className="form-error">{error}</p>}{notice && <p role="status">{notice}</p>}
        <div className="actions page-editor-actions"><button className="button" type="submit" disabled={blocked}>{busy ? "Saving…" : uploads ? "Uploading…" : "Save page"}</button><button type="button" disabled={blocked} onClick={close}>Close</button><span>{dirty ? "Unsaved changes" : "All changes saved"}</span></div>
      </form>
    </BlogEditorDrawer>}
  </>;
}

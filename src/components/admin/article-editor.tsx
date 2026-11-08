"use client";

import { useState, type RefObject } from "react";
import { BlogArticleContent } from "@/components/blog-article-content";
import { formatArticle, type ArticleFormat } from "@/lib/article-formatting";
import { safeAssetUrl } from "@/lib/blog-model";

const tools: { format: ArticleFormat; label: string; title: string }[] = [
  { format: "heading", label: "H2", title: "Heading 2" },
  { format: "subheading", label: "H3", title: "Heading 3" },
  { format: "bold", label: "Bold", title: "Bold" },
  { format: "italic", label: "Italic", title: "Italic" },
  { format: "code", label: "Code", title: "Inline code" },
  { format: "list", label: "Bullets", title: "Bulleted list" },
  { format: "ordered-list", label: "Numbers", title: "Numbered list" },
  { format: "quote", label: "Quote", title: "Block quote" },
];

export function ArticleEditor({ value, onChange, textareaRef, onImage, onSelectionChange }: {
  value: string; onChange: (value: string) => void; textareaRef: RefObject<HTMLTextAreaElement | null>;
  onImage?: () => void; onSelectionChange?: (position: number) => void;
}) {
  const [preview, setPreview] = useState(false);
  const [link, setLink] = useState<{ start: number; end: number } | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  function selection() { return { start: textareaRef.current?.selectionStart ?? value.length, end: textareaRef.current?.selectionEnd ?? value.length }; }
  function apply(format: ArticleFormat, href?: string) {
    const range = format === "link" && link ? link : selection();
    const next = formatArticle(value, range.start, range.end, format, href);
    if (next.content.length > 60000) { setError("The article exceeds 60,000 characters."); return; }
    setError(""); onChange(next.content); setLink(null); setUrl("");
    requestAnimationFrame(() => { textareaRef.current?.focus(); textareaRef.current?.setSelectionRange(next.start, next.end); });
  }
  return <div className="article-editor">
    <div className="article-editor-modes" role="group" aria-label="Article view"><button type="button" aria-pressed={!preview} onClick={() => { setPreview(false); setLink(null); }}>Write</button><button type="button" aria-pressed={preview} onClick={() => { setPreview(true); setLink(null); }}>Preview</button></div>
    {!preview && <>
      <div className="article-formatting" role="group" aria-label="Article formatting">{tools.map(tool => <button type="button" key={tool.format} title={tool.title} aria-label={tool.title} onMouseDown={event => event.preventDefault()} onClick={() => apply(tool.format)}>{tool.label}</button>)}<button type="button" onMouseDown={event => event.preventDefault()} onClick={() => { setLink(selection()); setError(""); }}>Link</button>{onImage && <button type="button" onMouseDown={event => event.preventDefault()} onClick={onImage}>Image</button>}</div>
      {link && <div className="article-link-input"><label htmlFor="article-link-url">Link URL</label><input id="article-link-url" autoFocus value={url} onChange={event => setUrl(event.target.value)} placeholder="https://example.com or /contact/" onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); if (safeAssetUrl(url.trim())) apply("link", url); else setError("Enter an HTTPS or site-relative link URL."); } if (event.key === "Escape") { event.preventDefault(); setLink(null); textareaRef.current?.focus(); } }} /><button type="button" onClick={() => { if (safeAssetUrl(url.trim())) apply("link", url); else setError("Enter an HTTPS or site-relative link URL."); }}>Insert link</button><button type="button" onClick={() => { setLink(null); setError(""); textareaRef.current?.focus(); }}>Cancel</button></div>}
    </>}
    <textarea ref={textareaRef} id="post-content" value={value} hidden={preview} rows={18} required={!preview} maxLength={60000} aria-describedby="post-format-help" onSelect={event => onSelectionChange?.(event.currentTarget.selectionEnd)} onChange={event => { setError(""); onChange(event.target.value); onSelectionChange?.(event.target.selectionEnd); }} onKeyDown={event => {
      if ((event.ctrlKey || event.metaKey) && !event.altKey && ["b", "i"].includes(event.key.toLowerCase())) { event.preventDefault(); apply(event.key.toLowerCase() === "b" ? "bold" : "italic"); }
    }} />
    {preview && <div className="article-editor-preview" role="region" aria-label="Formatted article preview">{value.trim() ? <BlogArticleContent content={value} /> : <p>Start writing to preview your article.</p>}</div>}
    <p id="post-format-help" className="form-note">Select text and use the toolbar, then choose Preview to see the formatting. Ctrl/Cmd+B for bold; Ctrl/Cmd+I for italic. Markdown is saved with the article; pasted HTML stays plain text. Images and file links can be inserted below.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
  </div>;
}

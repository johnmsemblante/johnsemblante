"use client";

import { useState } from "react";

export function ArticleShareLink({ url }: { url: string }) {
  const [status, setStatus] = useState("");
  const [fallback, setFallback] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setFallback(false); setStatus("Article link copied.");
    } catch {
      setFallback(true); setStatus("Select and copy the article link below.");
    }
  }
  return <div className="article-share-link">
    <button type="button" className="button secondary" onClick={copy}>Copy article link</button>
    <span role="status">{status}</span>
    {fallback && <input type="text" readOnly value={url} aria-label="Article link to copy" onFocus={event => event.currentTarget.select()} />}
  </div>;
}

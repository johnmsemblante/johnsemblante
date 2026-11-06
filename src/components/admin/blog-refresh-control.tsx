"use client";

import Link from "next/link";
import { useState } from "react";
import { requestBlogRefresh } from "@/lib/blog-refresh";

export function BlogRefreshControl() {
  const [message, setMessage] = useState("");
  return <section className="admin-card blog-refresh-control" aria-labelledby="blog-refresh-title">
    <h2 id="blog-refresh-title">Blog content refresh</h2>
    <p>Saved articles check for the latest public content automatically. Use this if an open blog tab still shows an older version.</p>
    <button type="button" className="button secondary" onClick={() => setMessage(requestBlogRefresh() ? "Refresh requested for open public blog tabs in this browser. You can also reopen the article to read the latest saved content." : "Browser storage is blocked, so other tabs could not be notified. Reopen or refresh the public article to load its latest saved content.")}>Refresh live blog content</button>
    <Link href="/blog/" className="text-link" target="_blank" rel="noopener noreferrer">Open public blog ↗</Link>
    <p role="status" className="admin-notice">{message}</p>
    <p className="form-note">This refreshes open tabs in this browser. It does not purge Firebase Hosting or social-platform caches. Rebuild and deploy to update the article HTML, search/social previews, or remove previously exported content.</p>
  </section>;
}

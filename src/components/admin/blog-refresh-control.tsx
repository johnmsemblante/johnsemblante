"use client";
import { useRef, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { requestSiteRefresh } from "@/lib/site-refresh";
import { firebaseMessage } from "@/lib/firebase-client";
import { useAdmin } from "./admin-gate";

export function BlogRefreshControl() {
  const { db } = useAdmin();
  const [message, setMessage] = useState(""), [busy, setBusy] = useState(false);
  const lock = useRef(false);
  async function refresh() {
    if (lock.current) return;
    lock.current = true; setBusy(true); setMessage("");
    requestSiteRefresh();
    try {
      await setDoc(doc(db, "siteState", "content"), { token: crypto.randomUUID(), updatedAt: serverTimestamp() });
      setMessage("Site-wide refresh requested. Connected visitors will reload the latest managed page, blog, work, and venture content. Other visitors receive the latest content when they open or refresh a page.");
    } catch (error) { setMessage("This browser was notified, but the site-wide request failed. " + firebaseMessage(error)); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="admin-card blog-refresh-control" aria-labelledby="site-refresh-title">
    <h2 id="site-refresh-title">Site-wide content refresh</h2>
    <p>Ask connected public pages across browsers and devices to fetch the latest saved content.</p>
    <button type="button" className="button secondary" disabled={busy} onClick={() => void refresh()}>{busy ? "Requesting refresh?" : "Refresh live site content"}</button>
    <p role="status" className="admin-notice">{message}</p>
    <p className="form-note">This refreshes managed content. Automatic publishing checks saved public content every five minutes and builds clean URLs, initial HTML and SEO metadata when needed. See Automatic website publishing for progress. Social platforms manage their own preview caches.</p>
  </section>;
}

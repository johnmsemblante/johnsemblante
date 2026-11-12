"use client";

import { createContext, useContext, useEffect, useState, type ReactNode, type ComponentProps } from "react";
import Link from "next/link";
import { doc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { articleRefresher } from "@/lib/blog-refresh";
import { subscribeSiteRefresh } from "@/lib/site-refresh";
import { firebaseConfigured, getFirebase } from "@/lib/firebase-client";
import { emptyPage, fieldKey, pageUrl, validatePage, type PageId, type PageRecord } from "@/lib/page-model";

const Content = createContext<PageRecord | null>(null);
export function PageContent({ id, initial, children }: { id: PageId; initial: PageRecord; children: ReactNode }) {
  const [record, setRecord] = useState(initial);
  const [error, setError] = useState(false);
  useEffect(() => {
    setRecord(initial);
    if (!firebaseConfigured) return;
    const ref = doc(getFirebase().db, "pages", id);
    const accept = (value: unknown) => { if (!validatePage(value)) throw new Error("Invalid page content"); setRecord(value); setError(false); };
    const reader = articleRefresher(async () => { const snapshot = await getDocFromServer(ref); return snapshot.exists() ? snapshot.data() : emptyPage(); }, accept, () => setError(true));
    const refresh = () => { if (document.visibilityState !== "hidden") void reader.refresh(); };
    const stop = onSnapshot(ref, snapshot => {
      if (!snapshot.metadata.fromCache) { try { accept(snapshot.exists() ? snapshot.data() : emptyPage()); } catch { setError(true); } }
    }, () => setError(true));
    refresh(); const unsubscribe = subscribeSiteRefresh(refresh);
    window.addEventListener("focus", refresh); document.addEventListener("visibilitychange", refresh);
    return () => { reader.dispose(); stop(); unsubscribe(); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [id, initial]);
  return <Content.Provider value={record}>{error && <p role="status" className="article-refresh-notice">The latest page content could not be loaded. Showing the last available copy. <button type="button" onClick={() => window.dispatchEvent(new Event("focus"))}>Try again</button></p>}{children}{record.images.length > 0 && <section className="section page-image-gallery" aria-label="Page images">{record.images.map((image, i) => <figure key={i}><img src={image.src} alt={image.alt} loading="lazy" />{image.caption && <figcaption>{image.caption}</figcaption>}</figure>)}</section>}</Content.Provider>;
}
function useValue(scope: string, fallback: string) {
  const record = useContext(Content);
  return record?.values[fieldKey(scope, fallback)] ?? fallback;
}
export function PageText({ scope, fallback }: { scope: string; fallback: string }) {
  const value = useValue(scope, fallback);
  return <>{value}</>;
}
export function PageImage({ scope, src = "", alt = "", ...props }: ComponentProps<"img"> & { scope: string; src: string }) {
  const nextSrc = useValue(`${scope}_src`, src);
  const nextAlt = useValue(`${scope}_alt_${fieldKey("asset", src)}`, alt);
  return <img {...props} src={pageUrl(nextSrc, true) ? nextSrc : src} alt={nextAlt} />;
}
export function PageLink({ scope, href, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { scope: string; href: string }) {
  const value = useValue(scope, href);
  return <Link {...props} href={pageUrl(value) ? value : href} />;
}

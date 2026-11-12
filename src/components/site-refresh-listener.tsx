"use client";
import { useEffect } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { firebaseConfigured, getFirebase } from "@/lib/firebase-client";
import { requestSiteRefresh } from "@/lib/site-refresh";
/** A public version signal reaches visitors in other browsers/devices, too. */
export function SiteRefreshListener() {
  useEffect(() => {
    if (!firebaseConfigured) return;
    let previous: string | undefined;
    return onSnapshot(doc(getFirebase().db, "siteState", "content"), snapshot => {
      if (snapshot.metadata.fromCache) return;
      const next = snapshot.exists() ? snapshot.data().token : "";
      if (typeof next !== "string") return;
      if (previous !== undefined && previous !== next && !window.location.pathname.startsWith("/adminauth")) requestSiteRefresh();
      previous = next;
    }, () => { /* Individual readers still refresh on load/focus. */ });
  }, []);
  return null;
}

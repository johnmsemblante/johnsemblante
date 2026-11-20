"use client";
import { useEffect } from "react";
import { afterPageLoad } from "@/lib/after-page-load";
import { requestSiteRefresh } from "@/lib/site-refresh";
/** A public version signal reaches visitors in other browsers/devices, too. */
export function SiteRefreshListener() {
  useEffect(() => {
    return afterPageLoad(({ doc, getFirebase, onSnapshot }) => {
      let previous: string | undefined;
      return onSnapshot(doc(getFirebase().db, "siteState", "content"), snapshot => {
        if (snapshot.metadata.fromCache) return;
        const next = snapshot.exists() ? snapshot.data().token : "";
        if (typeof next !== "string") return;
        if (previous !== undefined && previous !== next && !window.location.pathname.startsWith("/adminauth")) requestSiteRefresh();
        previous = next;
      }, () => { /* Individual readers still refresh on load/focus. */ });
    });
  }, []);
  return null;
}

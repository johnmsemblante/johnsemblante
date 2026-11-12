import { subscribeSiteRefresh } from "./site-refresh";
const eventName = "portfolio:blog-refresh";
const storageKey = "portfolio:blog-refresh-request";

/** Only a refresh signal is stored. Never clear authentication or unrelated app data. */
export function requestBlogRefresh(): boolean {
  let otherTabsNotified = false;
  try {
    window.localStorage.setItem(storageKey, `${Date.now()}-${Math.random()}`);
    otherTabsNotified = true;
  } catch { /* The local event still works when browser storage is blocked. */ }
  window.dispatchEvent(new Event(eventName));
  return otherTabsNotified;
}

export function subscribeBlogRefresh(refresh: () => void): () => void {
  const stopSiteRefresh = subscribeSiteRefresh(refresh);
  const storage = (event: StorageEvent) => { if (event.key === storageKey && event.newValue) refresh(); };
  window.addEventListener(eventName, refresh);
  window.addEventListener("storage", storage);
  return () => { stopSiteRefresh(); window.removeEventListener(eventName, refresh); window.removeEventListener("storage", storage); };
}

/** Coalesce overlapping refreshes; a save during an old read forces a fresh read. */
export function articleRefresher<T>(read: () => Promise<T>, receive: (value: T) => void, fail: () => void) {
  let stopped = false;
  let again = false;
  let pending: Promise<void> | null = null;
  function refresh(): Promise<void> {
    if (stopped) return Promise.resolve();
    again = true;
    if (pending) return pending;
    pending = (async () => {
      do {
        again = false;
        try { const value = await read(); if (!stopped && !again) receive(value); }
        catch { if (!stopped && !again) fail(); }
      } while (again && !stopped);
    })().finally(() => { pending = null; });
    return pending;
  }
  return { refresh, dispose() { stopped = true; } };
}

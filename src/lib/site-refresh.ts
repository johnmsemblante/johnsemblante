const eventName = "portfolio:site-refresh";
const storageKey = "portfolio:site-refresh-request";
export function requestSiteRefresh(): boolean {
  let notified = false;
  try { window.localStorage.setItem(storageKey, `${Date.now()}-${Math.random()}`); notified = true; } catch {}
  window.dispatchEvent(new Event(eventName));
  return notified;
}
export function subscribeSiteRefresh(refresh: () => void) {
  const storage = (event: StorageEvent) => { if (event.key === storageKey && event.newValue) refresh(); };
  window.addEventListener(eventName, refresh); window.addEventListener("storage", storage);
  return () => { window.removeEventListener(eventName, refresh); window.removeEventListener("storage", storage); };
}

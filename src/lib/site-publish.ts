"use client";
const eventName = "portfolio:publish-request";
/** Local notice only: GitHub checks public content independently of the browser. */
export function notifySitePublish() { window.dispatchEvent(new Event(eventName)); }
export function subscribeSitePublish(callback: () => void) {
  window.addEventListener(eventName, callback);
  return () => window.removeEventListener(eventName, callback);
}

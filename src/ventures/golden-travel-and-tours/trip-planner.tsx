"use client";

import { useEffect, useRef } from "react";
import { TripEstimator } from "./trip-estimator";

export function TripPlanner() {
  const panel = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);

  useEffect(() => {
    let frame = 0;
    function reveal() {
      if (!panel.current) return;
      panel.current.open = true;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        summary.current?.focus({ preventScroll: true });
        panel.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
      });
    }
    function followLink(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (link?.getAttribute("href") !== "#trip-estimator") return;
      event.preventDefault();
      reveal();
    }
    function followAddress() {
      if (window.location.hash === "#trip-estimator" || new URLSearchParams(window.location.search).has("requestquote")) reveal();
    }
    followAddress();
    document.addEventListener("click", followLink, true);
    window.addEventListener("hashchange", followAddress);
    window.addEventListener("popstate", followAddress);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", followLink, true);
      window.removeEventListener("hashchange", followAddress);
      window.removeEventListener("popstate", followAddress);
    };
  }, []);

  return <section className="venture-section trip-planner-section" aria-label="Request a travel quote">
    <details id="trip-estimator" ref={panel} className="trip-planner">
      <summary ref={summary} className="trip-planner-heading">
        <span><span className="eyebrow">Golden Travel and Tours</span><span className="trip-planner-title">Let’s plan your Cebu trip.</span><span className="trip-planner-hint">Build your own itinerary or explore our 12 packages.</span></span>
        <span className="trip-planner-indicator" aria-hidden="true" />
      </summary>
      <div className="trip-planner-body"><TripEstimator /></div>
    </details>
  </section>;
}

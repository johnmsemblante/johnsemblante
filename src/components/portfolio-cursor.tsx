"use client";

import { useEffect, useRef } from "react";
import "./portfolio-cursor.css";

export function PortfolioCursor() {
  const ring = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const element = ring.current;
    const shell = element?.parentElement;
    if (!element || !shell) return;
    const enabled = matchMedia("(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)");
    const hide = () => shell.removeAttribute("data-mouse");
    const move = (event: PointerEvent) => {
      if (!enabled.matches || event.pointerType !== "mouse") { hide(); return; }
      element.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      shell.setAttribute("data-mouse", "");
    };
    shell.addEventListener("pointermove", move, { passive: true });
    shell.addEventListener("pointerleave", hide);
    shell.addEventListener("pointercancel", hide);
    window.addEventListener("blur", hide);
    document.addEventListener("keydown", hide);
    enabled.addEventListener("change", hide);
    return () => {
      hide();
      shell.removeEventListener("pointermove", move);
      shell.removeEventListener("pointerleave", hide);
      shell.removeEventListener("pointercancel", hide);
      window.removeEventListener("blur", hide);
      document.removeEventListener("keydown", hide);
      enabled.removeEventListener("change", hide);
    };
  }, []);
  return <span ref={ring} className="portfolio-cursor-ring" aria-hidden="true" />;
}

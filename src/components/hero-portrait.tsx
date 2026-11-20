"use client";

import { useEffect, useRef } from "react";

export function HeroPortrait() {
  const image = useRef<HTMLImageElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const photo = image.current;
    const layer = canvas.current;
    const art = photo?.parentElement;
    if (!photo || !layer || !art) return;

    const enabled = matchMedia("(prefers-reduced-motion: no-preference)");
    let visible = false;
    let generation = 0;
    let pending = false;
    let renderer: ReturnType<typeof import("@/lib/portrait-particles").createParticlePortrait> | undefined;

    function sync() {
      if (!enabled.matches) {
        generation++;
        pending = false;
        renderer?.dispose();
        renderer = undefined;
        return;
      }
      const active = visible && !document.hidden;
      if (renderer) {
        renderer.setActive(active);
      } else if (active && !pending && photo && layer) {
        pending = true;
        const request = ++generation;
        void Promise.all([import("@/lib/portrait-particles"), photo.decode()]).then(([module]) => {
          if (request !== generation) return;
          renderer = module.createParticlePortrait(photo, layer);
          renderer.setActive(visible && !document.hidden);
        }).catch(() => {
          if (request === generation && art) art.dataset.portrait = "fallback";
        });
      }
    }

    if (!("IntersectionObserver" in window)) {
      art.dataset.portrait = "fallback";
      return;
    }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    observer.observe(layer);
    enabled.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      generation++;
      observer.disconnect();
      enabled.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      renderer?.dispose();
      delete art.dataset.portrait;
    };
  }, []);

  return <><figure className="hero-portrait">
    <div className="hero-portrait-art">
      <img ref={image} src="/images/profile/john-doodle-sketch.webp" alt="Graphite portrait of John Clark Semblante" width={640} height={827} fetchPriority="high" decoding="async" />
    </div>
  </figure><canvas className="portrait-particle-field" ref={canvas} aria-hidden="true" /></>;
}

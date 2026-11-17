"use client";

import { useEffect, useRef, useState } from "react";
import { advancePortrait, portraitArtwork, portraitTarget } from "@/lib/portrait-model";
import portraitConfig from "@/content/hero-portrait.json";

export function HeroPortrait() {
  const image = useRef<HTMLImageElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = canvas.current, artwork = image.current;
    if (!element || !artwork) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let renderer: ReturnType<typeof import("@/lib/portrait-renderer").createPortraitRenderer> | undefined;
    let disposed = false, failed = false, loading = false, visible = false, frame = 0, generation = 0;
    let lastFrame = 0, current = { x: 0, y: 0 }, target = { x: 0, y: 0 }, velocity = { x: 0, y: 0 };
    let pointerPosition: { x: number; y: number } | undefined;
    let loadController: AbortController | undefined;
    const stop = () => { cancelAnimationFrame(frame); frame = 0; lastFrame = 0; };
    const enabled = () => !disposed && !failed && !reduced.matches && pointer.matches;
    const fail = () => { failed = true; generation++; loading = false; loadController?.abort(); stop(); renderer?.dispose(); renderer = undefined; setReady(false); };
    const tick = (time: number) => {
      if (!enabled() || !visible || document.hidden || !renderer) { stop(); return; }
      frame = 0;
      const delta = lastFrame ? Math.min((time - lastFrame) / 1000, 0.06) : 1 / 30;
      lastFrame = time;
      const x = advancePortrait(current.x, velocity.x, target.x, delta);
      const y = advancePortrait(current.y, velocity.y, target.y, delta);
      current = { x: x.position, y: y.position }; velocity = { x: x.velocity, y: y.velocity };
      try { renderer.draw(current); } catch { fail(); return; }
      if (Math.abs(current.x - target.x) + Math.abs(current.y - target.y) + Math.abs(velocity.x) + Math.abs(velocity.y) > 0.0001) frame = requestAnimationFrame(tick);
      else lastFrame = 0;
    };
    const sync = () => {
      if (!enabled()) {
        generation++; loading = false; loadController?.abort(); stop(); renderer?.dispose(); renderer = undefined; setReady(false); return;
      }
      if (!visible || document.hidden) { stop(); return; }
      if (renderer) { if (!frame) frame = requestAnimationFrame(tick); return; }
      if (loading) return;
      loading = true;
      const request = ++generation;
      loadController = new AbortController();
      const signal = loadController.signal;
      const initialize = async () => {
        if (portraitConfig.modelUrl) {
          const module = await import("@/lib/portrait-gltf-renderer");
          signal.throwIfAborted();
          return module.createGltfPortraitRenderer(element, portraitConfig.modelUrl, portraitConfig.rotation, signal);
        }
        const [module] = await Promise.all([import("@/lib/portrait-renderer"), artwork.decode()]);
        signal.throwIfAborted();
        return module.createPortraitRenderer(element, artwork);
      };
      void initialize().then(instance => {
        if (disposed || request !== generation) { instance.dispose(); return; }
        loading = false;
        if (!enabled() || !visible || document.hidden) { instance.dispose(); return; }
        try {
          renderer = instance;
          renderer.draw(current);
          setReady(true); frame = requestAnimationFrame(tick);
        } catch { fail(); }
      }).catch(() => { if (!disposed && request === generation) fail(); });
    };
    const aim = (x: number, y: number) => {
      if (!enabled() || !visible) return;
      const bounds = element.getBoundingClientRect();
      target = portraitTarget(x, y, bounds);
      if (renderer && !frame && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => { if (event.pointerType === "mouse" || event.pointerType === "pen") { pointerPosition = { x: event.clientX, y: event.clientY }; aim(event.clientX, event.clientY); } };
    const reset = () => { pointerPosition = undefined; target = { x: 0, y: 0 }; if (renderer && !frame && visible && enabled()) frame = requestAnimationFrame(tick); };
    const reposition = () => { if (pointerPosition) aim(pointerPosition.x, pointerPosition.y); if (renderer && !frame && visible && enabled()) frame = requestAnimationFrame(tick); };
    const resize = new ResizeObserver(reposition); resize.observe(element);
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) reset(); };
    const focus = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement) || !event.target.closest(".portrait-hero a")) return;
      const bounds = event.target.getBoundingClientRect(); aim(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    };
    const lost = (event: Event) => { event.preventDefault(); fail(); };
    const observer = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (!visible) reset(); sync(); }, { threshold: 0.08 });
    observer.observe(element);
    pointer.addEventListener("change", sync); reduced.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync); document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerout", leave); document.addEventListener("focusin", focus);
    window.addEventListener("blur", reset); window.addEventListener("scroll", reposition, { passive: true }); element.addEventListener("webglcontextlost", lost);
    sync();
    return () => {
      disposed = true; generation++; loadController?.abort(); stop(); observer.disconnect(); resize.disconnect(); renderer?.dispose();
      pointer.removeEventListener("change", sync); reduced.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync); document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerout", leave); document.removeEventListener("focusin", focus);
      window.removeEventListener("blur", reset); window.removeEventListener("scroll", reposition); element.removeEventListener("webglcontextlost", lost);
    };
  }, []);

  return <figure className="hero-portrait" data-animated={ready}>
    <div className="hero-portrait-art">
      <img ref={image} src={portraitArtwork} alt="Graphite portrait of John Clark Semblante" width={1000} height={1250} fetchPriority="high" decoding="async" />
      <canvas ref={canvas} aria-hidden="true" />
    </div>
  </figure>;
}

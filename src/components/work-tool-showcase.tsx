"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { publishedTools } from "@/config/tool-ventures";

const previews: Record<string, string> = {
  "qr-code-generator": "QR generator controls and preview",
  "image-compressor": "Image compressor upload and output options",
  "pdf-editor": "PDF editor upload and editing controls",
  "business-startup-calculator": "Negosyo calculator inputs and break-even estimate",
  "neon-dash": "Neon Dash runner on a neon-lit track during play",
};

export function WorkToolShowcase() {
  const tools = publishedTools.filter(tool => previews[tool.id]).sort((first, second) => Number(second.id === "neon-dash") - Number(first.id === "neon-dash"));
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(4);
  const touchStart = useRef<number | null>(null);
  const last = Math.max(0, tools.length - visible);
  const position = Math.min(index, last);
  useEffect(() => {
    const queries = [567, 767, 991].map(width => matchMedia(`(max-width: ${width}px)`));
    function update() {
      const match = queries.findIndex(query => query.matches);
      const count = match < 0 ? 4 : match + 1;
      setVisible(count);
      setIndex(value => Math.min(value, Math.max(0, tools.length - count)));
    }
    update();
    queries.forEach(query => query.addEventListener("change", update));
    return () => queries.forEach(query => query.removeEventListener("change", update));
  }, [tools.length]);
  function move(direction: number) {
    setIndex(value => Math.max(0, Math.min(value + direction, last)));
  }
  return <section className="work-showcase" id="tools-and-games" aria-labelledby="work-tools-title">
    <div className="work-showcase-heading">
      <h3 id="work-tools-title">Free tools &amp; games</h3>
      <div>
        <button type="button" aria-label="Previous tool or game" aria-controls="work-showcase-track" disabled={position === 0} onClick={() => move(-1)}>←</button>
        <button type="button" aria-label="Next tool or game" aria-controls="work-showcase-track" disabled={position === last} onClick={() => move(1)}>→</button>
      </div>
    </div>
    <div className="work-showcase-window" tabIndex={0} role="group" aria-labelledby="work-tools-title"
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        move(event.key === "ArrowRight" ? 1 : -1);
      }}
      onTouchStart={event => { touchStart.current = event.touches[0].clientX; }}
      onTouchEnd={event => {
        const start = touchStart.current;
        touchStart.current = null;
        if (start === null) return;
        const delta = event.changedTouches[0].clientX - start;
        if (Math.abs(delta) > 45) move(delta < 0 ? 1 : -1);
      }}>
    <div className="work-showcase-grid" id="work-showcase-track" style={{ "--slide-index": position } as CSSProperties}>
      {tools.map((tool, itemIndex) => <article key={tool.id} inert={itemIndex < position || itemIndex >= position + visible}>
        <Link href={tool.route}>
          <img src={`/images/work-previews/${tool.id}.webp`} alt={previews[tool.id]} width={900} height={506} loading="lazy" decoding="async" />
          <div className="work-showcase-copy">
            <p className="eyebrow">{tool.category}</p>
            <h3>{tool.shortName ?? tool.name}</h3>
            <p>{tool.description}</p>
            <span>{tool.ctaLabel ?? "Try it"} <span aria-hidden="true">↗</span></span>
          </div>
        </Link>
      </article>)}
    </div>
    </div>
  </section>;
}

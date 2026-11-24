"use client";

import { useState } from "react";
import { goldenTravelFigmaEmbed, goldenTravelFigmaUrl } from "@/content/golden-travel-design";

export function GoldenTravelFigma() {
  const [open, setOpen] = useState(false);

  return <section className="section project-figma" aria-labelledby="golden-travel-figma">
    <h2 id="golden-travel-figma">Explore the design in Figma</h2>
    <details onToggle={event => setOpen(event.currentTarget.open)}>
      <summary>Show the Figma preview</summary>
      {open && <iframe src={goldenTravelFigmaEmbed} title="Golden Travel and Tours original website design in Figma" allowFullScreen />}
    </details>
    <a className="text-link" href={goldenTravelFigmaUrl} target="_blank" rel="noopener noreferrer">Open the design in Figma (new tab) <span aria-hidden="true">↗</span></a>
  </section>;
}

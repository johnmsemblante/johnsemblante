import Link from "next/link";
import { NeonDash } from "@/components/neon-dash";
import { DonationSupport } from "@/components/tools/donation-support";
import { pageMetadata } from "@/lib/metadata";
import "./neon-dash.css";

const title = "Neon Dash | Free Cyberpunk Runner Game by John Semblante";
const description = "Play Neon Dash, a free cyberpunk endless runner. Jump over hazards, slide under gates, and beat your high score in your browser.";
export const metadata = { ...pageMetadata(title, description, "/games/neon-dash/", { url: "/images/work-previews/neon-dash.webp", alt: "Neon Dash gameplay" }), title: { absolute: title } };

export default function NeonDashPage() {
  return <>
    <section className="section neon-page" aria-labelledby="neon-title">
      <p className="eyebrow">Free browser game / By John Semblante</p>
      <h1 id="neon-title">Neon Dash</h1>
      <p className="lede">Run the city. Dodge the glitches. Beat your high score.</p>
      <NeonDash />
      <noscript>Enable JavaScript to play Neon Dash.</noscript>
      <div className="neon-guide">
        <article><h2>How to play</h2><p>Your runner moves automatically. Jump over red hazards and moving drones. Slide under magenta gates. Follow the gold energy trails and keep going as the track speeds up.</p><p>Touch controls work in portrait. Rotate for a larger playfield if you prefer. Press Enter with the playfield focused to start or restart.</p></article>
        <article><h2>How I built it</h2><p>Next.js serves the page; a TypeScript simulation and Canvas renderer handle the run. The city layers and runner are drawn locally, and optional sound effects are synthesized in the browser. Your best distance and sound preference are saved on this device. No account is needed.</p><Link className="text-link" href="/work/">Back to the portfolio →</Link></article>
      </div>
    </section>
    <DonationSupport />
  </>;
}

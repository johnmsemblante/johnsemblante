import { useEffect, useRef } from "react";
import { createRun, rules } from "@/lib/neon-dash/engine";
import { worlds, type WorldId } from "@/lib/neon-dash/worlds";
import type { Player } from "@/lib/neon-dash/progression";

function WorldPreview({ id }: { id: WorldId }) {
  const preview = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let cancelled = false;
    void import("@/lib/neon-dash/art").then(({ buildRenderer }) => {
      const context = preview.current?.getContext("2d");
      if (context && !cancelled) buildRenderer(context)(createRun(), false, true, undefined, id, true);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);
  return <canvas ref={preview} width={rules.width} height={rules.height} aria-hidden="true" />;
}

export function NeonDashWorlds({ player, onSelect, onBack }: { player: Player; onSelect: (id: WorldId) => void; onBack: () => void }) {
  return <section className="neon-shop" aria-labelledby="neon-worlds-title">
    <div className="neon-buttons"><button type="button" onClick={onBack}>Back to menu</button><strong>{player.lifetimeDistance.toLocaleString()} m completed</strong></div>
    <h2 id="neon-worlds-title">Select world</h2>
    <div className="neon-shop-grid neon-world-grid">{worlds.map(world => {
      const unlocked = player.unlocked.includes(world.id);
      const selected = player.world === world.id;
      return <article key={world.id}>
        <WorldPreview id={world.id} />
        <h3>{world.name}</h3>
        <p>{world.description}</p>
        <strong>{selected ? "Selected" : unlocked ? "Unlocked" : "Locked"}</strong>
        {world.distance > 0 && <p>{world.distance.toLocaleString()} m across completed runs to unlock</p>}
        {!unlocked && <p>{player.lifetimeDistance.toLocaleString()} / {world.distance.toLocaleString()} m</p>}
        {unlocked && !selected && <button type="button" onClick={() => onSelect(world.id)}>Select {world.name}</button>}
      </article>;
    })}</div>
  </section>;
}

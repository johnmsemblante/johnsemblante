import { useState } from "react";
import { achievementCategories, achievements, challenges, dailyFor } from "@/lib/neon-dash/activity";
import { achievementProgress, cosmetics, type Player } from "@/lib/neon-dash/progression";
import { worlds } from "@/lib/neon-dash/worlds";

export type ActivityScreen = "daily" | "achievements" | "stats";
const titles = { daily: "Daily Challenges", achievements: "Achievements", stats: "Player Stats" };
const number = (value: number) => value.toLocaleString();
const duration = (seconds: number) => `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
function Progress({ name, value, target }: { name: string; value: number; target: number }) {
  return <><progress aria-label={name} value={Math.min(value, target)} max={target} /><p>{number(Math.min(value, target))} / {number(target)}</p></>;
}
export function NeonDashActivity({ screen, player, date, feedback, onClaim, onBack }: {
  screen: ActivityScreen; player: Player; date: string; feedback: string; onClaim: (id: string) => void; onBack: () => void;
}) {
  const [category, setCategory] = useState("All");
  const daily = dailyFor(player.daily, date);
  const unlocked = Object.keys(player.achievements).length;
  const stats = player.stats;
  const rows = [
    ["Runs completed", number(stats.runs)], ["Best distance", `${number(player.best)} m`], ["Total distance", `${number(player.lifetimeDistance)} m`],
    ["Coins collected", number(player.collected)], ["Coins spent", number(player.spent)], ["Wallet coins", number(player.wallet)],
    ["Successful jumps", number(stats.jumps)], ["Successful slides", number(stats.slides)], ["Hazards cleared", number(stats.dodges)],
    ["Total survival time", duration(stats.survival)], ["Longest run", duration(stats.longest)],
    ["Characters", `${player.owned.skins.length} / ${cosmetics.skins.length}`], ["Trails", `${player.owned.trails.length} / ${cosmetics.trails.length}`],
    ["Worlds", `${player.unlocked.length} / ${worlds.length}`], ["Achievements", `${unlocked} / ${achievements.length}`],
  ];
  return <section className="neon-shop neon-activity" aria-labelledby="neon-activity-title">
    <div className="neon-buttons"><button type="button" onClick={onBack}>Back to menu</button><strong>Wallet: {number(player.wallet)} coins</strong></div>
    <h2 id="neon-activity-title">{titles[screen]}</h2>
    {screen === "daily" && <>
      <p>{date} UTC · Resets at 00:00 UTC. Only finished runs count.</p>
      {daily.date !== date && <p>Daily progress is paused until the device clock reaches the last saved UTC day.</p>}
      <p role="status">{feedback}</p>
      <div className="neon-shop-grid">{challenges(date).map(item => {
        const value = daily.date === date ? daily.stats[item.metric] : 0;
        const claimed = daily.claimed.includes(item.id);
        return <article key={item.id}><strong>{item.difficulty} · {item.reward} coins</strong><h3>{item.name}</h3>
          <p>{item.verb} {number(item.target)} {item.unit}.</p><Progress name={item.name} value={value} target={item.target} />
          <strong>{claimed ? "Reward claimed" : value >= item.target ? "Completed" : "In progress"}</strong>
          {value >= item.target && !claimed && <button type="button" onClick={() => onClaim(item.id)} aria-label={`Claim reward for ${item.name}`}>Claim reward</button>}
        </article>;
      })}</div>
    </>}
    {screen === "achievements" && <>
      <p>{unlocked} of {achievements.length} unlocked · {Math.floor(unlocked / achievements.length * 100)}%</p>
      <div className="neon-buttons" role="group" aria-label="Achievement category">{["All", ...achievementCategories].map(label => <button key={label} type="button" aria-pressed={category === label} onClick={() => setCategory(label)}>{label}</button>)}</div>
      <div className="neon-shop-grid">{achievements.filter(badge => category === "All" || badge.category === category).map(badge => <article key={badge.id}>
        <strong><span aria-hidden="true">{badge.icon} </span>{badge.category}</strong><h3>{badge.name}</h3><p>{badge.description}</p>
        <Progress name={badge.name} value={player.achievements[badge.id] ? badge.target : achievementProgress(player, badge.metric)} target={badge.target} />
        <strong>{player.achievements[badge.id] ? `Unlocked · ${player.achievements[badge.id].slice(0, 10)} UTC` : "Locked"}</strong>
      </article>)}</div>
    </>}
    {screen === "stats" && <><p>Some counters began in Phase 3. Earlier totals are shown only where they were already recorded.</p><dl className="neon-shop-grid">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></>}
  </section>;
}

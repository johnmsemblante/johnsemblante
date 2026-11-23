"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { advance, createRun, meters, rules } from "@/lib/neon-dash/engine";
import { createAudio, type AudioLevels, type Sound } from "@/lib/neon-dash/audio";
import { awardAchievements, changeCosmetic, claimChallenge, finishRun, loadPlayer, newPlayer, parsePlayer, playerKey, selectWorld, type Category, type Player } from "@/lib/neon-dash/progression";
import { achievements, challenges, utcDay } from "@/lib/neon-dash/activity";
import { NeonDashActivity, type ActivityScreen } from "./neon-dash-activity";
import { NeonDashShop } from "./neon-dash-shop";
import { NeonDashWorlds } from "./neon-dash-worlds";
import { getWorld, worlds, type WorldId } from "@/lib/neon-dash/worlds";

type Mode = "loading" | "menu" | "help" | "run" | "pause" | "over" | "error" | "characters" | "shop" | "worlds" | "settings" | ActivityScreen;
const activityScreen = (mode: Mode): mode is ActivityScreen => mode === "daily" || mode === "achievements" || mode === "stats";

export function NeonDash() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const arena = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const run = useRef(createRun());
  const active = useRef<Mode>("loading");
  const audio = useRef<ReturnType<typeof createAudio> | null>(null);
  const wake = useRef(() => {});
  const settingsReturn = useRef<"menu" | "pause">("menu");
  const currentPlayer = useRef(newPlayer());
  const runWorld = useRef(currentPlayer.current.world);
  const receipt = useRef({ credited: false });
  const sessionOnly = useRef(false);
  const shop = useRef<HTMLDivElement>(null);
  const touch = useRef<{ id: number; x: number; y: number } | null>(null);
  const [mode, setMode] = useState<Mode>("loading");
  const [sound, setSound] = useState(false);
  const [best, setBest] = useState(0);
  const [player, setPlayer] = useState(currentPlayer.current);
  const [feedback, setFeedback] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [audioWarning, setAudioWarning] = useState("");
  const [record, setRecord] = useState(false);
  const [newWorlds, setNewWorlds] = useState<WorldId[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [date, setDate] = useState("");
  const [stats, setStats] = useState({ distance: 0, coins: 0 });
  function go(next: Mode) { touch.current = null; active.current = next; setMode(next); wake.current(); }
  function applyPlayer(value: Player) {
    currentPlayer.current = value;
    audio.current?.configure(value.sound, value.audio);
    setSound(value.sound);
    setBest(value.best);
    setPlayer(value);
    wake.current();
  }
  function latestPlayer() {
    if (sessionOnly.current) return currentPlayer.current;
    try {
      const saved = parsePlayer(localStorage.getItem(playerKey));
      return saved ? { ...saved, achievements: { ...currentPlayer.current.achievements, ...saved.achievements } } : currentPlayer.current;
    }
    catch { return currentPlayer.current; }
  }
  function persist(value: Player) {
    applyPlayer(value);
    try {
      const raw = localStorage.getItem(playerKey);
      if (raw !== null && !parsePlayer(raw)) {
        sessionOnly.current = true;
        setStorageWarning("Saved progress could not be read and was left untouched. Changes apply only to this session.");
        return;
      }
      localStorage.setItem(playerKey, JSON.stringify(value));
      sessionOnly.current = false;
      setStorageWarning("");
    } catch {
      sessionOnly.current = true;
      setStorageWarning("Progress could not be saved. Changes apply only to this session.");
    }
  }
  function cosmeticAction(category: Category, id: string, action: "buy" | "equip") {
    const latest = latestPlayer();
    const result = changeCosmetic(latest, category, id, action);
    if (result.player !== latest) {
      const updated = awardAchievements(result.player);
      const badgeNames = achievements.filter(badge => updated.achievements[badge.id] && !latest.achievements[badge.id]).map(badge => badge.name);
      persist(updated);
      unlock(badgeNames.length ? "unlock" : action === "buy" ? "purchase" : "equip");
      setFeedback([result.message, ...badgeNames.map(name => `Achievement unlocked: ${name}!`)].join(" "));
      return;
    }
    else applyPlayer(latest);
    setFeedback(result.message);
  }
  function redeem(id: string) {
    const now = new Date();
    setDate(utcDay(now));
    try {
      if (sessionOnly.current) throw new Error("Unsaved session");
      const raw = localStorage.getItem(playerKey);
      const saved = parsePlayer(raw);
      if (raw !== null && !saved) throw new Error("Unreadable save");
      const latest = saved ? { ...saved, achievements: { ...currentPlayer.current.achievements, ...saved.achievements } } : currentPlayer.current;
      const updated = claimChallenge(latest, id, now);
      if (updated === latest) { setFeedback("This reward is no longer available."); return; }
      localStorage.setItem(playerKey, JSON.stringify(updated));
      applyPlayer(updated);
      unlock("reward");
      setFeedback(`Reward claimed: +${updated.wallet - latest.wallet} coins.`);
    } catch { setFeedback("Could not save your reward. No coins were added. Try again when storage is available."); }
  }
  function tone(cue: Sound) { audio.current?.play(cue); }
  function unlock(cue: Sound = "button") {
    if (!currentPlayer.current.sound) return;
    audio.current ??= createAudio();
    audio.current.configure(true, currentPlayer.current.audio);
    void audio.current.unlock().then(() => { setAudioWarning(""); tone(cue); }).catch(() => setAudioWarning("Audio is unavailable in this browser. You can still play."));
  }
  function toggleSound() {
    const latest = latestPlayer();
    persist({ ...latest, sound: !latest.sound });
    unlock();
  }
  function settings(from: "menu" | "pause") { settingsReturn.current = from; go("settings"); }
  function volume(channel: keyof AudioLevels, value: number) {
    const latest = latestPlayer();
    persist({ ...latest, audio: { ...latest.audio, [channel]: value } });
    unlock();
  }
  function start() {
    unlock();
    run.current = createRun();
    receipt.current = { credited: false };
    runWorld.current = currentPlayer.current.world;
    setNewWorlds([]);
    setNewBadges([]);
    setRecord(false);
    setStats({ distance: 0, coins: 0 });
    go("run");
  }
  function jump() { if (active.current === "run") run.current.buffer = rules.grace; }
  function slide() {
    const state = run.current;
    if (active.current === "run" && !state.lift && !state.slide) {
      state.slide = rules.slideTime;
      state.slides++;
      tone("slide");
    }
  }
  function keys(event: KeyboardEvent<HTMLDivElement>) {
    const key = event.key.toLowerCase();
    if (event.target instanceof HTMLButtonElement && (key === "enter" || key === " ")) return;
    const current = active.current;
    if (key === "enter" && (current === "menu" || current === "over")) { event.preventDefault(); start(); }
    if (["p", "escape"].includes(key) && ["pause", "run"].includes(current)) {
      event.preventDefault();
      if (!event.repeat) { if (current === "pause") unlock(); go(current === "run" ? "pause" : "run"); }
    }
    if (current !== "run") return;
    if ([" ", "arrowup", "arrowdown", "w", "s"].includes(key)) event.preventDefault();
    if (event.repeat) return;
    if ([" ", "arrowup", "w"].includes(key)) jump();
    if (["arrowdown", "s"].includes(key)) slide();
  }
  useEffect(() => {
    if (mode === "run") arena.current?.focus({ preventScroll: true });
    else if (mode === "menu") overlay.current?.querySelector<HTMLButtonElement>(".neon-primary")?.focus({ preventScroll: true });
    else if (mode === "shop" || mode === "characters" || mode === "worlds" || mode === "settings" || activityScreen(mode)) shop.current?.querySelector("button")?.focus();
    else if (mode === "over" || mode === "pause" || mode === "help" || mode === "error") {
      const root = overlay.current;
      (root?.querySelector<HTMLButtonElement>(".neon-primary") ?? root?.querySelector("button"))?.focus({ preventScroll: true });
    }
  }, [mode]);
  useEffect(() => {
    const updateDate = () => setDate(utcDay());
    updateDate();
    const clock = window.setInterval(updateDate, 1000);
    window.addEventListener("focus", updateDate);
    try {
      const loaded = loadPlayer(localStorage);
      applyPlayer(loaded.player);
      setStorageWarning(loaded.warning);
    } catch { setStorageWarning("Browser storage is unavailable. Progress applies only to this session."); }
    const sync = (event: StorageEvent) => {
      if (event.key !== playerKey || sessionOnly.current) return;
      const saved = parsePlayer(event.newValue);
      if (saved) applyPlayer(saved);
    };
    window.addEventListener("storage", sync);
    let cancelled = false;
    let frame = 0;
    let previous = 0;
    let remainder = 0;
    let hudAt = 0;
    let motionListener: (() => void) | undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibility = () => { if (document.hidden && active.current === "run") go("pause"); };
    document.addEventListener("visibilitychange", visibility);
    void import("@/lib/neon-dash/art").then(({ buildRenderer }) => {
      if (cancelled) return;
      const ctx = canvas.current?.getContext("2d");
      if (!ctx) { go("error"); return; }
      const draw = buildRenderer(ctx);
      const schedule = () => { if (!cancelled && !frame) frame = requestAnimationFrame(tick); };
      wake.current = schedule;
      go("menu");
      function tick(now: number) {
        frame = 0;
        const elapsed = Math.min(.05, (now - (previous || now)) / 1000);
        previous = now;
        const state = run.current;
        if (active.current === "run") {
          remainder += elapsed;
          while (remainder >= rules.step && !state.dead) {
            advance(state, rules.step, Math.random, tone);
            remainder -= rules.step;
          }
          if (now >= hudAt || state.dead) {
            setStats({ distance: meters(state), coins: state.coins });
            hudAt = now + 110;
          }
          if (state.dead) {
            const distance = meters(state);
            const latest = latestPlayer();
            const personalBest = distance > latest.best;
            setRecord(personalBest);
            const now = new Date();
            const today = utcDay(now);
            setDate(today);
            const survival = Math.floor(state.time + 1e-8);
            const updated = finishRun(latest, receipt.current, state.coins, distance, {
              jumps: state.jumps, slides: state.slides, dodges: state.dodges, survival, longest: survival,
              downtown: Number(runWorld.current === "neon-downtown"),
            }, now);
            setNewBadges(achievements.filter(badge => updated.achievements[badge.id] && !latest.achievements[badge.id]).map(badge => badge.name));
            setNewWorlds(updated.unlocked.filter(id => !latest.unlocked.includes(id)));
            persist(updated);
            tone(updated.unlocked.length > latest.unlocked.length || Object.keys(updated.achievements).length > Object.keys(latest.achievements).length ? "unlock" : personalBest ? "record" : "over");
            go("over");
          }
        } else { remainder = 0; previous = 0; }
        const world = ["run", "pause", "over"].includes(active.current) ? runWorld.current : currentPlayer.current.world;
        try { draw(state, active.current === "run", motion.matches || currentPlayer.current.reducedEffects, currentPlayer.current.equipped, world); }
        catch { wake.current = () => {}; go("error"); return; }
        if (active.current === "run") schedule();
      }
      schedule();
      motionListener = schedule;
      motion.addEventListener("change", schedule);
    }).catch(() => { if (!cancelled) go("error"); });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (motionListener) motion.removeEventListener("change", motionListener);
      wake.current = () => {};
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", updateDate);
      window.clearInterval(clock);
      audio.current?.close();
      audio.current = null;
    };
  }, []);

  const soundButton = <button type="button" aria-pressed={!sound} onClick={toggleSound}>Mute: {sound ? "off" : "on"}</button>;
  const shopping = mode === "characters" || mode === "shop";
  const selectingWorld = mode === "worlds";
  const sideScreen = shopping || selectingWorld || mode === "settings" || activityScreen(mode);
  const readyRewards = date && player.daily.date === date ? challenges(date).filter(item => !player.daily.claimed.includes(item.id) && player.daily.stats[item.metric] >= item.target).length : 0;
  const nextWorld = worlds.find(world => !player.unlocked.includes(world.id));
  return <div className="neon-game">
    <div className="neon-hud">
      <div><span>Distance <strong>{stats.distance} m</strong></span><span>Energy <strong>{stats.coins}</strong></span><span>Best <strong>{best} m</strong></span></div>
      {mode === "run" && <button type="button" onClick={() => go("pause")}>Pause</button>}
    </div>
    <div hidden={sideScreen} className="neon-arena" ref={arena} tabIndex={0} role="group" aria-label="Neon Dash playfield" aria-describedby="neon-controls" onKeyDown={keys}>
      <canvas className={mode === "run" ? "neon-playing" : undefined} ref={canvas} width={rules.width} height={rules.height} aria-hidden="true"
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0 || active.current !== "run") return;
          arena.current?.focus({ preventScroll: true });
          event.currentTarget.setPointerCapture(event.pointerId);
          touch.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
        }}
        onLostPointerCapture={event => { if (touch.current?.id === event.pointerId) touch.current = null; }}
        onPointerCancel={event => { if (touch.current?.id === event.pointerId) touch.current = null; }}
        onPointerUp={event => {
          const start = touch.current;
          if (start?.id !== event.pointerId) return;
          touch.current = null;
          const horizontal = Math.abs(event.clientX - start.x);
          const vertical = event.clientY - start.y;
          if (vertical > 24 && vertical > horizontal) slide();
          else if (Math.hypot(horizontal, vertical) < 16) jump();
        }} />
      {mode !== "run" && mode !== "characters" && mode !== "shop" && mode !== "worlds" && mode !== "settings" && !activityScreen(mode) && <div className="neon-overlay" ref={overlay} onClickCapture={event => {
        if (event.target instanceof Element && event.target.closest("button")) unlock();
      }}>
        <p className="neon-kicker">{getWorld(mode === "over" || mode === "pause" ? runWorld.current : player.world).name}</p>
        <h2>{({ loading: "Neon Dash", menu: "Neon Dash", help: "How to play", pause: "Run paused", over: "Signal lost", error: "Game unavailable" })[mode]}</h2>
        <p role="status">{mode === "loading" ? "Loading city and runner graphics…" : mode === "menu" ? `Run the city. Dodge the glitches. Beat your high score. Wallet: ${player.wallet} coins.` : mode === "help" ? "Jump red barriers, floor lasers, and drones. Slide under magenta overhead gates. Finish the run to bank your coins. Restarting or leaving early forfeits run coins." : mode === "over" ? `${stats.distance} m · ${stats.coins} collected · +${stats.coins} wallet coins · Wallet: ${player.wallet} · Best: ${best} m${record ? " · New personal best!" : ""}` : mode === "error" ? "Reload in a browser with Canvas support to try again." : "Your distance and energy are frozen."}</p>
        {mode === "over" && <p>{player.lifetimeDistance.toLocaleString()} m completed{nextWorld ? ` · ${(nextWorld.distance - player.lifetimeDistance).toLocaleString()} m to ${nextWorld.name}` : " · All worlds unlocked"}</p>}
        {mode === "over" && newWorlds.length > 0 && <p className="neon-unlock" role="status">New world unlocked: {newWorlds.map(id => getWorld(id).name).join(", ")}!</p>}
        {mode === "over" && newBadges.length > 0 && <p className="neon-unlock" role="status">Achievements unlocked: {newBadges.join(", ")}!</p>}
        {mode === "over" && player.daily.date === date && <p>{challenges(date).filter(item => player.daily.stats[item.metric] >= item.target).length} / 3 daily objectives complete</p>}
        <div className="neon-buttons">
          {mode === "error" && <button type="button" onClick={() => window.location.reload()}>Reload game</button>}
          {(mode === "menu" || mode === "pause") && <button type="button" onClick={() => settings(mode)}>Settings</button>}
          {(mode === "menu" || mode === "over") && <button type="button" onClick={() => { setFeedback(""); go("daily"); }}>Daily Challenges{readyRewards ? ` (${readyRewards} ready)` : ""}</button>}
          {mode === "menu" && <><button type="button" onClick={() => go("achievements")}>Achievements</button><button type="button" onClick={() => go("stats")}>Player Stats</button></>}
          {(mode === "menu" || (mode === "over" && newWorlds.length > 0)) && <button type="button" onClick={() => go("worlds")}>Select World</button>}
          {mode === "menu" && <><button type="button" className="neon-primary" onClick={start}>Play</button><button type="button" onClick={() => { setFeedback(""); go("characters"); }}>Character selection</button><button type="button" onClick={() => { setFeedback(""); go("shop"); }}>Shop</button><button type="button" onClick={() => go("help")}>How to play</button>{soundButton}</>}
          {mode === "help" && <button type="button" onClick={() => { go("menu"); arena.current?.focus(); }}>Back to menu</button>}
          {mode === "pause" && <><button type="button" className="neon-primary" onClick={() => { unlock(); go("run"); }}>Resume</button><button type="button" onClick={start}>Restart</button>{soundButton}</>}
          {mode === "over" && <button type="button" className="neon-primary" onClick={start}>Run again</button>}
          {(mode === "over" || mode === "pause") && <button type="button" onClick={() => { run.current = createRun(); setStats({ distance: 0, coins: 0 }); go("menu"); arena.current?.focus(); }}>Main menu</button>}
        </div>
      </div>}
    </div>
    {shopping && <div ref={shop}><NeonDashShop player={player} selection={mode === "characters"} feedback={feedback} onAction={cosmeticAction} onBack={() => go("menu")} /></div>}
    {selectingWorld && <div ref={shop}><NeonDashWorlds player={player} onSelect={id => {
      const latest = latestPlayer();
      const selected = selectWorld(latest, id);
      if (selected !== latest) persist(selected);
    }} onBack={() => { run.current = createRun(); setStats({ distance: 0, coins: 0 }); go("menu"); }} /></div>}
    {activityScreen(mode) && <div ref={shop}><NeonDashActivity key={mode} screen={mode} player={player} date={date} feedback={feedback} onClaim={redeem} onBack={() => { run.current = createRun(); setStats({ distance: 0, coins: 0 }); go("menu"); }} /></div>}
    {mode === "settings" && <div ref={shop} role="region" className="neon-shop neon-settings" aria-labelledby="neon-settings-heading">
      <button type="button" onClick={() => go(settingsReturn.current)}>Back to {settingsReturn.current === "pause" ? "pause" : "menu"}</button>
      <h2 id="neon-settings-heading">Settings</h2>
      {soundButton}
      {(["master", "effects"] as const).map(channel => <label key={channel}>
        {channel === "master" ? "Master volume" : "Sound effects volume"} <span>{Math.round(player.audio[channel] * 100)}%</span>
        <input type="range" min="0" max="100" step="5" value={Math.round(player.audio[channel] * 100)}
          onChange={event => applyPlayer({ ...currentPlayer.current, audio: { ...currentPlayer.current.audio, [channel]: Number(event.target.value) / 100 } })}
          onBlur={() => volume(channel, currentPlayer.current.audio[channel])} />
      </label>)}
      <label><input type="checkbox" checked={player.reducedEffects} onChange={event => persist({ ...latestPlayer(), audio: currentPlayer.current.audio, reducedEffects: event.target.checked })} /> Reduce visual effects</label>
    </div>}
    {audioWarning && <p className="neon-storage" role="status">{audioWarning}</p>}
    {storageWarning && <p className="neon-storage" role="status">{storageWarning}</p>}
    {!sideScreen && <div className="neon-buttons neon-inputs">
      <button type="button" disabled={mode !== "run"} onClick={() => { jump(); arena.current?.focus(); }}>↑ Jump</button>
      <button type="button" disabled={mode !== "run"} onClick={() => { slide(); arena.current?.focus(); }}>↓ Slide</button>
    </div>}
    <p id="neon-controls">Space, ↑ or W to jump. ↓ or S to slide. P or Esc to pause. On touch, tap the track to jump or swipe down to slide.</p>
  </div>;
}

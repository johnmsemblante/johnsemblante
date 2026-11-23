"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { advance, createRun, meters, rules, type Cue } from "@/lib/neon-dash/engine";
import { changeCosmetic, finishRun, loadPlayer, newPlayer, parsePlayer, playerKey, type Category, type Player } from "@/lib/neon-dash/progression";
import { NeonDashShop } from "./neon-dash-shop";

type Mode = "loading" | "menu" | "help" | "run" | "pause" | "over" | "error" | "characters" | "shop";

export function NeonDash() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const arena = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const run = useRef(createRun());
  const active = useRef<Mode>("loading");
  const audio = useRef<AudioContext | null>(null);
  const enabled = useRef(false);
  const currentPlayer = useRef(newPlayer());
  const receipt = useRef({ credited: false });
  const sessionOnly = useRef(false);
  const shop = useRef<HTMLDivElement>(null);
  const touch = useRef<number | null>(null);
  const [mode, setMode] = useState<Mode>("loading");
  const [sound, setSound] = useState(false);
  const [best, setBest] = useState(0);
  const [player, setPlayer] = useState(currentPlayer.current);
  const [feedback, setFeedback] = useState("");
  const [storageWarning, setStorageWarning] = useState("");
  const [record, setRecord] = useState(false);
  const [stats, setStats] = useState({ distance: 0, coins: 0 });
  function go(next: Mode) { active.current = next; setMode(next); }
  function applyPlayer(value: Player) {
    currentPlayer.current = value;
    enabled.current = value.sound;
    setSound(value.sound);
    setBest(value.best);
    setPlayer(value);
  }
  function latestPlayer() {
    if (sessionOnly.current) return currentPlayer.current;
    try { return parsePlayer(localStorage.getItem(playerKey)) ?? currentPlayer.current; }
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
    if (result.player !== latest) persist(result.player);
    else applyPlayer(latest);
    setFeedback(result.message);
  }
  function tone(cue: Cue | "button") {
    const context = audio.current;
    if (!enabled.current || context?.state !== "running") return;
    const pitches = { jump: 590, land: 145, slide: 230, coin: 940, hit: 105, button: 450 };
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const now = context.currentTime;
    oscillator.type = cue === "hit" ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(pitches[cue], now);
    oscillator.frequency.exponentialRampToValueAtTime(pitches[cue] * (cue === "coin" ? 1.45 : .64), now + .13);
    gain.gain.setValueAtTime(.07, now);
    gain.gain.exponentialRampToValueAtTime(.001, now + .15);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(now);
    oscillator.stop(now + .16);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
  function unlock() {
    if (!enabled.current) return;
    try {
      audio.current ??= new AudioContext();
      void audio.current.resume().then(() => tone("button")).catch(() => {});
    } catch {}
  }
  function toggleSound() {
    const latest = latestPlayer();
    persist({ ...latest, sound: !latest.sound });
    unlock();
  }
  function start() {
    unlock();
    run.current = createRun();
    receipt.current = { credited: false };
    setRecord(false);
    setStats({ distance: 0, coins: 0 });
    go("run");
  }
  function jump() { if (active.current === "run") run.current.buffer = rules.grace; }
  function slide() {
    const state = run.current;
    if (active.current === "run" && !state.lift && !state.slide) {
      state.slide = rules.slideTime;
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
      if (!event.repeat) go(current === "run" ? "pause" : "run");
    }
    if (current !== "run") return;
    if ([" ", "arrowup", "arrowdown", "w", "s"].includes(key)) event.preventDefault();
    if (event.repeat) return;
    if ([" ", "arrowup", "w"].includes(key)) jump();
    if (["arrowdown", "s"].includes(key)) slide();
  }
  useEffect(() => {
    if (mode === "run" || mode === "menu") arena.current?.focus();
    else if (mode === "shop" || mode === "characters") shop.current?.querySelector("button")?.focus();
    else if (mode === "over" || mode === "pause" || mode === "help") overlay.current?.querySelector("button")?.focus();
  }, [mode]);
  useEffect(() => {
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
    let last = "";
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibility = () => { if (document.hidden && active.current === "run") go("pause"); };
    document.addEventListener("visibilitychange", visibility);
    void import("@/lib/neon-dash/art").then(({ buildRenderer }) => {
      if (cancelled) return;
      const ctx = canvas.current?.getContext("2d");
      if (!ctx) { go("error"); return; }
      const draw = buildRenderer(ctx);
      go("menu");
      function tick(now: number) {
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
            setRecord(distance > latest.best);
            persist(finishRun(latest, receipt.current, state.coins, distance));
            go("over");
          }
        } else remainder = 0;
        const signature = `${active.current}:${motion.matches}:${currentPlayer.current.equipped.skins}:${currentPlayer.current.equipped.trails}`;
        if (active.current === "run" || last !== signature) draw(state, active.current === "run", motion.matches, currentPlayer.current.equipped);
        last = signature;
        frame = requestAnimationFrame(tick);
      }
      frame = requestAnimationFrame(tick);
    }).catch(() => { if (!cancelled) go("error"); });
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("storage", sync);
      if (audio.current) void audio.current.close().catch(() => {});
      audio.current = null;
    };
  }, []);

  const soundButton = <button type="button" aria-pressed={sound} onClick={toggleSound}>Sound: {sound ? "on" : "off"}</button>;
  const shopping = mode === "characters" || mode === "shop";
  return <div className="neon-game">
    <div className="neon-hud">
      <div><span>Distance <strong>{stats.distance} m</strong></span><span>Energy <strong>{stats.coins}</strong></span><span>Best <strong>{best} m</strong></span></div>
      {mode === "run" && <button type="button" onClick={() => go("pause")}>Pause</button>}
    </div>
    <div hidden={shopping} className="neon-arena" ref={arena} tabIndex={0} role="group" aria-label="Neon Dash playfield" aria-describedby="neon-controls" onKeyDown={keys}>
      <canvas ref={canvas} width={rules.width} height={rules.height} aria-hidden="true"
        onPointerDown={event => { if (event.button !== 0 || active.current !== "run") return; arena.current?.focus(); event.currentTarget.setPointerCapture(event.pointerId); touch.current = event.clientY; }}
        onPointerCancel={() => { touch.current = null; }}
        onPointerUp={event => { if (touch.current === null) return; if (event.clientY - touch.current > 24) slide(); else jump(); touch.current = null; }} />
      {mode !== "run" && mode !== "characters" && mode !== "shop" && <div className="neon-overlay" ref={overlay}>
        <p className="neon-kicker">Night circuit / Sector 01</p>
        <h2>{({ loading: "Neon Dash", menu: "Neon Dash", help: "How to play", pause: "Run paused", over: "Signal lost", error: "Game unavailable" })[mode]}</h2>
        <p role="status">{mode === "loading" ? "Loading city and runner graphics…" : mode === "menu" ? `Run the city. Dodge the glitches. Beat your high score. Wallet: ${player.wallet} coins.` : mode === "help" ? "Jump red barriers, floor lasers, and drones. Slide under magenta overhead gates. Finish the run to bank your coins. Restarting or leaving early forfeits run coins." : mode === "over" ? `${stats.distance} m · ${stats.coins} collected · +${stats.coins} wallet coins · Wallet: ${player.wallet} · Best: ${best} m${record ? " · New personal best!" : ""}` : mode === "error" ? "Reload in a browser with Canvas support to try again." : "Your distance and energy are frozen."}</p>
        <div className="neon-buttons">
          {mode === "menu" && <><button type="button" className="neon-primary" onClick={start}>Play</button><button type="button" onClick={() => { setFeedback(""); go("characters"); }}>Character selection</button><button type="button" onClick={() => { setFeedback(""); go("shop"); }}>Shop</button><button type="button" onClick={() => go("help")}>How to play</button>{soundButton}</>}
          {mode === "help" && <button type="button" onClick={() => { go("menu"); arena.current?.focus(); }}>Back to menu</button>}
          {mode === "pause" && <><button type="button" className="neon-primary" onClick={() => { unlock(); go("run"); }}>Resume</button><button type="button" onClick={start}>Restart</button>{soundButton}</>}
          {mode === "over" && <button type="button" className="neon-primary" onClick={start}>Run again</button>}
          {(mode === "over" || mode === "pause") && <button type="button" onClick={() => { run.current = createRun(); setStats({ distance: 0, coins: 0 }); go("menu"); arena.current?.focus(); }}>Main menu</button>}
        </div>
      </div>}
    </div>
    {shopping && <div ref={shop}><NeonDashShop player={player} selection={mode === "characters"} feedback={feedback} onAction={cosmeticAction} onBack={() => go("menu")} /></div>}
    {storageWarning && <p className="neon-storage" role="status">{storageWarning}</p>}
    {!shopping && <div className="neon-buttons neon-inputs">
      <button type="button" disabled={mode !== "run"} onClick={() => { jump(); arena.current?.focus(); }}>↑ Jump</button>
      <button type="button" disabled={mode !== "run"} onClick={() => { slide(); arena.current?.focus(); }}>↓ Slide</button>
    </div>}
    <p id="neon-controls">Space, ↑ or W to jump. ↓ or S to slide. P or Esc to pause. On touch, tap the track to jump or swipe down to slide.</p>
  </div>;
}

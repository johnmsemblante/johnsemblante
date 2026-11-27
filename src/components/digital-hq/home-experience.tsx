"use client";

import { Component, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { PageText } from "@/components/page-content";
import { SiteWordmark } from "@/components/site-wordmark";
import { profile } from "@/content/profile";
import { HQIcon } from "./icon";
import { HomeModeToggle, setPortfolioMode, usePortfolioMode } from "./mode";
import { hqObjects, initialQuality, type HQContent, type Quality, type SectionId } from "./objects";
import { previewCharacterEnabled } from "./character-config";
import { HQ_BACKGROUND_URL } from "./background-config";
import type { HQHandle } from "./canvas";
import "./digital-hq.css";

const LiveScene = dynamic(() => import("./canvas"), { ssr: false });
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode; onFailure?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onFailure?.(); }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}
export function HomeExperience({ classic, content }: { classic: ReactNode; content: HQContent }) {
  const mode = usePortfolioMode();
  useEffect(() => { document.documentElement.dataset.homePresentation = mode; return () => { delete document.documentElement.dataset.homePresentation; }; }, [mode]);
  return mode === "classic" ? classic : <SceneBoundary fallback={classic} onFailure={() => setPortfolioMode("classic")}><DigitalHQ content={content}/></SceneBoundary>;
}

function DigitalHQ({ content }: { content: HQContent }) {
  const section = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null), api = useRef<HQHandle | null>(null);
  const labels = useRef(new Map<SectionId, HTMLAnchorElement>());
  const panel = useRef<HTMLDialogElement>(null), help = useRef<HTMLDialogElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const [selected, setSelected] = useState<SectionId | null>(null);
  const [live, setLive] = useState(false), [status, setStatus] = useState<"preview" | "loading" | "ready" | "fallback">("preview");
  const [quality, setQuality] = useState<Quality>("medium"), [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(true), [tabVisible, setTabVisible] = useState(true);
  const [character, setCharacter] = useState<"preview" | "ready" | "missing" | "failed">(previewCharacterEnabled ? "preview" : "missing");
  const [sound, setSound] = useState(false), [fullscreen, setFullscreen] = useState(false);
  const audio = useRef<AudioContext | null>(null), soundEnabled = useRef(false);
  const drag = useRef<{ x: number; last: number; moved: boolean } | null>(null);
  const item = hqObjects.find(object => object.id === selected);
  const preview = `/images/digital-hq/${previewCharacterEnabled ? "preview" : "workspace"}`;

  useEffect(() => {
    // Let the remembered mode settle before mounting WebGL. A Classic-only visit
    // cancels this task and never imports the scene renderer.
    const timer = window.setTimeout(() => { setStatus("loading"); setLive(true); }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!live || status !== "loading" || !visible || !tabVisible) return;
    const timer = window.setTimeout(() => { setLive(false); setStatus("fallback"); }, 25000);
    return () => window.clearTimeout(timer);
  }, [live, status, visible, tabVisible]);

  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const adapt = () => { setReducedMotion(media.matches); const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
      const tier = initialQuality({ width: innerWidth, cores: navigator.hardwareConcurrency ?? 4, reducedMotion: media.matches, saveData: !!connection?.saveData, slowConnection: /^(slow-)?2g$/.test(connection?.effectiveType ?? "") }); setQuality(tier);
    }; adapt(); media.addEventListener("change", adapt);
    const visibility = () => setTabVisible(!document.hidden); visibility(); document.addEventListener("visibilitychange", visibility);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting)); if (host.current) observer.observe(host.current);
    const fullscreenChange = () => setFullscreen(document.fullscreenElement === section.current); document.addEventListener("fullscreenchange", fullscreenChange);
    try { const value = localStorage.getItem("digital-hq-sound"); setSound(value === "on"); soundEnabled.current = value === "on"; } catch { /* preferences remain session-local */ }
    return () => { media.removeEventListener("change", adapt); document.removeEventListener("visibilitychange", visibility); document.removeEventListener("fullscreenchange", fullscreenChange); observer.disconnect(); void audio.current?.close(); };
  }, []);
  useEffect(() => { if ((!visible || !tabVisible) && audio.current?.state === "running") void audio.current.suspend(); }, [visible, tabVisible]);
  const onReady = useCallback(() => setStatus("ready"), []);
  const onFailure = useCallback(() => { setLive(false); setStatus("fallback"); }, []);
  const project = useCallback((id: SectionId, x: number, y: number, isVisible: boolean) => {
    const element = labels.current.get(id); if (!element || innerWidth < 1100) return;
    element.style.left = `${x}px`; element.style.top = `${y}px`; element.style.visibility = isVisible ? "visible" : "hidden";
  }, []);
  useEffect(() => {
    if (status === "ready" || !host.current) return;
    const position = () => {
      if (!host.current) return;
      const { width, height } = host.current.getBoundingClientRect();
      const scale = Math.max(width / 1920, height / 1080), left = (width - 1920 * scale) / 2, top = (height - 1080 * scale) / 2;
      for (const object of hqObjects) { const element = labels.current.get(object.id); if (element) { element.style.visibility = "visible"; if (innerWidth >= 1100) { element.style.left = `${left + object.preview[0] / 100 * 1920 * scale}px`; element.style.top = `${top + object.preview[1] / 100 * 1080 * scale}px`; } } }
    }; const observer = new ResizeObserver(position); observer.observe(host.current); position(); return () => observer.disconnect();
  }, [status]);
  useEffect(() => { if (selected && panel.current && !panel.current.open) panel.current.showModal(); }, [selected]);

  function chime() {
    if (!soundEnabled.current) return;
    try { const context = audio.current ??= new AudioContext(); void context.resume(); const oscillator = context.createOscillator(), gain = context.createGain(); oscillator.type = "sine"; oscillator.frequency.setValueAtTime(520, context.currentTime); oscillator.frequency.exponentialRampToValueAtTime(780, context.currentTime + .11); gain.gain.setValueAtTime(.025, context.currentTime); gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .16); oscillator.connect(gain).connect(context.destination); oscillator.start(); oscillator.stop(context.currentTime + .17); } catch { setSound(false); soundEnabled.current = false; }
  }
  function select(id: SectionId) { if (drag.current?.moved) return; previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; setSelected(id); api.current?.select(id); chime(); }
  function close() { panel.current?.close(); setSelected(null); api.current?.highlight(null); api.current?.control("reset"); previousFocus.current?.focus({ preventScroll: true }); }
  function reset() { close(); }
  function retry() { setStatus("loading"); setLive(true); }
  async function toggleFullscreen() { try { if (document.fullscreenElement) await document.exitFullscreen(); else await section.current?.requestFullscreen(); } catch { /* Unsupported browsers keep their normal viewport. */ } }
  const characterNotice = character === "preview" ? "Development character · likeness pending" : character === "failed" ? "Character unavailable · navigation still works" : character === "missing" ? "Character model in preparation" : null;

  return <section ref={section} className="hq" aria-labelledby="home-hero-title" data-live={status === "ready"}>
    <link rel="preload" as="image" type="image/avif" href={`${preview}.avif`} media="(min-width: 1100px)" fetchPriority="high"/>
    <link rel="preload" as="image" type="image/avif" href={`${preview}-mobile.avif`} media="(max-width: 1099px)" fetchPriority="high"/>
    <div className="hq-visual" aria-hidden="true" style={{ backgroundImage: `url("${HQ_BACKGROUND_URL}")` }}>
      <picture className="hq-preview"><source type="image/avif" media="(max-width: 1099px)" srcSet={`${preview}-mobile.avif`}/><source type="image/avif" srcSet={`${preview}.avif`}/><img src={`${preview}.webp`} alt="" width={1920} height={1080} fetchPriority="high" decoding="async"/></picture>
      <div className="hq-canvas" ref={host} onPointerDown={event => { drag.current = { x: event.clientX, last: event.clientX, moved: false }; }} onPointerUp={() => { window.setTimeout(() => { drag.current = null; }, 0); }} onPointerCancel={() => { drag.current = null; }} onPointerLeave={() => { drag.current = null; api.current?.tilt(0, 0); api.current?.highlight(null); }} onPointerMove={event => {
        if (drag.current && event.buttons) { if (Math.abs(event.clientX - drag.current.x) > 5) drag.current.moved = true; if (drag.current.moved) api.current?.rotate((event.clientX - drag.current.last) * .0015); drag.current.last = event.clientX; }
        else if (event.pointerType === "mouse") { const bounds = event.currentTarget.getBoundingClientRect(); api.current?.tilt((event.clientX - bounds.left) / bounds.width * 2 - 1, (event.clientY - bounds.top) / bounds.height * 2 - 1); }
      }}>
        {live && <SceneBoundary key={live ? "live" : "static"} onFailure={onFailure} fallback={null}><LiveScene api={api} selected={selected} quality={quality} reducedMotion={reducedMotion} active={visible && tabVisible} onSelect={select} onReady={onReady} onFailure={onFailure} onQuality={setQuality} onCharacter={setCharacter} project={project}/></SceneBoundary>}
      </div>
    </div>
    <div className="hq-shade" aria-hidden="true"/>
    <div className="hq-brand"><SiteWordmark onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); reset(); } }}/><div><strong><PageText scope="home_1" fallback={profile.fullName}/></strong><span data-portfolio-profession="true"><PageText scope="home_4" fallback={profile.title}/></span><span>Cebu, Philippines</span></div></div>
    <div className="hq-intro"><p className="hq-kicker"><span/> A SPACE FOR IDEAS</p><h1 id="home-hero-title" className="hq-position"><PageText scope="home_3" fallback="Cebu Web Developer"/></h1><p className="hq-greeting">Welcome to my<br/><em>Digital HQ.</em></p><p className="hq-intro-copy">Projects, ventures, useful tools, and a few side quests. Make yourself at home.</p><span className="hq-intro-rule"/></div>
    <div className="hq-utilities"><HomeModeToggle/><div className="hq-utility-buttons"><button type="button" onClick={() => { const value = !sound; setSound(value); soundEnabled.current = value; try { localStorage.setItem("digital-hq-sound", value ? "on" : "off"); } catch { /* session only */ } if (value) chime(); else void audio.current?.suspend(); }} aria-label={sound ? "Mute interface sound" : "Enable interface sound"} aria-pressed={sound}><HQIcon name={sound ? "sound" : "muted"}/></button><button type="button" aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"} onClick={() => void toggleFullscreen()}><HQIcon name="expand"/></button><button type="button" aria-label="How to explore Digital HQ" onClick={() => { previousFocus.current = document.activeElement as HTMLElement; help.current?.showModal(); }}><HQIcon name="help"/></button></div></div>
    <nav className="hq-labels" aria-label="Explore Digital HQ">{hqObjects.map(object => <a key={object.id} href={object.href} ref={element => { if (element) labels.current.set(object.id, element); else labels.current.delete(object.id); }} className={`hq-hotspot hq-hotspot-${object.id}`} style={{ "--hq-accent": object.accent, left: `${object.preview[0]}%`, top: `${object.preview[1]}%` } as CSSProperties} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); select(object.id); } }} onFocus={() => api.current?.highlight(object.id)} onBlur={() => api.current?.highlight(null)} onPointerEnter={() => api.current?.highlight(object.id)} onPointerLeave={() => api.current?.highlight(null)} aria-haspopup="dialog" aria-controls="hq-section-panel"><HQIcon name={object.icon} size={25}/><span><strong>{object.label}</strong><small>{object.name}</small></span><i aria-hidden="true"/></a>)}</nav>
    <div className="hq-footer"><div><p className="hq-status" role="status">{status === "ready" ? "You’re in the HQ" : status === "loading" ? "Preparing your workspace…" : status === "fallback" ? "Preview mode · every destination is available" : "Choose an object. Discover what’s inside."}</p>{characterNotice && <p className="hq-character-note">{characterNotice}</p>}</div><div className="hq-view-controls">{status === "ready" ? <><div className="hq-camera-controls" role="group" aria-label="Digital HQ camera"><button type="button" aria-label="Rotate left" onClick={() => api.current?.control("left")}>↶</button><button type="button" aria-label="Rotate right" onClick={() => api.current?.control("right")}>↷</button><button type="button" aria-label="Zoom in" onClick={() => api.current?.control("in")}>+</button><button type="button" aria-label="Zoom out" onClick={() => api.current?.control("out")}>−</button><button type="button" aria-label="Reset camera" onClick={reset}><HQIcon name="reset" size={17}/></button></div><label className="hq-quality"><span className="hq-sr-only">Scene quality</span><select value={quality} onChange={event => setQuality(event.target.value as Quality)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></> : status === "fallback" ? <button type="button" className="hq-retry" onClick={retry}><HQIcon name="reset" size={18}/>Retry 3D</button> : null}</div></div>
    <dialog ref={panel} id="hq-section-panel" className="hq-panel" aria-labelledby="hq-panel-title" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      {item && <div className="hq-panel-inner" style={{ "--hq-accent": item.accent } as CSSProperties}><div className="hq-panel-top"><span>DIGITAL HQ / {item.label.toUpperCase()}</span><button type="button" autoFocus onClick={close} aria-label="Close section"><HQIcon name="close"/></button></div><div className="hq-panel-icon"><HQIcon name={item.icon} size={32}/></div><p className="hq-panel-eyebrow">{item.name}</p><h2 id="hq-panel-title">{item.label}</h2><p className="hq-panel-description">{content[item.id].description}</p><div className="hq-panel-cards">{content[item.id].cards.map(card => <Link key={`${card.href}-${card.title}`} href={card.href} prefetch={false} className="hq-content-card">{card.image && <img src={card.image} alt="" width={120} height={82} loading="lazy"/>}<span>{card.meta && <small>{card.meta}</small>}<strong>{card.title}</strong><span>{card.description}</span></span></Link>)}</div><Link href={item.href} prefetch={false} className="hq-panel-cta">{item.id === "arcade" ? "Play Neon Dash" : item.id === "contact" ? "Open contact form" : `Explore ${item.label.toLowerCase()}`}</Link><button type="button" className="hq-panel-back" onClick={close}>Back to Digital HQ</button></div>}
    </dialog>
    <dialog ref={help} className="hq-help hq-panel" aria-labelledby="hq-help-title" onCancel={() => { previousFocus.current?.focus(); }}><div className="hq-panel-inner"><div className="hq-panel-top"><span>MAKE YOURSELF AT HOME</span><button type="button" autoFocus aria-label="Close exploration guide" onClick={() => { help.current?.close(); previousFocus.current?.focus(); }}><HQIcon name="close"/></button></div><h2 id="hq-help-title">A little look around.</h2><p>The 3D workspace starts automatically. Select a labeled object to explore, drag gently to rotate, and use the camera controls to zoom or reset. The logo always brings you home.</p><p>Use Tab and Enter to explore without a mouse. Escape closes a panel. Classic restores the original site. Sound starts muted.</p><nav aria-label="Digital HQ navigation guide">{hqObjects.map(object => <a href={object.href} key={object.id} onClick={event => { if (!event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); help.current?.close(); select(object.id); } }}><HQIcon name={object.icon}/>{object.label}</a>)}</nav><p className="hq-help-note">This is the Phase 1 preview. Content panels link to the existing full pages, tools, and game. The personalised character and dedicated section experiences follow in later phases.</p></div></dialog>
  </section>;
}

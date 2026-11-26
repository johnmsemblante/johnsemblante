"use client";

import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { PageText } from "@/components/page-content";
import { profile } from "@/content/profile";
import { OfficeIcon } from "./icon";
import { useOfficeMode } from "./mode";
import { initialOfficeQuality, officeRooms, type OfficeContent, type OfficeStats, type RoomId } from "./rooms";
import type { OfficeQuality, OfficeRenderer } from "./renderer";
import "./office.css";

// A rendering failure must never take down the existing homepage content.
class OfficeBoundary extends Component<{children:ReactNode;fallback:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?this.props.fallback:this.props.children;}
}
export function HomeExperience({classic,content,stats}:{classic:ReactNode;content:OfficeContent;stats:OfficeStats}){
  const mode=useOfficeMode();
  useEffect(()=>{document.documentElement.dataset.homePresentation=mode;return()=>{delete document.documentElement.dataset.homePresentation;};},[mode]);
  return mode==="classic"?classic:<OfficeBoundary fallback={classic}><OfficeHero content={content} stats={stats}/><section className="section office-original-intro" aria-label="About my work"><p className="lede"><PageText scope="home_5" fallback={profile.homeSummary}/></p><div className="office-intro-links"><Link href="/contact/">Discuss your project</Link><a href="#services-title">Discover more below <span aria-hidden="true">↓</span></a></div></section></OfficeBoundary>;
}

function OfficeHero({content,stats}:{content:OfficeContent;stats:OfficeStats}){
  const host=useRef<HTMLDivElement>(null);
  const renderer=useRef<OfficeRenderer|null>(null);
  const labels=useRef(new Map<RoomId,HTMLButtonElement>());
  const dialog=useRef<HTMLDialogElement>(null);
  const previousFocus=useRef<HTMLElement|null>(null);
  const activeRoom=useRef<RoomId|null>(null);
  const [room,setRoom]=useState<RoomId|null>(null);
  const [status,setStatus]=useState<"preview"|"loading"|"ready"|"fallback">("preview");
  const [quality,setQuality]=useState<OfficeQuality|"static">("static");
  const [requestLive,setRequestLive]=useState(0);
  const [liveAllowed,setLiveAllowed]=useState(false);
  const [exploring,setExploring]=useState(false);
  const selected=officeRooms.find(item=>item.id===room);

  useEffect(()=>{
    const query=matchMedia("(prefers-reduced-motion: reduce)");
    function adapt(){
      const connection=(navigator as Navigator & {connection?:{saveData?:boolean;effectiveType?:string}}).connection;
      const tier=initialOfficeQuality({width:innerWidth,reducedMotion:query.matches,saveData:!!connection?.saveData,slowConnection:/^(slow-)?2g$/.test(connection?.effectiveType??""),cores:navigator.hardwareConcurrency??4});
      setQuality(tier);setLiveAllowed(tier!=="static");
    }
    adapt();query.addEventListener("change",adapt);
    return()=>query.removeEventListener("change",adapt);
  },[]);
  useEffect(()=>{
    if(!(liveAllowed&&exploring)&&!requestLive)return;
    const controller=new AbortController();
    let cancelled=false;let local:OfficeRenderer|null=null;let idle:number|undefined;
    const start=async()=>{
      if(cancelled||!host.current)return;
      setStatus("loading");
      try{
        const {createOfficeRenderer}=await import("./renderer");
        if(cancelled||!host.current)return;
        local=await createOfficeRenderer(host.current,{
          signal:controller.signal,
          quality:quality==="static"?"low":quality,
          reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches,
          qualityChanged:setQuality,
          failed:()=>{if(!cancelled){setStatus("fallback");setLiveAllowed(false);setRequestLive(0);}},
          project:(id,x,y,visible)=>{const element=labels.current.get(id);if(element){if(innerWidth>=1100){element.style.left=`${x}px`;element.style.top=`${y}px`;element.style.visibility=visible?"visible":"hidden";}else element.style.visibility="visible";}},
        });
        if(cancelled){local.dispose();return;}
        renderer.current=local;if(activeRoom.current)local.select(activeRoom.current);setStatus("ready");
      }catch{if(!cancelled){host.current?.replaceChildren();setStatus("fallback");}}
    };
    const timer=window.setTimeout(()=>{if("requestIdleCallback" in window)idle=window.requestIdleCallback(()=>void start(),{timeout:2500});else void start();},0);
    return()=>{cancelled=true;controller.abort();clearTimeout(timer);if(idle!==undefined)window.cancelIdleCallback(idle);local?.dispose();if(renderer.current===local)renderer.current=null;};
    // Tier changes go through the renderer's existing context, without rebuilding it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[liveAllowed,exploring,requestLive]);
  useEffect(()=>{if(quality!=="static")renderer.current?.quality(quality);},[quality]);
  useEffect(()=>{
    if(status==="ready"||!host.current)return;
    function placePreviewLabels(){
      if(!host.current)return;
      if(innerWidth<1100){labels.current.forEach(element=>{element.style.visibility="visible";});return;}
      const {width,height}=host.current.getBoundingClientRect();
      const scale=Math.max(width/1672,height/850),left=(width-1672*scale)/2,top=(height-850*scale)/2;
      for(const item of officeRooms){const element=labels.current.get(item.id);if(element){element.style.left=`${left+item.preview[0]/100*1672*scale}px`;element.style.top=`${top+item.preview[1]/100*850*scale}px`;element.style.visibility="visible";}}
    }
    const observer=new ResizeObserver(placePreviewLabels);observer.observe(host.current);placePreviewLabels();return()=>observer.disconnect();
  },[status]);
  useEffect(()=>{if(room&&dialog.current&&!dialog.current.open)dialog.current.showModal();},[room]);

  function select(id:RoomId){
    if(liveAllowed)setExploring(true);
    activeRoom.current=id;
    previousFocus.current=document.activeElement instanceof HTMLElement?document.activeElement:null;
    setRoom(id);renderer.current?.select(id);
  }
  function close(){
    activeRoom.current=null;
    dialog.current?.close();setRoom(null);renderer.current?.select(null);
    previousFocus.current?.focus({preventScroll:true});
  }
  const statusLabel=status==="ready"?"Live workspace":status==="loading"?"Opening the workspace…":status==="fallback"?"Preview mode · explore any room":"Explore the workspace";
  return <><link rel="preload" as="image" type="image/avif" href="/images/office/workspace.avif" media="(min-width: 760px)" fetchPriority="high"/><link rel="preload" as="image" type="image/avif" href="/images/office/workspace-mobile.avif" media="(max-width: 759px)" fetchPriority="high"/><section className="office-hero" aria-labelledby="home-hero-title" data-live={status==="ready"} onPointerMove={event=>{if(liveAllowed&&event.pointerType==="mouse"&&!exploring)setExploring(true);}}>
    <div className="office-scene" aria-hidden="true">
      <picture className="office-preview"><source type="image/avif" media="(max-width: 759px)" srcSet="/images/office/workspace-mobile.avif"/><source type="image/webp" media="(max-width: 759px)" srcSet="/images/office/workspace-mobile.webp"/><source type="image/avif" srcSet="/images/office/workspace.avif"/><img src="/images/office/workspace.webp" alt="" width={1672} height={850} fetchPriority="high" decoding="async"/></picture>
      <div className="office-canvas" ref={host} onPointerMove={event=>{const id=renderer.current?.pick(event.clientX,event.clientY);renderer.current?.highlight(id??null);event.currentTarget.style.cursor=id?"pointer":"default";}} onPointerLeave={()=>renderer.current?.highlight(null)} onClick={event=>{const id=renderer.current?.pick(event.clientX,event.clientY);if(id)select(id);}}/>
    </div>
    <div className="office-atmosphere" aria-hidden="true"/>
    <div className="office-intro">
      <p className="office-eyebrow"><PageText scope="home_1" fallback={profile.fullName}/><span>/</span>DIGITAL WORKSPACE</p>
      <h1 id="home-hero-title"><PageText scope="home_3" fallback="Cebu Web Developer"/>{" "}<span>&amp; creative technologist.</span></h1>
      <p className="office-intro-copy">Websites, ventures, and a few side quests.<br/>Step inside and explore what I’ve been building.</p>
      <p className="office-professional"><span data-office-profession="true"><PageText scope="home_4" fallback={profile.title}/></span> <span aria-hidden="true">·</span> Building since 2013</p>
      <div className="office-actions"><button className="office-primary" type="button" onClick={()=>select("work")}><OfficeIcon name="compass"/>Explore my workspace</button><Link href="/work/">View my works</Link></div>
      <p className="office-location">BASED IN CEBU, PHILIPPINES</p>
    </div>
    <div className="office-labels" role="group" aria-label="Explore office rooms">{officeRooms.map(item=><button ref={element=>{if(element)labels.current.set(item.id,element);else labels.current.delete(item.id);}} className={`office-hotspot office-hotspot-${item.id}`} style={{"--room-accent":item.accent,left:`${item.preview[0]}%`,top:`${item.preview[1]}%`} as React.CSSProperties} key={item.id} type="button" onClick={()=>select(item.id)} onFocus={()=>renderer.current?.highlight(item.id)} onBlur={()=>renderer.current?.highlight(null)} onPointerEnter={()=>renderer.current?.highlight(item.id)} onPointerLeave={()=>renderer.current?.highlight(null)} aria-haspopup="dialog" aria-controls="office-room-panel" aria-label={`Explore ${item.label}`}><OfficeIcon name={item.icon}/><span>{item.label}</span><span className="office-hotspot-pin" aria-hidden="true"/></button>)}</div>
    <div className="office-bottom">
      <div className="office-explore-controls">
        <p className="office-status" role="status"><OfficeIcon name="compass" size={16}/>{statusLabel}</p>
        {status==="ready"?<div className="office-controls" role="group" aria-label="Workspace camera controls"><button type="button" aria-label="Rotate workspace left" onClick={()=>renderer.current?.control("left")}>↶</button><button type="button" aria-label="Rotate workspace right" onClick={()=>renderer.current?.control("right")}>↷</button><span/><button type="button" aria-label="Zoom in" onClick={()=>renderer.current?.control("in")}>+</button><button type="button" aria-label="Zoom out" onClick={()=>renderer.current?.control("out")}>−</button><span/><button type="button" aria-label="Reset workspace view" onClick={()=>renderer.current?.control("reset")}><OfficeIcon name="reset" size={17}/></button><label className="office-quality"><span className="office-sr-only">Rendering quality</span><select value={quality} onChange={event=>setQuality(event.target.value as OfficeQuality)}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label></div>:<button className="office-enable" type="button" onClick={()=>{if(quality==="static")setQuality("low");setRequestLive(n=>n+1);}}>Enable 3D view</button>}
        <p className="office-hint">Choose a room. Make yourself at home.</p>
      </div>
      <ul className="office-stats" aria-label="Inside the workspace">{stats.map(item=><li key={item.label}><Link prefetch={false} href={item.icon==="game"?"/games/neon-dash/":item.icon==="tool"?"/tools/":item.icon==="layers"?"/ventures/":"/work/"}><OfficeIcon name={item.icon}/><strong>{item.value}</strong><span>{item.label}</span></Link></li>)}</ul>
    </div>
    <dialog ref={dialog} id="office-room-panel" className="office-panel" aria-labelledby="office-panel-title" onCancel={event=>{event.preventDefault();close();}} onClick={event=>{if(event.target===event.currentTarget)close();}}>
      {selected&&<div className="office-panel-inner" style={{"--room-accent":selected.accent} as React.CSSProperties}>
        <div className="office-panel-top"><span className="office-eyebrow">INSIDE THE WORKSPACE</span><button autoFocus type="button" onClick={close} aria-label="Close room and return to overview"><OfficeIcon name="close"/></button></div>
        <span className="office-panel-symbol"><OfficeIcon name={selected.icon} size={28}/></span>
        <p className="office-panel-room">{selected.name}</p><h2 id="office-panel-title">{selected.label}</h2>
        <p className="office-panel-description">{content[selected.id].description}</p>
        <div className="office-panel-cards">{content[selected.id].cards.map(card=><Link href={card.href} key={`${card.href}-${card.title}`} prefetch={false} className="office-panel-card">{card.image&&<img src={card.image} alt="" width={100} height={70} loading="lazy"/>}<span>{card.meta&&<small>{card.meta}</small>}<strong>{card.title}</strong><span>{card.description}</span></span></Link>)}</div>
        <Link href={selected.href} className="office-panel-cta">{selected.id==="arcade"?"Play Neon Dash":selected.id==="contact"?"Get in touch":`Explore ${selected.label.toLowerCase()}`}</Link><button type="button" className="office-panel-back" onClick={close}>Back to the workspace</button>
      </div>}
    </dialog>
  </section></>;
}

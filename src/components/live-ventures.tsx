"use client";
import { useEffect, useState } from "react";
import { ventures as source } from "@/ventures/registry";
import type { Venture } from "@/ventures/types";
import { VentureCards } from "@/ventures/cards";
import { VentureLanding } from "@/ventures/landing";
import { mergeVentures } from "@/lib/venture-model";
import { fetchPublicVentures } from "@/lib/public-ventures";
import { articleRefresher } from "@/lib/blog-refresh";
import { subscribeSiteRefresh } from "@/lib/site-refresh";
import { BrowserIllustration } from "./browser-illustration";
function useVentures(initial:Venture[]) {
  const [items,setItems]=useState(initial),[error,setError]=useState(false),[loading,setLoading]=useState(true);
  useEffect(()=>{
    setItems(initial);setLoading(true);
    const project=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if(!project){setLoading(false);return;}
    const reader=articleRefresher(()=>fetchPublicVentures(project),records=>{setItems(mergeVentures(source,records));setError(false);setLoading(false);},()=>{setError(true);setLoading(false);});
    const refresh=()=>{if(document.visibilityState!=="hidden")void reader.refresh();};
    refresh();const stop=subscribeSiteRefresh(refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);const timer=window.setInterval(refresh,60000);
    return()=>{reader.dispose();stop();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.clearInterval(timer);};
  },[initial]);
  return{items,error,loading};
}
function RefreshError(){return <p role="status" className="article-refresh-notice">The latest venture content could not be loaded. Showing the last available copy. <button type="button" onClick={()=>window.dispatchEvent(new Event('focus'))}>Try again</button></p>;}
export function LiveVentureIllustration({initial}:{initial:Venture[]}){
  const {items}=useVentures(initial);const images=['golden-travel-and-tours','lazy-barista'].flatMap(slug=>{const v=items.find(v=>v.slug===slug);return v?.logo?[{...v.logo,name:v.name}]:[];});
  return <BrowserIllustration showcase={{kind:'ventures',label:'COFFEE, TRAVEL AND PHOTOGRAPHY',caption:'A look at my interests outside development.',images}}/>;
}
export function LiveVentureCards({initial,compact=false,headingLevel=3}:{initial:Venture[];compact?:boolean;headingLevel?:2|3}){
  const {items,error}=useVentures(initial);const exported=new Set(initial.map(v=>v.slug));
  return <>{error&&<RefreshError/>}<VentureCards items={items} compact={compact} headingLevel={headingLevel} linkFor={v=>exported.has(v.slug)?`/ventures/${v.slug}/`:`/ventures/view/?venture=${encodeURIComponent(v.slug)}`}/></>;
}
function VentureMetadata({venture}:{venture:Venture|null}){
  useEffect(()=>{
    const title=document.title,meta=document.head.querySelector<HTMLMetaElement>('meta[name="description"]'),description=meta?.content;
    const robots=document.createElement('meta');robots.name='robots';robots.content='noindex, follow';
    document.title=venture?(venture.seo?.title?.trim()||venture.name):'Venture unavailable';
    if(venture&&meta)meta.content=venture.seo?.description?.trim()||venture.description;
    if(!venture)document.head.appendChild(robots);
    return()=>{document.title=title;if(meta&&description!==undefined)meta.content=description;robots.remove();};
  },[venture]);return null;
}
export function LiveVentureDetail({initial,query=false}:{initial:Venture[];query?:boolean}){
  const {items,error,loading}=useVentures(initial);const [requested,setRequested]=useState('');
  const slug=query?requested:initial[0]?.slug??'';
  useEffect(()=>{if(query)setRequested(new URLSearchParams(window.location.search).get('venture')??'');},[query]);
  const venture=items.find(v=>v.slug===slug)??null;
  return <>{error&&<RefreshError/>}{venture?<><VentureMetadata venture={venture}/><VentureLanding venture={venture}/></>:query&&loading?<p role="status">Loading venture…</p>:<main className="portfolio-shell"><VentureMetadata venture={null}/><h1>Venture unavailable</h1><p>This venture is not published or has been deleted.</p><a href="/ventures/">View all ventures</a></main>}</>;
}

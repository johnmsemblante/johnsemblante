"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { readMode } from "./objects";

const key="portfolio-home-mode";
let memory: "interactive"|"classic"|null=null;
function snapshot(){if(memory)return memory;try{return readMode(localStorage.getItem(key));}catch{return "interactive";}}
function subscribe(callback:()=>void){const storage=()=>{memory=null;callback();};window.addEventListener("portfolio-mode",callback);window.addEventListener("storage",storage);return()=>{window.removeEventListener("portfolio-mode",callback);window.removeEventListener("storage",storage);};}
export function usePortfolioMode(){return useSyncExternalStore(subscribe,snapshot,()=>"interactive" as const);}
export function setPortfolioMode(mode:"interactive"|"classic") {memory=mode;try{localStorage.setItem(key,mode);}catch{/* Session-only mode when storage is unavailable. */}window.dispatchEvent(new Event("portfolio-mode"));}
export function HomeModeToggle(){
  const pathname=usePathname();const mode=usePortfolioMode();
  if(pathname!=="/")return null;
  return <div className="hq-mode office-mode" role="group" aria-label="Homepage presentation">{(["interactive","classic"] as const).map(value=><button type="button" key={value} aria-pressed={mode===value} onClick={()=>setPortfolioMode(value)}>{value==="interactive"?"Interactive":"Classic"}</button>)}</div>;
}

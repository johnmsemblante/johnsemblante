"use client";
import { useEffect, useState } from "react";
import { articleRefresher } from "@/lib/blog-refresh";
import { PageText } from "./page-content";
import { Button } from "./ui";
import { BrowserIllustration } from "./browser-illustration";
import { subscribeSiteRefresh } from "@/lib/site-refresh";
import type { Project } from "@/content/site";
import { projects as source } from "@/content/site";
import type { IndustrySlug } from "@/content/industries";
import { mergeWorks } from "@/lib/work-model";
import { fetchPublicWorks } from "@/lib/public-works";
import { ProjectExplorer } from "./project-explorer";
import { WorkDetail } from "./work-detail";
function useWorks(initial:Project[]) {
  const [projects,setProjects]=useState(initial),[error,setError]=useState("");
  useEffect(()=>{
    const id=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;if(!id)return;
    const reader=articleRefresher(()=>fetchPublicWorks(id),records=>{setProjects(mergeWorks(source,records));setError("");},()=>setError("The latest portfolio changes could not be loaded. Showing the last available copy; please refresh to retry."));
    const refresh=()=>{if(document.visibilityState!=="hidden")void reader.refresh();};
    refresh();const stop=subscribeSiteRefresh(refresh);window.addEventListener("focus",refresh);document.addEventListener("visibilitychange",refresh);const timer=window.setInterval(refresh,60000);
    return()=>{reader.dispose();stop();window.clearInterval(timer);window.removeEventListener("focus",refresh);document.removeEventListener("visibilitychange",refresh);};
  },[]);
  return {projects,error};
}
export function LiveWorkExplorer({initial,industry}:{initial:Project[];industry?:IndustrySlug}) {
  const {projects,error}=useWorks(initial);const [slug,setSlug]=useState<string|null>(null);
  useEffect(()=>{const restore=()=>setSlug(new URLSearchParams(window.location.search).get("project"));restore();window.addEventListener("popstate",restore);return()=>window.removeEventListener("popstate",restore);},[]);
  const exported=new Set(initial.map(p=>p.slug));
  const visible=projects.filter(p=>!industry||p.industries.includes(industry)).map(p=>exported.has(p.slug)?p:{...p,caseStudyUrl:`/work/?project=${encodeURIComponent(p.slug)}`});
  if(slug){const project=projects.find(p=>p.slug===slug);return <>{error&&<p role="status">{error}</p>}{project?<WorkDetail project={project}/>:<p role="status">This work is unavailable or no longer published. <a href="/work/">View all work</a></p>}</>;}
  if(!projects.length&&!industry)return <>{error&&<p role="status">{error}</p>}<div className="empty-state"><p className="eyebrow"><PageText scope="work_9" fallback="Project collection"/></p><h2><PageText scope="work_10" fallback="Looking for relevant experience?"/></h2><p><PageText scope="work_11" fallback="Tell me what you are building and I can discuss the experience relevant to your project."/></p></div></>;
  return <>{error&&<p role="status">{error}</p>}<ProjectExplorer projects={visible} industry={industry}/></>;
}
export function LiveWorkDetail({initial}:{initial:Project}){
  const {projects,error}=useWorks([initial]);const project=projects.find(p=>p.slug===initial.slug);
  useEffect(()=>{if(project)document.title=project.seo?.title||`${project.title} | John Semblante`;},[project]);
  return <>{error&&<p role="status">{error}</p>}{project?<WorkDetail project={project}/>:<section className="section"><h1>Work unavailable</h1><p>This project is no longer published.</p><a href="/work/">View all work</a></section>}</>;
}

export function LiveFeaturedWork({initial}:{initial:Project[]}) {
  const {projects}=useWorks(initial),featured=projects[0];if(!featured)return null;
  const href=initial.some(p=>p.slug===featured.slug)?`/work/${featured.slug}/`:`/work/?project=${encodeURIComponent(featured.slug)}`;
  return <section className="section featured-case"><div><p className="eyebrow"><PageText scope="work_12" fallback="From the project collection"/></p><h2>{featured.title}</h2><p className="lede">{featured.summary}</p><Button href={href} secondary><PageText scope="work_13" fallback="Explore the project"/></Button></div><dl><div><dt><PageText scope="work_14" fallback="Work category"/></dt><dd>{featured.role}</dd></div><div><dt><PageText scope="work_15" fallback="Technology"/></dt><dd>{featured.technologies.join(" ? ")}</dd></div>{featured.outcome&&<div><dt><PageText scope="work_16" fallback="Outcome"/></dt><dd>{featured.outcome}</dd></div>}</dl></section>;
}
export function LiveWorkIllustration({initial}:{initial:Project[]}) {
  const {projects}=useWorks(initial);const images=["roar-fitness","perth-cosmetic-surgery"].flatMap(slug=>{const p=projects.find(p=>p.slug===slug);return p?.image?[{src:p.image.src,name:p.title,width:516,height:337}]:[];});
  return <BrowserIllustration showcase={{kind:"work",label:"FROM THE PUBLIC COLLECTION",caption:"Examples from my website development work.",images}}/>;
}

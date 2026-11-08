"use client";
import { useEffect, useState } from "react";
import type { Project } from "@/content/site";
import { projects as source } from "@/content/site";
import type { IndustrySlug } from "@/content/industries";
import { mergeWorks } from "@/lib/work-model";
import { fetchPublicWorks } from "@/lib/public-works";
import { ProjectExplorer } from "./project-explorer";
import { WorkDetail } from "./work-detail";
function useWorks(initial:Project[]) {
  const [projects,setProjects]=useState(initial),[error,setError]=useState("");
  useEffect(()=>{const id=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;if(!id)return;let disposed=false,pending=false;const refresh=async()=>{if(pending)return;pending=true;try{const records=await fetchPublicWorks(id);if(!disposed){setProjects(mergeWorks(source,records));setError("");}}catch{if(!disposed)setError("The latest portfolio changes could not be loaded. Showing the deployed version; please refresh to retry.");}finally{pending=false;}};void refresh();const focus=()=>{if(document.visibilityState==="visible")void refresh();};window.addEventListener("focus",focus);document.addEventListener("visibilitychange",focus);const timer=window.setInterval(focus,60000);return()=>{disposed=true;window.clearInterval(timer);window.removeEventListener("focus",focus);document.removeEventListener("visibilitychange",focus);};},[]);
  return {projects,error};
}
export function LiveWorkExplorer({initial,industry}:{initial:Project[];industry?:IndustrySlug}) {
  const {projects,error}=useWorks(initial);const [slug,setSlug]=useState<string|null>(null);
  useEffect(()=>{const restore=()=>setSlug(new URLSearchParams(window.location.search).get("project"));restore();window.addEventListener("popstate",restore);return()=>window.removeEventListener("popstate",restore);},[]);
  const exported=new Set(initial.map(p=>p.slug));
  const visible=projects.filter(p=>!industry||p.industries.includes(industry)).map(p=>exported.has(p.slug)?p:{...p,caseStudyUrl:`/work/?project=${encodeURIComponent(p.slug)}`});
  if(slug){const project=projects.find(p=>p.slug===slug);return <>{error&&<p role="status">{error}</p>}{project?<WorkDetail project={project}/>:<p role="status">This work is unavailable or no longer published. <a href="/work/">View all work</a></p>}</>;}
  return <>{error&&<p role="status">{error}</p>}<ProjectExplorer projects={visible} industry={industry}/></>;
}
export function LiveWorkDetail({initial}:{initial:Project}){
  const {projects,error}=useWorks([initial]);const project=projects.find(p=>p.slug===initial.slug);
  useEffect(()=>{if(project)document.title=project.seo?.title||`${project.title} | John Semblante`;},[project]);
  return <>{error&&<p role="status">{error}</p>}{project?<WorkDetail project={project}/>:<section className="section"><h1>Work unavailable</h1><p>This project is no longer published.</p><a href="/work/">View all work</a></section>}</>;
}

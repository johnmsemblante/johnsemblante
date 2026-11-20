"use client";
import { useEffect, useState } from "react";
import type { Project } from "@/content/site";
import { projects as workSource } from "@/content/site";
import { mergeWorks } from "@/lib/work-model";
import { fetchPublicWorks } from "@/lib/public-works";
import { fetchPublicBlogSnapshot } from "@/lib/public-blog-snapshot";
import { articleRefresher } from "@/lib/blog-refresh";
import { subscribeSiteRefresh } from "@/lib/site-refresh";

import { Arrow } from "./ui";
import { PageText } from "./page-content";
import Link from "next/link";
type Writing = {slug:string;title:string;excerpt:string;category:string;publishedAt:string;featuredImage?:string;featuredImageAlt?:string};
function useLive<T>(initial:T, read:(project:string)=>Promise<T>) {
  const [value,setValue]=useState(initial),[error,setError]=useState(false);
  useEffect(()=>{const project=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;if(!project)return;const reader=articleRefresher(()=>read(project),next=>{setValue(next);setError(false);},()=>setError(true));const refresh=()=>{if(document.visibilityState!=='hidden')void reader.refresh();};refresh();const stop=subscribeSiteRefresh(refresh);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);const timer=window.setInterval(refresh,60000);return()=>{reader.dispose();stop();window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);window.clearInterval(timer);};},[read]);
  return{value,error};
}
const readWorks=async(project:string)=>mergeWorks(workSource,await fetchPublicWorks(project),true);
const readWriting=async(project:string):Promise<Writing[]> => (await fetchPublicBlogSnapshot(project)).map(p=>({slug:p.slug,title:p.title,excerpt:p.excerpt,category:p.categories.join(' / '),publishedAt:p.publishedAt,featuredImage:p.featuredImage,featuredImageAlt:p.featuredImageAlt}));
export function LiveHomeWorks({initial}:{initial:Project[]}) {
  const {value,error}=useLive(initial,readWorks);const exported=new Set(initial.map(v=>v.slug));
  return <>{error&&<p role="status">The latest projects could not be loaded. Showing the last available copy.</p>}{value.length?<ul className="home-projects">{value.slice(0,3).map(p=><li key={p.slug}><Link href={exported.has(p.slug)?`/work/${p.slug}/`:`/work/?project=${encodeURIComponent(p.slug)}`}>{p.image && <img className="home-project-thumb" src={p.image.src} alt={p.image.alt} loading="lazy" width={560} height={350} />}<h3>{p.title} <Arrow /></h3></Link></li>)}</ul>:<div className="work-pending"><span className="work-pending-mark" aria-hidden="true"><PageText scope="home_19" fallback="</>"/></span><div><h3><PageText scope="home_20" fallback="Looking for a relevant example?"/></h3><p><PageText scope="home_21" fallback="Tell me what you need to build, and I can discuss the experience relevant to your project."/></p></div></div>}</>;
}
export function LiveHomeWriting({initial,source}:{initial:Writing[];source:Writing[]}) {
  // Only explicitly published source summaries cross the server/client boundary.
  const {value,error}=useLive(initial,readWriting);const exported=new Set([...initial,...source].map(p=>p.slug));
  const writing=[...new Map([...source,...value].map(p=>[p.slug,p])).values()].sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)).slice(0,2);
  return <>{error&&<p role="status">The latest articles could not be loaded. Showing the last available copy.</p>}{writing.length?<div className="home-note-list">{writing.map(post=><article key={post.slug} className="home-note"><Link href={exported.has(post.slug)?`/blog/${post.slug}/`:`/blog/?post=${encodeURIComponent(post.slug)}`}>{post.featuredImage && <img src={post.featuredImage} alt={post.featuredImageAlt ?? ""} loading="lazy" width={640} height={350} />}<p className="eyebrow">{post.category}</p><h3>{post.title} <Arrow/></h3></Link></article>)}</div>:<p className="body-copy"><PageText scope="home_38" fallback="I share development notes here when there is something useful to write about. In the meantime, you can browse my website projects."/></p>}</>;
}

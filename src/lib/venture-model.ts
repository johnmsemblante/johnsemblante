import type { Venture } from "@/ventures/types";
import { pageUrl } from "./page-model";
export type VentureRecord = { venture: Venture; status: "draft" | "published"; revision: number };
export type PublicVenture = { slug: string; deleted: boolean; content?: string };
export const ventureSlug = (name: string) => name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,90).replace(/-$/, "");
const optionalKeys = ["canonicalBase","logo","hero","storyImage","story","gallery","offerings","offeringsNote","artwork","vehicles","ordering","contact","phones","socials","questions","seo"];
const requiredKeys = ["slug","name","category","description","theme","title","tagline"];
const text = (v: unknown, max: number, required = false): v is string => typeof v === "string" && v.length <= max && (!required || !!v.trim());
function object(v: unknown, keys: string[]): v is Record<string, unknown> { return !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).every(k => keys.includes(k)); }
function list(v: unknown, validate: (v: unknown) => boolean, max = 50) { return Array.isArray(v) && v.length <= max && v.every(validate); }
function image(v: unknown): boolean { return object(v,["src","alt","width","height","title","thumbnailSrc","sourceUrl","caption"]) && pageUrl(v.src as string,true) && text(v.alt,200,true) && Number.isInteger(v.width) && Number(v.width)>0 && Number(v.width)<=20000 && Number.isInteger(v.height) && Number(v.height)>0 && Number(v.height)<=20000 && (v.title===undefined||text(v.title,200,true)) && (v.caption===undefined||text(v.caption,2000)) && (v.thumbnailSrc===undefined||pageUrl(v.thumbnailSrc as string,true)) && (v.sourceUrl===undefined||pageUrl(v.sourceUrl as string)); }
function link(v: unknown): boolean { return object(v,["label","url"]) && text(v.label,200,true) && pageUrl(v.url as string); }
export function validateVenture(v: Venture): string {
  if (!object(v,[...requiredKeys,...optionalKeys]) || !requiredKeys.every(k => k in v)) return "Invalid venture fields.";
  if (!text(v.slug,100,true) || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(v.slug) || v.slug === "view") return "Use a lowercase URL slug with letters, numbers and hyphens. The slug view is reserved.";
  for (const k of ["name","category","title","tagline"] as const) if (!text(v[k],200,true)) return `Enter ${k} (up to 200 characters).`;
  if (!text(v.description,2000,true) || !["coffee","travel","photography"].includes(v.theme)) return "Enter a description and choose a layout.";
  if (v.canonicalBase !== undefined && (!pageUrl(v.canonicalBase) || !v.canonicalBase.startsWith("https://"))) return "Canonical URL must use HTTPS.";
  for (const k of ["logo","hero","storyImage"] as const) if (v[k] !== undefined && !image(v[k])) return `${k}: add a safe image URL, description, width and height.`;
  if (v.story !== undefined && !text(v.story,20000)) return "Story must be at most 20,000 characters.";
  if (v.offeringsNote !== undefined && !text(v.offeringsNote,4000)) return "Offerings note is too long.";
  if (v.seo !== undefined && (!object(v.seo,["title","description"]) || (v.seo.title !== undefined && !text(v.seo.title,160)) || (v.seo.description !== undefined && !text(v.seo.description,500)))) return "Meta title/description must be at most 160/500 characters.";
  if (v.contact !== undefined && !link(v.contact)) return "Enter a safe contact link.";
  for (const k of ["phones","socials"] as const) if (v[k] !== undefined && !list(v[k],link,20)) return `${k}: check the labels and URLs.`;
  if (v.artwork !== undefined && !list(v.artwork,image,20)) return "Check artwork image fields (maximum 20).";
  if (v.vehicles !== undefined && !list(v.vehicles,i => object(i,["name","image"]) && text(i.name,200,true) && image(i.image),20)) return "Check vehicle names and images.";
  if (v.questions !== undefined && !list(v.questions,i => object(i,["question","answer"]) && text(i.question,500,true) && text(i.answer,4000,true),30)) return "Check FAQ questions and answers.";
  if (v.offerings !== undefined && !list(v.offerings,i => object(i,["title","description","price","image"]) && text(i.title,200,true) && text(i.description,4000,true) && (i.price === undefined || (typeof i.price === "number" && Number.isFinite(i.price) && i.price>=0 && i.price<=10000000)) && (i.image === undefined || image(i.image)))) return "Check offering titles, descriptions, prices and images.";
  if (v.ordering !== undefined && (!object(v.ordering,["title","steps","note"]) || !text(v.ordering.title,200,true) || !list(v.ordering.steps,i=>text(i,2000,true),30) || (v.ordering.note!==undefined && !text(v.ordering.note,4000)))) return "Check ordering instructions.";
  if (v.gallery !== undefined && !list(v.gallery,i => {
    if (!object(i,["src","alt","width","height","title","thumbnailSrc","sourceUrl","caption"])) return false;
    return image({src:i.src,alt:i.alt,width:i.width,height:i.height}) && text(i.title,200,true) && pageUrl(i.thumbnailSrc as string,true) && pageUrl(i.sourceUrl as string) && (i.caption===undefined||text(i.caption,2000));
  })) return "Check gallery images, titles and source links (maximum 50).";
  if (JSON.stringify(v).length > 400000) return "Venture content is too large.";
  return "";
}
export function parseVenture(content: unknown, slug: string): Venture | null {
  if (typeof content !== "string" || content.length>400000) return null;
  try { const v = JSON.parse(content); return v?.slug === slug && !validateVenture(v) ? v : null; } catch { return null; }
}
export function mergeVentures(source: Venture[], records: PublicVenture[]) {
  const all = new Map(source.map(v=>[v.slug,v]));
  for (const record of records) { if (record.deleted) all.delete(record.slug); else { const v=parseVenture(record.content,record.slug); if(v)all.set(record.slug,v); } }
  return [...all.values()];
}
export function emptyVenture(): Venture { return {slug:"",name:"",category:"",description:"",theme:"coffee",title:"",tagline:"",story:"",offerings:[],questions:[],socials:[],phones:[],artwork:[],vehicles:[],gallery:[],seo:{title:"",description:""}}; }

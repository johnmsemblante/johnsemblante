import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ventures } from "@/ventures/registry";
import { mergeVentures, parseVenture, type PublicVenture } from "./venture-model";
export function buildVentures() {
  const file=join(process.cwd(),".generated","ventures.json");
  if(!existsSync(file)){if(process.env.NODE_ENV==="production")throw new Error("Missing Ventures snapshot. Use npm run build.");return ventures;}
  const snapshot=JSON.parse(readFileSync(file,"utf8"));
  const project=process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID||JSON.parse(readFileSync('.firebaserc','utf8')).projects.default;
  if(snapshot.project!==project)throw new Error("Ventures snapshot belongs to another Firebase project.");
  if(!Array.isArray(snapshot.records)||snapshot.records.some((r:PublicVenture)=>typeof r.deleted!=="boolean"||(!r.deleted&&!parseVenture(r.content,r.slug))))throw new Error("Invalid Ventures snapshot.");
  return mergeVentures(ventures,snapshot.records);
}

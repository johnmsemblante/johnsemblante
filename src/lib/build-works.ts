import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { projects } from "@/content/site";
import { mergeWorks, type PublicWork } from "./work-model";
export function buildWorks() {
  const file = join(process.cwd(), ".generated", "works.json");
  if (!existsSync(file)) { if (process.env.NODE_ENV === "production") throw new Error("Missing Works snapshot. Use npm run build."); return projects; }
  const snapshot = JSON.parse(readFileSync(file,"utf8"));
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || JSON.parse(readFileSync(".firebaserc","utf8")).projects.default;
  if (snapshot.project !== projectId) throw new Error("Works snapshot belongs to another Firebase project.");
  return mergeWorks(projects, snapshot.records as PublicWork[]);
}

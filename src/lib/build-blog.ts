import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { validatePost, effectiveStatus, type ManagedPost } from "./blog-model";
import { publishedPosts } from "@/content/blog";

/** Server/build only. Never import this module into a client component. */
export function buildBlogPosts(): ManagedPost[] {
  const file = join(process.cwd(), ".generated", "blog-posts.json");
  if (!existsSync(file)) {
    if (process.env.NODE_ENV === "production") throw new Error("Missing public blog snapshot. Build with npm run build.");
    return [];
  }
  const snapshot = JSON.parse(readFileSync(file, "utf8"));
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || JSON.parse(readFileSync(join(process.cwd(), ".firebaserc"), "utf8")).projects?.default;
  if (snapshot.project !== project) throw new Error("Blog snapshot project mismatch. Run npm run sync:blog.");
  const posts = snapshot.posts as ManagedPost[];
  const reserved = new Set(publishedPosts().map(post => post.slug));
  for (const post of posts) {
    if (validatePost(post, { allowDueSchedule: true }) || effectiveStatus(post) !== "published" || !Number.isFinite(Date.parse(post.publishedAt))) throw new Error("Invalid public blog snapshot. Run npm run sync:blog.");
    if (reserved.has(post.slug)) throw new Error(`Duplicate source/managed blog slug: ${post.slug}. Resolve the conflict before deploying.`);
    reserved.add(post.slug);
  }
  return posts;
}

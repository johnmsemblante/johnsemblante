import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Metadata } from "next";
import { emptyPage, validatePage, type PageId, type PageRecord } from "./page-model";

export function buildPage(id: PageId): PageRecord {
  const file = join(process.cwd(), ".generated", "pages.json");
  if (!existsSync(file)) {
    if (process.env.NODE_ENV === "production") throw new Error("Missing Pages snapshot. Use npm run build.");
    return emptyPage();
  }
  const snapshot = JSON.parse(readFileSync(file, "utf8"));
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || JSON.parse(readFileSync(".firebaserc", "utf8")).projects.default;
  if (snapshot.project !== project) throw new Error("Pages snapshot belongs to another Firebase project.");
  const record = snapshot.records[id];
  if (record === undefined) return emptyPage();
  if (!validatePage(record)) throw new Error(`Invalid Pages snapshot: ${id}.`);
  return record;
}
export function withPageMetadata(id: PageId, fallback: Metadata): Metadata {
  const record = buildPage(id);
  const title = record.seoTitle.trim();
  const description = record.seoDescription.trim();
  return { ...fallback, ...(title ? { title: { absolute: title } } : {}), ...(description ? { description } : {}),
    openGraph: { ...fallback.openGraph, ...(title ? { title } : {}), ...(description ? { description } : {}) },
    twitter: { ...fallback.twitter, ...(title ? { title } : {}), ...(description ? { description } : {}) } };
}

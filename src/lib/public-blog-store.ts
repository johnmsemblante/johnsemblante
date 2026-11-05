"use client";

import type { Firestore } from "firebase/firestore";
import { effectiveStatus, postFromData } from "./blog-model";

type WireValue = { stringValue?: string; integerValue?: string; doubleValue?: number; timestampValue?: string; nullValue?: unknown; arrayValue?: { values?: WireValue[] } };
function decode(value: WireValue): unknown {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.arrayValue !== undefined) return (value.arrayValue.values ?? []).map(decode);
  return null;
}

export async function readPublicArticle(db: Firestore, slug: string, now = Date.now(), endpoint = "https://firestore.googleapis.com/v1") {
  const { projectId, apiKey } = db.app.options;
  if (!projectId || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100) return null;
  const url = new URL(`${endpoint}/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/blogPosts/${encodeURIComponent(slug)}`);
  if (apiKey) url.searchParams.set("key", apiKey);
  // A fresh anonymous REST read avoids caching a pre-release permission denial on a long-lived SDK watch target.
  // Only public Web app identification is sent; no admin token, cookies or service-account credential is used.
  const response = await fetch(url, { cache: "no-store", credentials: "omit" });
  if (response.status === 403 || response.status === 404) return null;
  if (!response.ok) throw new Error("Article service unavailable");
  const body = await response.json();
  const fields = body.fields && typeof body.fields === "object" ? body.fields as Record<string, WireValue> : {};
  const value = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, decode(field)]));
  const post = postFromData(slug, value);
  return post && effectiveStatus(post, now) === "published" ? post : null;
}

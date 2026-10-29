import type { Metadata } from "next";
import { site } from "@/content/site";
export function pageMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: `${site.url}${path}` },
    openGraph: { title, description, url: `${site.url}${path}`, siteName: site.name, type: "website" },
    twitter: { card: "summary", title, description } };
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ventures } from "@/ventures/registry";
import { VentureLanding } from "@/ventures/landing";
import { pageMetadata } from "@/lib/metadata";
import { site } from "@/content/site";
export const dynamicParams = false;
export function generateStaticParams() { return ventures.map(v => ({ venture: v.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ venture: string }> }): Promise<Metadata> {
  const { venture } = await params;
  const v = ventures.find(v => v.slug === venture);
  if (!v) return {};
  const url = v.canonicalBase || `${site.url}/ventures/${v.slug}/`;
  const logo = v.logo?.src.trim() ? v.logo : undefined;
  const image = logo ? { url: new URL(logo.src, site.url).href, width: logo.width, height: logo.height, alt: logo.alt } : undefined;
  const metadata = pageMetadata(v.name, v.description, `/ventures/${v.slug}/`, image);
  return { ...metadata, title: { absolute: v.name }, alternates: { canonical: url },
    openGraph: { ...metadata.openGraph, siteName: v.name, url },
  };
}
export default async function VenturePage({ params }: { params: Promise<{ venture: string }> }) { const { venture } = await params; const v = ventures.find(v => v.slug === venture); if (!v) notFound(); return <VentureLanding venture={v} />; }

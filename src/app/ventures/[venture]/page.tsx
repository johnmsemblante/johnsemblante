import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ventures } from "@/ventures/registry";
import { VentureLanding } from "@/ventures/landing";
import { site } from "@/content/site";
export const dynamicParams = false;
export function generateStaticParams() { return ventures.map(v => ({ venture: v.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ venture: string }> }): Promise<Metadata> { const { venture } = await params; const v = ventures.find(v => v.slug === venture); if (!v) return {}; const url = v.canonicalBase || `${site.url}/ventures/${v.slug}/`; return { title: { absolute: v.name }, description: v.description, alternates: { canonical: url }, openGraph: { title: v.name, description: v.description, siteName: v.name, url, type: "website", images: v.hero ? [{ url: `${site.url}${v.hero.src}`, width: v.hero.width, height: v.hero.height, alt: v.hero.alt }] : undefined }, twitter: { card: "summary", title: v.name, description: v.description } }; }
export default async function VenturePage({ params }: { params: Promise<{ venture: string }> }) { const { venture } = await params; const v = ventures.find(v => v.slug === venture); if (!v) notFound(); return <VentureLanding venture={v} />; }

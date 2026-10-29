import { notFound } from "next/navigation";
import { projects } from "@/content/site";
import { PageIntro } from "@/components/ui";
import { pageMetadata } from "@/lib/metadata";
export const dynamicParams = false;
export function generateStaticParams() { return projects.map(p => ({ slug: p.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const p = projects.find(p => p.slug === slug); return p ? pageMetadata(p.title, p.summary, `/work/${p.slug}/`) : {}; }
export default async function CaseStudy({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const p = projects.find(p => p.slug === slug); if (!p) notFound(); return <><PageIntro eyebrow={p.role} title={p.title}><p>{p.summary}</p></PageIntro><section className="section"><p className="eyebrow">{p.technologies.join(" · ")}</p>{[["The challenge", p.challenge], ["The approach", p.approach], ["The outcome", p.outcome]].map(([heading, text]) => <article className="case-section" key={heading}><h2>{heading}</h2><p className="lede">{text}</p></article>)}</section></>; }

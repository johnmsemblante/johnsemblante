import { notFound } from "next/navigation";
import { buildWorks } from "@/lib/build-works";
import { pageMetadata } from "@/lib/metadata";
import { LiveWorkDetail } from "@/components/live-works";
export const dynamicParams=false;
export function generateStaticParams(){return buildWorks().map(project=>({slug:project.slug}));}
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params;const project=buildWorks().find(p=>p.slug===slug);return project?pageMetadata(project.seo?.title||project.title,project.seo?.description||project.summary,`/work/${project.slug}/`,project.image?.src.trim()?{url:project.image.src,alt:project.image.alt}:undefined):{};}
export default async function ProjectPage({params}:Props){const {slug}=await params;const project=buildWorks().find(p=>p.slug===slug);if(!project)notFound();return <LiveWorkDetail initial={project}/>;}

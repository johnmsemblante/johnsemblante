import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectExplorer } from "@/components/project-explorer";
import { PageIntro } from "@/components/ui";
import { findIndustry, industries, industryPath } from "@/content/industries";
import { projects, site } from "@/content/site";
import { pageMetadata } from "@/lib/metadata";

export const dynamicParams = false;
export function generateStaticParams() { return industries.map(industry => ({ industry: industry.slug })); }
type Props = { params: Promise<{ industry: string }> };
export async function generateMetadata({ params }: Props) {
  const industry = findIndustry((await params).industry);
  if (!industry) return {};
  const hasProjects = projects.some(project => project.industries.includes(industry.slug));
  return pageMetadata(industry.title, `${industry.description}${hasProjects ? "" : " No project examples are currently published in this collection."}`, industryPath(industry.slug));
}
export default async function IndustryPage({ params }: Props) {
  const industry = findIndustry((await params).industry);
  if (!industry) notFound();
  const collection = projects.filter(project => project.industries.includes(industry.slug));
  const url = `${site.url}${industryPath(industry.slug)}`;
  const schema = { "@context": "https://schema.org", "@type": "CollectionPage", name: industry.title, description: industry.description, url,
    mainEntity: { "@type": "ItemList", numberOfItems: collection.length, itemListElement: collection.map((project, index) => ({ "@type": "ListItem", position: index + 1, name: project.title, url: `${site.url}/work/${project.slug}/` })) } };
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
    <PageIntro eyebrow="Work / Industry collection" title={industry.heading}><p>{industry.introduction}</p><div className="actions"><Link className="button secondary" href="/work/#projects">← All portfolio projects</Link></div></PageIntro>
    <section className="section" aria-label={`${industry.label} portfolio`}>
      <div className="industry-context"><p>{collection.length ? "Explore the available public examples below. Technology badges describe each project; historical screenshots and live websites may differ." : `There are no published ${industry.label.toLowerCase()} project examples in this collection yet. Get in touch to discuss your website requirements.`}</p><p>Share this page&apos;s URL to send someone directly to this collection.</p></div>
      <ProjectExplorer projects={collection} industry={industry.slug} />
    </section>
    <section className="contact-band"><div className="industry-contact-copy"><p className="eyebrow">Your next website</p><h2>Let&apos;s discuss your {industry.slug === "other" ? "website" : industry.label.toLowerCase()} project.</h2><p className="body-copy">Share your design, existing website or requirements. We can talk through the development support you need.</p></div><Link className="button" href="/contact/?topic=experience#inquiry">Discuss your project ↗</Link></section>
  </>;
}

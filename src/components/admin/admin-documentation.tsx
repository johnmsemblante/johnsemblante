"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { documentationGuides } from "@/content/admin-documentation";
import { searchDocumentation } from "@/lib/documentation-search";

const categories = [...new Set(documentationGuides.map(guide => guide.category))];
export function AdminDocumentation() {
  const [query, setQuery] = useState(""), [category, setCategory] = useState("all");
  const results = searchDocumentation(documentationGuides, query, category);
  const list = useRef<HTMLDivElement>(null);
  const latest = documentationGuides.reduce((date, guide) => guide.updated > date ? guide.updated : date, "");
  function clear() { setQuery(""); setCategory("all"); }
  function expand(open: boolean) { list.current?.querySelectorAll("details").forEach(detail => { detail.open = open; }); }
  return <>
    <div className="admin-heading"><div><p className="eyebrow">Website handbook</p><h1>Documentation</h1><p>Find out how the site works, follow a workflow, or troubleshoot a problem without opening the code.</p></div></div>
    <section className="admin-card documentation-search" aria-label="Find documentation">
      <div><label htmlFor="documentation-query">Search documentation</label><input id="documentation-query" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Try publishing, image size, SEO or uploads" aria-describedby="documentation-search-help" /></div>
      <div><label htmlFor="documentation-category">Topic</label><select id="documentation-category" value={category} onChange={event => setCategory(event.target.value)}><option value="all">All topics</option>{categories.map(value => <option key={value}>{value}</option>)}</select></div>
      <button className="documentation-control" type="button" onClick={clear} disabled={!query && category === "all"}>Clear filters</button>
      <p id="documentation-search-help" className="form-note">Search covers full instructions as well as titles and tags. Multiple words must all appear in the same guide.</p>
    </section>
    <div className="documentation-results-heading"><p role="status" aria-live="polite">{results.length} of {documentationGuides.length} guides{category !== "all" ? ` · ${category}` : ""}</p><div><button className="documentation-control" type="button" onClick={() => expand(true)} disabled={!results.length}>Expand results</button><button className="documentation-control" type="button" onClick={() => expand(false)} disabled={!results.length}>Collapse results</button></div></div>
    <div ref={list} className="documentation-results">
      {results.map(guide => <details key={guide.id} className="documentation-guide" id={`guide-${guide.id}`}>
        <summary><span className="documentation-guide-category">{guide.category}</span><h2>{guide.title}</h2><span className="documentation-guide-summary">{guide.summary}</span><span className="documentation-guide-date">Last reviewed <time dateTime={guide.updated}>{guide.updated}</time></span></summary>
        <div className="documentation-guide-body">
          {guide.sections.map(section => <section key={section.heading}><h3>{section.heading}</h3>{section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}{section.steps && <ol>{section.steps.map(step => <li key={step}>{step}</li>)}</ol>}</section>)}
          {!!guide.links?.length && <nav aria-label={`Related links for ${guide.title}`} className="documentation-related">{guide.links.map(link => <Link key={link.href} href={link.href} {...(link.href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{link.label}{link.href.startsWith("https:") ? " ↗" : " →"}</Link>)}</nav>}
        </div>
      </details>)}
      {!results.length && <section className="admin-card documentation-empty"><h2>No matching guides</h2><p>Try fewer words, a different topic, or terms such as “publish”, “images” or “draft”.</p><button type="button" className="documentation-control" onClick={clear}>Show all guides</button></section>}
    </div>
    <aside className="documentation-maintenance"><h2>Maintained with the website</h2><p>Guides are updated in source alongside relevant feature and workflow changes, then published with the next deployment. They are not automatically rewritten after content saves. Latest handbook review: <time dateTime={latest}>{latest}</time>.</p></aside>
  </>;
}

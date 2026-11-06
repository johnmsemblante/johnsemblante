import { Fragment, type ReactNode } from "react";
import { articleBlocks, safeAssetUrl } from "@/lib/blog-model";

/** Render a small Markdown subset as React nodes; never interpret stored HTML. */
function inline(text = "", depth = 0): ReactNode {
  if (depth > 4) return text;
  const pattern = /`([^`\n]+)`|\[([^\]\n]+)\]\(([^\s()]+)\)|\*\*([^\n]+?)\*\*|\*([^*\n]+)\*/g;
  const parts: ReactNode[] = [];
  let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    parts.push(text.slice(cursor, match.index));
    const key = match.index;
    if (match[1] !== undefined) parts.push(<code key={key}>{match[1]}</code>);
    else if (match[2] !== undefined) parts.push(safeAssetUrl(match[3]) ? <a key={key} href={match[3]} rel="noopener noreferrer">{inline(match[2], depth + 1)}</a> : <Fragment key={key}>{match[0]}</Fragment>);
    else if (match[4] !== undefined) parts.push(<strong key={key}>{inline(match[4], depth + 1)}</strong>);
    else parts.push(<em key={key}>{inline(match[5], depth + 1)}</em>);
    cursor = match.index! + match[0].length;
  }
  parts.push(text.slice(cursor));
  return parts;
}

export function BlogArticleContent({ content }: { content: string }) {
  return <div className="blog-prose managed-prose">{articleBlocks(content).map((block, index) => {
    if (block.type === "image") return <figure className="article-media" key={index}><img src={block.url} alt={block.text} loading="lazy" referrerPolicy="no-referrer" /><figcaption>{block.text}</figcaption></figure>;
    if (block.type === "asset") return <p key={index}><a className="article-asset" href={block.url} target="_blank" rel="noopener noreferrer">{block.text} <span aria-hidden="true">↗</span></a></p>;
    if (block.type === "heading") return block.level === 3 ? <h3 key={index}>{inline(block.text)}</h3> : <h2 key={index}>{inline(block.text)}</h2>;
    if (block.type === "quote") return <blockquote key={index}><p>{inline(block.text)}</p></blockquote>;
    if (block.type === "list") return <ul key={index}>{block.items?.map((item, i) => <li key={i}>{inline(item)}</li>)}</ul>;
    if (block.type === "ordered-list") return <ol key={index}>{block.items?.map((item, i) => <li key={i}>{inline(item)}</li>)}</ol>;
    return <p key={index}>{inline(block.text)}</p>;
  })}</div>;
}

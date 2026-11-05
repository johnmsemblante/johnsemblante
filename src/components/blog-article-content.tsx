import { articleBlocks } from "@/lib/blog-model";

export function BlogArticleContent({ content }: { content: string }) {
  return <div className="blog-prose managed-prose">{articleBlocks(content).map((block, index) => {
    if (block.type === "image") return <figure className="article-media" key={index}><img src={block.url} alt={block.text} loading="lazy" referrerPolicy="no-referrer" /><figcaption>{block.text}</figcaption></figure>;
    if (block.type === "asset") return <p key={index}><a className="article-asset" href={block.url} target="_blank" rel="noopener noreferrer">{block.text} <span aria-hidden="true">↗</span></a></p>;
    if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
    if (block.type === "quote") return <blockquote key={index}><p>{block.text}</p></blockquote>;
    if (block.type === "list") return <ul key={index}>{block.items?.map((item, i) => <li key={i}>{item}</li>)}</ul>;
    return <p key={index}>{block.text}</p>;
  })}</div>;
}

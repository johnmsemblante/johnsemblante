import { articleBlocks } from "@/lib/blog-model";

export function BlogArticleContent({ content }: { content: string }) {
  return <div className="blog-prose managed-prose">{articleBlocks(content).map((block, index) => {
    if (block.type === "heading") return <h2 key={index}>{block.text}</h2>;
    if (block.type === "quote") return <blockquote key={index}><p>{block.text}</p></blockquote>;
    if (block.type === "list") return <ul key={index}>{block.items?.map((item, i) => <li key={i}>{item}</li>)}</ul>;
    return <p key={index}>{block.text}</p>;
  })}</div>;
}

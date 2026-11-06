import { safeAssetUrl } from "./blog-model";

export type ArticleFormat = "bold" | "italic" | "code" | "heading" | "subheading" | "list" | "ordered-list" | "quote" | "link";
type Selection = { content: string; start: number; end: number };

/** Keep formatting changes independent of the DOM, including selection restoration. */
export function formatArticle(content: string, start: number, end: number, format: ArticleFormat, href = ""): Selection {
  start = Math.max(0, Math.min(start, content.length));
  end = Math.max(start, Math.min(end, content.length));
  const selected = content.slice(start, end);
  const replace = (from: number, to: number, text: string, a = 0, b = text.length): Selection => ({ content: content.slice(0, from) + text + content.slice(to), start: from + a, end: from + b });
  if (format === "link") {
    if (!safeAssetUrl(href.trim())) return { content, start, end };
    const url = href.trim().replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/\s/g, value => encodeURIComponent(value));
    const text = selected.replace(/[\[\]\r\n]/g, " ") || "Link text";
    return replace(start, end, `[${text}](${url})`, 1, text.length + 1);
  }
  if (format === "bold" || format === "italic" || format === "code") {
    const marker = format === "bold" ? "**" : format === "italic" ? "*" : "`";
    if (selected.startsWith(marker) && selected.endsWith(marker) && selected.length > marker.length * 2) return replace(start, end, selected.slice(marker.length, -marker.length));
    if (content.slice(start - marker.length, start) === marker && content.slice(end, end + marker.length) === marker) return replace(start - marker.length, end + marker.length, selected);
    const text = selected || (format === "code" ? "code" : "text");
    return replace(start, end, marker + text + marker, marker.length, marker.length + text.length);
  }
  const from = start === 0 ? 0 : content.lastIndexOf("\n", start - 1) + 1;
  const lastSelected = end > start && content[end - 1] === "\n" ? end - 1 : end;
  const nextBreak = content.indexOf("\n", lastSelected);
  const to = nextBreak < 0 ? content.length : nextBreak;
  const lines = content.slice(from, to).split("\n");
  const prefix = format === "heading" ? "## " : format === "subheading" ? "### " : format === "quote" ? "> " : "- ";
  const pattern = format === "ordered-list" ? /^\d+\. / : new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);
  const remove = lines.every(line => !line.trim() || pattern.test(line));
  let number = 0;
  const formatted = lines.map(line => {
    if (!line.trim()) return line;
    if (remove) return line.replace(pattern, "");
    const plain = line.replace(/^(?:#{2,3} |[-] |\d+\. |> )/, "");
    return (format === "ordered-list" ? `${++number}. ` : prefix) + plain;
  }).join("\n") || (format === "ordered-list" ? "1. " : prefix);
  return replace(from, to, formatted);
}

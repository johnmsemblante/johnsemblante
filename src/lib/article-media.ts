import { safeAssetUrl } from "./blog-model";

/** Insert a media block at the caret without deleting surrounding article text. */
export function insertArticleMedia(content: string, position: number, type: "image" | "asset", rawUrl: string, description: string) {
  const raw = rawUrl.trim();
  const label = description.trim().replace(/[\[\]\r\n]/g, " ").trim();
  if (!safeAssetUrl(raw) || !label || label.length > 200) throw new Error("Enter an HTTPS or site-relative URL and a description of up to 200 characters.");
  const url = (raw.startsWith("/") ? raw : new URL(raw).href).replace(/\(/g, "%28").replace(/\)/g, "%29");
  const snippet = `\n\n${type === "image" ? "!" : ""}[${label}](${url})\n\n`;
  const at = Number.isFinite(position) ? Math.max(0, Math.min(position, content.length)) : content.length;
  const next = content.slice(0, at) + snippet + content.slice(at);
  if (next.length > 60000) throw new Error("The article exceeds 60,000 characters. Shorten the text before inserting this image or link.");
  return { content: next, caret: at + snippet.length };
}

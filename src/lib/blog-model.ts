export type ManagedPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  content: string;
  publishedAt: string;
  status: "draft" | "published";
  revision: number;
};
export type PostInput = Omit<ManagedPost, "revision">;

export function validDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
}

export function validatePost(input: PostInput): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(input.slug) || input.slug.length > 100) return "Use a URL slug of up to 100 lowercase letters, numbers and single hyphens.";
  const fields = [["Title", input.title, 160], ["Excerpt", input.excerpt, 500], ["Category", input.category, 80], ["Article", input.content, 60000]] as const;
  for (const [name, value, maximum] of fields) {
    if (!value.trim() || value.length > maximum) return `${name} is required and must be at most ${maximum.toLocaleString()} characters.`;
  }
  if (input.status !== "draft" && input.status !== "published") return "Choose draft or published status.";
  if (input.publishedAt && !validDate(input.publishedAt)) return "Enter a valid publication date.";
  if (input.status === "published" && !validDate(input.publishedAt)) return "A valid publication date is required before publishing.";
  return null;
}

export function postFromData(slug: string, value: Record<string, unknown>): ManagedPost | null {
  const keys = ["title", "excerpt", "category", "content", "publishedAt", "status"];
  if (keys.some(key => typeof value[key] !== "string") || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1) return null;
  const post: ManagedPost = {
    slug, title: value.title as string, excerpt: value.excerpt as string,
    category: value.category as string, content: value.content as string,
    publishedAt: value.publishedAt as string, status: value.status as ManagedPost["status"],
    revision: value.revision as number,
  };
  return validatePost(post) ? null : post;
}

// A deliberately small text format. HTML is always rendered as text by React.
export function articleBlocks(content: string): { type: "paragraph" | "heading" | "quote" | "list"; text?: string; items?: string[] }[] {
  return content.replace(/\r\n/g, "\n").split(/\n\s*\n/).filter(part => part.trim()).map(part => {
    const lines = part.trim().split("\n");
    if (lines.every(line => line.startsWith("- "))) return { type: "list", items: lines.map(line => line.slice(2)) };
    if (lines.every(line => line.startsWith("> "))) return { type: "quote", text: lines.map(line => line.slice(2)).join("\n") };
    if (lines.length === 1 && lines[0].startsWith("## ")) return { type: "heading", text: lines[0].slice(3) };
    return { type: "paragraph", text: lines.join("\n") };
  });
}

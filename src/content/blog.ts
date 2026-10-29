export type BlogBlock =
  | { type: "paragraph" | "heading" | "quote"; text: string }
  | { type: "list"; items: string[] };

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  /** YYYY-MM-DD; required before publication. */
  publishedAt: string;
  status: "draft" | "published";
  body: BlogBlock[];
};

// Duplicate this draft to start writing. Draft content never enters exported pages.
export const posts: BlogPost[] = [
  {
    slug: "my-first-post",
    title: "My first post",
    excerpt: "Replace this with a short introduction to your article.",
    category: "Notes",
    publishedAt: "",
    status: "draft",
    body: [
      { type: "paragraph", text: "Start with one idea you want your reader to take away." },
      { type: "heading", text: "Explore your idea" },
      { type: "paragraph", text: "Add your own story, examples, and a useful conclusion." },
    ],
  },
];

export function publishedPosts(): BlogPost[] {
  const published = posts.filter(post => post.status === "published");
  const slugs = new Set<string>();
  for (const post of published) {
    const validDate = /^\d{4}-\d{2}-\d{2}$/.test(post.publishedAt) &&
      !Number.isNaN(Date.parse(post.publishedAt)) &&
      new Date(post.publishedAt).toISOString().slice(0, 10) === post.publishedAt;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || slugs.has(post.slug) ||
      !validDate || !post.title.trim() || !post.excerpt.trim() || !post.body.length) {
      throw new Error(`Complete the content, date, and unique URL slug before publishing: ${post.slug}`);
    }
    slugs.add(post.slug);
  }
  return published.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function formatPostDate(date: string): string {
  return new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(date));
}

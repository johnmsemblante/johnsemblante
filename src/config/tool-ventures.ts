// Source-only registry. Never merge these entries into the managed venture store
// or page catalog: those are the admin CRUD boundaries.
export type ToolVenture = {
  id: string; name: string; description: string; slug: string;
  route: string; category: string; icon: string;
  status: "published" | "draft"; order: number;
  featuredOnHome?: boolean;
  featuredOrder?: number;
  shortName?: string;
  homeDescription?: string;
  ctaLabel?: string;
  iconImage?: string;
  donationsEnabled?: boolean;
};
export const toolVentures: ToolVenture[] = [{
  id: "qr-code-generator", slug: "qr-code-generator",
  name: "Free QR Code Generator by John Semblante",
  description: "Create private, custom QR codes for links, text, Wi-Fi, email and phone calls. Download PNG or SVG for free.",
  route: "/tools/qr-code-generator/", category: "Free online tool",
  icon: "▦", status: "published", order: 1,
  featuredOnHome: true,
  featuredOrder: 1,
  shortName: "Free QR Code Generator",
  homeDescription: "Create custom QR codes for websites, Wi-Fi, text, emails, and more. Customize your design and download your QR code instantly.",
  ctaLabel: "Create a QR Code",
  iconImage: "/tools/qr-code-generator/icon.svg",
  donationsEnabled: true,
}];
export const publishedTools = toolVentures.filter(tool => tool.status === "published").sort((a, b) => a.order - b.order);

export function featuredHomeTools(items: readonly ToolVenture[] = toolVentures): ToolVenture[] {
  const eligible = items
    .filter(tool => tool.status === "published" && tool.featuredOnHome)
    .sort((a, b) => (a.featuredOrder ?? a.order) - (b.featuredOrder ?? b.order));
  const selected: ToolVenture[] = [];
  const ids = new Set<string>();
  const routes = new Set<string>();

  for (const tool of eligible) {
    if (ids.has(tool.id) || routes.has(tool.route)) continue;
    ids.add(tool.id);
    routes.add(tool.route);
    selected.push(tool);
    if (selected.length === 4) break;
  }
  return selected;
}

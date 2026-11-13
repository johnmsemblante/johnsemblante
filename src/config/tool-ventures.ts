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
  navigationLabel?: string;
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
  navigationLabel: "QR Generator",
}, {
  id: "image-compressor", slug: "image-compressor",
  name: "Free Image Compressor by John Semblante",
  description: "Compress JPG, PNG and WebP locally in your browser. Choose 50KB, 100KB, 200KB, 500KB or a custom target and download for free.",
  route: "/tools/image-compressor/", category: "Free online tool",
  icon: "▧", status: "published", order: 2,
  featuredOnHome: true, featuredOrder: 2,
  shortName: "Free Image Compressor",
  homeDescription: "Reduce JPG, PNG and WebP file sizes privately in your browser. Choose a target size, compare your result and download for free.",
  ctaLabel: "Compress an Image",
  iconImage: "/tools/image-compressor/icon.svg",
  donationsEnabled: true, navigationLabel: "Image Compressor",
}, {
  id: "pdf-editor", slug: "pdf-editor",
  name: "Free PDF Editor by John Semblante",
  description: "Add text and drawn signatures, rotate or remove pages, and download an edited PDF privately in your browser.",
  route: "/tools/pdf-editor/", category: "Free online tool",
  icon: "PDF", status: "published", order: 3,
  featuredOnHome: true, featuredOrder: 3, shortName: "Free PDF Editor",
  homeDescription: "Add text, draw a signature and manage PDF pages. Edit and download locally, with no account or watermark.",
  ctaLabel: "Edit a PDF", iconImage: "/tools/pdf-editor/icon.svg",
  donationsEnabled: true, navigationLabel: "PDF Editor",
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

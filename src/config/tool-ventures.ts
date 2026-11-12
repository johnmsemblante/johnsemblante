// Source-only registry. Never merge these entries into the managed venture store
// or page catalog: those are the admin CRUD boundaries.
export type ToolVenture = {
  id: string; name: string; description: string; slug: string;
  route: string; category: string; icon: string;
  status: "published" | "draft"; order: number;
};
export const toolVentures: ToolVenture[] = [{
  id: "qr-code-generator", slug: "qr-code-generator",
  name: "Free QR Code Generator by John Semblante",
  description: "Create private, custom QR codes for links, text, Wi-Fi, email and phone calls. Download PNG or SVG for free.",
  route: "/tools/qr-code-generator/", category: "Free online tool",
  icon: "▦", status: "published", order: 1,
}];
export const publishedTools = toolVentures.filter(tool => tool.status === "published").sort((a, b) => a.order - b.order);

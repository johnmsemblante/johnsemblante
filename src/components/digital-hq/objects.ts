export type Quality = "high" | "medium" | "low";
type Vector = readonly [number, number, number];
type ObjectDefinition = {
  id: string; label: string; name: string; icon: string; href: string; accent: string;
  model: string; position: Vector; anchor: Vector; preview: readonly [number, number];
  camera: { position: Vector; target: Vector }; hover: "lift" | "tilt";
  selection: "rise" | "activate" | "open"; character: string; source: string;
};

// One catalogue drives physical models, raycasting, HTML navigation and content.
export const hqObjects = [
  { id: "work", label: "My Works", name: "The project archive", icon: "code", href: "/work/", accent: "#ffc177", model: "sd-card", position: [-6, 1, 2.2], anchor: [-6, 2.5, 2.5], preview: [27.13, 57.75], camera: { position: [-7, 5.2, 12], target: [-3.5, 2.5, 1] }, hover: "tilt", selection: "rise", character: "work", source: "buildWorks" },
  { id: "skills", label: "Skills", name: "Behind the builds", icon: "layers", href: "/about/", accent: "#78d7ef", model: "monitors", position: [-2.9, 2.35, .2], anchor: [-3.3, 4.05, .3], preview: [38.52, 44.69], camera: { position: [-5, 5, 10], target: [-2.2, 3.2, .3] }, hover: "lift", selection: "activate", character: "typing", source: "profile" },
  { id: "ventures", label: "Ventures", name: "Ideas taking flight", icon: "rocket", href: "/ventures/", accent: "#ffb977", model: "rocket", position: [-3.8, 3, -2.2], anchor: [-3.8, 5.15, -2], preview: [37.95, 36.22], camera: { position: [-6, 6, 10], target: [-3, 3.7, -1] }, hover: "lift", selection: "activate", character: "point", source: "buildVentures" },
  { id: "blog", label: "Blog", name: "Notes from the work", icon: "book", href: "/blog/", accent: "#f7c78d", model: "bookshelf", position: [4.5, .25, -3.1], anchor: [4.5, 4.85, -2.5], preview: [63.92, 37.55], camera: { position: [7, 5.6, 10], target: [4.1, 3.6, -2.5] }, hover: "lift", selection: "open", character: "reading", source: "buildBlogPosts" },
  { id: "tools", label: "Tools", name: "The utility workspace", icon: "tool", href: "/tools/", accent: "#7cdcec", model: "toolbox", position: [3.5, 2.35, .8], anchor: [3.6, 3.75, 1], preview: [62.91, 47.39], camera: { position: [6, 5.3, 11], target: [3.2, 2.7, .8] }, hover: "tilt", selection: "open", character: "point", source: "publishedTools" },
  { id: "arcade", label: "Games", name: "After hours arcade", icon: "game", href: "/games/neon-dash/", accent: "#d995fa", model: "arcade", position: [7.2, .2, -.8], anchor: [8.9, 3.4, 1], preview: [81.79, 49.56], camera: { position: [10, 5.5, 12], target: [6, 2.5, -.8] }, hover: "lift", selection: "activate", character: "gaming", source: "publishedTools:neon-dash" },
  { id: "contact", label: "Contact", name: "Let’s work together", icon: "mail", href: "/contact/", accent: "#d5bdff", model: "phone", position: [5.3, 2.25, 3.5], anchor: [5.3, 1.8, 4], preview: [71.72, 65.74], camera: { position: [8, 5.2, 12], target: [4, 2.6, 2.5] }, hover: "lift", selection: "rise", character: "contact", source: "profile:contact" },
  { id: "about", label: "About Me", name: "Meet the developer", icon: "person", href: "/about/", accent: "#ffca8b", model: "character", position: [0, .2, -.2], anchor: [1.7, .55, 4.6], preview: [57.09, 76.05], camera: { position: [1.5, 5.4, 10], target: [0, 3.8, 0] }, hover: "lift", selection: "activate", character: "introduce", source: "profile" },
] as const satisfies readonly ObjectDefinition[];
export type SectionId = typeof hqObjects[number]["id"];
export type HQCard = { title: string; description: string; href: string; image?: string; meta?: string };
export type HQContent = Record<SectionId, { description: string; cards: HQCard[] }>;
export const overview = { position: [0, 7.8, 20.5] as Vector, target: [0, 3.1, 0] as Vector };
export function initialQuality(input: { width: number; reducedMotion: boolean; saveData: boolean; slowConnection: boolean; cores: number }): Quality {
  if (input.saveData || input.slowConnection || input.reducedMotion || input.width < 760) return "low";
  return input.cores <= 2 ? "low" : input.width < 1100 || input.cores <= 4 ? "medium" : "high";
}
export function readMode(value: string | null): "interactive" | "classic" { return value === "classic" ? "classic" : "interactive"; }

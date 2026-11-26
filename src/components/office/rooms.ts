// Source-managed room layout. Coordinates are shared by the scene and HTML labels.
export const officeRooms = [
  { id: "about", label: "About me", name: "The reception", icon: "person", target: [-10, 0, 6], anchor: [-10, 2, 6], preview: [49.78,68.29], href: "/about/", accent: "#e9be92" },
  { id: "work", label: "My works", name: "Development studio", icon: "code", target: [3.8, 0, -5], anchor: [4, 3, -5], preview: [57.26,31.50], href: "/work/", accent: "#b7dbf0" },
  { id: "ventures", label: "Ventures", name: "The innovation lab", icon: "layers", target: [-2, 0, 5], anchor: [-2, 2.7, 5], preview: [60.31,54.83], href: "/ventures/", accent: "#b7d8c4" },
  { id: "tools", label: "Online tools", name: "The tools workshop", icon: "tool", target: [5, 0, 5], anchor: [5, 2.6, 5], preview: [70.56,46.61], href: "/tools/", accent: "#a9d9d4" },
  { id: "arcade", label: "Neon Dash", name: "After hours arcade", icon: "game", target: [-3, 0, -5], anchor: [-3, 2.9, -5], preview: [47.01,40.34], href: "/games/neon-dash/", accent: "#d4b8f1" },
  { id: "blog", label: "The blog", name: "The reading room", icon: "book", target: [-11, 0, .7], anchor: [-11, 2.4, .7], preview: [42.04,60.26], href: "/blog/", accent: "#e9c69f" },
  { id: "skills", label: "My toolkit", name: "Behind the builds", icon: "grid", target: [7.2, 0, .6], anchor: [7.3, 3, .6], preview: [68.72,35.92], href: "/about/", accent: "#c0cbb5" },
  { id: "contact", label: "Let’s talk", name: "The meeting room", icon: "mail", target: [11, 0, 3.7], anchor: [11, 3, 3.7], preview: [77.81,36.08], href: "/contact/", accent: "#edc7a7" },
] as const;
export type RoomId = typeof officeRooms[number]["id"];
export type OfficeCard = { title: string; description: string; href: string; image?: string; meta?: string };
export type OfficeContent = Record<RoomId, { description: string; cards: OfficeCard[] }>;
export type OfficeStats = { value: number; label: string; icon: string }[];

export function readOfficeMode(value: string | null): "interactive" | "classic" {
  return value === "classic" ? "classic" : "interactive";
}
export function initialOfficeQuality(input: { width: number; reducedMotion: boolean; saveData: boolean; slowConnection: boolean; cores: number }): "high" | "medium" | "low" | "static" {
  if (input.saveData || input.slowConnection || input.reducedMotion || input.width < 760) return "static";
  if (input.cores <= 2) return "low";
  return input.width < 1100 || input.cores <= 4 ? "medium" : "high";
}

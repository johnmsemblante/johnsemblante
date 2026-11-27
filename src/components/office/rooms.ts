// Source-managed room layout. Coordinates are shared by the scene and HTML labels.
export const officeRooms = [
  { id: "about", label: "About me", name: "The reception", icon: "person", target: [-10, 0, 6], anchor: [-10, 2, 6], preview: [40.75,75.73], href: "/about/", accent: "#e9be92" },
  { id: "work", label: "My works", name: "Development studio", icon: "code", target: [3.8, 0, -5], anchor: [4, 3, -5], preview: [49.92,28.18], href: "/work/", accent: "#b7dbf0" },
  { id: "ventures", label: "Ventures", name: "The innovation lab", icon: "layers", target: [-2, 0, 5], anchor: [-2, 2.7, 5], preview: [53.67,58.44], href: "/ventures/", accent: "#b7d8c4" },
  { id: "tools", label: "Online tools", name: "The tools workshop", icon: "tool", target: [5, 0, 5], anchor: [5, 2.6, 5], preview: [66.25,47.72], href: "/tools/", accent: "#a9d9d4" },
  { id: "arcade", label: "Neon Dash", name: "After hours arcade", icon: "game", target: [-3, 0, -5], anchor: [-3, 2.9, -5], preview: [37.34,39.66], href: "/games/neon-dash/", accent: "#d4b8f1" },
  { id: "blog", label: "The blog", name: "The reading room", icon: "book", target: [-11, 0, .7], anchor: [-11, 2.4, .7], preview: [31.25,65.41], href: "/blog/", accent: "#e9c69f" },
  { id: "skills", label: "My toolkit", name: "Behind the builds", icon: "grid", target: [7.2, 0, .6], anchor: [7.3, 3, .6], preview: [63.99,33.93], href: "/about/", accent: "#c0cbb5" },
  { id: "contact", label: "Let’s talk", name: "The meeting room", icon: "mail", target: [11, 0, 3.7], anchor: [11, 3, 3.7], preview: [75.14,34.14], href: "/contact/", accent: "#edc7a7" },
] as const;
export type RoomId = typeof officeRooms[number]["id"];
export type OfficeCard = { title: string; description: string; href: string; image?: string; meta?: string };
export type OfficeContent = Record<RoomId, { description: string; cards: OfficeCard[] }>;
export const officeOverview = { target: [0, 1.5, 0] as const, frameHeight: 22, frameWidth: 36 };
export function officeTilt(x: number, y: number, reducedMotion: boolean) {
  const clamp = (value: number) => Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
  return reducedMotion ? { yaw: 0, height: 0 } : { yaw: clamp(x) * .045, height: clamp(y) * 1.4 };
}

export function readOfficeMode(value: string | null): "interactive" | "classic" {
  return value === "classic" ? "classic" : "interactive";
}
export function initialOfficeQuality(input: { width: number; reducedMotion: boolean; saveData: boolean; slowConnection: boolean; cores: number }): "high" | "medium" | "low" | "static" {
  if (input.saveData || input.slowConnection || input.reducedMotion || input.width < 760) return "static";
  if (input.cores <= 2) return "low";
  return input.width < 1100 || input.cores <= 4 ? "medium" : "high";
}

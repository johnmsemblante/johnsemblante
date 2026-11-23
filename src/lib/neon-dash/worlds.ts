export const worlds = [
  { id: "neon-downtown", name: "Neon Downtown", distance: 0, description: "Cyan-lit streets and holographic signs beneath a violet night sky.", sky: ["#080d29", "#261955", "#a73076"], buildings: ["#21194c", "#131735", "#101026"], light: "#12b7dc", sun: "#f38e9b", deck: "#252044", detail: "#de397c", style: "street" },
  { id: "cyber-rooftops", name: "Cyber Rooftops", distance: 750, description: "A rooftop circuit amid antennas, vents, and a low orange sun.", sky: ["#2d1849", "#793662", "#f08c62"], buildings: ["#653c68", "#453052", "#28253e"], light: "#9eeaff", sun: "#ffd184", deck: "#423145", detail: "#ffb76b", style: "roof" },
  { id: "glitch-district", name: "Glitch District", distance: 2000, description: "A fractured skyline threaded with blue grids and magenta fragments.", sky: ["#070928", "#132771", "#622b83"], buildings: ["#24256d", "#171952", "#11143a"], light: "#a39fff", sun: "#e16cff", deck: "#17244e", detail: "#ff54d8", style: "digital" },
] as const;
export type World = typeof worlds[number];
export type WorldId = World["id"];
export const defaultWorld = worlds[0].id;
export const getWorld = (id: unknown) => worlds.find(world => world.id === id) ?? worlds[0];
export const unlockedWorlds = (distance: number, previous: readonly unknown[] = []) =>
  worlds.filter(world => distance >= world.distance || previous.includes(world.id)).map(world => world.id);

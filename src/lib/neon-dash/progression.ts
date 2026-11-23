export const playerKey = "neon-dash:v2:player-data";
export const cosmetics = {
  skins: [
    { id: "neon", name: "Neon Runner", price: 0, description: "A cyan visor and magenta street gear.", colors: ["#31c6d3", "#f857a2", "#6bf3ee"] },
    { id: "shadow", name: "Shadow Runner", price: 150, description: "A dark hood edged in ultraviolet.", colors: ["#483963", "#985be1", "#db9aff"] },
    { id: "ninja", name: "Cyber Ninja", price: 300, description: "A red mask and a trailing headband.", colors: ["#572737", "#eb405f", "#ff8596"] },
    { id: "phantom", name: "Glitch Phantom", price: 500, description: "A blue shell with fragmented magenta panels.", colors: ["#2874e4", "#fb44e4", "#87dfff"] },
    { id: "gold", name: "Golden Runner", price: 1000, description: "Black armor with an angular gold crown.", colors: ["#514127", "#eaae32", "#ffe794"] },
  ],
  trails: [
    { id: "cyan", name: "Classic Cyan", price: 0, description: "A clean cyan light trace.", colors: ["#50f3e2"] },
    { id: "pulse", name: "Purple Pulse", price: 100, description: "A violet trail that breathes as you run.", colors: ["#bb77ff"] },
    { id: "sparks", name: "Electric Sparks", price: 250, description: "Short blue sparks scatter in your wake.", colors: ["#79baff"] },
    { id: "streak", name: "Golden Streak", price: 500, description: "A smooth gold ribbon with tiny glints.", colors: ["#ffcf62"] },
  ],
};
export type Category = keyof typeof cosmetics;
type StorageAccess = Pick<Storage, "getItem" | "setItem">;
export type Player = {
  version: 2; earned: number; wallet: number; spent: number; best: number; sound: boolean;
  owned: Record<Category, string[]>; equipped: Record<Category, string>;
};
export function newPlayer(): Player {
  return { version: 2, earned: 0, wallet: 0, spent: 0, best: 0, sound: false, owned: { skins: ["neon"], trails: ["cyan"] }, equipped: { skins: "neon", trails: "cyan" } };
}
const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
export function parsePlayer(raw: string | null): Player | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Player;
    if (data?.version !== 2 || !count(data.earned) || !count(data.spent) || !count(data.wallet)
      || data.earned - data.spent !== data.wallet || !count(data.best) || typeof data.sound !== "boolean") return null;
    const result = newPlayer();
    for (const category of ["skins", "trails"] as const) {
      const owned = data.owned?.[category];
      if (!Array.isArray(owned)) return null;
      result.owned[category] = cosmetics[category].filter(item => !item.price || owned.includes(item.id)).map(item => item.id);
      if (result.owned[category].includes(data.equipped?.[category])) result.equipped[category] = data.equipped[category];
    }
    return { ...result, earned: data.earned, spent: data.spent, wallet: data.wallet, best: data.best, sound: data.sound };
  } catch { return null; }
}
export function loadPlayer(storage: StorageAccess) {
  const raw = storage.getItem(playerKey);
  const existing = parsePlayer(raw);
  if (existing) return { player: existing, warning: "" };
  const player = newPlayer();
  const score = Number(storage.getItem("neon-dash:v1:high-score"));
  if (count(score)) player.best = score;
  player.sound = storage.getItem("neon-dash:v1:sound") === "on";
  return { player, warning: raw === null ? "" : "Saved progress could not be read. It will not be overwritten." };
}
export function changeCosmetic(player: Player, category: Category, id: string, action: "buy" | "equip") {
  const item = cosmetics[category].find(entry => entry.id === id);
  if (!item) return { player, message: "Item unavailable." };
  const owned = player.owned[category].includes(id);
  if (action === "equip") return owned
    ? { player: { ...player, equipped: { ...player.equipped, [category]: id } }, message: `${item.name} equipped.` }
    : { player, message: "Unlock this item before equipping it." };
  if (owned) return { player, message: "You already own this item." };
  if (player.wallet < item.price) return { player, message: `You need ${item.price - player.wallet} more coins.` };
  return { player: { ...player, wallet: player.wallet - item.price, spent: player.spent + item.price,
    owned: { ...player.owned, [category]: [...player.owned[category], id] } }, message: `${item.name} unlocked.` };
}
export function finishRun(player: Player, receipt: { credited: boolean }, coins: number, distance: number) {
  if (receipt.credited || !count(coins) || !count(distance) || !count(player.earned + coins)) return player;
  receipt.credited = true;
  return { ...player, earned: player.earned + coins, wallet: player.wallet + coins, best: Math.max(player.best, distance) };
}

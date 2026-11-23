import { defaultWorld, unlockedWorlds, type WorldId } from "./worlds";
import { readLevels, type AudioLevels } from "./audio";
import { achievements, addStats, challenges, dailyFor, readStats, utcDay, validCount, zeroStats, type Daily, type Stats } from "./activity";

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
  lifetimeDistance: number; unlocked: WorldId[]; world: WorldId;
  collected: number; stats: Stats; daily: Daily; achievements: Record<string, string>;
  audio: AudioLevels; reducedEffects: boolean;
};
export function newPlayer(): Player {
  return { version: 2, earned: 0, wallet: 0, spent: 0, best: 0, sound: false, owned: { skins: ["neon"], trails: ["cyan"] }, equipped: { skins: "neon", trails: "cyan" }, lifetimeDistance: 0, unlocked: [defaultWorld], world: defaultWorld, collected: 0, stats: zeroStats(), daily: { date: "", stats: zeroStats(), claimed: [] }, achievements: {}, audio: readLevels(), reducedEffects: false };
}
const count = validCount;
export function achievementProgress(player: Player, metric: typeof achievements[number]["metric"]) {
  if (metric === "skins") return player.owned.skins.length;
  if (metric === "worlds") return player.unlocked.length;
  if (metric === "collected" || metric === "lifetimeDistance") return player[metric];
  return player.stats[metric];
}
export function awardAchievements(player: Player, now = new Date()) {
  const unlocked = { ...player.achievements };
  for (const badge of achievements) if (!unlocked[badge.id] && achievementProgress(player, badge.metric) >= badge.target) unlocked[badge.id] = now.toISOString();
  return { ...player, achievements: unlocked };
}
export function parsePlayer(raw: string | null): Player | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Player;
    if (data?.version !== 2 || !count(data.earned) || !count(data.spent) || !count(data.wallet)
      || data.earned - data.spent !== data.wallet || !count(data.best) || typeof data.sound !== "boolean") return null;
    const result = newPlayer();
    result.audio = readLevels(data.audio);
    result.reducedEffects = data.reducedEffects === true;
    result.collected = count(data.collected) && data.collected <= data.earned ? data.collected : data.earned;
    result.stats = readStats(data.stats);
    if (/^\d{4}-\d{2}-\d{2}$/.test(data.daily?.date ?? "") && Array.isArray(data.daily?.claimed)) {
      const date = data.daily.date;
      result.daily = { date, stats: readStats(data.daily.stats), claimed: challenges(date).filter(item => data.daily.claimed.includes(item.id)).map(item => item.id) };
    }
    for (const badge of achievements) {
      const timestamp = data.achievements?.[badge.id];
      if (typeof timestamp === "string" && Number.isFinite(Date.parse(timestamp))) result.achievements[badge.id] = timestamp;
    }
    result.lifetimeDistance = count(data.lifetimeDistance) ? data.lifetimeDistance : 0;
    result.unlocked = unlockedWorlds(result.lifetimeDistance, Array.isArray(data.unlocked) ? data.unlocked : []);
    if (result.unlocked.includes(data.world)) result.world = data.world;
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
  if (existing) return { player: awardAchievements(existing), warning: "" };
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
export function finishRun(player: Player, receipt: { credited: boolean }, coins: number, distance: number,
  details: Partial<Stats> = {}, now = new Date()) {
  if (receipt.credited || !count(coins) || !count(distance) || !count(player.earned + coins)) return player;
  receipt.credited = true;
  const lifetimeDistance = Math.min(Number.MAX_SAFE_INTEGER, player.lifetimeDistance + distance);
  const stats = readStats({ ...details, runs: 1, coins, distance });
  const daily = dailyFor(player.daily, utcDay(now));
  return awardAchievements({ ...player, earned: player.earned + coins, wallet: player.wallet + coins,
    collected: player.collected + coins, best: Math.max(player.best, distance), lifetimeDistance,
    unlocked: unlockedWorlds(lifetimeDistance, player.unlocked), stats: addStats(player.stats, stats),
    daily: daily.date === utcDay(now) ? { ...daily, stats: addStats(daily.stats, stats) } : daily }, now);
}

export function claimChallenge(player: Player, id: string, now = new Date()) {
  const date = utcDay(now);
  const daily = dailyFor(player.daily, date);
  if (daily.date !== date) return player;
  const challenge = challenges(date).find(item => item.id === id);
  if (!challenge || daily.claimed.includes(id) || daily.stats[challenge.metric] < challenge.target || !count(player.earned + challenge.reward)) return player;
  return { ...player, earned: player.earned + challenge.reward, wallet: player.wallet + challenge.reward, daily: { ...daily, claimed: [...daily.claimed, id] } };
}

export function selectWorld(player: Player, world: WorldId): Player {
  return player.unlocked.includes(world) ? { ...player, world } : player;
}

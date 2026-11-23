export const metrics = ["runs", "distance", "coins", "jumps", "slides", "survival", "longest", "dodges", "downtown"] as const;
export type Metric = typeof metrics[number];
export type Stats = Record<Metric, number>;
export type Daily = { date: string; stats: Stats; claimed: string[] };
export const zeroStats = () => Object.fromEntries(metrics.map(metric => [metric, 0])) as Stats;
export const utcDay = (now = new Date()) => now.toISOString().slice(0, 10);
export const validCount = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
export function readStats(value?: Partial<Stats>): Stats {
  const result = zeroStats();
  for (const metric of metrics) { const entry = value?.[metric]; if (validCount(entry)) result[metric] = entry; }
  return result;
}
export function addStats(previous: Stats, run: Stats): Stats {
  const result = zeroStats();
  for (const metric of metrics) result[metric] = metric === "longest" ? Math.max(previous[metric], run[metric]) : Math.min(Number.MAX_SAFE_INTEGER, previous[metric] + run[metric]);
  return result;
}
const objectives: { metric: Metric; name: string; targets: number[]; verb: string; unit: string }[] = [
  { metric: "coins", name: "Coin Collector", targets: [10, 30, 75], verb: "Collect", unit: "coins" },
  { metric: "distance", name: "Distance Runner", targets: [150, 450, 1000], verb: "Travel", unit: "m across completed runs" },
  { metric: "jumps", name: "Jump Master", targets: [5, 18, 40], verb: "Perform", unit: "jumps" },
  { metric: "slides", name: "Slide Expert", targets: [4, 12, 25], verb: "Perform", unit: "slides" },
  { metric: "runs", name: "Run Starter", targets: [2, 5, 10], verb: "Complete", unit: "runs" },
  { metric: "longest", name: "Survival Challenge", targets: [8, 18, 35], verb: "Survive", unit: "seconds in one run" },
  { metric: "dodges", name: "Obstacle Dodger", targets: [3, 10, 24], verb: "Clear", unit: "hazards" },
  { metric: "downtown", name: "World Explorer", targets: [1, 4, 8], verb: "Finish", unit: "runs in Neon Downtown" },
];
export function challenges(date: string) {
  let seed = 2166136261;
  for (const letter of date) seed = Math.imul(seed ^ letter.charCodeAt(0), 16777619);
  const pool = [...objectives];
  return ["Easy", "Medium", "Hard"].map((difficulty, index) => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const [objective] = pool.splice(seed % pool.length, 1);
    return { ...objective, id: `${date}:${objective.metric}`, difficulty, target: objective.targets[index], reward: (index + 1) * 50 };
  });
}
export function dailyFor(daily: Daily, date: string): Daily {
  return daily.date >= date ? daily : { date, stats: zeroStats(), claimed: [] };
}
export const achievementCategories = ["Gameplay", "Collection", "Exploration", "Milestones"] as const;
export const achievements = [
  { id: "first", name: "First Steps", category: "Milestones", metric: "runs", target: 1, icon: "◈", description: "Complete your first run." },
  { id: "collector", name: "Coin Collector", category: "Collection", metric: "collected", target: 100, icon: "◎", description: "Collect 100 lifetime coins." },
  { id: "treasure", name: "Treasure Hunter", category: "Collection", metric: "collected", target: 500, icon: "◎", description: "Collect 500 lifetime coins." },
  { id: "millionaire", name: "Neon Millionaire", category: "Collection", metric: "collected", target: 2000, icon: "◎", description: "Collect 2,000 lifetime coins." },
  { id: "marathon", name: "Marathon Runner", category: "Exploration", metric: "lifetimeDistance", target: 5000, icon: "◇", description: "Travel 5,000 m across completed runs." },
  { id: "endless", name: "Endless Explorer", category: "Exploration", metric: "lifetimeDistance", target: 20000, icon: "◇", description: "Travel 20,000 m across completed runs." },
  { id: "jumper", name: "Jump Master", category: "Gameplay", metric: "jumps", target: 100, icon: "↑", description: "Perform 100 successful jumps." },
  { id: "slider", name: "Slide Expert", category: "Gameplay", metric: "slides", target: 100, icon: "↓", description: "Perform 100 successful slides." },
  { id: "survivor", name: "Survivor", category: "Gameplay", metric: "longest", target: 180, icon: "◷", description: "Survive 180 seconds in one run." },
  { id: "fashion", name: "Fashion Icon", category: "Collection", metric: "skins", target: 3, icon: "✦", description: "Unlock three character skins." },
  { id: "explorer", name: "World Explorer", category: "Exploration", metric: "worlds", target: 3, icon: "◇", description: "Unlock all three environments." },
  { id: "dedicated", name: "Dedicated Runner", category: "Milestones", metric: "runs", target: 50, icon: "◈", description: "Complete 50 runs." },
] as const;

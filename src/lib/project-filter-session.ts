import type { IndustrySlug } from "@/content/industries";
import { cleanKeyword, emptyProjectFilters, projectFilterUrl, readProjectFilters, type FilterGroup, type ProjectFilters } from "./project-filters";

type HistoryPort = { href(): string; write(url: string, mode: "push" | "replace"): void };
type Timers = { set(callback: () => void, delay: number): ReturnType<typeof setTimeout>; clear(timer: ReturnType<typeof setTimeout>): void };
export type ProjectFilterSnapshot = { filters: ProjectFilters; query: string; ready: boolean; searching: boolean };

// Local UI/history state, with injectable browser ports for Back/Forward and debounce regression tests.
export function createProjectFilterSession(history: HistoryPort, technologies: string[], fixedIndustry?: IndustrySlug, timers: Timers = { set: (fn, delay) => setTimeout(fn, delay), clear: timer => clearTimeout(timer) }) {
  let state: ProjectFilterSnapshot = { filters: emptyProjectFilters(), query: "", ready: false, searching: false };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let searchCheckpoint = false;
  const listeners = new Set<(snapshot: ProjectFilterSnapshot) => void>();
  const emit = () => listeners.forEach(listener => listener(state));
  function cancel() { if (timer !== undefined) timers.clear(timer); timer = undefined; }
  function commit(filters: ProjectFilters, mode: "push" | "replace", query = cleanKeyword(filters.q)) {
    cancel();
    const href = history.href();
    const url = projectFilterUrl(href, filters, fixedIndustry);
    const current = new URL(href);
    if (`${current.pathname}${current.search}${current.hash}` !== url) history.write(url, mode);
    state = { filters, query, ready: true, searching: false }; emit();
  }
  function flushSearch() {
    const q = cleanKeyword(state.query);
    if (q !== state.filters.q) { commit({ ...emptyProjectFilters(), q }, searchCheckpoint ? "replace" : "push"); searchCheckpoint = true; }
    else { cancel(); state = { ...state, searching: false }; emit(); }
  }
  return {
    snapshot: () => state,
    subscribe(listener: (snapshot: ProjectFilterSnapshot) => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    restore() {
      cancel(); searchCheckpoint = false;
      const href = history.href();
      const filters = readProjectFilters(new URL(href).search, technologies, fixedIndustry);
      commit(filters, "replace");
    },
    focusSearch() { searchCheckpoint = false; },
    search(query: string) {
      const hadFilters = state.filters.industries.length || state.filters.technologies.length || state.filters.types.length;
      if (hadFilters) {
        // Clear dropdowns and their URL immediately; the debounced keyword replaces this single checkpoint.
        commit(emptyProjectFilters(), "push", query.slice(0, 200));
        searchCheckpoint = true;
      }
      cancel(); state = { ...state, query: query.slice(0, 200), searching: cleanKeyword(query) !== state.filters.q }; emit();
      if (state.searching) timer = timers.set(flushSearch, 300);
    },
    flushSearch,
    toggle(group: FilterGroup, value: string) {
      const selected = state.filters[group];
      const next = (selected as readonly string[]).includes(value) ? selected.filter(item => item !== value) : [...selected, value].sort();
      const filters = { ...state.filters, q: "", [group]: next } as ProjectFilters;
      // Validate every transition through the same normalization used for shared URLs.
      commit(readProjectFilters(new URL(projectFilterUrl(history.href(), filters, fixedIndustry), history.href()).search, technologies, fixedIndustry), "push");
      searchCheckpoint = false;
    },
    clearGroup(group: FilterGroup) { commit({ ...state.filters, q: "", [group]: [] }, "push"); searchCheckpoint = false; },
    clearSearch() { commit({ ...state.filters, q: "" }, "push"); searchCheckpoint = false; },
    clearAll() { commit(emptyProjectFilters(), "push"); searchCheckpoint = false; },
    shareUrl() { flushSearch(); return new URL(projectFilterUrl(history.href(), state.filters, fixedIndustry), history.href()).href; },
    dispose() { cancel(); listeners.clear(); },
  };
}
export type ProjectFilterSession = ReturnType<typeof createProjectFilterSession>;
export async function copyFilteredPortfolio(session: ProjectFilterSession, writeText?: (url: string) => Promise<void>) {
  const url = session.shareUrl();
  try { if (!writeText) throw new Error("Clipboard unavailable"); await writeText(url); return { url, copied: true, message: "Link copied. Share it to show these results." }; }
  catch { return { url, copied: false, message: "Could not copy automatically. Select and copy the link below." }; }
}

"use client";

import { useEffect, useState } from "react";
import { savedTheme, themeKey, type Theme } from "@/lib/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const system = window.matchMedia("(prefers-color-scheme: dark)");
    function sync() {
      let choice: Theme | null;
      try { choice = savedTheme(localStorage.getItem(themeKey)); }
      catch { choice = savedTheme(document.documentElement.dataset.theme ?? null); }
      const next = choice ?? (system.matches ? "dark" : "light");
      document.documentElement.dataset.theme = next;
      setTheme(next);
    }
    function storage(event: StorageEvent) {
      if (event.key === themeKey || event.key === null) sync();
    }
    sync();
    window.addEventListener("storage", storage);
    window.addEventListener("pageshow", sync);
    system.addEventListener("change", sync);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener("pageshow", sync);
      system.removeEventListener("change", sync);
    };
  }, []);

  function toggle() {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    setTheme(next);
    try { localStorage.setItem(themeKey, next); } catch { /* The selection still applies to this page. */ }
  }
  return <button type="button" className="theme-toggle" role="switch" aria-label="Dark mode" aria-checked={theme === "dark"} title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"} onClick={toggle}>
    <svg aria-hidden="true" focusable="false" width="22" height="22" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="#fafaf8" />
      <path d="M12 2a10 10 0 0 1 0 20 5 5 0 0 1 0-10 5 5 0 0 0 0-10Z" fill="#232828" />
      <circle cx="12" cy="7" r="1.5" fill="#232828" />
      <circle cx="12" cy="17" r="1.5" fill="#fafaf8" />
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" />
    </svg>
  </button>;
}

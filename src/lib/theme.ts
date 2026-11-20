export const themeKey = "portfolio-theme";
export type Theme = "light" | "dark";

export function savedTheme(value: string | null): Theme | null {
  return value === "dark" || value === "light" ? value : null;
}

// Runs in the head of the static export, before the browser paints the page.
export const themeBootstrap = `(function(){var t;try{t=localStorage.getItem(${JSON.stringify(themeKey)})}catch{}document.documentElement.dataset.theme=t==="light"||t==="dark"?t:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"})()`;

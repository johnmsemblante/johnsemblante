export function HQIcon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    rocket: <><path d="M13 4c3-2 6-2 7-1 1 1 1 4-1 7l-7 7-5-5 6-8Z"/><circle cx="15.5" cy="7.5" r="2"/><path d="m8 10-4 1-2 5 6-1m7 1-1 5-5 1 1-6M5 18l-2 3 4-2"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 3m0 4h.01"/></>,
    sound: <><path d="m11 4-6 5H2v6h3l6 5V4Zm4 4a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></>,
    muted: <><path d="m11 4-6 5H2v6h3l6 5V4Zm5 5 5 6m0-6-5 6"/></>,
    person: <><circle cx="12" cy="7" r="3" /><path d="M4 21v-2a8 8 0 0 1 16 0v2M8 21h8" /></>,
    code: <><path d="m7 7-5 5 5 5m10-10 5 5-5 5M14 4l-4 16" /></>,
    layers: <><path d="m12 3 10 6-10 6L2 9l10-6ZM2 14l10 6 10-6M2 19l10 6 10-6" transform="translate(0 -1) scale(1 .9)" /></>,
    tool: <><path d="M14 6a5 5 0 0 0-6 6L2 18a2.8 2.8 0 0 0 4 4l6-6a5 5 0 0 0 6-6l-3 3-4-4 3-3Z" transform="translate(1 -1)" /></>,
    game: <><path d="M7 6h10c3 0 5 11 4 13s-4-1-6-3H9c-2 2-5 5-6 3S4 6 7 6Z" /><path d="M6 11h6M9 8v6m7-4h.01m2 3h.01" /></>,
    book: <><path d="M5 3h13a1 1 0 0 1 1 1v17H6a3 3 0 0 1-3-3V5a2 2 0 0 1 2-2Zm-2 15a3 3 0 0 1 3-3h13M8 7h7m-7 4h5" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="3" /><path d="m3 6 9 7 9-7" /></>,
    reset: <><path d="M3 11a9 9 0 1 1 2 7M3 4v7h7" /></>,
    expand: <><path d="M3 9V3h6m6 0h6v6M3 15v6h6m6 0h6v-6" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
    close: <path d="m5 5 14 14M5 19 19 5" />,
    compass: <><circle cx="12" cy="12" r="10" /><path d="m16 8-2 6-6 2 2-6 6-2Z" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name] ?? paths.grid}</svg>;
}

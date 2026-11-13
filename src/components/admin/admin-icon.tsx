const paths = {
  documentation: ["M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1z", "M12 5v15M6 8h3M6 12h3M15 8h3M15 12h3"],
  ventures: ["M12 3v18M3 12h18", "M5 5h5v5H5zM14 14h5v5h-5z"],
  pages: ["M8 3h12v15H8z", "M4 7v14h12", "M11 7h6M11 11h6M11 15h4"],
  overview: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"],
  blog: ["M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z", "M14 2v6h6", "M8 12h8M8 16h8"],
  works: ["M3 4h18v16H3z", "M3 9h18M8 9v11"],
  jobs: ["M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2", "M3 7h18v13H3z", "M3 11c5 4 13 4 18 0M12 11v5"],
  logout: ["M9 4H4v16h5", "M10 12h11M17 8l4 4-4 4"],
  menu: ["M4 6h16M4 12h16M4 18h16"],
  close: ["M6 6l12 12M18 6 6 18"],
  arrow: ["M5 12h14M14 7l5 5-5 5"],
} as const;

export function AdminIcon({ name }: { name: keyof typeof paths }) {
  return <svg className="admin-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{paths[name].map(path => <path key={path} d={path} />)}</svg>;
}

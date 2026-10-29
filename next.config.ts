import type { NextConfig } from "next";
const config: NextConfig = {
  // Development should render ordinary 404s for unpublished article URLs.
  // The production build still exports only the explicitly published routes.
  output: process.env.NODE_ENV === "production" ? "export" : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
};
export default config;

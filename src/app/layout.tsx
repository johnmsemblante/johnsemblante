import type { Metadata } from "next";
import { site } from "@/content/site";
import "./globals.css";
export const metadata: Metadata = { metadataBase: new URL(site.url), title: { default: "John Semblante — Web Development & Ventures", template: "%s | John Semblante" }, description: site.description,
  // Keep the content-incomplete MVP out of search until launch approval.
  robots: { index: false, follow: false } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

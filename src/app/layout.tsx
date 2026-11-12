import { Montserrat } from "next/font/google";
import type { Metadata } from "next";
import { site } from "@/content/site";
import { homePageTitle } from "@/content/profile";
import "./globals.css";
import { SiteRefreshListener } from "@/components/site-refresh-listener";
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", variable: "--font-montserrat", style: ["normal", "italic"] });
export const metadata: Metadata = { metadataBase: new URL(site.url), title: { default: homePageTitle, template: "%s | John Semblante" }, description: site.description,
  // Public launch approved; metadata uses the active hosting domain.
  robots: { index: true, follow: true }, verification: { google: process.env.GOOGLE_SITE_VERIFICATION } };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={montserrat.variable}><body><SiteRefreshListener />{children}</body></html>;
}

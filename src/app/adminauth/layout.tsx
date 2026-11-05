import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: { absolute: "Administration | John Semblante" }, robots: { index: false, follow: false }, referrer: "same-origin" };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell"><a className="skip-link" href="#admin-main">Skip to content</a><header className="admin-brand"><Link href="/" aria-label="John Semblante home">js.</Link><span>John Semblante / Administration</span></header><main id="admin-main" tabIndex={-1}>{children}</main></div>;
}

import type { Metadata } from "next";
import { AdminGate } from "@/components/admin/admin-gate";
import { AdminFeedback } from "@/components/admin/admin-feedback";
import "./dashboard.css";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = { title: { absolute: "Administration | John Semblante" }, robots: { index: false, follow: false }, referrer: "same-origin" };
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="admin-shell"><a className="skip-link" href="#admin-main">Skip to content</a><div className="admin-theme-control"><ThemeToggle /></div><AdminFeedback /><AdminGate>{children}</AdminGate></div>;
}

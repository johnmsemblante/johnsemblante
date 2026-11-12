import { statSync } from "node:fs";
import { join } from "node:path";
import type { ReactNode } from "react";
import { donationConfig } from "@/config/donations";
import { publishedTools } from "@/config/tool-ventures";
import { configuredDonationMethods } from "@/lib/donation-methods";
import { ToolDonationWidget } from "@/components/tools/donation-widget";
import "./donations.css";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const methods = configuredDonationMethods(donationConfig, path => {
    try { return statSync(join(process.cwd(), "public", path.slice(1))).isFile(); }
    catch { return false; }
  });
  const eligiblePaths = publishedTools.filter(tool => tool.donationsEnabled).map(tool => tool.route);

  return <>{children}{methods.length > 0 && eligiblePaths.length > 0 &&
    <ToolDonationWidget methods={methods} eligiblePaths={eligiblePaths} />
  }</>;
}

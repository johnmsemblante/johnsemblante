import { statSync } from "node:fs";
import { join } from "node:path";
import { donationConfig } from "@/config/donations";
import { configuredDonationMethods } from "@/lib/donation-methods";
import { DonationWidget, ToolDonationWidget } from "./donation-widget";
import "../../app/(portfolio)/tools/donations.css";

export function DonationSupport({ toolsOnly = false }: { toolsOnly?: boolean }) {
  const methods = configuredDonationMethods(donationConfig, path => {
    try { return statSync(join(process.cwd(), "public", path.slice(1))).isFile(); }
    catch { return false; }
  });
  if (!methods.length) return null;
  return toolsOnly ? <ToolDonationWidget methods={methods} /> : <DonationWidget methods={methods} />;
}

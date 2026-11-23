import type { ReactNode } from "react";
import { DonationSupport } from "@/components/tools/donation-support";

export default function ToolsLayout({ children }: { children: ReactNode }) {
  return <>{children}<DonationSupport toolsOnly /></>;
}

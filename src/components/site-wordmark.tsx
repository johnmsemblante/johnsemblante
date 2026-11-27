import Link from "next/link";
import type { MouseEventHandler } from "react";

// One logo definition for the Classic shell and the immersive workspace.
export function SiteWordmark({ className = "", onClick }: { className?: string; onClick?: MouseEventHandler<HTMLAnchorElement> }) {
  return <Link href="/" className={`wordmark ${className}`.trim()} title="John Semblante home" onClick={onClick}>js<span>.</span></Link>;
}

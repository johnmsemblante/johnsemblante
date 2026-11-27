import Link from "next/link";

// One logo definition for the Classic shell and the immersive workspace.
export function SiteWordmark({ className = "" }: { className?: string }) {
  return <Link href="/" className={`wordmark ${className}`.trim()} title="John Semblante home">js<span>.</span></Link>;
}

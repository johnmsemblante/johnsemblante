import { PageIntro } from "@/components/ui";
import { ToolVentureCards } from "@/components/tool-venture-cards";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("Free online tools", "Useful browser-based tools by John Semblante. Create custom QR codes locally with no account, uploads or watermarks.", "/tools/");
export default function ToolsPage() {
  return <><PageIntro eyebrow="Independent ventures / Free utilities" title="Useful little tools."><p>Simple tools for everyday tasks, built by John Semblante. Start with the free QR code generator: turn links, Wi-Fi details and messages into downloadable codes, with all processing in your browser.</p></PageIntro><section className="section" aria-label="Available tools"><ToolVentureCards /></section></>;
}

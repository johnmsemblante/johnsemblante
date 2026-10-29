import { SiteShell } from "@/components/site-shell";
import { Button, PageIntro } from "@/components/ui";

export default function NotFound() {
  return <SiteShell><PageIntro eyebrow="404 / Page not found" title="A small detour."><p>That page isn’t available.</p><div className="actions"><Button href="/">Back home</Button></div></PageIntro></SiteShell>;
}

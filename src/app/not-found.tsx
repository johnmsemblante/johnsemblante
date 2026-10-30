import { SiteShell } from "@/components/site-shell";
import { Button, PageIntro } from "@/components/ui";

export default function NotFound() {
  return <SiteShell><PageIntro eyebrow="404 / Page not found" title="Let’s get you back on track."><p>This page may have moved or the link may be incorrect. Explore my work or return to the homepage.</p><div className="actions"><Button href="/work/">Explore my work</Button><Button href="/" secondary>Back home</Button></div></PageIntro></SiteShell>;
}

import { PageContent } from "@/components/page-content";
import { buildPage, withPageMetadata } from "@/lib/build-pages";

import { PageText, PageLink } from "@/components/page-content";
import { site } from "@/content/site";
import { profile, socialAccounts } from "@/content/profile";
import { PageIntro } from "@/components/ui";
import { InquiryForm } from "@/components/inquiry-form";
import { pageMetadata } from "@/lib/metadata";
const contactTitle = `Contact ${profile.fullName} | Cebu Web Developer`;
export const metadata = withPageMetadata("contact", { ...pageMetadata(contactTitle, `Contact Cebu web developer ${profile.fullName} about WordPress, WooCommerce, website fixes, or a remote role. Share your project details here.`, "/contact/"), title: { absolute: contactTitle } });
export default function Contact() {
  return <PageContent id="contact" initial={buildPage("contact")}><PageIntro eyebrow={<PageText scope="contact_1" fallback={"Contact / Let’s connect"} />} title={<PageText scope="contact_2" fallback={"Let’s talk about your website."} />}><p><PageText scope="contact_3" fallback={"Have a WordPress project, a WooCommerce store that needs changes, or a website problem you can’t pin down? Tell me what you’re working on. I’m based in Mandaue City, Cebu, and also welcome remote development roles. A short description and a link are enough to start."} /></p></PageIntro><section className="section contact-layout"><InquiryForm /><aside className="contact-sidebar"><p className="eyebrow"><PageText scope="contact_4" fallback={"Find me here"} /></p><h2><PageText scope="contact_5" fallback={"Prefer email? Reach me here."} /></h2><dl><div><dt><PageText scope="contact_6" fallback={"Email"} /></dt><dd><PageLink scope="contact_7" href={`mailto:${site.email}`}><PageText scope="contact_8" fallback={site.email} /></PageLink></dd></div><div><dt><PageText scope="contact_9" fallback={"Phone"} /></dt><dd><PageLink scope="contact_10" href={`tel:${site.phone}`}><PageText scope="contact_11" fallback={site.phoneDisplay} /></PageLink></dd></div><div><dt><PageText scope="contact_12" fallback={"Based in"} /></dt><dd><PageText scope="contact_13" fallback={profile.location} /></dd></div></dl><h3><PageText scope="contact_14" fallback={"Elsewhere online."} /></h3><ul className="social-links">{socialAccounts.map(account => <li key={account.name}><PageLink scope="contact_15" href={account.url} target="_blank" rel="noopener noreferrer"><span><PageText scope="contact_16" fallback={account.name} /><small><PageText scope="contact_17" fallback={account.handle} /></small></span><span aria-hidden="true">↗</span></PageLink></li>)}</ul></aside></section></PageContent>;
}

import { site } from "@/content/site";
import { profile, socialAccounts } from "@/content/profile";
import { PageIntro } from "@/components/ui";
import { InquiryForm } from "@/components/inquiry-form";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("Contact", "Discuss WordPress development, WooCommerce, website fixes, or a career opportunity with John Semblante. Share your goals and project requirements.", "/contact/");
export default function Contact() {
  return <><PageIntro eyebrow="Contact / Let’s connect" title="Let’s talk about your website."><p>Need a custom build, help with your store, or a fix for an existing site? Share what you need and where you want to take it. Career opportunities and collaborations are welcome too.</p></PageIntro><section className="section contact-layout"><InquiryForm /><aside className="contact-sidebar"><p className="eyebrow">Find me here</p><h2>A direct line.</h2><dl><div><dt>Email</dt><dd><a href={`mailto:${site.email}`}>{site.email}</a></dd></div><div><dt>Phone</dt><dd><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a></dd></div><div><dt>Based in</dt><dd>{profile.location}</dd></div></dl><h3>Elsewhere online.</h3><ul className="social-links">{socialAccounts.map(account => <li key={account.name}><a href={account.url} target="_blank" rel="noopener noreferrer"><span>{account.name}<small>{account.handle}</small></span><span aria-hidden="true">↗</span></a></li>)}</ul></aside></section></>;
}

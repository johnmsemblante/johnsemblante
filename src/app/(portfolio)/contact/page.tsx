import { site } from "@/content/site";
import { profile, socialAccounts } from "@/content/profile";
import { PageIntro } from "@/components/ui";
import { InquiryForm } from "@/components/inquiry-form";
import { pageMetadata } from "@/lib/metadata";
const contactTitle = `Contact ${profile.fullName} | Cebu Web Developer`;
export const metadata = { ...pageMetadata(contactTitle, `Contact Cebu web developer ${profile.fullName} about WordPress, WooCommerce, website fixes, or a remote role. Share your project details here.`, "/contact/"), title: { absolute: contactTitle } };
export default function Contact() {
  return <><PageIntro eyebrow="Contact / Let’s connect" title="Let’s talk about your website."><p>I’m based in Mandaue City, Cebu, and welcome website projects and remote development roles. For project work, send your website or design link and explain what needs building or fixing. For a role, tell me about the team, responsibilities, and working hours.</p></PageIntro><section className="section contact-layout"><InquiryForm /><aside className="contact-sidebar"><p className="eyebrow">Find me here</p><h2>Contact details.</h2><dl><div><dt>Email</dt><dd><a href={`mailto:${site.email}`}>{site.email}</a></dd></div><div><dt>Phone</dt><dd><a href={`tel:${site.phone}`}>{site.phoneDisplay}</a></dd></div><div><dt>Based in</dt><dd>{profile.location}</dd></div></dl><h3>Elsewhere online.</h3><ul className="social-links">{socialAccounts.map(account => <li key={account.name}><a href={account.url} target="_blank" rel="noopener noreferrer"><span>{account.name}<small>{account.handle}</small></span><span aria-hidden="true">↗</span></a></li>)}</ul></aside></section></>;
}

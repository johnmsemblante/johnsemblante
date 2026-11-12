import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { QrGenerator } from "@/components/qr-generator";
import { pageMetadata } from "@/lib/metadata";
import { jsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import "./qr-code-generator.css";

const title = "Free QR Code Generator: No Sign Up | John Semblante";
const description = "Create custom QR codes for websites, Wi-Fi, text and more. Free to use, with no sign-up or watermarks. Download instantly as PNG or SVG.";
export const metadata = { ...pageMetadata(title, description, "/tools/qr-code-generator/"), title: { absolute: title } };
const questions = [
  ["Do free QR codes expire?", "These static QR codes have no built-in expiry. A website, email account or phone number encoded in one can still change or become unavailable. Keep a copy of your downloaded file."],
  ["What is the difference between static and dynamic QR codes?", "A static code contains your actual content. You need a new QR image to change it. Dynamic codes usually point through a redirect service that can change the destination and may track scans or require a subscription. This tool creates static codes only."],
  ["Can I use my QR code commercially?", "Yes. Download and use it on menus, packaging, business cards or posters without a watermark or subscription. Make sure you have permission to share the content you encode."],
  ["Is my Wi-Fi password private?", "Generation happens locally, without uploading the password. However, the password is encoded in the QR itself and can be read by anyone who has the image. Only share it with people you trust."],
  ["Which download format should I choose?", "PNG works well for everyday digital use; choose 2,048 pixels for larger output. SVG stays sharp at any size and suits print layouts. Test the final printed size and keep its blank border."],
  ["Why does my QR code not scan?", "Try square dots, a dark foreground and a light background. Keep the border, shorten long content and increase the printed size. Different scanners handle Wi-Fi, email and phone actions differently. Always test with the devices your audience uses."],
];
export default function QrCodePage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "WebApplication", name: "Free QR Code Generator by John Semblante", url: `${site.url}/tools/qr-code-generator/`, description, applicationCategory: "UtilitiesApplication", operatingSystem: "Any modern web browser", browserRequirements: "Requires JavaScript", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, creator: { "@type": "Person", name: "John Semblante", url: `${site.url}/about/` } }) }} />
    <PageIntro eyebrow="Free tools / Built for everyday use" title="Free QR Code Generator"><p>Create custom QR codes for websites, Wi-Fi, text, emails, and more. Completely free, with no sign-up, watermarks, or unnecessary uploads.</p></PageIntro>
    <section className="section" aria-label="QR code generator"><QrGenerator /><noscript><p>Enable JavaScript to generate QR codes locally in your browser.</p></noscript></section>
    <section className="section qr-guide"><p className="eyebrow">From an idea to a scan</p><h2>How to create a QR code.</h2><ol><li>Choose a content type and enter the details you want to share.</li><li>Choose readable colors and a download size. Your preview updates as you type.</li><li>Download PNG or SVG, then scan the file with your phone before using it.</li></ol><h3>Small codes, useful connections.</h3><p>Link a printed menu to your website, give guests access to Wi-Fi, share a short note, or make it easier for customers to email or call you. Website links need an internet connection to open; text is stored directly in the code.</p><h3>Your content stays with you.</h3><p>This free QR code maker processes your entries in your browser. It does not send QR content to a server, store entries in browser storage, or track scans. Your downloaded files remain wherever you save them. A QR code is readable data, so avoid encoding secrets you do not want recipients to see.</p></section>
    <section className="section qr-guide"><h2>Frequently asked questions.</h2>{questions.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}<p><Link className="qr-attribution" href="/about/">Built by John Semblante</Link> · <Link href="/tools/">Explore free tools</Link></p></section>
  </>;
}

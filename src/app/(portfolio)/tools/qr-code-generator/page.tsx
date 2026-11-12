import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { QrGenerator } from "@/components/qr-generator";
import { pageMetadata } from "@/lib/metadata";
import { jsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import "./qr-code-generator.css";

const title = "Free QR Code Generator (No Sign Up) | John Semblante";
const description = "Create free QR codes for websites, Wi-Fi, email, phone numbers and text. No sign-up, no watermarks or expiry. Customize and download PNG or SVG.";
export const metadata = { ...pageMetadata(title, description, "/tools/qr-code-generator/"), title: { absolute: title } };
const questions = [
  ["Is this QR code generator really free?", "Yes. All five content types, color settings and PNG/SVG downloads are free, with no watermark or subscription. You can use the codes on menus, packaging, business cards and posters. Make sure you have permission to share the content you encode."],
  ["Do I need to create an account?", "No account or sign-up is required. Enter your content, choose your settings and download your QR code directly."],
  ["Do QR codes generated here expire?", "The static QR image has no imposed expiration date. It continues to encode the same content, while a linked website must remain accessible and email accounts, phone numbers or Wi-Fi credentials must remain valid."],
  ["Can I download my QR code as PNG or SVG?", "Yes. PNG works well for everyday digital use, with sizes up to 2,048 pixels. SVG stays sharp at any size and suits print layouts. Test the final printed size and keep its blank border."],
  ["Can I customize the QR code’s colors?", "Yes. Choose foreground and background colors, plus square or rounded dots. Use a dark foreground on a light background with strong contrast, and scan the downloaded code before sharing it."],
  ["Are my QR code details stored on a server?", "This tool generates QR codes locally in your browser. It does not upload your entries or generated images, save them in browser storage, or track scans. Downloaded files remain wherever you save them. Anyone with the QR image can read its contents, including an encoded Wi-Fi password."],
  ["Why does my QR code not scan?", "Try square dots, a dark foreground and a light background. Keep the border, shorten long content and increase the printed size. Different scanners handle Wi-Fi, email and phone actions differently. Always test with the devices your audience uses."],
];
export default function QrCodePage() {
  return <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "WebApplication", name: "Free QR Code Generator by John Semblante", url: `${site.url}/tools/qr-code-generator/`, description, applicationCategory: "UtilitiesApplication", operatingSystem: "Any modern web browser", browserRequirements: "Requires JavaScript", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, creator: { "@type": "Person", name: "John Semblante", url: `${site.url}/about/` } }) }} />
    <PageIntro eyebrow="Free tools / Built for everyday use" title="Free QR Code Generator"><p>Create free QR codes for websites, Wi-Fi, email, phone numbers and text. Customize your colors and download PNG or SVG, with no sign-up or watermarks.</p></PageIntro>
    <section className="section" aria-label="QR code generator"><QrGenerator /><noscript><p>Enable JavaScript to generate QR codes locally in your browser.</p></noscript></section>
    <section className="section qr-guide" aria-labelledby="qr-how-to">
      <h2 id="qr-how-to">How to Generate a QR Code for Free</h2>
      <ol>
        <li>Choose a content type and enter the details you want to share.</li>
        <li>Choose readable colors, a dot style and a download size. Your preview updates as you type.</li>
        <li>Download PNG or SVG, then scan the file with your phone before using it.</li>
      </ol>
    </section>
    <section className="section qr-guide" aria-labelledby="qr-uses">
      <h2 id="qr-uses">What Can You Use a QR Code For?</h2>
      <p>Link a printed menu to your website, share Wi-Fi access with guests, or add an email or phone shortcut to a business card. Plain text codes can hold a short note or instructions. Website links work well on posters, packaging and other marketing materials, and need an internet connection to open. Text is stored directly in the code.</p>
    </section>
    <section className="section qr-guide" aria-labelledby="qr-expiry">
      <h2 id="qr-expiry">Do Free QR Codes Expire?</h2>
      <p>This tool creates static QR codes with no imposed expiration date. The content is encoded directly in the image. A linked website must remain accessible, and other details such as a phone number or Wi-Fi password must remain valid.</p>
      <p>Changing a static code’s destination requires generating and sharing a new QR image. Dynamic QR codes usually point through a redirect service that can change the destination and may track scans or require a subscription.</p>
    </section>
    <section className="section qr-guide" aria-labelledby="qr-wifi">
      <h2 id="qr-wifi">How to Create a Wi-Fi QR Code</h2>
      <p>Choose Wi-Fi, enter the network name exactly as it appears on your router, and select WPA/WPA2, WEP or Open network. Enter the password for a secured network and check Hidden network if needed. Download the code and scan it with a compatible phone to test joining the network.</p>
      <p>Network credentials are processed locally in your browser. The password is readable from the QR image, so share it only with people you trust.</p>
    </section>
    <section className="section qr-guide" aria-labelledby="qr-faq">
      <h2 id="qr-faq">Frequently Asked Questions</h2>
      {questions.map(([question, answer]) => <details key={question}>
        <summary>{question}</summary>
        <p>{answer}</p>
      </details>)}
      <p><Link className="qr-attribution" href="/about/">Built by John Semblante</Link> · <Link href="/tools/">Explore free tools</Link></p>
    </section>
  </>;
}

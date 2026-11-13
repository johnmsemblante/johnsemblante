import Link from "next/link";
import { PageIntro } from "@/components/ui";
import { PdfEditor } from "@/components/pdf-editor";
import { pageMetadata } from "@/lib/metadata";
import { jsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import "./pdf-editor.css";

const title = "Free PDF Editor Online | John Semblante";
const description = "Add text and drawn signatures to PDF files, rotate or remove pages, and download for free. No account, watermark or server upload required.";
export const metadata = { ...pageMetadata(title, description, "/tools/pdf-editor/"), title: { absolute: title } };
export default function PdfEditorPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd({ "@context": "https://schema.org", "@type": "WebApplication", name: "Free PDF Editor by John Semblante", url: `${site.url}/tools/pdf-editor/`, description, applicationCategory: "UtilitiesApplication", operatingSystem: "Any modern web browser", browserRequirements: "JavaScript, Canvas and module Web Workers", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" }, creator: { "@type": "Person", name: "John Semblante", url: `${site.url}/about/` } }) }} />
    <PageIntro eyebrow="Free tools / by John Semblante" title="Free PDF Editor Online"><p>Edit PDF files directly in your browser for free. Add text, sign documents, rotate or remove pages, and download your updated PDF. No account, watermark, or server upload required.</p></PageIntro>
    <section className="section" aria-label="PDF editor"><PdfEditor /><noscript>Enable JavaScript to edit PDF files locally in your browser.</noscript></section>
    <section className="section pdf-guide"><h2>How to edit a PDF for free</h2><ol><li>Choose or drop one unencrypted PDF, up to 20 MB and 100 pages.</li><li>Select Add text, enter your words, choose a size and color, then tap the page. Select an added element to drag it or use the position buttons.</li><li>Open Draw a signature, draw with a mouse or touch, choose Use signature, and tap the page. Select it to resize or remove it.</li><li>Use page navigation to rotate or delete pages. Undo and redo cover page and element edits.</li><li>Choose Download Edited PDF and review the downloaded file before sharing. Keep the original separately.</li></ol></section>
    <section className="section pdf-guide"><h2>Your documents stay in your browser</h2><p>PDFs and signatures remain in temporary tab memory. They are never sent to Firebase, Cloudinary, analytics or another processing server, and are not saved in browser storage. Clear the document, replace it, or close the tab to discard edits. Refreshing loses your work. Downloading the website code and PDF rendering assets still requires a connection.</p><h2>What this editor supports</h2><p>Add new text and drawn signatures, move or remove your additions, rotate pages and delete pages. Existing text and images are preserved where supported; this tool does not rewrite original PDF text, redact confidential content, fill interactive forms, merge files or provide certificate-backed digital signatures.</p><p>Added text and signatures are embedded as transparent images to match their preview. Added text is not selectable or searchable. Text is one line at a time, up to 200 characters; add separate elements for more lines. Some fonts, emoji and complex scripts depend on your device. Keep elements inside the page boundary and inspect the export.</p></section>
    <section className="section pdf-guide"><h2>Frequently asked questions</h2>
      <details><summary>Is the PDF editor completely free?</summary><p>Yes. There is no account, paid tier, watermark or required donation.</p></details>
      <details><summary>Can I edit password-protected PDFs?</summary><p>No. Encrypted PDFs and PDFs with editing restrictions are rejected. Ask the document owner for an unrestricted, unencrypted copy.</p></details>
      <details><summary>Will it work on my phone?</summary><p>Use a current browser with JavaScript and Web Workers. Touch placement, drawing and position buttons are supported. Large files can exceed device memory; try a smaller PDF if loading or export fails.</p></details>
      <details><summary>Is my drawn signature digitally verified?</summary><p>No. It is an image of a basic electronic signature, without a certificate or cryptographic verification. Editing a previously digitally signed PDF can invalidate its existing signature.</p></details>
      <details><summary>Why does my document look different?</summary><p>Unusual fonts, interactive forms, layers and complex PDF features can render or save differently. The preview is a static page view and does not show interactive form widgets. Keep the original and review all pages after downloading. This tool does not sanitize PDF scripts, attachments or links.</p></details>
      <p>Built <Link href="/about/">by John Semblante</Link> · <Link href="/tools/">Explore free tools</Link> · <Link href="/tools/image-compressor/">Compress an image</Link></p>
    </section>
  </>;
}

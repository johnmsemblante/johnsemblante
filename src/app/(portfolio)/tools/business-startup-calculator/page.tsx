import Link from "next/link";
import { NegosyoCalculator } from "@/components/negosyo/calculator";
import { pageMetadata } from "@/lib/metadata";
import { jsonLd } from "@/lib/seo";
import { site } from "@/content/site";
import "./negosyo.css";

const route = "/tools/business-startup-calculator/";
const title = "Free PH Startup Cost & Break-Even Calculator | John Semblante";
const description = "Plan your business in the Philippines with a free startup cost and break-even calculator. Estimate capital, expenses, selling prices, profit and sales targets.";
export const metadata = { ...pageMetadata(title,description,route, { url: "/images/work-previews/business-startup-calculator.webp", alt: title }), title:{absolute:title} };
export default function NegosyoPage() {
  return <div className="negosyo">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:jsonLd({"@context":"https://schema.org","@type":"WebApplication",name:"Negosyo Startup Calculator PH",url:site.url+route,description,applicationCategory:"BusinessApplication",operatingSystem:"Any modern web browser",offers:{"@type":"Offer",price:"0",priceCurrency:"PHP"}})}}/>
    <header className="ng-header"><Link href="/tools/">Free online tools</Link><h1>Negosyo Startup Calculator PH</h1><p>Plan your business, calculate your capital, and estimate when you could break even.</p></header>
    <NegosyoCalculator/>
    <section className="ng-guide"><h2>How to read your business plan</h2>
      <details><summary>How much money do I need to open?</summary><p>Add equipment, opening stock, pre-opening purchases and refundable deposits. Then add a cash reserve for the largest projected shortfall in your chosen reserve period and a contingency for unexpected startup costs. Compare the result with owner capital and any loan proceeds.</p></details>
      <details><summary>How do I estimate monthly operating costs?</summary><p>Collect actual quotes for rent, wages, utilities and other regular bills. Convert annual and weekly bills to monthly equivalents. For costs that rise with sales, either enter costs per offering or use one shared variable budget. The calculator counts one method at a time.</p></details>
      <details><summary>What does operating break-even mean?</summary><p>It is the sales level where contribution covers fixed expenses. For example, if a hypothetical service sells for ₱500 and uses ₱200 in supplies, it contributes ₱300. At ₱6,000 in monthly fixed costs, 20 services cover those bills. For several offerings, the calculator weights the contribution margin by expected sales revenue.</p><a href="https://www.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs/break-even-point">Break-even formula reference · U.S. Small Business Administration</a></details>
      <details><summary>When would I recover my investment?</summary><p>Operating break-even covers a month's bills. Payback takes enough cumulative cash receipts after payments to recover your initial owner outlay. Credit sales, deposits and loan principal can make the cash result different from operating profit.</p></details>
      <details><summary>Which budgeting mistakes should I watch for?</summary><p>Check paid owner time, maintenance, packaging, collections and deposits. Opening inventory is a startup cash purchase. Budget separately for replenishment as you sell. Avoid counting the same ingredients in both a monthly budget and a product cost. Confirm permits and charges with the relevant Philippine authorities and your local government.</p></details>
      <details><summary>Where is my plan saved?</summary><p>Your browser stores your plans on this device. Export JSON to back them up, or choose Print / Save as PDF for a readable feasibility report. No registration is required.</p></details>
    </section>
  </div>;
}

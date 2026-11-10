# Public content review: 10 November 2026

The revision focuses on helping a potential client understand John's services, relevant experience, and how to begin a conversation. It keeps the Cebu Web Developer homepage title/H1, the WordPress/Full Stack Developer role, existing URLs, and documented career and project facts.

## Changes

- Homepage and profile: more direct explanations of WordPress work, WooCommerce customization, and troubleshooting. Added practical questions about existing sites, design readiness, remote working hours, and information needed to discuss cost and timing.
- Services and process: describe concrete inputs, tasks, review and handover instead of general promotional language. No promised results, availability, rates or delivery dates were added.
- Work and Contact: explain how to use project examples and what to send. Historical project screenshots and confidentiality limits remain identified.
- Blog: consistent introductory copy for static and live listings. Homepage previews now include publicly released managed articles rather than suggesting no articles are published.
- Ventures: clearer trip inquiry information, a shorter travel meta description, a simpler photography story, and corrected coffee-menu wording. Package names now use colons; destinations, rates, prices and contact details remain unchanged.
- Industry pages: shorter descriptions for empty collections while clearly stating that examples are not yet published. No fictional projects were promoted to client work.
- Removed em dashes from source-controlled public prose, image descriptions, gallery captions and inquiry messages. Private admin labels and historical documentation are outside this punctuation pass.

## Saved content and factual review

Managed articles and Works records are stored in Firestore, separately from the source copy. Do not edit ignored build snapshots as a content fix: the next build replaces them. With the owner's approval, the first article received four light paragraph edits, a clearer excerpt and shorter SEO metadata. Its experience timeline now uses "since 2013" instead of almost/nearly ten years. The save used an update-time precondition and incremented its revision from 2 to 3, preserving its slug, visible title, publication date, images, links, categories and tags. The owner subsequently asked to prioritize deploying the main site changes; no further article revisions are included. Its personal anecdotes, workshop attendance and project examples were preserved, not expanded or independently verified.

Existing references to AI development tools in John's supplied skills and experience are factual workflow descriptions, not evidence of how the site copy was authored. They have not been removed to imply the tools are unused. Em dashes are ordinary punctuation; removing them is a style preference and does not establish human authorship.

## SEO approach

Use natural service and location terms, descriptive page titles, real examples and clear next steps. Keep canonical URLs, sitemap coverage and readable initial HTML. Google evaluates helpfulness and reliability, not a promised detector score. No claim is made that this revision is undetectable, guarantees indexing, or guarantees rankings.

References: [Google's guidance on AI-assisted content](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content) and [helpful, reliable content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

Validation completed before release: TypeScript and 83 tests across the SEO, forms, ventures, Work and blog suites passed. The production export and SEO audit cover 35 public pages. A DOM check found no em dashes in rendered text or metadata and confirmed the managed article link and four native FAQ controls on the homepage. The saved article edit was read back and checked against the original to confirm unchanged fields were preserved. No visual browser review was performed. The release workflow rebuilds from the current public records and verifies the live site after Hosting deployment.

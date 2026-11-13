// Owner-facing operational guides. Keep this safe for a publicly downloadable static bundle.
export type DocumentationSection = { heading: string; paragraphs?: string[]; steps?: string[] };
export type DocumentationGuide = {
  id: string; title: string; category: string; summary: string; updated: string;
  tags: string[]; sections: DocumentationSection[];
  links?: { label: string; href: string }[];
  sources: string[];
};
const reviewed = "2026-11-13";
export const documentationGuides: DocumentationGuide[] = [
  {
    id: "site-overview", title: "How the website fits together", category: "Getting started", updated: reviewed,
    summary: "Understand the public portfolio, admin workspace, saved content and static publishing.",
    tags: ["architecture", "Next.js", "Firebase", "Firestore", "hosting", "dashboard"], sources: ["docs/admin-setup.md", "docs/automatic-publishing.md"],
    sections: [
      { heading: "The two parts", paragraphs: ["The public website includes Home, About, Work, Ventures, Blog, Contact and Free Tools. This dashboard manages page content, articles, portfolio projects, business ventures and a private job shortlist.", "The website is built with Next.js and exported as static files to Firebase Hosting. Firebase Authentication checks your Google sign-in; Firestore rules control access to private records and writing content. Some public sections also read published content in the browser."] },
      { heading: "What a save changes", paragraphs: ["An editor saves content to Firestore. Public readers can show published updates before the next deployment. Clean URLs, initial page HTML, social previews and sitemap entries are regenerated together by the publishing workflow. A successful save and a successful deployment are separate events.", "Free tools, shared navigation, integrations, layouts and this documentation are maintained in source code. They are not editable content records."] },
    ], links: [{ label: "Dashboard overview", href: "/adminauth/" }],
  },
  {
    id: "admin-access", title: "Signing in, access and signing out", category: "Getting started", updated: reviewed,
    summary: "Use the approved Google account and understand Access not granted or session errors.",
    tags: ["login", "Google", "authentication", "permissions", "logout", "security"], sources: ["docs/admin-setup.md"],
    sections: [
      { heading: "Open the workspace", steps: ["Open /adminauth/ and sign in with your approved Google account.", "Choose a menu item. On mobile, open the navigation with the menu button.", "Use Logout when finished, especially on a shared device. Sign-in uses a browser session, not a permanent offline admin database."] },
      { heading: "If access is denied", paragraphs: ["Google sign-in alone does not grant administrator access. An authorized project operator must approve that exact Firebase account ID with an enabled admin membership. A different Google account is not automatically approved.", "If you see Access not granted, check which account is signed in. Ask the site operator to verify membership if needed. If a save reports expired authorization, sign in again and retry; never weaken access rules to bypass an error.", "The dashboard is excluded from indexing. Its static interface files are downloadable, so private drafts and credentials must never be embedded in those files. Private records are fetched only through authorized database access."] },
      { heading: "If Google sign-in cannot start", paragraphs: ["An invalid deployed Firebase configuration message means the operator must check the build settings and redeploy. GitHub Actions variables have separate Name and Value fields: Value must contain just the existing value, without NAME=, quotes or surrounding whitespace. Pasting a whole environment assignment makes the API key and related endpoints invalid.", "The publishing workflow now validates formats and checks Firebase’s public sign-in configuration before a release. Correcting a build variable needs a successful manual or push-triggered build; an unchanged scheduled check may skip the rebuild. This setup error is separate from blog/venture content or admin membership. Never share credentials or change access rules to work around it."] },
    ],
  },
  {
    id: "pages-editor", title: "Edit homepage and landing-page content", category: "Content management", updated: reviewed,
    summary: "Change page copy, images, links and metadata with Pages, and restore code defaults.",
    tags: ["Pages", "Home", "About", "Contact", "gallery", "reset", "SEO"], sources: ["docs/pages-admin.md"],
    sections: [
      { heading: "Make a page change", steps: ["Open Pages and select Home, About, Work, Blog, Ventures or Contact.", "Use the editor search to find a field by section or original text. Edit its text, image or link. For an image, supply the required description.", "Optionally add gallery images or edit the page meta title and description. Blank metadata fields keep their existing defaults.", "Choose Save page. Pages has no draft status: saving publishes the overrides.", "Review the public page, then confirm the automated publishing build succeeds for updated initial HTML and search previews."] },
      { heading: "Defaults and boundaries", paragraphs: ["Reset to code default removes that field’s saved override. Other saved fields remain. Closing unsaved edits prompts before discarding; active uploads block closing or saving.", "Use Blog for articles, Works for project records and Ventures for individual venture sites. Shared navigation/footer, form behavior and free tools remain code-managed. If another tab changed the same record, a conflict prevents overwriting its newer revision; keep your text before reloading."] },
    ], links: [{ label: "Open Pages", href: "/adminauth/pages/" }],
  },
  {
    id: "blog-publishing", title: "Write, preview, publish and schedule a blog post", category: "Content management", updated: reviewed,
    summary: "Manage article drafts, formatted content, publication dates and public links.",
    tags: ["Blog", "articles", "draft", "schedule", "Manila", "UTC+8", "categories", "tags", "images"], sources: ["docs/admin-setup.md", "src/components/admin/admin-blog.tsx"],
    sections: [
      { heading: "Publish an article", steps: ["Open Blog and create a post or select an existing article.", "Complete the title, URL slug, excerpt and article body. Add relevant categories/tags and image descriptions. Use the editor’s formatting controls rather than pasting executable HTML.", "Save as Draft while preparing. Preview and check headings, links, images and factual claims.", "Choose Published and the intended publication date/time. A future publication time is scheduled; dashboard time fields use Asia/Manila (UTC+8). Save the post.", "A published article can be read using the Blog query link before its clean /blog/slug/ route is deployed. After the publishing workflow completes, use the clean URL for sharing and search previews."] },
      { heading: "Scheduling and unpublishing", paragraphs: ["Scheduled content is picked up by the first successful automated check after release; GitHub scheduling and build delays mean it is not an exact-time guarantee. Drafts remain private database records.", "Unpublishing or deleting affects the live content readers, but previously exported HTML is replaced or removed only after deployment. Wait for a successful build before treating an old clean URL as removed. Keep published slugs stable; renames need separate redirect handling."] },
    ], links: [{ label: "Open Blog", href: "/adminauth/blog/" }],
  },
  {
    id: "works-editor", title: "Add or update a portfolio project", category: "Content management", updated: reviewed,
    summary: "Manage Work details, project visibility, screenshots, industries and source defaults.",
    tags: ["Works", "portfolio", "projects", "draft", "technologies", "case study", "delete"], sources: ["docs/works-admin.md"],
    sections: [
      { heading: "Manage a project", steps: ["Open Works. Choose an existing project or create a new one.", "Enter a factual title, role, year, project type, industries, technologies, description and documented scope. Add screenshots and meaningful image descriptions.", "Review the slug, external website, optional case-study fields and SEO metadata. Use only technologies and results actually supported by the work.", "Choose Draft or Published and save. Review /work/ and the immediate /work/?project=slug view.", "Confirm a successful automated deployment before sharing a new clean /work/slug/ URL or expecting homepage and sitemap changes."] },
      { heading: "Source entries, deletion and conflicts", paragraphs: ["Existing source projects are the baseline. Dashboard records override them by slug; changing a source default does not replace a saved dashboard override. Drafting or deleting a source entry leaves a public marker so the original cannot reappear accidentally.", "Deleting requires confirmation and does not delete hosted images. A venture’s Work entry is separate from its Ventures page. Concurrent changes are protected with revision checks; a failed save preserves your input. Renaming a slug does not automatically add a redirect."] },
    ], links: [{ label: "Open Works", href: "/adminauth/works/" }],
  },
  {
    id: "ventures-editor", title: "Manage business ventures and their pages", category: "Content management", updated: reviewed,
    summary: "Edit business/photography ventures without mixing them with source-managed free tools.",
    tags: ["Ventures", "business", "photography", "travel", "coffee", "gallery", "offerings"], sources: ["docs/ventures-admin.md", "docs/code-managed-tools.md"],
    sections: [
      { heading: "Update a venture", steps: ["Open Ventures and select an entry or choose New venture.", "Edit its name, slug, category, layout, hero, story, images, contact links and metadata. Edit offerings, FAQs, vehicles or photography gallery entries where the selected layout supports them.", "Choose Draft or Published, then Save venture. Wait for any uploads to finish first.", "Review the live venture cards and immediate /ventures/view/?venture=slug link. Confirm deployment before using a newly generated /ventures/slug/ URL."] },
      { heading: "What stays in code", paragraphs: ["Pages → Ventures edits the portfolio’s Ventures landing page; Ventures edits individual businesses. Free QR Code Generator and Free Image Compressor are separate, source-managed tools and cannot be created, edited or deleted here.", "Drafts stay in admin-only records; public copies are written atomically when published. Deletion markers prevent source defaults from reappearing. Travel estimator algorithms and reference-rate definitions remain code-managed. Renames require redirects for old shared URLs."] },
    ], links: [{ label: "Open Ventures", href: "/adminauth/ventures/" }],
  },
  {
    id: "media-uploads", title: "Upload and troubleshoot editor images", category: "Integrations", updated: reviewed,
    summary: "Understand Cloudinary uploads, image limits, descriptions and why deleting content keeps images.",
    tags: ["Cloudinary", "Cloudflare", "upload", "image URL", "5MB", "AVIF", "authorization"], sources: ["docs/works-admin.md", "docs/admin-setup.md", "docs/pages-admin.md"],
    sections: [
      { heading: "Add an editor image", steps: ["Use the editor’s image upload control while signed in as an approved admin, or supply a valid existing image URL/local asset path where supported.", "Choose JPG, PNG, WebP or AVIF up to 5 MB. Compress large images first if necessary.", "Wait for completion, add a useful image description and review the preview before saving the content record."] },
      { heading: "How uploads work", paragraphs: ["Editor uploads use the existing authenticated media Worker to send images to Cloudinary. Content records store the returned URLs, not image binaries. Cloudinary signing secrets remain server-side. This is different from the public Image Compressor, which never uploads the selected image.", "If uploads are not connected, use the available URL field and ask the operator to check the configured media endpoint. For authorization failures, sign in again and retry. For format or size errors, select a supported smaller image. Persistent failures need an operator to check Worker configuration and provider responses.", "Deleting a post, project or venture does not destroy its hosted media. Review provider usage separately before removing assets still referenced elsewhere."] },
    ], links: [{ label: "Open Image Compressor", href: "/tools/image-compressor/" }],
  },
  {
    id: "automatic-publishing", title: "How automatic publishing and deployment work", category: "Publishing & SEO", updated: reviewed,
    summary: "Know what happens after Save, how to check builds and how to publish from your phone.",
    tags: ["GitHub Actions", "Firebase Hosting", "Spark", "deploy", "build", "five minutes", "receipt", "sync"], sources: ["docs/automatic-publishing.md", ".github/workflows/publish-site.yml"],
    sections: [
      { heading: "After saving public content", steps: ["Save the Blog, Works, Ventures or Pages change successfully.", "The existing GitHub workflow checks published content on a five-minute schedule. You can close the dashboard; a local computer does not need to stay running.", "Open View builds or run publishing now on GitHub in the dashboard’s publishing panel. Check the latest run’s event and status.", "For a manual check, open the workflow in GitHub and use Run workflow on main. A push to main also starts a build.", "Wait for the deployment step to succeed, then check the public clean URL, metadata and sitemap. Do not infer deployment success only from a successful editor save."] },
      { heading: "What the workflow does", paragraphs: ["The workflow validates public build-value formats and checks that Firebase accepts the configured API key and authorizes the production domain. It then reads public Firestore content, compares a content fingerprint, builds the static site when needed and deploys only the existing Firebase Hosting site. Scheduled checks skip unchanged content. Manual runs and code pushes build even when the content fingerprint is unchanged.", "A public /content-deployment.json receipt accompanies the exported files. A failed validation, read, build or deployment leaves the previous successful release live. Publishing jobs are serialized. GitHub schedule delays or skipped runs add to the five-minute interval, so publication is not instantaneous.", "Public build configuration and deployment authorization belong in the configured build environment. In GitHub variable Value fields, use only the actual value without NAME= or quotes. Never place service-account keys or deployment tokens in the documentation, repository or dashboard fields."] },
    ], links: [{ label: "Open publishing workflow", href: "https://github.com/johnmsemblante/johnsemblante/actions/workflows/publish-site.yml" }],
  },
  {
    id: "publishing-troubleshooting", title: "Saved changes are missing or a build failed", category: "Troubleshooting", updated: reviewed,
    summary: "Check publication status, live refresh, clean URLs, deployment errors and cached previews.",
    tags: ["refresh", "stale", "cache", "not showing", "failed", "conflict", "offline", "404"], sources: ["docs/automatic-publishing.md", "docs/pages-admin.md", "docs/works-admin.md"],
    sections: [
      { heading: "Work through these checks", steps: ["Confirm the save succeeded, the record is Published and any scheduled release time has passed. A draft should not appear publicly.", "Reload or refocus the public page. Use Refresh live site content in the dashboard when appropriate. A live-data refresh is separate from a Hosting deployment.", "For a new record, use its immediate query-based view while waiting for a clean route. A new clean route can return 404 until deployed.", "Check the latest GitHub publishing run. A queued/in-progress job has not finished; a failed job leaves the previous release live. Use the failed step’s log to identify the issue.", "If no successful run picked up the change, run the existing workflow manually. After success, reload the clean URL. Search engines and social networks may still cache older previews."] },
      { heading: "When to ask for a code/configuration fix", paragraphs: ["Builds stop rather than publish incomplete snapshots when public content cannot be read or fails validation. Missing build configuration, invalid data or provider/network failures need inspection of the specific failure. Do not redeploy an old export as a workaround.", "A conflicting save means another revision changed the record. Preserve your text, reload the latest version and reapply the intended changes. Offline/read-error notices may retain the last available public content; they do not prove that a fresh read succeeded."] },
    ], links: [{ label: "Check publishing runs", href: "https://github.com/johnmsemblante/johnsemblante/actions/workflows/publish-site.yml" }],
  },
  {
    id: "seo-and-indexing", title: "Search metadata, sitemap and indexing", category: "Publishing & SEO", updated: reviewed,
    summary: "Update titles and descriptions, verify deployed URLs and request search-engine indexing.",
    tags: ["SEO", "Google", "Bing", "canonical", "robots", "Open Graph", "Twitter", "social preview"], sources: ["docs/seo.md", "docs/google-search-appearance.md", "docs/image-compressor.md"],
    sections: [
      { heading: "Update search information", steps: ["Edit the relevant page or content record’s SEO title/description. Canonicals and route conventions remain code-managed.", "Wait for successful deployment. Live text changes alone do not replace initial HTML metadata on static Hosting.", "Check the final clean URL and sitemap.xml. Share the canonical HTTPS URL with the site’s trailing slash convention.", "In the verified Google Search Console property, inspect the URL, run the live test and request indexing when ready. Confirm the sitemap is registered.", "In Bing Webmaster Tools, inspect/submit the same canonical URL and confirm the sitemap is registered. Submission does not guarantee indexing or rankings."] },
      { heading: "Previews and privacy", paragraphs: ["Open Graph/Twitter metadata is generated during the build. Work detail pages use their featured image; venture pages use their logo, falling back to the site’s branded social image when not configured. Providers may cache previews after deployment.", "Admin pages remain noindex and stay out of the public sitemap. A noindex directive controls search visibility, not authorization. Never publish private information assuming a page is protected only because it is not indexed."] },
    ], links: [{ label: "View public sitemap", href: "/sitemap.xml" }],
  },
  {
    id: "slugs-and-redirects", title: "Rename URLs without losing old links", category: "Publishing & SEO", updated: reviewed,
    summary: "Understand slugs, immediate views and the separate redirect work needed after a rename.",
    tags: ["slug", "rename", "301", "redirect", "broken links", "canonical", "delete"], sources: ["docs/works-admin.md", "docs/ventures-admin.md", "docs/seo.md"],
    sections: [
      { heading: "Before changing a published slug", steps: ["Prefer keeping a published URL stable. Record the old path if a rename is necessary.", "Save the new slug through the relevant editor and review the renamed content. The editor rejects reserved or occupied names.", "Ask the maintainer to add an exact permanent redirect from the old clean path to the new clean path in the existing Hosting configuration.", "Deploy the updated content and redirect together. Verify the new page, old-path redirect and sitemap; update manually supplied links and query-based links separately."] },
      { heading: "Important distinction", paragraphs: ["Changing an editor slug does not automatically create a redirect. Immediate query links are useful before a build, but do not replace the clean URL’s initial HTML or search metadata. Deleting or unpublishing a record also needs deployment to remove its previously exported page."] },
    ],
  },
  {
    id: "portfolio-search", title: "How Work search and filters behave", category: "Site features", updated: reviewed,
    summary: "Use keyword search, industry/technology/type filters and shareable portfolio results.",
    tags: ["portfolio", "Work", "industry", "technology", "filter", "search", "share", "Back"], sources: ["docs/portfolio-industries.md", "src/lib/project-filters.ts"],
    sections: [
      { heading: "Find and share work", steps: ["Open Work and either type a keyword or select Industry, Technology and Project Type filters.", "Typing clears dropdown selections; choosing a dropdown option clears the keyword search. These are independent modes.", "Within a dropdown group, choices match any selected value. Across different groups, projects must match all selected groups. Counts reflect the other selected groups.", "Use removable chips or Clear All to reset. Use Share these results for a link that includes the current filters. Browser Back/Forward restores filter checkpoints."] },
      { heading: "Search scope", paragraphs: ["Search ignores case and accents and matches documented project details, technologies, industries and supported aliases. It does not invent project experience. Dedicated industry pages keep their own collection scope while filtering.", "Work filters run locally; they do not require an external search service. Query combinations are not separate sitemap pages. Draft concepts do not appear as published portfolio work."] },
    ], links: [{ label: "Open public Work directory", href: "/work/" }],
  },
  {
    id: "job-finder", title: "Find remote jobs and keep a private shortlist", category: "Site features", updated: reviewed,
    summary: "Search job sources, filter loaded results and manage account-specific saved jobs.",
    tags: ["Job Finder", "Himalayas", "Jobicy", "Philippines", "UTC+8", "bookmark", "saved jobs"], sources: ["src/components/admin/job-finder.tsx", "src/components/admin/use-saved-jobs.ts"],
    sections: [
      { heading: "Find roles", steps: ["Open Job Finder, choose an available job source and enter a role keyword or use a quick search.", "Submit Search remote jobs to query the source. Typing alone does not send a source request.", "Use the filters to narrow the loaded listings. Check original postings for Philippines eligibility, UTC+8 working hours, remote arrangements and any travel requirements.", "Use the save/bookmark control, then open Saved jobs to review your shortlist. Remove a bookmark when it is no longer useful."] },
      { heading: "Availability and privacy", paragraphs: ["Himalayas broader search depends on the configured proxy; unavailable sources are disabled. Provider feeds and caches can delay updates, and listings may expire. Eligibility labels are source information, not a guarantee of hiring eligibility.", "Saved jobs are private records under the signed-in admin’s account, with a loaded shortlist limit of 100 entries. A bookmark is not a job application. Open the original posting to apply; the dashboard does not apply or send messages for you."] },
    ], links: [{ label: "Open Job Finder", href: "/adminauth/jobs/" }],
  },
  {
    id: "free-tools", title: "How free tools are listed and maintained", category: "Free tools", updated: reviewed,
    summary: "Understand tool cards, homepage order, code-only management and optional support.",
    tags: ["registry", "homepage", "QR", "compressor", "donations", "ventures", "source code"], sources: ["docs/code-managed-tools.md", "src/config/tool-ventures.ts"],
    sections: [
      { heading: "One source of truth", paragraphs: ["Published tools come from one source-code registry. That registry supplies Tools, public Ventures cards, navigation, sitemap and homepage eligibility. QR Code Generator is first; Image Compressor is second. Homepage selection is ordered, deduplicated and limited to four featured tools.", "Free tools deliberately have no admin CRUD records. Adding a tool, changing its logic, editing its registry description or enabling homepage featuring requires a reviewed code change and deployment. Pages does not edit their tool cards."] },
      { heading: "Request a change", steps: ["Describe the tool behavior or listing copy you want changed, with the affected public URL.", "Implement and validate the code change, keeping existing tools and business-venture CRUD intact.", "Update the corresponding owner guide and technical documentation, then deploy through the existing workflow and verify the public route and listing links."] },
    ], links: [{ label: "Explore free tools", href: "/tools/" }],
  },
  {
    id: "qr-generator", title: "Create and download a QR code", category: "Free tools", updated: reviewed,
    summary: "Generate static QR codes, understand privacy and avoid scanning problems.",
    tags: ["QR", "Wi-Fi", "PNG", "SVG", "email", "phone", "expiry", "colors"], sources: ["docs/code-managed-tools.md"],
    sections: [
      { heading: "Use the generator", steps: ["Open Free QR Code Generator. Choose website, text, Wi-Fi, email or phone and enter the details.", "Choose readable colors, square or rounded dots and the desired output size. Keep a dark foreground and light background.", "Download PNG for everyday use or SVG for scalable artwork. Scan the downloaded code with the devices and printed size you intend to use."] },
      { heading: "Privacy and limits", paragraphs: ["QR codes are generated locally without uploading entries or storing them in browser storage. Anyone holding the image can read its contents, including an encoded Wi-Fi password.", "These are static codes with no imposed expiry or scan tracking. A linked website or account must still exist. Changing the encoded destination requires generating and distributing a new image. For scanning issues, shorten the content, restore strong contrast and keep the blank border."] },
    ], links: [{ label: "Open QR Code Generator", href: "/tools/qr-code-generator/" }],
  },
  {
    id: "image-compressor", title: "Compress an image to a target file size", category: "Free tools", updated: reviewed,
    summary: "Choose JPG/PNG/WebP targets, compare actual sizes and handle transparency correctly.",
    tags: ["image compressor", "50KB", "100KB", "200KB", "500KB", "PNG", "WebP", "transparency", "quality"], sources: ["docs/image-compressor.md"],
    sections: [
      { heading: "Compress and download", steps: ["Choose or drop one still JPG, PNG or WebP. Input limits are 20 MB, 24 megapixels and 12,000 pixels per side.", "Use target-size mode with 50, 100, 200 or 500 KB, or enter a custom size from 1 KB to 20 MB. Here KB means 1,000 bytes and MB means 1,000,000 bytes.", "Keep the original format or explicitly select another. PNG/WebP preserve transparency; JPG replaces it with white. Quality mode offers 10–100% for JPG/WebP; PNG is lossless and has no quality slider.", "Press Compress Image and review the target-achieved message, actual size, output dimensions and previews. Download the result shown."] },
      { heading: "How it works and what can change", paragraphs: ["Processing happens entirely in the browser, using a worker where supported and Canvas fallback otherwise. The tool searches quality and then reduces dimensions within bounded attempts. Re-encoded output is capped at 4,096 pixels on its longest side. It never uploads the selected image to Firebase, Cloudinary or a compression service.", "A target is a maximum-size attempt, not a promise of exact size or original quality. Unreachable targets show an honest warning and the smallest candidate. Already-small images keep their original bytes when format is unchanged. Re-encoding may remove metadata. Animated PNG/WebP are unsupported.", "Changing a file or setting clears its old result. Cancel stops or invalidates pending work. If decoding/export fails or your device is low on memory, try a smaller input, a larger target or another supported format."] },
    ], links: [{ label: "Open Image Compressor", href: "/tools/image-compressor/" }],
  },
  {
    id: "donations", title: "How the optional Support Free Tools widget works", category: "Integrations", updated: reviewed,
    summary: "Understand eligible routes, GCash/PayPal configuration and optional donations.",
    tags: ["donation", "support", "GCash", "PayPal", "payment", "widget"], sources: ["docs/code-managed-tools.md", "src/config/donations.ts"],
    sections: [
      { heading: "Visitor behavior", paragraphs: ["Eligible published tools reuse one Support widget. It opens only after a visitor chooses it; compression, QR generation and downloads remain free without a contribution. It is not shown on the homepage, directories or admin dashboard.", "Configured payment methods use the owner-supplied GCash receiving image and approved international provider link. If no complete enabled method exists, the layout renders no trigger. The website does not collect transactions or automatically open a payment popup."] },
      { heading: "Change payment details", steps: ["Ask the maintainer to update the existing source configuration and approved receiving asset; these settings are not editable from Pages or Ventures.", "Verify the recipient information and external provider destination before releasing.", "Rebuild/deploy and check eligible tool pages, modal close behavior and image/link availability. Actual payment completion must be verified separately through the provider."] },
    ],
  },
  {
    id: "contact-inquiries", title: "How contact inquiries are sent and confirmed", category: "Site features", updated: reviewed,
    summary: "Understand Formspree delivery, success messages, errors and the direct-email fallback.",
    tags: ["contact", "form", "Formspree", "email", "inquiry", "timeout", "message"], sources: ["src/components/inquiry-form.tsx", "src/lib/submit-inquiry.ts"],
    sections: [
      { heading: "Visitor workflow", steps: ["Open Contact and enter a name, email, topic and message. Do not include passwords or private client materials.", "Submit once and wait while Sending is shown. The form disables repeated submission during the request.", "The form reports success only when the provider acknowledges the submission. On success it resets for a new inquiry; on failure it keeps the message for review or retry.", "If sending cannot be confirmed, use the direct email link shown below the form. A timed-out request may have reached the provider, so retrying can send a duplicate."] },
      { heading: "Owner maintenance", paragraphs: ["Name, email and message are sent to the configured Formspree endpoint to deliver the inquiry. There is no inbox in this dashboard. Check the configured delivery mailbox/provider account when investigating delivery problems; a website confirmation is not proof that an email reached a particular inbox.", "Pages can edit supported form wording and contact links. The actual submission endpoint and request/validation behavior are source-managed. A delivery or rate-limit issue needs review of the provider and specific error, not a change to free-tool image processing."] },
    ], links: [{ label: "Open Contact", href: "/contact/" }],
  },
  {
    id: "travel-quotations", title: "How the Cebu trip planner builds a quotation request", category: "Site features", updated: reviewed,
    summary: "Explain package references, custom itineraries and why submitting an inquiry is not a booking.",
    tags: ["Golden Travel", "trip planner", "estimator", "quotation", "packages", "rates", "vehicle", "booking"], sources: ["src/ventures/golden-travel-and-tours/trip-estimator.tsx", "src/ventures/golden-travel-and-tours/trip-planner.tsx"],
    sections: [
      { heading: "Plan a trip", steps: ["Open Golden Travel and Tours and expand the trip planner. Choose a package or build a custom itinerary.", "Enter pickup/drop-off, a current or future Cebu travel date, time, passengers, vehicle preference and any requested stops or customizations.", "Review the generated itinerary and any supported package price reference. Extra stops, customized packages, multiple days or routes without a supported rate require a personalized quotation.", "Choose to send the trip inquiry, review the prefilled summary and add contact details. A successful submission resets the planner for a new inquiry."] },
      { heading: "References are not reservations", paragraphs: ["The planner prepares a request for a confirmed quotation. It does not reserve a vehicle, take payment or guarantee a final total. Reference amounts include their confirmation date and conditions; confirm current availability and pricing before committing.", "Venture copy, images and supported content sections can be edited in Ventures. Planner algorithms, package definitions and reference-rate tables remain source-managed and should be reviewed together when pricing behavior changes."] },
    ], links: [{ label: "Open Golden Travel and Tours", href: "/ventures/golden-travel-and-tours/" }],
  },
  {
    id: "documentation-maintenance", title: "Keep this documentation current with site changes", category: "Maintenance", updated: reviewed,
    summary: "Use this handbook and update the relevant guide whenever a feature or workflow changes.",
    tags: ["documentation", "handbook", "maintenance", "updates", "testing", "release", "checklist"], sources: ["docs/admin-documentation.md", "AGENTS.md"],
    sections: [
      { heading: "Find an answer", steps: ["Use Search documentation to search titles, descriptions, tags and complete instructions. Multiple words must all match the same guide, regardless of case or accents.", "Choose a topic to narrow results. Expand a matching guide to read its steps, explanations and related links.", "Use Clear filters to return to all guides. Last reviewed dates show when each guide was checked against the implementation; they are not an automatic guarantee that an external service has not changed."] },
      { heading: "Required with future implementation changes", paragraphs: ["The repository instructions require maintainers and coding agents to update the affected owner-facing guide, technical notes and reviewed date in the same change as any feature, configuration, editor, publishing, integration or operational adjustment. Add a guide for a new workflow instead of leaving it undocumented.", "This handbook is source-managed and deployed with the site. It is not automatically rewritten after a dashboard content save or by monitoring the site. Ordinary content edits do not require a handbook update unless they change how a feature is used or maintained.", "Documentation must describe verified current behavior, useful steps, limits and troubleshooting. Keep historical release notes separate. Never include credentials, private keys, private drafts, personal records or environment values. Run the documentation checks and relevant feature tests before release."] },
    ],
  },
];

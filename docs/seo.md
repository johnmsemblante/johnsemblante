# SEO setup and editing guide

Automatic publishing on Spark is implemented in [the publishing workflow](automatic-publishing.md). Once activated, it builds clean URLs and SEO HTML after detecting saved public changes; manual local rebuilding is no longer required for content edits.


This guide covers the technical SEO audit and implementation of 6 November 2026 (Asia/Manila). The current production domain is **https://johnsemblante.com** (changed on 10 November 2026). These changes need a production build and Hosting deployment before they become live.

## Navigation and breadcrumbs

The portfolio header's Ventures link has a separate disclosure button for its submenu. The submenu lists published venture routes, followed by a linked Free Tools heading and published tool links. Venture entries come from the build's existing public venture snapshot. Tools come from the source-managed registry, with optional `navigationLabel` text. Rebuild after publishing or renaming managed ventures so header links reflect exported destinations.

Public portfolio pages other than the homepage have a breadcrumb trail. Standalone venture pages use the same breadcrumb component within their own layouts. Work industry trails link directly through Work, since there is no separate industry index. Each visible trail has matching BreadcrumbList JSON-LD, with absolute production URLs matching the existing trailing-slash canonicals. Homepage branding, metadata, and canonical URLs retain their existing values. Admin and unknown routes have no public breadcrumb trail.

`build-navigation.ts` prepares lightweight route labels on the server. `PortfolioBreadcrumbs` selects the current path and renders its trail in initial exported HTML. The shared HeaderNavigation component supports click/touch, Tab/Enter, Escape, focus dismissal and outside-click dismissal for dropdowns. The mobile menu contains the same submenu as an expandable section.

Use `node --test tests/navigation-breadcrumbs.test.cjs`, `npm.cmd run build`, `npm.cmd run audit:seo` and `npm.cmd run audit:seo:qr` to validate navigation models, breadcrumb markup and canonical metadata. Google Search Console indexing and rich-result appearance require separate verification.

## Audit findings and priorities

The initial live-HTML audit checked the homepage, Blog, Work, About, Contact, admin landing page, robots.txt and sitemap. The completed export audit checks every public sitemap URL and the exported admin pages.

| Priority | Finding | Implementation / status |
| --- | --- | --- |
| Critical | Managed posts existed only at `/blog/?post=slug`; their article body, individual metadata and links were missing from the initial HTML. | Every build now anonymously reads published posts and already released schedules, exports `/blog/slug/` pages with article HTML and metadata, seeds the listing with the public snapshot, and adds the clean URLs to the sitemap. The instant database view remains available. |
| High | The homepage had no canonical URL. | Added explicit homepage metadata and canonical. Public pages use the current production domain consistently. |
| High | `/blog/` initially had no H1 or crawlable managed-article links. | The initial HTML now includes its heading and links/cards from the public snapshot. It does not insert placeholder drafts. |
| High | Most pages had no social preview image. | Added a 1200×630 branded PNG fallback and Open Graph/Twitter image metadata. Project pages use their screenshots; articles use their featured image when available. |
| Basic | Work had an unnecessarily long title; some page titles were generic. | Shortened the Work title and made homepage/Blog titles more descriptive. |
| Basic | Article structured data lacked image and author URL. | Static article pages now include safely serialized BlogPosting JSON-LD, publication time, author URL, canonical page URL and image. Homepage includes WebSite/Person data using verified site information. |
| Already correct | Public pages were indexable, robots.txt referenced the sitemap, and admin pages used noindex/nofollow and were absent from the sitemap. | Preserved. Authentication and Firestore rules remain the access controls; noindex is not security. |
| Follow-up | One current managed article's title and four descriptions exceed the audit's editorial length guidance. | These are review warnings, not indexing failures. Edit the managed post's SEO title in the dashboard; review the Golden Travel and empty-industry descriptions in source. No production article content was changed by this audit. |

The verified export contains **34 public sitemap URLs** and one managed article at the time of the audit. Counts change as you publish. The audit found zero blocking errors and five editorial warnings. This is a technical and content-structure audit, not a measured Lighthouse/Core Web Vitals report, a backlink audit, Search Console verification or proof of Google indexing. No ranking improvement or rich result is guaranteed.

## Publishing now has two views

- **SEO page:** `/blog/article-slug/` contains the build's article, title, description, image and JSON-LD directly in its HTML. Share this clean URL after deployment.
- **Instant view:** `/blog/?post=article-slug` reads the current public database version. New posts and newly released schedules can be viewed here before the next deployment. When a clean page exists in the current build, this view updates its client-side canonical to that clean URL. Old query links keep working, but their initial HTML/social previews are still the shared Blog page.

**After publishing, editing, scheduling, unpublishing or deleting a post, rebuild and deploy.** A deployed HTML copy stays public until replaced by another deployment, even if its database record is changed to Draft or deleted. Publishing a private draft for the first time still requires your explicit Published/Schedule choice; the build does not read private drafts. Scheduling releases the instant view automatically; a later build is required to create its clean SEO page. There is no automatic deployment or paid scheduled job.

The build uses the public project ID from `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, falling back to `.firebaserc`'s default project. It uses anonymous REST queries protected by the existing rules, without an admin token, service-account key or API key. Reads count toward ordinary Firestore quotas. It validates and writes only public article fields to ignored `.generated/blog-posts.json`, then exports the pages. A network/permission/index failure stops the build; it does not silently replace articles with an empty snapshot. Duplicate source/managed slugs also stop the build. The generated snapshot is not committed.

For local development, run `npm run sync:blog` to refresh the snapshot, then restart `npm run dev`. `npm run build` refreshes it automatically. Without browser Firebase configuration, the exported snapshot still renders, but the instant view and admin sign-in need the normal Firebase Web configuration described in [admin setup](admin-setup.md).

## Change a managed article's SEO

1. Sign in at `/adminauth/blog/`, then open the article.
2. Write a clear visible Title and Short introduction. The article title remains its H1.
3. Under **SEO metadata**, enter an optional **Meta title** and **Meta description**. Empty values use the Title and Short introduction independently.
4. Add a public HTTPS or site-relative Featured image URL and an accurate description. Use an image relevant to the article. The image appears in cards, article pages and share metadata. Empty images use the branded social fallback for metadata and the site logo for cards.
5. Save with the intended visibility, rebuild, run the SEO audit and deploy Hosting. Check the clean article URL with View Page Source, not just the browser Elements panel.

The normal Next.js page title template adds ` | John Semblante` to clean article titles. Do not add the suffix twice. Prefer short, descriptive titles (often around 50–60 characters including branding) and descriptions (often around 140–160 characters). These are writing guidelines, not fixed Google limits; Google may choose different titles/snippets. The audit warns at title length >65 or description length >170 and never silently truncates your copy.

Categories and tags help readers organize content. They are not a reason to repeat keywords. Use one H1 (the article Title); use the editor's H2/H3 controls for logical section headings. Describe informative images in alt text. Keep published slugs stable so existing links continue working. The slug is generated from the original title and remains fixed on edits.

## Change source pages and shared defaults

| Setting | Where to edit | Notes |
| --- | --- | --- |
| Canonical production domain, general description, social image path | `src/content/site.ts` | Keep `site.url` HTTPS and without a trailing slash. |
| Page title, description, canonical path and optional image | Each public `src/app/**/page.tsx` using `pageMetadata(...)` | The helper is in `src/lib/metadata.ts`. |
| Homepage title and canonical | `src/app/(portfolio)/page.tsx` | Its explicit metadata overrides the root fallback. |
| Root fallback title, title suffix, language, index defaults and verification | `src/app/layout.tsx` | Do not set all pages to noindex. |
| Project SEO title/description and image | `src/content/projects.ts` / Project records | Optional `seo.title` and `seo.description` override title/summary in the case-study metadata. The project image supplies its social image. |
| Source-based blog article | `src/content/blog.ts` | `title`, `excerpt`, optional `seoTitle`, `seoDescription`, `featuredImage`, `featuredImageAlt`. Only `status: "published"` articles export. Source posts are separate from dashboard posts. |
| Venture title, description and social image | `src/ventures/<venture>/content.ts`, `src/app/ventures/[venture]/page.tsx` | A venture's own canonicalBase is respected when configured. |
| Industry collection metadata | `src/content/industries.ts`, `src/app/(portfolio)/work/industry/[industry]/page.tsx` | Keep empty collections honest; add verified examples when available. |
| Branded default social card | `public/images/seo/john-semblante-social.png` | Replace with a suitable public PNG/JPEG, preferably 1200×630, and update the helper dimensions if needed. |
| Public URL list and crawler entry point | `src/app/sitemap.ts`, `src/app/robots.ts` | Admin routes, drafts and future schedules must stay out of the sitemap. Do not invent lastModified dates. |
| Structured data | `src/lib/seo.ts`, `src/components/published-blog-article.tsx` | Use factual visible information. Do not add fake reviews, ratings or credentials. |
| Managed article export | `scripts/sync-blog-snapshot.cjs`, `src/lib/public-blog-snapshot.ts`, `src/lib/build-blog.ts` | Build-only public reads; no admin credentials. |

Example for a source page:

```tsx
export const metadata = pageMetadata(
  "WordPress Website Development",
  "Describe the actual services and information on this page in a clear sentence.",
  "/your-page/",
  { url: "/images/your-social-image.jpg", alt: "Describe the image" },
);
```

Creating a metadata entry does not create a page. Keep its path equal to the actual route, including the site's trailing slash. Do not change the canonical to a future domain until it is connected and working. When migrating domains, configure appropriate permanent redirects in Hosting, update `site.url`, rebuild, audit, redeploy and update Search Console. Canonical tags are not redirects.

## Free Search Console and validation tools

Search Console setup is a manual owner step; it has not been performed by this change. Add the current production URL-prefix property, use the verification method Google supplies, submit `/sitemap.xml`, and inspect representative URLs. If using the HTML meta-tag method, set the public verification token as `GOOGLE_SITE_VERIFICATION=your-token` in ignored `.env.local` (or the build environment), then rebuild/deploy. Use only the content value, not the entire meta tag. It is not a password, and you do not need to send it in chat.

After deployment, inspect the homepage, `/blog/`, a clean article URL and a Work case study using Google's URL Inspection/Rich Results tools. Verify the canonical, initial HTML, metadata and image. External preview caches may need refreshing. Do not block `/adminauth/` in robots.txt merely to hide it: crawlers need to see its noindex directive. Firebase authentication remains mandatory for actual private content.

## Checks and release

```powershell
npm run test:seo
npm run test:blog
npm run build
npm run audit:seo
```

`audit:seo` checks every sitemap URL against `out/`: HTML existence, title/description, one H1, canonical consistency, social images, image alt attributes, JSON-LD syntax, English language, admin noindex and robots sitemap reference. It fails on blocking errors and prints editorial warnings separately. It checks local image existence, not the uptime of external image hosts. `test:seo` uses mocked queries and does not write production records.

Deploy a freshly built `out/` using the existing Firebase CLI workflow:

```powershell
firebase deploy --only hosting --project johnmsemblanteapp
```

No Firestore rule/index change or billing upgrade is required for this SEO revision. The existing scheduled-post index must already be ready. Never deploy an old `out/` after publishing changes and expect it to contain current articles. Always verify the deployment before submitting new article URLs to search engines.

## References

- [Next.js metadata and Open Graph images](https://nextjs.org/docs/app/getting-started/metadata-and-og-images)
- [Google JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)
- [Google canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Search Console getting started](https://support.google.com/webmasters/answer/9128668)

## Sharing a single article

Use the clean `/blog/article-slug/` URL for social previews. The article footer and the dashboard now provide **Copy article link** for articles included in the current build. The dashboard's **View published post** also uses the clean page; **View latest database version** remains the instant query view. New posts need a build/deployment before the share link is available.

An existing `/blog/?post=slug` URL still returns the listing's initial HTML on static Hosting, so a preview crawler may show the Blog title/image. Changing client-side metadata or adding a JavaScript redirect cannot reliably fix the preview of that old URL. Share the clean page instead. If a platform already cached an older preview of the clean URL, refresh it with that platform's preview/debugging tool after deploying.

## Google indexability recheck ? 6 November 2026

Live checks of all **34 sitemap URLs** returned HTTP 200 using a Googlebot-style user agent. Public pages had no blocking robots meta directive or X-Robots-Tag header. The homepage's canonical points to its current HTTPS web.app URL; robots.txt allows crawling and advertises the accessible XML sitemap. HTTP redirects to HTTPS. A deliberately nonexistent URL returned a genuine 404 with noindex. Admin pages have both noindex metadata and an X-Robots-Tag header. The alternate firebaseapp.com host uses the web.app canonical.

These requests check technical accessibility from this environment. They do not impersonate a verified Google crawler IP, inspect Google's index, or prove a specific page is indexed. A missing result for a name search is not conclusive evidence of a technical block. No technical crawl/index prohibition was found in the tested public URLs, and buying a domain is not needed to make the current public site eligible.

The follow-up changes make the homepage title, visible H1, description and Person metadata use **John Clark Semblante**, with John Semblante retained as the brand alias. Person metadata links only the social accounts already present in the project's profile data. The SEO export audit now checks that the homepage title and H1 contain the same full name as its Person schema. These identity changes require a build and Hosting deployment.

### Owner steps still required in Search Console

1. Add a **URL-prefix** property for exactly `https://johnsemblante.com/`. The older Firebase URL-prefix property is separate.
2. If the property is not already verified, choose the HTML tag method. Put only its content value in `GOOGLE_SITE_VERIFICATION` in the ignored build environment, then rebuild and deploy before pressing Verify. An absent verification meta tag does not prove the property is unverified; another verification method may already have been used.
3. In **Sitemaps**, submit `https://johnsemblante.com/sitemap.xml`.
4. Inspect `https://johnsemblante.com/` with **URL Inspection**. Record the actual indexed/not-indexed reason, Google's selected canonical, and any last crawl information.
5. Use **Test live URL**. If eligible, use **Request indexing**. Also inspect Work, About, and a clean `/blog/slug/` article URL. Do not repeatedly request the same unchanged page.
6. Monitor the Page indexing report. If Google reports ?Discovered ? currently not indexed? or ?Crawled ? currently not indexed?, use that exact report to decide the next step rather than changing robots settings at random. Add the website URL to your own public professional profiles when appropriate; the site code cannot edit those profiles.

Search Console ownership verification, sitemap submission and requests for indexing have not been completed by the code changes. Google decides whether and when to index and serve a page; neither an index/follow directive nor submitting a sitemap guarantees it. Do not use paid indexing services or the restricted Google Indexing API for ordinary portfolio/blog pages.

References: [Google technical eligibility](https://developers.google.com/search/docs/essentials/technical), [ownership verification](https://support.google.com/webmasters/answer/9008080), [requesting a recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

### Live deployment status for the recheck

The owner-supplied HTML verification tag was configured in ignored `.env.local`, built and deployed to Firebase Hosting on 6 November 2026. A live HTTPS fetch confirmed the exact tag, the full-name homepage title/H1, index/follow metadata and absence of a public noindex response header. The deployed homepage, blog, sitemap, robots.txt, article page, social image and admin asset matched the local build. This deployment also includes the prepared clean article sharing controls.

The token is a public ownership-verification value; passwords and Google login codes were not used. Keep `GOOGLE_SITE_VERIFICATION` in the build environment on every computer/CI job that deploys this site, otherwise a later build can remove the verification tag. The owner confirmed **Ownership verified** using the HTML tag method on 6 November 2026. Keep that meta tag in subsequent deployments. Sitemap submission success and Google indexing status have not yet been confirmed; those require the corresponding Search Console results.

## Current positioning and keyword plan

The professional title remains **WordPress/Full Stack Developer**, defined as `professionalTitle` in `src/content/profile.ts`. It supplies the profile role, current employment label, hero specialty, portrait illustration, footer, metadata image description and Person jobTitle. Historical employment titles keep their original meanings.

The primary homepage search phrase is **Cebu Web Developer**. Its title is **Cebu Web Developer | John Clark Semblante**, defined separately as `homePageTitle` in the profile file and used by the homepage and root metadata. The homepage H1 is **Cebu Web Developer**; John's full name appears in the eyebrow, introduction and structured data. The default description in `src/content/site.ts` describes WordPress development, WooCommerce customization and website fixes. The shared metadata helper carries each page's title/description into Open Graph and Twitter previews.

About focuses on John's career and Mandaue City location; Work shows actual projects; Contact explains what to send for a project or remote role. Their titles/descriptions are edited in the corresponding `src/app/(portfolio)/.../page.tsx` files. Homepage services and process copy live in `src/components/development-services.tsx` and `src/components/workflow.tsx`. The Blog index has matching introductory copy in its route and `src/components/managed-blog.tsx`; update both to keep initial and live views consistent. Do not add the primary phrase to unrelated venture offers or every project title.

The 8 November content revision replaces general slogans with specific work, tools and inquiry guidance, grounded in the supplied career history. It does not rewrite managed articles or project records, add client results, change URLs, or claim new availability. The existing branded social image keeps the accurate professional role; changing metadata does not require new artwork. See [the content review](review/content-review-2026-11-08.md).

Suggested search phrases below are based on your documented skills and location, **not measured search volume, competition or a ranking guarantee**:

| Search intent | Suggested phrases | Best existing destination / supporting content |
| --- | --- | --- |
| Find you by name | John Clark Semblante; John Semblante; John Clark Semblante portfolio | Homepage, with your full name, current role and introduction |
| Assess your work | John Clark Semblante works; John Clark Semblante projects; WordPress developer portfolio | Work page, actual client/venture records, screenshots and case studies |
| Find a local developer | Cebu web developer (primary); web developer in Cebu; WordPress developer Cebu | Homepage introduction and service copy, location and genuine project evidence |
| Hire remotely | remote WordPress developer Philippines; WordPress full stack developer | Homepage/profile/contact, plus documented collaboration experience |
| Find a specific skill | custom WordPress development; Figma to WordPress developer; WooCommerce developer Philippines | Existing service sections, relevant experience and verified project write-ups |
| Learn or solve a problem | Concrete WordPress troubleshooting or implementation questions you have actually solved | Helpful blog articles with steps, code, limitations and a relevant project example |

Use **portfolio**, not ?portfoio,? in your site content. ?Works? is a reasonable branded query, but ?portfolio? and ?projects? make more natural headings. Generic ?WordPress developer? is broader than the branded/local phrases; use it naturally alongside your name and Cebu/Philippines context rather than assuming a new portfolio will immediately rank for it.

Write for people who need to assess your work, not an AI detector. Google prioritizes helpful, reliable, people-first content; AI assistance alone is not the deciding factor. Natural wording cannot guarantee rankings or prevent a classifier from labeling content as AI-generated. Use first-hand examples and verify facts rather than inventing personal stories. References: [Google’s people-first guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), [Google on AI-generated content](https://developers.google.com/search/blog/2023/02/google-search-and-ai-content).

No HTML meta-keywords tag is added: [Google says it does not affect indexing or ranking](https://developers.google.com/search/docs/crawling-indexing/special-tags). Titles, headings, useful text, descriptive internal links and real project evidence are the implementation focus. [Google recommends clear, concise titles without keyword stuffing](https://developers.google.com/search/docs/appearance/title-link).

Next steps after Google begins showing data: review Search Console Performance queries and landing pages, compare branded versus service/location searches, and refine the pages that already match the intent. Expand real case studies with your contributions and technologies; do not add invented results or claim every historical website used the modern full-stack tools. Build a few useful articles from actual WordPress, WooCommerce, Figma implementation or website debugging work rather than creating many thin keyword landing pages.

## First article URL change — 8 November 2026

The first managed article was renamed to `/blog/my-web-development-journey-a-cebu-web-developers-story/`. Its public rename record identifies the former slug as `my-web-development-journey-from-front-end-beginnings-to-what-s-next`. Hosting has exact 301 redirects for the old clean path, with and without a trailing slash, to the new clean page. The rebuild includes only the new article URL in the sitemap. Share the new clean URL. Legacy `/blog/?post=old-slug` query links are not covered by these path redirects and should be updated manually.

## Live browser content versus deployed SEO HTML

Clean article pages now pre-render the snapshot and refresh the visible article from Firestore on load, focus, visibility changes and a 60-second visible-page interval. Saves and the admin Overview's **Refresh live blog content** action request fresh reads in other public tabs in the same browser. This fixes saved edits appearing stale to readers without requiring a rebuild for every visible text edit. The page keeps a consistent canonical and updates its browser metadata and structured data with the live public article.

The initial HTML and previews fetched without JavaScript remain build-time copies. Rebuild and deploy to update those SEO/social copies, create clean URLs for new articles, update sitemap entries, or remove old published HTML. A refresh button cannot purge Google/social caches or replace a Hosting deployment. If a network refresh fails, readers see the last available copy with a warning; if the server confirms the article is no longer public, the rendered article is hidden and client metadata is marked noindex. This does not remove the deployed HTML from the server.

## Venture and Work sharing image priority

Single venture pages use `venture.logo` for both Open Graph and Twitter previews. When the logo is absent or its URL is blank, they use `site.socialImage`; a gallery/hero photo is not substituted. Work detail pages use `project.image`, falling back to `site.socialImage` when no usable image URL is configured. The default is `public/images/seo/john-semblante-social.png`. This fallback is selected at build time for missing/blank configuration; a social platform cannot automatically switch to it if a configured external URL later fails. Rebuild and redeploy after changing these fields. Previously shared previews may remain cached by the social platform until it fetches the URL again.

## Managed Works publishing

Production builds now export the merged source/managed Work collection to clean detail routes, industry lists, homepage project sections and the sitemap. Public Work explorers and detail views refresh published data after hydration. Newly published projects have an instant `/work/?project=slug` view until a rebuild/deploy creates their clean URL. Share the clean URL after deployment for project-specific social metadata. As with blog posts, editing, drafting or deleting a Work requires rebuild/deployment to update or remove its initial HTML; browser refresh cannot remove an old exported file. See [Works administration](works-admin.md).

## Sitemap fetch check - 8 November 2026

The owner reported the November 6 `/sitemap.xml` submission still showing Unknown / Couldn't fetch, with no Last read date and zero discovered pages. That is not proof of a specific XML defect, nor does it establish that Google has successfully processed the current sitemap. Search Console's detailed fetch error and Google's crawler logs are unavailable to this code review.

Direct live requests on November 8 returned HTTP 200 for the canonical HTTPS sitemap (35 URLs, 2,932 uncompressed bytes) and robots.txt. The sitemap has the expected UTF-8 declaration, sitemap namespace, absolute production URLs and no admin routes. Robots permits crawling and references the canonical sitemap. HTTP requests redirect to HTTPS. GET, HEAD, identity encoding and requests bearing Googlebot/Inspection user-agent strings all succeeded. User-agent strings do not make those requests originate from Google infrastructure.

One reproducible routing issue was found: `/sitemap.xml/` returned 404. The submitted path reported by the owner does not have that trailing slash, so this does not explain that particular Search Console row. Hosting now redirects extra-slash variants of sitemap.xml and robots.txt to the canonical files. Explicit XML/plain-text content types and `public,max-age=0,must-revalidate` headers make crawler-file delivery predictable after releases. The canonical sitemap was already valid and accessible; these changes are not a confirmed cure for Google's reported fetch failure. No artificial lastmod dates, duplicate sitemap URLs or unrelated robots exclusions were added.

Run `npm run audit:seo:live` after deployment. It checks current HTTPS status/content, sitemap URLs/namespace/duplicates, crawler request variants, HEAD, robots discovery, canonical crawler-file redirects and every listed page's response/canonical/noindex settings. It does not access Search Console or impersonate a verified Google crawler. `npm run test:seo` also tests its error detection without network requests.

Owner steps:

1. Select the verified URL-prefix property `https://johnmsemblanteapp.web.app/`.
2. Resubmit the canonical sitemap once: `https://johnmsemblanteapp.web.app/sitemap.xml`, without a trailing slash. Use `sitemap.xml` if the form already displays the site's URL prefix.
3. Revisit the Sitemaps report after Google processes that request; look for a new Last read date, status and discovered-page count. Google controls retry timing; no specific turnaround is guaranteed.
4. If a new attempt still fails, use URL Inspection on that exact sitemap URL and select Test live URL. Successful live retrieval helps establish availability from the inspection service; it does not guarantee processing by the sitemap crawler. Record the submission/last-read timestamps and any detailed HTTP error for further diagnosis.

Google says it retries failed fetches for a few days and may stop after continued failures; resubmitting creates a new fetch request. Do not repeatedly rename/delete sitemap files, request indexing of the XML itself, or remove the ownership verification tag. Reference: [Google Sitemaps report and fetch troubleshooting](https://support.google.com/webmasters/answer/7451001?hl=en).


## Custom domain launch — 10 November 2026

For public wording and client inquiry guidance, see the [10 November content review](review/content-review-2026-11-10.md). The content uses concrete service descriptions and verified experience while retaining the Cebu Web Developer positioning. Punctuation preferences are editorial choices, not AI-detection or ranking signals we can guarantee.

The canonical origin is now `https://johnsemblante.com`. `src/content/site.ts` supplies the base for page canonicals, Open Graph URLs/images, structured data, robots discovery and the sitemap. The deployment still targets Firebase site `johnmsemblanteapp`; it does not require a new project or moving data. The live SEO audit defaults to the new domain.

Firebase reported active domain ownership, hosting and certificate. Initial HTTPS retrieval returned Firebase's Site Not Found, while later direct requests returned the existing portfolio before any new deployment. This is consistent with domain routing propagation; no broken Next.js route or empty export was found. The apex A record resolves to `199.36.158.100`, the ownership TXT identifies the existing site, and no AAAA record was present during inspection. Keep DNS changes aligned with the Firebase domain wizard; a rebuild cannot fix an unconnected hostname. Reference: [Firebase custom-domain setup](https://firebase.google.com/docs/hosting/custom-domain).

The old Firebase hostnames remain available and serve the same export with custom-domain canonicals. No host-wide redirect is configured: Firebase Hosting path redirects apply across this site's domains, so a catch-all redirect to the custom domain would loop on that domain. Existing article-slug redirects remain. `www.johnsemblante.com` currently has no DNS record or Hosting connection; configure it separately as an apex redirect before use.

Add and verify the new URL-prefix property in Search Console, submit `https://johnsemblante.com/sitemap.xml`, and inspect the homepage there. Keep the existing verification tag; use the new property's supplied verification method if it does not accept the existing tag. Earlier sitemap troubleshooting above refers to the old Firebase property, not a verified result for this new domain. Update public profile links to the new domain. Indexing, canonical selection and rankings are controlled by Google.

Custom-domain admin access additionally requires Firebase Authentication's authorized domains and the two Cloudflare Worker CORS allowlists. The release adds the apex domain without removing the existing Firebase or local-development entries. Do not change project IDs, Firestore data, Cloudinary secrets or the working Firebase auth handler domain just to change the public site URL.

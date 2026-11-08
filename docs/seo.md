# SEO setup and editing guide

This guide covers the technical SEO audit and implementation of 6 November 2026 (Asia/Manila). The current production domain is **https://johnmsemblanteapp.web.app**. These changes need a production build and Hosting deployment before they become live.

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

1. Add a **URL-prefix** property for exactly `https://johnmsemblanteapp.web.app/`.
2. If the property is not already verified, choose the HTML tag method. Put only its content value in `GOOGLE_SITE_VERIFICATION` in the ignored build environment, then rebuild and deploy before pressing Verify. An absent verification meta tag does not prove the property is unverified; another verification method may already have been used.
3. In **Sitemaps**, submit `https://johnmsemblanteapp.web.app/sitemap.xml`.
4. Inspect `https://johnmsemblanteapp.web.app/` with **URL Inspection**. Record the actual indexed/not-indexed reason, Google's selected canonical, and any last crawl information.
5. Use **Test live URL**. If eligible, use **Request indexing**. Also inspect Work, About, and a clean `/blog/slug/` article URL. Do not repeatedly request the same unchanged page.
6. Monitor the Page indexing report. If Google reports ?Discovered ? currently not indexed? or ?Crawled ? currently not indexed?, use that exact report to decide the next step rather than changing robots settings at random. Add the website URL to your own public professional profiles when appropriate; the site code cannot edit those profiles.

Search Console ownership verification, sitemap submission and requests for indexing have not been completed by the code changes. Google decides whether and when to index and serve a page; neither an index/follow directive nor submitting a sitemap guarantees it. Do not use paid indexing services or the restricted Google Indexing API for ordinary portfolio/blog pages.

References: [Google technical eligibility](https://developers.google.com/search/docs/essentials/technical), [ownership verification](https://support.google.com/webmasters/answer/9008080), [requesting a recrawl](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

### Live deployment status for the recheck

The owner-supplied HTML verification tag was configured in ignored `.env.local`, built and deployed to Firebase Hosting on 6 November 2026. A live HTTPS fetch confirmed the exact tag, the full-name homepage title/H1, index/follow metadata and absence of a public noindex response header. The deployed homepage, blog, sitemap, robots.txt, article page, social image and admin asset matched the local build. This deployment also includes the prepared clean article sharing controls.

The token is a public ownership-verification value; passwords and Google login codes were not used. Keep `GOOGLE_SITE_VERIFICATION` in the build environment on every computer/CI job that deploys this site, otherwise a later build can remove the verification tag. The owner confirmed **Ownership verified** using the HTML tag method on 6 November 2026. Keep that meta tag in subsequent deployments. Sitemap submission success and Google indexing status have not yet been confirmed; those require the corresponding Search Console results.

## Current positioning and keyword plan

The canonical current title is **WordPress/Full Stack Developer**, defined once as `professionalTitle` in `src/content/profile.ts`. The profile title/headline, current employment label, homepage title and hero, portrait illustration, footer, metadata image description and Person jobTitle use this shared value. Historical employer titles and project-specific technologies retain their factual meanings; a skill category such as Front-end is not another current job title. To regenerate the branded image after changing the title, run `node scripts/generate-social-card.cjs`, inspect the PNG, rebuild and deploy.

The homepage title is now **John Clark Semblante | WordPress/Full Stack Developer**. The Work page targets portfolio/project searches, while About and Contact have distinct name-based titles. Avoid adding the same keyword list to every title or repeating the brand suffix. The site's canonical domain and existing project/article slugs do not change for keyword targeting.

Suggested search phrases below are based on your documented skills and location, **not measured search volume, competition or a ranking guarantee**:

| Search intent | Suggested phrases | Best existing destination / supporting content |
| --- | --- | --- |
| Find you by name | John Clark Semblante; John Semblante; John Clark Semblante portfolio | Homepage, with your full name, current role and introduction |
| Assess your work | John Clark Semblante works; John Clark Semblante projects; WordPress developer portfolio | Work page, actual client/venture records, screenshots and case studies |
| Find a local developer | WordPress developer Cebu; WordPress developer Philippines | Homepage introduction and service copy, location and genuine project evidence |
| Hire remotely | remote WordPress developer Philippines; WordPress full stack developer | Homepage/profile/contact, plus documented collaboration experience |
| Find a specific skill | custom WordPress development; Figma to WordPress developer; WooCommerce developer Philippines | Existing service sections, relevant experience and verified project write-ups |
| Learn or solve a problem | Concrete WordPress troubleshooting or implementation questions you have actually solved | Helpful blog articles with steps, code, limitations and a relevant project example |

Use **portfolio**, not ?portfoio,? in your site content. ?Works? is a reasonable branded query, but ?portfolio? and ?projects? make more natural headings. Generic ?WordPress developer? is broader than the branded/local phrases; use it naturally alongside your name and Cebu/Philippines context rather than assuming a new portfolio will immediately rank for it.

No HTML meta-keywords tag is added: [Google says it does not affect indexing or ranking](https://developers.google.com/search/docs/crawling-indexing/special-tags). Titles, headings, useful text, descriptive internal links and real project evidence are the implementation focus. [Google recommends clear, concise titles without keyword stuffing](https://developers.google.com/search/docs/appearance/title-link).

Next steps after Google begins showing data: review Search Console Performance queries and landing pages, compare branded versus service/location searches, and refine the pages that already match the intent. Expand real case studies with your contributions and technologies; do not add invented results or claim every historical website used the modern full-stack tools. Build a few useful articles from actual WordPress, WooCommerce, Figma implementation or website debugging work rather than creating many thin keyword landing pages.

## Live browser content versus deployed SEO HTML

Clean article pages now pre-render the snapshot and refresh the visible article from Firestore on load, focus, visibility changes and a 60-second visible-page interval. Saves and the admin Overview's **Refresh live blog content** action request fresh reads in other public tabs in the same browser. This fixes saved edits appearing stale to readers without requiring a rebuild for every visible text edit. The page keeps a consistent canonical and updates its browser metadata and structured data with the live public article.

The initial HTML and previews fetched without JavaScript remain build-time copies. Rebuild and deploy to update those SEO/social copies, create clean URLs for new articles, update sitemap entries, or remove old published HTML. A refresh button cannot purge Google/social caches or replace a Hosting deployment. If a network refresh fails, readers see the last available copy with a warning; if the server confirms the article is no longer public, the rendered article is hidden and client metadata is marked noindex. This does not remove the deployed HTML from the server.

## Venture and Work sharing image priority

Single venture pages use `venture.logo` for both Open Graph and Twitter previews. When the logo is absent or its URL is blank, they use `site.socialImage`; a gallery/hero photo is not substituted. Work detail pages use `project.image`, falling back to `site.socialImage` when no usable image URL is configured. The default is `public/images/seo/john-semblante-social.png`. This fallback is selected at build time for missing/blank configuration; a social platform cannot automatically switch to it if a configured external URL later fails. Rebuild and redeploy after changing these fields. Previously shared previews may remain cached by the social platform until it fetches the URL again.

## Managed Works publishing

Production builds now export the merged source/managed Work collection to clean detail routes, industry lists, homepage project sections and the sitemap. Public Work explorers and detail views refresh published data after hydration. Newly published projects have an instant `/work/?project=slug` view until a rebuild/deploy creates their clean URL. Share the clean URL after deployment for project-specific social metadata. As with blog posts, editing, drafting or deleting a Work requires rebuild/deployment to update or remove its initial HTML; browser refresh cannot remove an old exported file. See [Works administration](works-admin.md).

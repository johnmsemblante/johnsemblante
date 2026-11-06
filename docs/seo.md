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

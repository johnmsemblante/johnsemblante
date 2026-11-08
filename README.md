# John Semblante — Portfolio & Ventures

A portfolio for John Clark Semblante, a WordPress/Full Stack Developer based in Cebu, Philippines, covering WordPress development services, with public projects, confidential experience summaries, independent pages for Lazy Barista, Golden Travel and Tours, and Lapse Hub, and a blog for development notes.

- **Live website:** https://johnmsemblanteapp.web.app/
- **Repository:** https://github.com/johnmsemblante/johnsemblante
- **Firebase project and Hosting site:** `johnmsemblanteapp`
- **Production branch:** `main`
- **Architecture:** Next.js App Router, TypeScript, Tailwind CSS, and a static export hosted on Firebase Hosting.

The website is live and search indexing is enabled. `johnsemblante.com` is the intended future custom domain; the current canonical URL is the Firebase URL above.

## SEO and publishing

See the [SEO audit and editing guide](docs/seo.md) for findings, meta title/description and social image settings, canonical URLs, article formatting, sitemap/indexing rules, and free Search Console setup.

Builds now export published dashboard articles to clean `/blog/slug/` pages with HTML and metadata. The instant `/blog/?post=slug` view remains available. **Rebuild and deploy after publishing, editing, unpublishing or deleting:** previously exported article copies stay public until redeployment. No paid SEO service or Firebase billing upgrade is required.

Public article views now refresh saved content automatically on load, focus and while visible. The admin Overview includes **Refresh live blog content** for open tabs in the same browser. SEO/social HTML still updates through a build and Hosting deployment. See the [live update details](docs/admin-setup.md#live-article-updates-and-dashboard-refresh).

Run `npm run test:seo`, `npm run build`, and `npm run audit:seo` before deploying. `npm run sync:blog` refreshes the public snapshot for local development; it reads anonymously using the public project ID, with no admin credentials. See the guide for the complete workflow and limitations.

Current professional title is maintained in `src/content/profile.ts`. See the [positioning and keyword plan](docs/seo.md#current-positioning-and-keyword-plan) for target search phrases, page mapping and editing guidance.

## 1. Quick start

Run commands from the `johnsemblante` checkout on the computer you are using. This machine uses the path below; the other device uses `D:\Personal\Sites\johnsemblante`.

```powershell
cd "C:\Users\johnm\Documents\ChatGPT\johnsemblante"
npm ci
npm run dev
```

Open http://localhost:3000. Leave the terminal running while editing. Most saved source changes appear automatically. Press **Ctrl+C** to stop the server.

The public portfolio does not need XAMPP, Apache, PHP, a database, or Firebase credentials to run locally. Admin access and managed blog publishing require the optional Firebase setup in [admin-setup.md](docs/admin-setup.md). The old site at `C:\xampp\htdocs\sites\johnmsemblanteapp` is historical; deploy this repository's `out/` folder instead.

### On a new computer

Install Node.js with npm and Git first. The installed Next.js version requires Node.js 20.9 or newer; prefer a currently supported Node.js LTS version compatible with the dependencies. Check your versions:

```powershell
node --version
npm --version
git --version
```

Then clone and install:

```powershell
git clone https://github.com/johnmsemblante/johnsemblante.git
cd johnsemblante
npm ci
npm run dev
```

Use `npm ci` to install the versions in `package-lock.json`. The source-based public pages work without an `.env` file. To reproduce the production admin, managed blog and Job Finder setup, restore the public Firebase configuration and feed endpoint in ignored `.env.local` using [admin setup](docs/admin-setup.md). Preserve `GOOGLE_SITE_VERIFICATION` in every production build environment to keep the deployed Google ownership tag. Do not commit environment files or credentials. Firebase CLI sign-in is needed for deployment, not ordinary public-page development.

## 2. Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependencies on a fresh checkout or after lockfile changes. |
| `npm run dev` | Start development at port 3000, with source updates. |
| `npm run typecheck` | Check TypeScript without publishing anything. |
| `npm run build` | Fetch public blog and Works snapshots, compile, check TypeScript, and export the production site to `out/`. |
| `npm run audit:seo` | Check metadata, canonicals, headings, images, sitemap and private-page indexing in the current export. |
| `npm run audit:seo:live` | Check the deployed sitemap/robots responses, crawler-file redirects and every listed page. Requires network access. |
| `npm run sync:blog` | Refresh the anonymous public article snapshot for local development; also runs during build. |
| `npm run test:forms` | Check confirmed submission/reset and failure preservation using mocked delivery. |
| `npm run test:blog` | Check blog models, loading, editing, formatting, layout and live refresh. |
| `npm run test:admin` | Check dashboard access/navigation, Job Finder and the feed Worker. |
| `npm run test:work` | Check portfolio data, search and grouped filter behavior. |
| `npm run test:work-admin` | Check Works validation, public merging/reads, transactions and server-side uploads. |
| `npm run test:ventures` | Check ventures, gallery data and detail-page sharing image selection. |
| `npm run test:seo` | Check SEO metadata and static article export behavior. |
| `npm run test:rules` | Check Firestore access rules against a local emulator; see admin setup. |
| `npm run preview` | Serve the existing `out/` build at http://127.0.0.1:3100. |
| `git diff --check` | Check pending changes for whitespace errors. |

Run `npm run build` **before** `npm run preview`. Static preview does not watch source changes: rebuild and refresh after editing. Keep its terminal open and stop it with Ctrl+C. This lightweight preview does not emulate Firebase's redirects or headers.

There is no `npm start` or lint script. Blog, dashboard/Job Finder and Firestore access-rule tests are available as `npm run test:blog`, `npm run test:admin` and `npm run test:rules`; see [admin setup](docs/admin-setup.md). The scripts use Webpack because Turbopack's CSS worker had problems in the original Windows environment.

## 3. Where to edit content

Portfolio and venture baseline content lives in TypeScript files. Works can also be managed at `/adminauth/works/`; see [Works administration](docs/works-admin.md). Managed blog posts can be created and edited at `/adminauth/blog/` using Firebase Authentication and Firestore; see [admin setup](docs/admin-setup.md). The source-based blog remains supported separately. Preserve the surrounding quotes, commas, arrays, and braces. Use the existing entries as templates, save, then check the affected page locally.

| What you want to change | File or directory |
| --- | --- |
| Name, live domain, general description, public email and phone | `src/content/site.ts` |
| Biography, title, skills, experience, education, portrait and personal social links | `src/content/profile.ts` |
| Portfolio projects, images, dates, descriptions and website links | `/adminauth/works/`; source baseline in `src/content/projects.ts` |
| Blog posts and drafts | `src/content/blog.ts` |
| Lazy Barista menu, prices, images, ordering instructions and contacts | `src/ventures/lazy-barista/content.ts` |
| Golden Travel services, brand information and contacts | `src/ventures/golden-travel-and-tours/content.ts` |
| Lapse Hub photography story and Flickr gallery links | `src/ventures/lapse-hub/content.ts`; see [Lapse Hub guide](docs/lapse-hub.md) |
| Venture registration and shared data shape | `src/ventures/registry.ts`, `src/ventures/types.ts` |
| Personal photos and project screenshots | `public/images/profile/`, `public/images/projects/` |
| Business logos, artwork and drink photos | `public/ventures/` |
| Shared styling, colors, typography and responsive layouts | `src/app/globals.css` |
| Navigation and footer | `src/components/site-navigation.tsx`, `src/components/site-shell.tsx` |
| Contact form UI and delivery handling | `src/components/inquiry-form.tsx`, `src/lib/submit-inquiry.ts` |
| Homepage service offers | `src/components/development-services.tsx` |
| Skills descriptions, categories and icons | `src/content/skill-details.ts`, `public/icons/skills/` |
| Confidential experience overview | `src/components/experience-spotlight.tsx` |
| Shared hero canvas and page-specific images | `src/components/browser-illustration.tsx` and each page's `BrowserIllustration` props |
| Browser and Apple home-screen icons | `src/app/icon.svg`, `src/app/favicon.ico`, `src/app/apple-icon.png` |
| Image lightbox and gallery interaction | `src/components/zoom-image.tsx` |

### About and experience

Edit the `experience` array in `profile.ts`. Each company has `company`, `role`, `dates`, and a `responsibilities` list. Each list item becomes a bullet. Entries appear in array order, so keep the most recent job first.

The current bullets are based on John's supplied resume and edited for clarity without adding unverified results. Update the source file when the resume changes; the website does not automatically read the PDF. The full resume is not published because it contains reference contacts and a residential address.

### Portfolio projects and case studies

Manage projects at `/adminauth/works/`: add, edit, draft, publish and delete works through a full-width library and right-side editor. Existing local image paths are preserved; featured images can be uploaded through the admin-only Cloudflare service to Cloudinary, or entered as URLs. The browser and upload service enforce a 5 MB limit for JPG/PNG/WebP/AVIF. Gallery images accept URLs and captions. See [Works administration](docs/works-admin.md) for setup, quotas, tests and publishing limits. The instructions below describe the source baseline; managed records override source entries by slug. Rebuild/deploy after public changes to update clean detail pages, the homepage, SEO/social HTML and sitemap. The public Work directory and detail views also refresh published data on load/focus and while visible.

The `entries` array in `projects.ts` uses this order:

```text
[slug, title, year, screenshotFilename, websiteURL, summary, technologies]
```

To add a project, add its screenshot under `public/images/projects/`, then add an entry in that format. Use a unique lowercase slug with hyphens. The project list and `/work/your-slug/` page are generated from the content at build time.

The `Project` type in `site.ts` also supports optional `challenge`, `approach`, and `outcome` fields. The current tuple mapper does not populate these fields: extend the mapped objects or refactor entries to typed project objects when adding detailed case studies. The detail page already renders supplied fields. Do not invent client results or statistics.

Keep published slugs stable. Renaming one changes its URL and requires a redirect if old links should continue working.

### Blog: draft, preview and publish

For normal publishing, use **Blog Management** at `/adminauth/blog/`. Its full-width post library opens a right-side editor for new or selected posts. The editor generates slugs, accepts comma-separated categories/tags (including pasted lists), and supports featured-image URLs, Write/Preview formatting, image/file URLs, SEO overrides, drafts, publishing, future Manila-time scheduling and confirmed deletion. Featured images appear beside article details in full-width blog rows, with the site logo for empty or broken card images. Compact tags follow the Work card style. The article toolbar supports H2/H3, emphasis, lists, quotes, code and links; it is a Markdown editor with preview. Direct file uploads are not enabled.

After saving, readers receive live database updates; rebuild and deploy to update initial HTML, social previews, the sitemap and clean article routes. Share `/blog/your-slug/` after that deployment. Legacy `?post=` links retain generic initial sharing metadata. See [admin setup](docs/admin-setup.md) and [SEO publishing](docs/seo.md) for the exact workflow, scheduling and refresh limitations.

The steps below apply only to the separate **source-based articles**, not dashboard records:

1. Open `src/content/blog.ts` and duplicate the starter object inside `posts`.
2. Set a unique slug, title, excerpt and category.
3. Keep `status: "draft"` while writing.
4. Add plain-text body blocks: `paragraph`, `heading`, `quote`, or `list`.
5. Add a real publication date in `YYYY-MM-DD` format and change status to `published` when ready.
6. Check `/blog/` and `/blog/your-slug/` locally, then build and deploy.

```ts
body: [
  { type: "paragraph", text: "Your introduction." },
  { type: "heading", text: "What I learned" },
  { type: "list", items: ["First point", "Second point"] },
  { type: "quote", text: "Your quotation." },
]
```

This is structured text, not Markdown or HTML. Drafts are excluded from pages and the sitemap, including during development. To preview an article locally, temporarily set it to published with a valid date; restore draft status before deployment if it is unfinished. A future date does not schedule publication: status controls inclusion. Draft text committed to a public GitHub repository is still visible in source.

See [the writing guide](docs/writing.md) for more detail.

### Lazy Barista menu and photos

Edit `offerings` in the Lazy Barista content file. Each drink has a title, description, numeric PHP price, and optional image with `src`, `alt`, `width`, and `height`. Enter `120`, not a currency-formatted string; the page formats pesos.

The six individual drink photos were cropped from the supplied menu artwork. Crop source coordinates are recorded in [drink-photo-crops.json](docs/review/drink-photo-crops.json). Their original price badges remain visible. **When changing prices, update both the text price and any artwork/photo showing the old price.** Update the full menu artwork too if it changes.

Phone and social links are managed independently for each venture. Confirm ordering information before publishing. Golden Travel does not currently publish package prices or guaranteed vehicle availability. Edit its `vehicles` array in `src/ventures/golden-travel-and-tours/content.ts` to change vehicle names and images; the shared renderer builds the cards and image gallery from that data.

### Images

Put public assets in `public/` and reference them without the `public` prefix:

```text
File: public/ventures/lazy-barista/huwat-sa.webp
URL:  /ventures/lazy-barista/huwat-sa.webp
```

Use descriptive lowercase filenames, meaningful alt text, and actual image dimensions. Compress large images before adding them; the static export uses unoptimized Next.js images and has no server image optimizer. Preserve original source artwork outside the repository. Only public-ready assets belong in `public/`, since everything there can be downloaded by visitors.

## 4. Project structure and routes

```text
src/
  app/
    (portfolio)/          Home, About, Work, Blog, Contact, Ventures directory
    ventures/[venture]/   Independent venture landing routes
    adminauth/            Google sign-in, dashboard, Blog, Works and Job Finder
    layout.tsx            Root metadata and global stylesheet
    robots.ts             Search crawler rules
    sitemap.ts            Generated published-page sitemap
  components/             Shared layout and interactive UI
  content/                Personal profile, projects, blog and site settings
  lib/metadata.ts         Portfolio metadata helper
  ventures/               Venture registry, content, types and presentation
public/                   Public images and assets
scripts/preview.mjs       Local static-export preview server
scripts/sync-blog-snapshot.cjs  Anonymous public article snapshot for builds
scripts/sync-works.cjs     Anonymous public Works overrides for builds
tests/                    Automated checks for forms, blog, admin, work and SEO
workers/job-feed/         Separate Cloudflare Worker for the Himalayas feed
workers/media-upload/     Admin-only Cloudinary image upload service
docs/                     Writing and source/review notes
firebase.json             Hosting folder, site and response headers
.firebaserc               Default Firebase project
next.config.ts            Production static export configuration
```

Public routes include `/`, `/about/`, `/work/`, `/work/[slug]/`, `/work/industry/[industry]/`, `/blog/`, `/blog/[slug]/`, `/contact/`, `/ventures/`, `/ventures/lazy-barista/`, `/ventures/golden-travel-and-tours/`, and `/ventures/lapse-hub/`. Clean blog article routes are exported for source-published and publicly released managed entries at build time. `/adminauth/`, `/adminauth/blog/`, `/adminauth/works/` and `/adminauth/jobs/` are excluded from indexing; Firebase authorization protects private records.

The `(portfolio)` directory is a layout group and does not appear in URLs. Venture pages have separate presentation from the portfolio shell. Most components render at build time; navigation, filtering and the inquiry form use client components for interaction.

## 5. Contact form: Formspree email delivery

The contact form uses the public endpoint in `site.contactFormEndpoint` in `src/content/site.ts`. The current endpoint is `https://formspree.io/f/xwllnvev`. Formspree controls the notification recipient; the intended inbox is `johnmsemblante@gmail.com`.

With JavaScript enabled, the form submits in place and shows success only after Formspree acknowledges the submission. Fields and the submit button are disabled while sending. Failed requests preserve the input and show retry/direct-email guidance. A 20-second timeout prevents an indefinite loading state; no request is automatically retried. Confirmed submissions clear the visitor's name, email and message, including any prefilled itinerary, and restore the form's contextual default topic. A confirmed travel inquiry also resets the itinerary planner, package/customization choices, extra stops and optional fields; its success message remains visible. Reviewing an itinerary does not clear it. Search/filter forms and saved admin editing screens retain their working state. Run `npm run test:forms` for mocked submission/reset checks; no real inquiries are sent by those tests. Native POST remains as a no-JavaScript fallback. The email field supplies Reply-To. The honeypot uses Formspree's `_gotcha` field; additional spam settings are managed in Formspree.

### Verify delivery

Check the form's Email workflow in Formspree and confirm the intended inbox is verified. After deploying, submit a clearly labeled test, confirm the on-page success message and dashboard entry, then verify the inbox notification and Reply-To. API acceptance does not prove inbox delivery. If Formspree imposes a CAPTCHA, domain restriction, or quota, resolve it in the dashboard; do not disable protections blindly.

### Change the recipient

Update and verify the notification address in the Formspree dashboard (form Workflow → Email settings). Also edit `site.email` and redeploy to update the website's visible address and direct-email links. Changing `site.email` alone does **not** change the Formspree recipient. The endpoint can remain the same when only the recipient changes. Never put email passwords or private API keys in source code.

FormSubmit is no longer used. Reference: https://help.formspree.io/articles/form-and-project-settings/changing-a-form-email-address/

### Typography

Montserrat is loaded through `next/font/google` and self-hosted in the exported build. The build needs network access to download the font; visitors receive the bundled files from this website. Body text, headings, navigation, and controls use Montserrat. Decorative monograms and code-style illustrations retain their artwork styling.

## 6. Deploy to the live Firebase site

### One-time setup on a computer

Install the Firebase CLI and sign in with an account that can deploy to this project:

```powershell
npm install -g firebase-tools
firebase login
firebase hosting:sites:list --project johnmsemblanteapp
```

Verify the listed site is `johnmsemblanteapp`. The repository already contains `firebase.json` and `.firebaserc`; you do not need to run `firebase init` or copy configuration from the old XAMPP project.

### Every release

Run each step only after the previous one succeeds:

```powershell
npm run typecheck
npm run build
npm run audit:seo
npm run preview
```

Run the feature tests relevant to the change from the commands table, and update this README or its linked guides when behavior, configuration, content editing or release steps change. Review the production preview, then stop it with Ctrl+C. Check mobile and desktop layouts, navigation, keyboard focus, images, contact form validation, modified content, and an invalid URL's 404 page. Use mocked delivery for routine inquiry checks; send a real test inquiry only with explicit authorization.

Save the reviewed changes to GitHub:

```powershell
git status
git diff --check
git add <reviewed-files>
git commit -m "Describe the website changes"
git push origin main
```

Inspect `git status` before staging to avoid including unrelated files. If there are no changes, skip the add/commit steps. Pushing to GitHub does **not** automatically deploy this project.

Replace `<reviewed-files>` with the actual paths being released. A normal frontend/documentation release deploys Hosting only. Deploy Firestore rules/indexes, Auth configuration or the Cloudflare Worker separately only when those components changed; see the admin guide. A README update alone does not require backend deployment.

Publish the build:

```powershell
firebase deploy --only hosting --project johnmsemblanteapp
```

This replaces the live website at https://johnmsemblanteapp.web.app/. Wait for `Deploy complete!`, then open the live pages and verify the changes. The CLI uploads the existing `out/` directory; it does not run the build for you. Never deploy after a failed build, because an older export may still exist.

Firebase serves real exported page files with trailing slashes and a real 404 response. Do not add the old site's catch-all `/index.html` SPA rewrite. Hashed Next.js static assets use long-lived immutable caching.

After deploying, run `npm run audit:seo:live`. The canonical crawler files are `/sitemap.xml` and `/robots.txt`, without ending slashes; their slash variants redirect to those files. Both crawler files revalidate on requests. A passing live audit confirms current public responses, not successful Google processing or indexing. See [sitemap troubleshooting](docs/seo.md#sitemap-fetch-check---8-november-2026) if Search Console reports Couldn't fetch.

Official reference: [Firebase Hosting deployment workflow](https://firebase.google.com/docs/hosting/test-preview-deploy).

### Undo a bad release

In the [Firebase console](https://console.firebase.google.com/project/johnmsemblanteapp/hosting), open Hosting's release history and use an available previous release's rollback action. This restores hosting content, not Git history. Then correct or revert the source change, build again, and deploy a new release so the repository and live site agree.

## 7. SEO and custom domains

- `src/content/site.ts`: current public base URL, without a trailing slash.
- `src/lib/metadata.ts`: portfolio canonical and social metadata.
- `src/app/layout.tsx`: root title, description and indexing settings.
- `src/app/robots.ts`: allows crawling and links the sitemap.
- `src/app/sitemap.ts`: generates URLs for pages, projects, ventures and published posts.
- Venture route metadata: individual titles, descriptions, canonicals and brand images.

To launch `johnsemblante.com`, add and verify it in Firebase Hosting, follow Firebase's DNS instructions, and wait for HTTPS to work. Then update `site.url`, rebuild and deploy. Confirm canonicals, sitemap and social image URLs use the chosen domain. Changing the string alone does not connect a domain.

## 8. Moving a venture to its own website

Each venture's content and assets are grouped together, but the shared renderer, CSS and navigation still need adapting:

1. Copy its content, types, relevant assets, shared landing component and needed styles into the new application.
2. Mount the landing page at `/` and update asset paths and portfolio-relative links.
3. Configure the new site's metadata and social-image domain. `canonicalBase` overrides the current venture canonical URL only; it does not move hosting or rewrite links/images.
4. Deploy and verify the independent site.
5. Add a permanent redirect from the old venture URL in Firebase and update the portfolio's venture link.

## 9. Troubleshooting and maintenance

| Problem | What to do |
| --- | --- |
| Port 3000 is busy | Stop your existing dev server or use `npm run dev -- --port 3001`. |
| Preview fails or shows old content | Run a successful `npm run build` first; preview reads only `out/`. |
| An image is missing | Check spelling/case, its file under `public/`, and its URL without the `public` prefix. |
| A blog post is missing | Check published status, valid date, unique slug and required content; rebuild for production. |
| Firebase permission/authentication error | Run `firebase login --reauth` and verify the account has access to `johnmsemblanteapp`. |
| PowerShell blocks npm/firebase script shims | Use `npm.cmd` or `firebase.cmd` with the same arguments. |
| Live content appears unchanged | Confirm you rebuilt the correct checkout, deployed the correct project, and refresh the live page. |
| TypeScript/build fails | Fix the first reported error, rerun the check, and deploy only after success. |

Keep `package-lock.json` committed. Package declarations currently use broad ranges, including `latest` for Next.js and React; dependency updates should be intentional and followed by build and browser checks. Keep `.env` files, credentials, `node_modules/`, `.next/`, `out/`, and Firebase local caches out of Git as configured in `.gitignore`.

Regularly verify external portfolio links, business contact information, prices and image licenses. Add only confirmed experience, projects and business information. Keep the source notes in `docs/review/` aligned with meaningful asset/content changes.

### Skills toolkit

The About page groups all entries from `profile.skills`, `profile.languages`, and `profile.tools`. Edit descriptions, category, and icon keys in `src/content/skill-details.ts` when adding or changing an item. Local SVGs live in `public/icons/skills/`; their provenance is recorded in `docs/review/skill-icon-sources.json`. Broader skills and unavailable brand icons use original generic symbols, with visible text labels. Tooltips support hover, keyboard focus, tap, and Escape.

### Confidential experience spotlight

The Work page includes a general experience spotlight above the public project list. Edit its public copy in `src/components/experience-spotlight.tsx`. Its contact link selects the “Discuss relevant experience” topic without submitting anything. It does not expose or unlock private case studies. Do not add client identities, URLs, screenshots, source files, or project-specific claims without appropriate disclosure permission. Protected material must not be placed in the static export or public repository.

## 10. Updates — 30 October 2026

### Interface and navigation

- Modern image lightbox with a frameless presentation, captions, related-image thumbnails, previous/next navigation, and keyboard controls. Venture drink photos, menu artwork, and vehicle images use appropriate groups.
- Sticky portfolio and venture headers keep navigation available while scrolling. Mobile menus start closed and use an animated hamburger-to-X button to open and close the links.
- Montserrat is used across the website through bundled font files.
- The About page groups skills and technologies with local icons and accessible tooltips. John's manual restyling places the rounded tooltip above its card with a small pointer; that styling is preserved in this release.
- The Work page includes an Experience spotlight that describes capabilities without publishing confidential client identities or assets.

### Content and inquiries

- Refreshed homepage, About, Work, Contact, Blog, venture pages, shared calls to action, and metadata to make services and next steps clearer.
- Added three homepage service offers: Figma to WordPress, WooCommerce development, and website fixes and improvements.
- Kept historical project dates, supplied experience, and venture prices/contact information. Removed unsupported promotional claims and kept unpublished articles as drafts. See [the content review](docs/review/content-review-2026-10-30.md) for scope and facts still needing owner confirmation.
- Replaced FormSubmit after its host error with Formspree endpoint `https://formspree.io/f/xwllnvev`. Visitors receive inline sending, success, or error feedback. Failed submissions retain their message, and the form includes a direct-email alternative.
- Documented how to change the Formspree recipient separately from the website's public email address, and corrected local setup and vehicle-editing instructions.

### Verification and release notes

John manually committed and published earlier changes today. This release builds on those commits and includes the remaining content refresh, Formspree integration, documentation, and his tooltip styling.

One owner-authorized inquiry from the local browser preview was accepted by Formspree on 30 October 2026. Sending/success feedback and form reset were verified. Simulated host errors, rate limiting, validation rejection, network interruption, and missing/invalid acknowledgements were also checked. **Inbox notification receipt and Reply-To still require owner confirmation**; an accepted submission alone does not prove email delivery.

Use the release steps above to type-check, build, commit, push, and deploy. GitHub and Firebase Hosting are separate steps; a Git push does not publish the website.


## 11. Updates — 31 October 2026

### Hero canvases

The Home, Work, and Ventures directory hero illustrations share `src/components/browser-illustration.tsx`. Each keeps the illustrated browser/phone composition and now uses square, borderless browser-window styling without the outer shadow.

- **Home:** the enhanced portrait beside John's name and Full Stack Developer role. The image comes from `profile.portrait`; the displayed name and hero role copy are configured in the homepage/component.
- **Work:** Roar Fitness and Perth Cosmetic Surgery screenshots. Edit the ordered `heroProjects` slug selection in `src/app/(portfolio)/work/page.tsx`; image paths and names are read from the public project content.
- **Ventures directory:** Golden Travel and Tours and Lazy Barista logos. Edit the ordered `heroBrands` slug selection in `src/app/(portfolio)/ventures/page.tsx`; logos and names come from the venture registry. This is the `/ventures/` hero, not the individual business landing pages.

`BrowserIllustration` accepts either a `portrait` or `showcase` configuration. A showcase supplies its kind, label, caption and image list. Keep the two modes mutually exclusive. Images in these canvases are illustrative rather than links or lightbox triggers; the project and venture collections below provide navigation. Use existing source images rather than embedding duplicate assets.

### Enhanced portrait and sizing

`public/images/profile/john-enhanced.webp` is the current shared portrait. It is an AI-enhanced 1103 × 1426 version of the original 247 × 319 image, **not true 4K/UHD**. Reconstructed detail should not be described as recovered photographic detail. The original stays at `public/images/profile/john-resume.jpg` through `profile.resumePortrait`.

The enhanced image is used in the About hero, homepage About section, and homepage canvas. The About portrait displays up to 460px wide on desktop; the homepage About image up to 340px. Responsive rules reduce these sizes on smaller screens. Portraits retain their proportions, square edges, and borderless treatment. See [portrait enhancement notes](docs/review/portrait-enhancement.md).

To replace the portrait again, update `profile.portrait` in `src/content/profile.ts` and the image width/height attributes in the About page, homepage, and browser illustration. Update any aspect ratio in `.home-portrait` if the new crop changes. Keep public image filenames versioned when changing files to avoid stale browser caches.

### Profile updates and icons

John's profile title is now Full Stack Developer. The education list includes Banilad Elementary School (1999–2005), Saint Louis School of Mandaue (2005–2009), and University of Lapu-Lapu and Mandaue (2009–2013), as supplied in his local profile update. These additions supplement the resume-based career content.

The existing `js.` site mark is available as an SVG favicon, a multi-size ICO fallback, and an Apple touch icon. Next.js adds their metadata links automatically from `src/app/`; there is no separate favicon service. After icon changes, a browser tab may need reopening to refresh its cached icon.

### Verification scope

The October 31 changes were checked with production builds, TypeScript checks, and exported HTML/image references. Visual browser interaction review was unavailable in this chat for these changes; those checks do not claim a completed visual/mobile review. Use the release checklist before further design changes. The Formspree inbox and Reply-To confirmation noted above remains outstanding unless confirmed separately by the owner.


## 12. Golden Travel trip planner — 1 November 2026

The Golden Travel landing page includes `#trip-estimator`, a client-side itinerary planner. The first selection is **Build my own trip** or **Packages**. Packages reveals a required second selection with all 12 owner-supplied itineraries (1–4 and A–H), their destinations and activities, and an optional customization field. The owner supplied the package list directly on November 1, matching the earlier July list.

All 12 packages currently display **Request quotation** because no complete rate sheet was supplied for these exact itineraries. The planner does not calculate current route prices, reserve vehicles or take payments. Do not apply historical quotations for different routes to these packages.

### Editing the planner

- `src/ventures/golden-travel-and-tours/packages.ts`: package names and stops. Optional `fixedRate` contains an owner-supplied amount in PHP, confirmation date and explicit conditions for that exact itinerary. A published reference is not an automatically adjusted final total.
- `src/ventures/golden-travel-and-tours/trip-estimator.tsx`: the two planning modes, trip fields, customization, extra stops, results and inquiry summary.
- `src/ventures/golden-travel-and-tours/rates.ts`: estimate disclaimer and retained historical quotation records. The historical records no longer populate the selector.
- `src/components/inquiry-form.tsx`: initial topic/message and travel wording. The existing Formspree endpoint handles explicit customer submissions; the contact page uses the same component.

Customers enter pickup/drop-off, travel date/time, passenger count, vehicle preference, journey type, optional hours/luggage, up to five extra stops and notes. Package customization allows requests to add/remove destinations or change activities and schedules. Switching modes clears hidden package/customization and extra-stop state; editing fields clears the previous result.

“Request final quotation” opens a prefilled inquiry for review; it does not submit it. Customers provide their name/email and press Send trip inquiry. No planner input is stored in a database, browser storage or URL. It goes to Formspree only upon inquiry submission.

### Pricing and verification

Fuel/driver inclusions, activity and entrance fees, parking, tolls, boats/ferries, meals, accommodation and overtime require confirmation. No fuel adjustment, per-kilometre rate, live routing or availability guarantee is applied. A listed stop does not promise an attraction is open or that the itinerary fits the requested hours. The team confirms the schedule and whether multiple days are needed.

Keep private Messenger exports, customer contacts and supplier commission arrangements outside the repository. When changing the planner, verify both modes, all 12 packages, customizations, added stops and inquiry summaries. Do not send test inquiries without explicit authorization. Build and logic checks do not replace browser/mobile review or inbox-delivery checks.

### Expandable trip planner

The hero action and navigation open an inline expandable planner below the hero, implemented in `trip-planner.tsx`. Both `#trip-estimator` and `?requestquote` open the planner; hero anchor clicks preserve the fragment in browser history. Closing the section retains input during the current visit.

Pickup, drop-off and extra stops are plain text fields. Customers can freely enter place names, landmarks, hotels or addresses. There is no location autocomplete, map, geocoding service or location API configuration. No planner input is persisted across reloads; the completed itinerary goes to Formspree only when the customer explicitly submits an inquiry.

Travel dates are checked against the current date in Asia/Manila. Package pricing remains manual until verified rates and applicable conditions are supplied. Review both planning modes, all package selections, stop add/remove, direct quotation links and inquiry contents before release. Do not send test inquiries without authorization.


## 13. Admin access and blog editor

`/adminauth/` is the Google sign-in gateway and dashboard for approved administrators. Its shared header and responsive sidebar link to Overview, Blog, Works, Job Finder and Logout. `/adminauth/blog/` preserves adding, editing, previewing, saving drafts, publishing and unpublishing Firestore-backed articles. Admin membership is granted only by a trusted Firebase project operator; signing in alone does not grant access. Firestore rules protect private records and writes.

`/adminauth/jobs/` targets remote work from the Philippines. It supports the free Himalayas feed through a small Cloudflare Worker (Philippines/UTC+8 checks) and the direct Jobicy feed (last seven days). Search shortcuts reflect John's WordPress, WooCommerce, PHP and front-end/full-stack experience. Local skill ordering, disclosed-pay filters, summaries, employment/pay details and private bookmarks help review opportunities. Country/timezone labels remain source data, not a hiring guarantee. Existing Arbeitnow bookmarks are preserved.

The broader feed needs a free Cloudflare account and the public `NEXT_PUBLIC_HIMALAYAS_PROXY_URL` endpoint in ignored `.env.local`; see [connection instructions](docs/admin-setup.md#connecting-the-free-cloudflare-feed). Jobicy works without that configuration. No job API key, portfolio runtime dependency or Firebase billing upgrade is required. Deploy the updated bookmark rules with Hosting; no new composite index is needed.

See [admin-setup.md](docs/admin-setup.md) for Web app configuration, Authentication, security rules/index deployment, admin approval, Job Finder limitations, local tests and static-export SEO limits. No production Firebase settings, users, rules or posts are changed automatically.


### Blog editor improvements

Managed articles now support automatic unique slugs, multiple categories and tags, image/file URL blocks, automatic server publication timestamps, future scheduling in Manila time, confirmed permanent deletion, and optional SEO title/description fallbacks. Future schedules remain private until the server release time. Existing managed articles are upgraded only when saved. See [admin setup and publishing guide](docs/admin-setup.md) for scheduling behavior, media URL support and browser-rendered SEO limits.

## 14. Industry portfolio collections

The Work page keeps all 14 original projects and adds the existing Golden Travel and Tours and Lazy Barista pages as clearly labeled personal ventures. Industry filters work alongside the original technology filters, with shareable query URLs and dedicated `/work/industry/{industry}/` collections. Project cards show industry, type, technologies and case-study/live links; case-study pages support optional documented scope, galleries and SEO overrides.

Dental, real estate and hospitality collections currently show honest empty states. SmileCraft Dental Studio, Haven Property Group, WellSpring Medical Clinic, Coastline Boutique Resort and Northstar Legal Group remain unpublished planning records, without working demo links or invented implementation claims.

See [portfolio-industries.md](docs/portfolio-industries.md) for all nine routes, content fields, changed files, publishing guidance and checks. Run `npm run test:work` for the portfolio tests. No new dependencies, API keys or database setup are required.

The Work directory now adds debounced keyword search, grouped multi-select Industry/Technology/Project Type dropdowns, removable chips, Clear All and **Share these results**. Readable query URLs restore selections and browser history; duplicate/legacy values normalize safely. Industry records and dedicated routes remain intact through a normalization layer. Technology choices come only from verified project fields. See the guide above for aliases, empty states, keyboard controls, clipboard fallback and static-export SEO behavior.

Dropdown options without a match in the other selected groups are now disabled, with live contextual counts. Clicking an option's label or count also checks its checkbox. Search and dropdowns work separately: typing clears dropdown selections; filtering clears the search input. Shared links follow the same rule, with a keyword taking priority over group parameters in older combined URLs.

## 15. Current feature and documentation summary - 6 November 2026

This section describes the current implementation; dated notes above record earlier releases. The current professional title is **WordPress/Full Stack Developer**. Google Search Console ownership was verified by the owner. Crawlability checks passed, but indexing and rankings are Google decisions; the earlier sitemap fetch warning is not a confirmed successful sitemap-processing result.

- **Blog:** the admin library, slide-in editor, automatic slugs and labels, formatting, featured images, scheduling, deletion, SEO overrides and live refresh are implemented. Clean article pages are exported during builds. Dashboard refresh requests new public reads in the same browser; it does not purge a CDN or deploy updated SEO HTML.
- **Work:** original projects remain alongside clearly labeled personal ventures. Keyword search and grouped multi-select filters are separate modes. Unavailable combinations are disabled; clicking an enabled label or count toggles the checkbox and keeps the dropdown open.
- **Ventures:** Lazy Barista, Golden Travel and Tours, and Lapse Hub are live. Lapse Hub uses its Facebook profile logo locally and a curated external Flickr gallery with popup viewing and source links; new Flickr uploads are not automatically imported.
- **Sharing:** venture detail pages use their logo and Work detail pages use their project image. Missing or blank image configuration falls back to `site.socialImage`. Social platforms may cache previews; see the SEO guide.
- **Inquiries:** confirmed Formspree submissions clear name, email and message. Travel submissions also reset planner choices and trip fields while retaining a success notice. Failures and itinerary reviews preserve input. Location fields are plain text, without autocomplete or interactive maps.
- **Travel quotation link:** share [the expanded trip planner](https://johnmsemblanteapp.web.app/ventures/golden-travel-and-tours/#trip-estimator). The planner prepares an inquiry; it does not confirm a booking or take payment.

| Guide | Use it for |
| --- | --- |
| [Admin setup](docs/admin-setup.md) | Google sign-in, approved admins, Firestore, blog editing, scheduling, live refresh and the Cloudflare Job Finder feed. |
| [SEO](docs/seo.md) | Titles/descriptions, sharing images, clean article URLs, build-time publishing, Search Console and keywords. |
| [Writing](docs/writing.md) | Source-based article content and writing guidance. |
| [Portfolio industries](docs/portfolio-industries.md) | Project records, industry collections, grouped filtering and sharing filter results. |
| [Lapse Hub](docs/lapse-hub.md) | Photography story, logo, external gallery, attribution and image hosting. |
| [Works administration](docs/works-admin.md) | Works editor, signed Cloudinary uploads, Firestore rules and release steps. |

Keep this README as the current setup and feature entry point. With each meaningful change, update the affected instructions and linked guide before committing/deploying. Avoid adding credentials, private content or claims of verification that were not performed.

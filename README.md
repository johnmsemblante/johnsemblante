# John Semblante — Portfolio & Ventures

A client-focused portfolio for John Semblante's WordPress and front-end development services, with public projects, confidential experience summaries, independent pages for Lazy Barista and Golden Travel and Tours, and a blog for development notes.

- **Live website:** https://johnmsemblanteapp.web.app/
- **Repository:** https://github.com/johnmsemblante/johnsemblante
- **Firebase project and Hosting site:** `johnmsemblanteapp`
- **Production branch:** `main`
- **Architecture:** Next.js App Router, TypeScript, Tailwind CSS, and a static export hosted on Firebase Hosting.

The website is live and search indexing is enabled. `johnsemblante.com` is the intended future custom domain; the current canonical URL is the Firebase URL above.

## 1. Quick start

Run commands from the `johnsemblante` checkout on the computer you are using. This machine uses the path below; the other device uses `D:\Personal\Sites\johnsemblante`.

```powershell
cd "C:\Users\John Clark Semblante\Documents\ChatGPT\johnsemblante"
npm ci
npm run dev
```

Open http://localhost:3000. Leave the terminal running while editing. Most saved source changes appear automatically. Press **Ctrl+C** to stop the server.

This project does not need XAMPP, Apache, PHP, a database, or Firebase credentials to run locally. The old site at `C:\xampp\htdocs\sites\johnmsemblanteapp` is historical; deploy this repository's `out/` folder instead.

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

Use `npm ci` to install the versions in `package-lock.json`. No `.env` file is required for the current site. Firebase CLI access is only needed when deploying.

## 2. Commands

| Command | Purpose |
| --- | --- |
| `npm ci` | Install the locked dependencies on a fresh checkout or after lockfile changes. |
| `npm run dev` | Start development at port 3000, with source updates. |
| `npm run typecheck` | Check TypeScript without publishing anything. |
| `npm run build` | Compile, check TypeScript, and export the production site to `out/`. |
| `npm run preview` | Serve the existing `out/` build at http://127.0.0.1:3100. |
| `git diff --check` | Check pending changes for whitespace errors. |

Run `npm run build` **before** `npm run preview`. Static preview does not watch source changes: rebuild and refresh after editing. Keep its terminal open and stop it with Ctrl+C. This lightweight preview does not emulate Firebase's redirects or headers.

There is no `npm start`, lint script, or automated test suite configured. The scripts use Webpack because Turbopack's CSS worker had problems in the original Windows environment.

## 3. Where to edit content

Content lives in TypeScript files; there is no CMS or database. Preserve the surrounding quotes, commas, arrays, and braces. Use the existing entries as templates, save, then check the affected page locally.

| What you want to change | File or directory |
| --- | --- |
| Name, live domain, general description, public email and phone | `src/content/site.ts` |
| Biography, title, skills, experience, education, portrait and personal social links | `src/content/profile.ts` |
| Portfolio projects, screenshot filenames, dates, descriptions and website links | `src/content/projects.ts` |
| Blog posts and drafts | `src/content/blog.ts` |
| Lazy Barista menu, prices, images, ordering instructions and contacts | `src/ventures/lazy-barista/content.ts` |
| Golden Travel services, brand information and contacts | `src/ventures/golden-travel-and-tours/content.ts` |
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

The `entries` array in `projects.ts` uses this order:

```text
[slug, title, year, screenshotFilename, websiteURL, summary, technologies]
```

To add a project, add its screenshot under `public/images/projects/`, then add an entry in that format. Use a unique lowercase slug with hyphens. The project list and `/work/your-slug/` page are generated from the content at build time.

The `Project` type in `site.ts` also supports optional `challenge`, `approach`, and `outcome` fields. The current tuple mapper does not populate these fields: extend the mapped objects or refactor entries to typed project objects when adding detailed case studies. The detail page already renders supplied fields. Do not invent client results or statistics.

Keep published slugs stable. Renaming one changes its URL and requires a redirect if old links should continue working.

### Blog: draft, preview and publish

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
    layout.tsx            Root metadata and global stylesheet
    robots.ts             Search crawler rules
    sitemap.ts            Generated published-page sitemap
  components/             Shared layout and interactive UI
  content/                Personal profile, projects, blog and site settings
  lib/metadata.ts         Portfolio metadata helper
  ventures/               Venture registry, content, types and presentation
public/                   Public images and assets
scripts/preview.mjs       Local static-export preview server
docs/                     Writing and source/review notes
firebase.json             Hosting folder, site and response headers
.firebaserc               Default Firebase project
next.config.ts            Production static export configuration
```

Public routes include `/`, `/about/`, `/work/`, `/work/[slug]/`, `/blog/`, `/blog/[slug]/`, `/contact/`, `/ventures/`, `/ventures/lazy-barista/`, and `/ventures/golden-travel-and-tours/`. Blog article routes exist only for published entries.

The `(portfolio)` directory is a layout group and does not appear in URLs. Venture pages have separate presentation from the portfolio shell. Most components render at build time; navigation, filtering and the inquiry form use client components for interaction.

## 5. Contact form: Formspree email delivery

The contact form uses the public endpoint in `site.contactFormEndpoint` in `src/content/site.ts`. The current endpoint is `https://formspree.io/f/xwllnvev`. Formspree controls the notification recipient; the intended inbox is `johnmsemblante@gmail.com`.

With JavaScript enabled, the form submits in place and shows success only after Formspree acknowledges the submission. Fields and the submit button are disabled while sending. Failed requests preserve the input and show retry/direct-email guidance. A 20-second timeout prevents an indefinite loading state; no request is automatically retried. Native POST remains as a no-JavaScript fallback. The email field supplies Reply-To. The honeypot uses Formspree's `_gotcha` field; additional spam settings are managed in Formspree.

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
npm run preview
```

Review the production preview, then stop it with Ctrl+C. Check mobile and desktop layouts, navigation, keyboard focus, images, contact form validation and delivery, the modified content, and an invalid URL's 404 page.

Save the reviewed changes to GitHub:

```powershell
git status
git diff --check
git add -A
git commit -m "Describe the website changes"
git push origin main
```

Inspect `git status` before staging to avoid including unrelated files. If there are no changes, skip the add/commit steps. Pushing to GitHub does **not** automatically deploy this project.

Publish the build:

```powershell
firebase deploy --only hosting --project johnmsemblanteapp
```

This replaces the live website at https://johnmsemblanteapp.web.app/. Wait for `Deploy complete!`, then open the live pages and verify the changes. The CLI uploads the existing `out/` directory; it does not run the build for you. Never deploy after a failed build, because an older export may still exist.

Firebase serves real exported page files with trailing slashes and a real 404 response. Do not add the old site's catch-all `/index.html` SPA rewrite. Hashed Next.js static assets use long-lived immutable caching.

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

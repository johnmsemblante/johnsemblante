# John Semblante — Portfolio & Ventures

A personal portfolio focused on web development, with independent pages for Lazy Barista and Golden Travel and Tours, plus a blog for writing practice.

- **Live website:** https://johnmsemblanteapp.web.app/
- **Repository:** https://github.com/johnmsemblante/johnsemblante
- **Firebase project and Hosting site:** `johnmsemblanteapp`
- **Production branch:** `main`
- **Architecture:** Next.js App Router, TypeScript, Tailwind CSS, and a static export hosted on Firebase Hosting.

The website is live and search indexing is enabled. `johnsemblante.com` is the intended future custom domain; the current canonical URL is the Firebase URL above.

## 1. Quick start

Run commands from the `johnsemblante` project folder. On John's current Windows machine:

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
| Contact form behavior | `src/components/inquiry-form.tsx` |

### About and experience

Edit the `experience` array in `profile.ts`. Each company has `company`, `role`, `dates`, and a `responsibilities` list. Each list item becomes a bullet. Entries appear in array order, so keep the most recent job first.

The current bullets come from John's updated resume. Update the source file when the resume changes; the website does not automatically read the PDF. The full resume is not published because it contains reference contacts and a residential address.

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

Phone and social links are managed independently for each venture. Confirm ordering information before publishing. Golden Travel does not currently publish package prices or guaranteed vehicle availability. Its vehicle section currently names Sedan, SUV and Van in `landing.tsx`; changing those cards requires updating that renderer as well as the content module.

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

## 5. Contact form: current behavior

The form validates required fields and prepares a reviewable email draft. Visitors open their email app or copy the message, then send it themselves. The website does not send, store, or confirm delivery of messages.

Update the receiving address in `src/content/site.ts`. Direct delivery would require adding a form provider or backend, its validation/spam controls, and delivery feedback. There are currently no Firebase SDK, Functions, Firestore, authentication, or analytics integrations.

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

Review the production preview, then stop it with Ctrl+C. Check mobile and desktop layouts, navigation, keyboard focus, images, contact draft behavior, the modified content, and an invalid URL's 404 page.

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

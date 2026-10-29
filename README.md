# John Semblante — Portfolio & Ventures

Next.js App Router, TypeScript, Tailwind CSS, and static export for Firebase Hosting. Uses the approved visual direction and shared wireframe concepts, with migrated portfolio content and résumé-based professional details. It is not deployed.

## Local development

Node.js 20.9 or newer is required by the selected Next.js release. Install dependencies with `npm ci`, start with `npm run dev`, and build with `npm run build`. `npm run typecheck` checks TypeScript. The production output is `out/`.

## Content

- `src/content/site.ts`: public contact details and project type. `src/content/projects.ts`: 14 entries migrated from the old portfolio, with original project dates, categories, screenshots, and website links. `src/app/(portfolio)/work/[slug]/page.tsx` is active and exports each project. Optional challenge/approach/outcome fields render only when provided; no project results are invented.
- `src/content/profile.ts`: biography, skills, experience, education, and social links. The updated résumé takes precedence over older website wording. CreateIT is current, confirmed by John. TikTok is omitted at his request.
- `public/images/profile/` and `public/images/projects/`: locally stored portrait and historical screenshots; no hotlinking to the old site.
- `src/content/blog.ts`: published and draft writing; see `docs/writing.md`.
- `src/ventures/lazy-barista/content.ts` and `src/ventures/golden-travel-and-tours/content.ts`: independent venture content. Brand styling is provisional, not approved branding.
- `src/ventures/landing.tsx`: shared venture presentation. Separate brand components can live inside each venture module as the wireframes require.
- No database, backend, contact submission service, analytics, client testimonials, prices, or performance claims are included.

## Architecture

Portfolio routes use the `(portfolio)` route group and shared shell. Venture detail routes sit outside that layout to keep each brand independent. Pages are server components rendered at build time. Navigation, project filtering, and inquiry drafting are small client components. No Firebase SDK is required.

The inquiry form validates required fields, creates a reviewable email draft, and offers an email-app link or copy fallback. It does not submit to a backend or guarantee delivery. Users send their email themselves. No messages are stored by the website. A direct-delivery form provider or Firebase backend can replace this later after the service and receiving inbox are configured. No existing service credentials were copied.

Development and production use the supported Webpack build option because Turbopack failed to launch its CSS processing worker in this Windows environment. Script entrypoints invoke Node directly to avoid Windows command shim issues with the ampersand in the workspace path.

Each venture owns content and an optional `canonicalBase`. For migration, move its content and presentation plus needed shared CSS into a new Next.js application, mount the landing at `/`, replace portfolio-relative links, set its canonical domain, and redirect the old route in Firebase. Shared styles and cross-site navigation still need to be copied or adjusted; this is a migration-ready structure, not a fully isolated package.

## Launch checklist

1. Review the migrated content, confirm venture logos and offerings, and add project scope/results where available. The raw résumé is not published as a download because it includes reference contacts and a detailed residential address. Professional content and city-level location are used on the website.
2. Verify responsive rendering, keyboard navigation, contrast, content, and metadata.
3. Remove the temporary `robots` noindex in `src/app/layout.tsx` and replace the disallow rule in `src/app/robots.ts` with allow and sitemap URL.
4. Run `npm run build` and `npm run typecheck`. Review generated HTML and all navigation.
5. Select the real Firebase project using an authenticated Firebase CLI. No project ID or credentials are committed. Deploy `out/` with `firebase deploy --only hosting --project YOUR_CONFIRMED_PROJECT_ID`.
6. Connect johnsemblante.com through Firebase Hosting and verify DNS, HTTPS, canonical URLs, and the real 404 response. No SPA fallback rewrite is configured, preserving static page URLs and 404 behavior.

Firebase configuration serves only the static export and sets immutable caching for hashed Next.js assets. Firebase Hosting project access and domain configuration are required before publication.

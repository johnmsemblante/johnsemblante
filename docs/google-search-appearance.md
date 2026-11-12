# Google search name and favicon

The preferred appearance is:

| Element | Value |
| --- | --- |
| Site name above the URL | John Clark Semblante |
| Alternate site name | John Semblante |
| Homepage title link | Cebu Web Developer \| John Clark Semblante |
| Favicon | Existing “js.” personal mark |
| Other page titles | Their own descriptive page titles |

Google chooses the actual search appearance. The site name is distinct from a page title. Google supports one site name/favicon per hostname, so About, Work, Blog and the venture pages on `johnsemblante.com` share that identity. Venture names still appear in their page titles and content. Independent venture identities in search would require separate domains/subdomains. See [site names](https://developers.google.com/search/docs/appearance/site-names), [favicons](https://developers.google.com/search/docs/appearance/favicon-in-search), and [title links](https://developers.google.com/search/docs/appearance/title-link).

## Implementation

- `site.searchName` controls the preferred name; `site.name` remains the shorter brand alias.
- The existing homepage WebSite node now specifies the preferred name and alternate. No duplicate WebSite block is added to every page.
- Shared page metadata, including venture pages, uses the preferred `og:site_name`. Each page retains its relevant title, description, canonical URL and social image.
- `src/app/icon.png` provides a 96×96 PNG favicon through Next.js file metadata. `src/app/favicon.ico` includes 16, 32, 48, 96 and 256px versions of the same mark. Both inherit across routes. The original SVG remains at `public/icon.svg`.
- Public robots rules allow the homepage and icons to be crawled. Admin routes remain noindex.

## Test production after deployment

1. Open **https://johnsemblante.com/icon.png** and **https://johnsemblante.com/favicon.ico**. Both should show your “js.” mark, without signing in.
2. Open Home, About, Work, Blog and a venture page. Use **View page source**, then find `rel="icon"` and `og:site_name`. Expect a PNG icon link with `sizes="96x96"` and `John Clark Semblante` as the site name. The homepage `<title>` should be `Cebu Web Developer | John Clark Semblante`; other pages should have their own titles.
3. In homepage source, find the single `WebSite` structured-data node. Check `name: John Clark Semblante`, `alternateName: John Semblante`, and `url: https://johnsemblante.com/`.
4. From this checkout, run `npm run audit:search-branding` to check the live PNG dimensions, homepage identity/title and shared favicon/site name on every sitemap page. Run `npm run audit:seo:live` for canonical, robots and crawlability checks. Passing verifies what production serves; it does not prove what Google has indexed.
5. Open [Schema Markup Validator](https://validator.schema.org/) and test `https://johnsemblante.com/`. Check the WebSite node. Google's Rich Results Test does **not** validate the site-name feature, so no site-name rich-result badge is expected.
6. Open [Google Search Console](https://search.google.com/search-console). Select the `johnsemblante.com` property → **URL Inspection** → enter `https://johnsemblante.com/` → **Test Live URL**. If accessible, choose **Request Indexing**. Inspect important changed pages such as About and Work individually if needed. In **Sitemaps**, confirm `https://johnsemblante.com/sitemap.xml` is submitted and readable.
7. Recheck Search Console later for a crawl after deployment, then inspect ordinary Google results. Google may take days to weeks and can choose a different name/title or omit the favicon. Repeated indexing requests do not accelerate the process; clearing site/browser caches does not clear Google's index. See [Google's recrawl instructions](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl).

## Release checks

Run `npm run typecheck`, `npm run test:seo`, `npm run build` and `npm run audit:seo`, then follow the normal commit/Hosting release process. No Firestore rules or Worker deployment is needed for this branding update. Keep favicon URLs stable and avoid changing the preferred site name repeatedly while waiting for Google to process it.

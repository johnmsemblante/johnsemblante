# Writing on your blog

Open `src/content/blog.ts`. Duplicate the starter draft inside the `posts` array for each new article. Keep `status: "draft"` while writing. Drafts are not exported, linked, or included in the sitemap; there is no browser editor or saved-draft service.

Set a unique lowercase URL slug with hyphens, title, excerpt, category, and publication date in YYYY-MM-DD format. Write the body using paragraph, heading, quote, and list blocks. Content is plain text, not HTML or Markdown. Heading blocks render as H2; the article title is H1.

Change status to `published` when ready. The article appears at `/blog/your-slug/` and in the Blog list. With `npm run dev`, refresh the page to see your edits. For a hosted site, run `npm run build` and redeploy the static export. Keep published slugs stable so existing links continue to work.

The site-wide noindex setting still applies until the portfolio is ready for launch. No new dependency or database is needed.

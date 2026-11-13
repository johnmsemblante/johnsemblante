<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Keep the owner-facing handbook current

For every change that affects a feature, editor, integration, configuration, publishing/deployment workflow, or operational behavior, update the relevant guides in `src/content/admin-documentation.ts` and the corresponding technical notes in `docs/` in the same change. Add a guide for a new workflow. Update only the affected guides' `updated` dates after verifying their instructions against the implementation. Ordinary content-only edits need a guide update only when usage or maintenance changes.

The handbook is available at `/adminauth/documentation/`. Write practical owner-facing steps, explain how the feature works, document limits and troubleshooting, and keep current instructions separate from historical release notes. Follow `docs/admin-documentation.md` for maintenance and validation. Never include secrets, credential values, service-account JSON, private records or draft content: the site's static bundles are publicly downloadable even though the dashboard UI uses the existing admin gate.

# Résumé Generator

`/adminauth/resume/` is an application in the existing admin dashboard, linked from the sidebar and Overview. It inherits `AdminGate`, the admin noindex metadata and login return-path allowlist. There is no public résumé route, sitemap entry, database collection, new dependency or service configuration.

## Owner workflow

1. Open **Résumé Generator** and start blank, import a generator JSON backup (version 1, up to 1 MB), or choose **Start from public profile**. Populated drafts require confirmation before replacement.
2. Choose Modern (sans serif) or Classic (serif), A4 or US Letter, and Comfortable or Compact spacing. Fill in personal details; city/country is enough for location.
3. Expand and edit summary, experience, selected projects, education, skills, and certifications/languages. Add up to 20 entries per experience/project/education list. One responsibility per line becomes one bullet. All sections support reordering and hiding; entries support reordering/removal. Empty sections and entries are omitted.
4. Check the live preview. **Print / Save PDF** opens an isolated document in the native print dialog; select Save as PDF, matching paper, 100% scale and no headers/footers. Review every page. The continuous preview does not predict final browser pagination. Native PDF destinations on mobile vary; use a desktop browser when unavailable.
5. **Download text** exports visible sections. **Export JSON backup** includes the complete editable draft, including hidden sections and layout. PDF/text import is unsupported. Keep backups private.

The optional public-profile starter copies only facts already in `src/content/profile.ts` and public contact/site data. It includes the listed bachelor's degree and omits school-level education to keep a professional résumé focused. It never invents metrics or fetches Firestore Pages overrides. Edits do not change public content. The owner must review current dates, wording and contacts before sharing.

## Free operation and storage

The feature runs entirely on the client. There is no paid AI, generation endpoint, external PDF service, remote font, résumé upload or additional Firestore operation. Existing dashboard authentication/membership activity and static hosting remain as before. Standard system fonts keep Unicode text selectable and avoid font licensing/download overhead. The two single-column layouts favor straightforward reading; no ATS scoring or universal parser compatibility is promised.

`use-resume-draft.ts` saves one draft under `portfolio:resume:v1:<Firebase UID>` in localStorage for the current origin/browser. Saving is enabled by default. Data is not encrypted and persists after logout; this is a convenience on trusted devices, not a secure vault. Turning **Remember draft on this browser** off removes its stored copy while retaining the in-tab draft. **Clear draft & local copy** confirms before removing the draft and disabling local saving. JSON backup is the mechanism for multiple versions or moving devices.

Loading and writing storage are guarded. Invalid stored data is not silently overwritten: saving pauses and the editor starts blank in memory. Storage quota/access failures pause saving and explain how to back up. `beforeunload` warns when meaningful work is not being saved, although in-app navigation and some mobile browser exits do not guarantee a warning. Back up before leaving with saving paused/off.

An optimistic raw-value check plus the browser `storage` event catches competing tabs. A changed/cleared copy pauses saving until the owner explicitly selects **Load saved draft** or **Keep this version**, each with a discard/overwrite confirmation. Account-keyed workspace remounting prevents one account's in-memory draft being written under another account.

## Rendering and validation

`resume-model.ts` owns the versioned schema, strict import validation, text export, file names and ordering. Short fields accept up to 300 characters; long fields accept up to 6,000. Import reconstructs known fields, rejects malformed versions/order/visibility/template/paper/spacing, limits lists to 20, enforces unique nonempty entry IDs per list and caps UTF-8 input at 1 MB. A failed import preserves the current draft.

`resume-document.ts` generates the same self-contained HTML for the preview and print. All user values are HTML-escaped, including the document title and URLs. Links accept only http(s), no embedded credentials; invalid URLs remain plain text. CSP denies external resources, scripts, forms and base URLs. Preview uses a sandboxed same-origin iframe without scripts; the off-screen print frame additionally allows the native print modal. No scripts/images/fonts are loaded by generated documents. Print uses semantic headings, paragraphs, links and bullets, browser pagination, fixed page margins and break avoidance for headings/bullets. It prints the current state rather than a stale preview. The print iframe is replaced on the next export and removed on workspace unmount; opening print does not claim the user saved a file.

## Validation

Run `npm.cmd run test:resume`, `npm.cmd run test:admin`, `npm.cmd run typecheck`, and `npm.cmd run build:prepared`. The prepared build uses existing content snapshots; the full publishing build additionally syncs public content and is not needed to test this local feature. See `docs/admin-documentation.md` for handbook maintenance. Review the screen using a local isolated fixture when no approved authenticated session is available; never bypass the production gate or embed private résumé data in a static fixture.

Verified 16 November 2026: all 41 admin regression tests (including 10 résumé checks), TypeScript and the production static build passed. An isolated Edge fixture exercised the actual editor with synthetic/public profile data: editing and live preview, local restore, layout settings, project creation/hiding/reordering, JSON download/import and invalid import preservation, cross-tab conflict resolution, account separation, blocked storage, disabling saving and clearing. Layouts at 1440/1024/768/390 px had no horizontal overflow or browser page errors, and the isolated editor made no external requests. Desktop/mobile screenshots were inspected. A generated two-page Letter PDF was rendered for visual review and checked for selectable Unicode text, complete section headings and absence of dashboard chrome. Section-heading letter spacing is zero so extracted headings remain intact. The production exported résumé/handbook routes were also checked signed out: only the existing login gate was shown, noindex remained in place, and the sitemap omitted admin routes. No signed-in production session, private records or deployed hosting were used or changed.

# Industry portfolio enhancement

**Current status:** the owner confirmed that the label-click enhancement now works and requested publishing the fix. The dropdown tracks pointer gestures that start inside it, allowing label activation without premature dismissal. Earlier release/checkpoint notes below describe the investigation history.

All 14 historical projects retain their original order, slugs, descriptions, dates, roles, technologies, screenshots and website links. Lazy Barista and Golden Travel and Tours are two additional **Personal venture** entries, pointing to their existing venture pages and accurately listing Next.js, TypeScript and Tailwind CSS.

The Work hero, confidential-work spotlight, featured project, workflow and contact CTA remain. The homepage keeps its existing compact cards and the same first three projects. No dependencies were added.

## Filtering and routes

The Work directory has two independent modes: keyword search, or grouped Industry/Technology/Project Type filtering. Typing clears every dropdown selection immediately; the keyword waits 300 ms before matching. Selecting or clearing a dropdown option cancels any pending search, clears the text input and filters by dropdown choices only. In dropdown mode, values within a group use OR and groups use AND. In search mode, keyword tokens use AND across the collection's searchable details. Everything uses local project data; there are no search API requests, new dependencies or database changes.

Search covers titles, summaries, full descriptions, industry names/aliases, verified technologies, project type, documented features/contributions and optional `tags`/`capabilities` fields. It ignores case and accents, trims whitespace, and supports basic aliases/plurals such as `wp`, `real estates`, `front-end` and `e-commerce`. Next.js projects match a React keyword as framework-related work, but React does not become a technology checkbox unless a project record actually lists it. WooCommerce currently returns no results because no published project verifies that implementation; industry/service copy is not used to invent capability matches.

Examples of readable shared URLs:

- `/work/?q=wordpress`
- `/work/?industry=dental,healthcare&technology=wordpress`
- `/work/?industry=healthcare&technology=wordpress&type=client-project`
- `/work/?technology=next-js,typescript&type=personal-venture`

Filters update the URL through Next.js-compatible native history calls without reloading. Committed dropdown/chip changes push checkpoints. Switching from dropdowns to search immediately removes the group parameters; the debounced keyword replaces that same new checkpoint. A typing session adds one checkpoint, then replaces that entry as typing continues. Back/Forward cancels pending timers before restoring the previous mode and values. If an older/shared URL contains both a keyword and dropdowns, the keyword takes priority and the group parameters are removed. Unknown values are ignored, duplicates removed, and parameters/values ordered consistently. Old `technology=WordPress`, `industry=travel` and `industry=hospitality` URLs normalize to current values. Clear All returns to `/work/` on the main directory, or the unfiltered dedicated collection URL when already in one. Unrecognized parameters and fragments are removed on normalization.

Dropdowns have per-group Clear actions, selection counts and labeled native checkboxes. Each option's live count is calculated against the other selected dropdown groups, excluding its own group's OR selections and the independent keyword query. Options with no matching projects are disabled and visually muted. Selected zero-match values restored from an old URL remain enabled so they can be removed. Native label associations let text, count and row clicks activate the associated checkbox without click interception. The outside-focus listener ignores transient document-body focus during label activation, keeping the panel open; actual outside pointer presses and focus on another control still dismiss it. Disabled checkboxes cannot be activated through their labels. Only one dropdown opens at a time. Outside pointer/focus, Escape and Done close it; Escape/Done return focus to the trigger. Arrow keys, Home/End, Tab and Space work within the checklist, skipping disabled inputs. Overlaid panels avoid pushing the results down and can open above a trigger when space is limited. Responsive styles stack controls on mobile. Removable chips and Clear All update both state and URL.

**Share these results** flushes the latest search before copying the full current-origin URL. Accessible success/error feedback is provided; if clipboard access fails, a labeled selectable link is shown for manual copying.

The directory waits for initial URL restoration before displaying its JavaScript results, avoiding an unfiltered-project flash on shared links. A no-JavaScript collection is included in the HTML. Canonical URLs remain the unfiltered Work/industry page; query combinations do not create new generated routes or sitemap entries. The indexable industry pages below retain their existing curated collections, introductions, metadata and permanent routes. Their keyword/technology/type filters stay inside that collection; clearing filters does not change its scope.

Directory industry normalization preserves the original project records and every old association. Travel and hospitality map to Hospitality & Travel. Existing business descriptions additionally place construction/service records in Home Services & Construction, Roar Fitness in Healthcare & Wellness, Nexus Appliances/Georges Bike Shop in E-commerce & Retail, and Active Kids Group in Education & Childcare. Legacy Other/Professional Services associations remain available, and unknown future industries fall into Other Industries. Directory card labels link to the matching normalized directory filter; dedicated legacy collection links remain available separately.

Use these dedicated, statically exported collection pages for search engines and client sharing. Each has initial HTML project content, unique metadata, canonical/social URLs, CollectionPage/ItemList structured data, technology filtering, contact links and a sitemap entry:

| Route | Published examples |
| --- | --- |
| `/work/industry/dental/` | None yet |
| `/work/industry/real-estate/` | None yet |
| `/work/industry/healthcare/` | Perth Cosmetic Surgery; Parkwood Chiropractic |
| `/work/industry/travel/` | Golden Travel and Tours (personal venture) |
| `/work/industry/food-beverage/` | Lazy Barista (personal venture) |
| `/work/industry/ecommerce/` | Loonglist |
| `/work/industry/hospitality/` | None yet |
| `/work/industry/professional-services/` | Impact Hygiene; Northcroft; Perth Scaffolding; Trinity Floors; Spinning Leaf Films |
| `/work/industry/other/` | The six remaining historical publishing, fitness, childcare and retail entries |

Empty collections explicitly state that no examples are published. Their copy offers a conversation without claiming completed dental, real estate or hospitality work. Industry labels do not imply unverified features: product-showcase sites are not classified ecommerce merely because they show products, and no historical site is newly claimed to use WooCommerce.

## Data and editing

- `src/content/industries.ts`: slugs, labels, introductions and metadata. New entries automatically appear in filters, generated routes and the sitemap.
- `src/content/projects.ts`: unchanged historical records plus their industry mapping, followed by the two venture records. Add fully documented projects here with their industries; components do not need editing. Classifications of historical entries are mapped at the top of this file.
- `src/content/site.ts`: extended `Project` type and published-only `projects` export, used by public pages, case-study routes and the sitemap.
- `src/content/project-drafts.ts`: fictional planning records, not imported into public pages or client components.
- `src/lib/project-filters.ts`: shared filtering, URL parsing/serialization and project-type/status labels.
- `src/content/portfolio-filter-groups.ts`: new industry groups and the legacy normalization layer, without rewriting project records.
- `src/lib/project-filter-session.ts`: debounced browser-history state and clipboard link preparation, tested through browser/history/timer adapters.
- `src/components/project-filter-dropdown.tsx`: reusable accessible multi-select disclosure with native checkboxes.
- `src/components/project-explorer.tsx` and `project-grid.tsx`: interactive filters and detailed Work cards. Compact homepage cards retain their original presentation.
- `src/app/(portfolio)/work/`: Work page, case-study page, industry routes, layout and scoped styles. Optional case-study sections use the existing image lightbox.
- `src/app/sitemap.ts` and `tests/work-portfolio.test.cjs`: discoverability and regression checks.

`Project` keeps its existing fields and adds:

| Fields | Purpose |
| --- | --- |
| `industries` | One or more industry slugs |
| `projectType` | `client`, `venture`, `concept`; visible text labels distinguish them |
| `publication` | `published` or `draft`; public exports exclude drafts |
| `status` | `archived`, `live`, `planned`, `in-progress` |
| `description` | Optional full overview |
| `objectives`, `contributions`, `features` | Optional documented scope lists |
| `gallery` | Optional preview images with alt text, captions and dimensions |
| `caseStudyUrl` | Optional alternate destination; defaults to `/work/{slug}/` |
| `seo.title`, `seo.description` | Optional metadata overrides; default to title/summary |

Existing `image`, `website`, `technologies`, `role`, `year`, `challenge`, `approach` and `outcome` fields remain supported. Historical records intentionally do not acquire invented objectives, features, contributions or results; unavailable sections are hidden. The Client project archive label does not newly assert a direct engagement or ownership of the entire current live website.

## Unpublished concepts

These remain `concept` / `draft` / `planned`, without technologies, screenshots, live links or generated routes:

1. SmileCraft Dental Studio — dental landing page.
2. Haven Property Group — real estate website.
3. WellSpring Medical Clinic — healthcare website.
4. Coastline Boutique Resort — hospitality website.
5. Northstar Legal Group — professional services website.

Build and document an original demo before adding a complete published record. Keep the Concept / Demo label, use licensed/original assets and actual implementation details, and never invent clients, testimonials or results. Only list WordPress when the demo actually runs on WordPress. SmileCraft is a sensible next priority for a dental example; this enhancement does not build five demo websites.

## Verification and release

```powershell
npm run test:work
npm run typecheck
npm run build
```

Tests cover original project retention, valid industries/assets, draft exclusion, contextual option availability/counts, same-group OR choices, search/dropdown exclusivity, label/checkbox handler behavior, keyword aliases/verified capabilities, shared URL normalization, debounce timing, history checkpoints, pending-search cancellation, clipboard success/failure, accessible server-rendered controls, project routes and all nine collections' metadata/structured lists. Export checks verify sitemap entries, internal href/image targets and absence of draft names in HTML/JavaScript. Browser interaction checks remain distinct from timer/history/event-handler tests.

No database, API key or billing setup is needed. A verified website-only release uses the existing Firebase Hosting process. Historical external websites may have changed or become unavailable; keep the original archive records and confirm replacements or new scope with the owner.

External-link audit on 5 November 2026: nine original website URLs returned HTTP 200 (including redirects). Sharon Kramer Books did not resolve in this environment; E Dee Monnen and Loonglist timed out; Roar Fitness and Georges Bike Shop returned HTTP 403 to automated HEAD requests. Those five need a manual browser check; a blocked HEAD request is not proof a site is unavailable to visitors. Original records and URLs were preserved.

The original industry-page release could not receive a browser review because the browser host was unavailable. During the later directory-filter revision, a native Chrome preview check was started, then Computer Use was stopped by the user with Escape. No further browser interaction was performed. Dropdown/mobile/clipboard visual review remains manual; automated URL/history/timer and server-render tests cover their underlying state behavior.

Released to the existing Firebase Hosting site on 5 November 2026 after 7 portfolio tests, 19 admin/feed tests, 8 blog tests and the production build passed. Export verification checked 26 Work-related pages, 840 local targets, nine industry canonical/sitemap entries and exclusion of draft names from public HTML/JavaScript. The release changes Hosting only; existing backend configuration and unfinished Git changes were preserved.

The subsequent grouped-dropdown/search revision is **local and not deployed yet**. Its verification passed 16 portfolio/history tests, 19 admin/feed tests, 8 blog tests, TypeScript and the production build. The export still includes 26 Work-related pages and all nine dedicated collections; 862 local targets were checked and draft names remain absent from public HTML/JavaScript. A static preview is available with `npm run preview` after the build. Complete the interrupted browser/mobile review before the next Hosting release.

The contextual-option and independent-mode follow-up is also local. Verification now passes 22 portfolio/facet/history/checkbox-handler tests plus the existing 27 admin/feed/blog tests (49 total), TypeScript and the production build. No browser automation or production deployment was performed for this follow-up. Disabled choices prevent adding a zero-match dropdown combination; genuinely empty keyword searches and incompatible older/shared filter URLs still show an honest empty state with removable selections and Clear All.

The subsequent label-click fix routes option text, count and row clicks through the associated checkbox's native click/change event. An isolated React DOM/jsdom interaction check verified the actual checked state and URL after each click, including disabled-option protection. The 22 portfolio tests, TypeScript, production build and export checks also passed. Temporary DOM tooling lives under ignored `tmp/portfolio-dom-tools`; portfolio dependencies are unchanged. This fix remains local pending deployment.

The latest dismissal fix adds the previously missing pointer/focus regression: transient body focus before label activation must not close the dropdown. The isolated React DOM check now asserts that the panel stays open after label text, count, row and checkbox clicks, and still closes for outside pointer/control focus and Escape. All 23 portfolio tests pass. This follow-up remains local.

After release, the owner confirmed that label clicks still closed the dropdown. The next local revision reproduces a missing case using the actual shell structure: `<main tabIndex={-1}>` can receive focus between an inside pointer press and native label activation. Dismissal now tracks pointer gestures originating inside the dropdown instead of relying only on a body-focus exception. The Technology/Next.js React DOM reproduction fails before this change and passes afterward; 23 portfolio tests, the build and export checks pass. The attempted automated Chrome check was stopped with Escape. The owner subsequently confirmed the behavior works and authorized committing and publishing this revision.

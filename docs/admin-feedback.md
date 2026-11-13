# Admin action feedback

The `/adminauth/` layout mounts one `AdminFeedback` surface alongside the existing authorization gate. A fixed, indeterminate top bar shows asynchronous activity. Bottom-right non-modal notices show outcomes without requiring a scroll to an editor header. Existing inline messages, field validation, save locks, authentication and persistence behavior remain in place.

The shared feedback is connected to Pages, Blog, Works, Ventures, editor image uploads, site-wide content refresh, Job Finder searches/bookmarks and administrator-session checks. Immediate local edits and filters do not trigger fake network progress. Saving to Firestore is distinct from the later GitHub build/Hosting deployment; notifications preserve that distinction.

## Implementation

- `src/lib/admin-feedback.ts` owns an in-memory external store. Each concurrent activity receives an independent ID and idempotent completion callback, so one finished operation does not stop another operation's indicator. There is no persistence, telemetry or network request in the feedback layer.
- `useAdminMessage` preserves each component's inline string state while emitting a notice for every nonempty setter call, including identical retries. It ignores responses after unmount. `useAdminActivity` tracks existing busy/loading state and cleans up on unmount. Do not call notification setters during rendering.
- The surface uses `useSyncExternalStore` with an empty server snapshot. Notifications survive admin subsection navigation, are cleared when the authenticated identity changes or access is denied, and are discarded when the admin layout unmounts.
- The portal follows the currently open native dialog. This keeps progress and notices above the modal backdrop and makes dismissal keyboard accessible. Otherwise it uses the document body. It does not open a dialog, steal focus or change the editor's modal behavior.
- The notification column moves above visible bottom editor actions, respects mobile safe areas and has bounded height/width. Up to four recent notices are retained. Every notice has a dismiss button. Success/info notices dismiss after 8–20 seconds depending on length; hovering/focusing pauses that timeout. Errors remain until dismissed or displaced by the bounded queue/session cleanup.
- Native invalid-field events are grouped into one error notice while retaining browser validation and focus behavior. Success/info announcements use status; error notices use alert. The top indicator has no invented numeric percentage and respects reduced motion.

## Maintaining coverage

New asynchronous admin features should reuse these hooks or the shared store and stop activity in cleanup/finally. Emit success only after the underlying operation is confirmed. Distinguish successful saves, private drafts, pending deployment, local refresh and actual deployment. Keep notices free of credentials and avoid unnecessary private record contents. Do not duplicate the public donation widget in the admin interface.

Run `npm.cmd run test:admin`, relevant editor/upload tests, `npm.cmd run typecheck` and the existing production build. Review long/scrolled editors, concurrent work, failed and repeated saves, native validation, image-upload failures, modal opening/closing, keyboard dismissal, hover/focus timeout pause, reduced motion, navigation cleanup and mobile safe areas. Browser QA uses isolated fixtures with mocked writes; it must not change real production records or bypass the live authorization gate.

Validation on 13 November 2026: all 172 Node regression tests, TypeScript and the production build passed. The export SEO audit found no errors and retained the existing long-blog-title warning. Edge tests used the real Pages editor and native drawer with isolated transaction/upload stubs: successful/failed/repeated saves, preserved input, image-upload outcomes, concurrent activity, portal relocation, sticky-action clearance, timeout pause, persistent errors, keyboard dismissal and grouped native validation all passed. Desktop/tablet/mobile checks at 1440/768/390px and reduced-motion checks passed; desktop and mobile save screenshots were inspected. No authenticated production save, delete or upload was performed.

# Classic production homepage and local interactive preview

As of 27 November 2026, production uses the original Classic portrait homepage. The unfinished interactive office is preserved on the local Git branch `interactive-office-wip`. It is not part of the production branch's current source. Selecting a presentation in browser storage is not a production rollback; production must serve Classic in its initial HTML, without an Interactive switch or office renderer.

## Keep development separate

- `main` is the production source. Its pushes and manual publishing runs build and deploy to Firebase Hosting; scheduled content publishing also uses `main`.
- `interactive-office-wip` is a local preview branch. Keep unfinished refinements there and do not merge or push them to `main` until the owner approves the final layout.
- To continue local design work, switch to `interactive-office-wip` and use the existing development command. This does not change production.
- To publish an unrelated production fix, switch to `main`, review the diff, and follow the existing publishing workflow. Preserve or commit local work before switching branches.
- Do not manually deploy the local `out/` folder while developing the office. It may contain an interactive export left from earlier testing. The GitHub production workflow builds its own export from `main`.

The rollback uses a normal Git revert of the office commit, rather than rewriting shared history or deleting the local work. It preserves other production features and leaves content records, admin permissions, contact settings and game saves unchanged. No local build is needed for this rollback; the existing production workflow builds the Classic source remotely.

## Release the office later

Review the local design, accessibility, device coverage, performance and security findings before authorizing publication. The original office commit remains in Git history and was reverted on `main`; a future release must deliberately restore that change and integrate the reviewed refinements. An ordinary merge should not be assumed to undo a revert. Check the resulting production diff carefully and deploy only the approved version.

Verify a successful publishing run and fetch the uncached homepage. It should contain `portrait-hero`, one Cebu Web Developer H1, the existing introduction and links, and no office mode controls. Confirm the portrait asset is available. Future scheduled content updates must continue using the Classic source until the redesign is explicitly released.

# Classic production and interactive development

Reviewed 27 November 2026. Production uses the Classic portrait homepage from main. The unfinished office lives on feature/interactive-office, pushed to GitHub for work across computers. Feature pushes do not publish the website.

## Continue on another computer

Save or commit existing checkout changes first. Run:

~~~powershell
git fetch origin
git switch --track origin/feature/interactive-office
npm ci
npm run dev
~~~

If the branch already exists locally, use git switch feature/interactive-office followed by git pull --ff-only. Open the localhost URL printed by Next.js. Choose Interactive if this browser remembers Classic. Commit future office work on this branch and use git push to synchronize it. No production build is needed for ordinary local development.

## Publishing boundary

- main remains the production source. Its pushes and scheduled content publishing deploy Classic to Firebase Hosting.
- feature/interactive-office is development only. The publishing workflow filters pushes to main. Its publish job also requires github.ref == 'refs/heads/main', so manual feature-branch runs skip that job.
- Do not merge interactive work into main until publication is approved. Do not manually deploy Firebase from this checkout or upload its out directory; it may contain an earlier export.
- Preserve current work and switch to main before an unrelated production fix.

The production rollback was a normal revert, preserving shared history and the office source on its development branch. Browser mode preferences do not control release state. Production must serve Classic in initial HTML without office controls.

## Release later

Review the final design, keyboard/device coverage, performance and existing security findings before authorizing publication. The original office commit was reverted on main; a later release must deliberately restore it and integrate refinements. An ordinary merge must not be assumed to undo a revert. Review the resulting diff and run release checks before publishing.

Until then, production should contain portrait-hero, one Cebu Web Developer H1 and no office controls. Content publishing continues to use Classic source from main.

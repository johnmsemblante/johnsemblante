# Classic production and Digital HQ development

Reviewed 27 November 2026. Production stays the Classic homepage from main. Development is `feature/digital-hq-interactive-portfolio`. The abandoned office is preserved on `feature/interactive-office` at `ed0020d`. The starting checkout was clean, so no new stash was needed; unrelated stashes remain untouched.

## Continue locally

Save changes before switching:

```powershell
git switch feature/digital-hq-interactive-portfolio
npm ci
npm run dev
```

Open the localhost URL, choose Interactive if Classic was remembered; live 3D now starts automatically. The labeled temporary rig appears in development; the production likeness is pending. See [Digital HQ maintenance](digital-hq.md).

The Phase 1 checkpoint was local. The owner subsequently authorized committing/pushing the same feature branch and deploying a separate test page on 27 November 2026. See the [handoff note](handoffs/2026-11-27-digital-hq.md) for the verified remote/deployment status and cross-computer setup.

## Publishing boundary

- main is the production source. Its pushes and scheduled content publishing deploy Classic to Firebase Hosting.
- The workflow filters pushes to main and requires `github.ref == 'refs/heads/main'`; manual feature-ref runs skip publishing too.
- Only the dedicated `digital-hq` Firebase test channel is authorized. Follow [preview deployment](digital-hq-preview.md). Do not merge to main or use a live Hosting deploy for this branch.
- Preserve work and switch to main before unrelated production fixes.

The old office was reverted on main through normal history. A later release must deliberately integrate the reviewed result; an ordinary merge may not restore a reverted change. Complete character, visual, mobile, accessibility, SEO and performance acceptance first. Keep `NEXT_PUBLIC_DIGITAL_HQ_PREVIEW` out of production. Browser preferences do not control release state.

## Restore a source version

Save new work before `git switch feature/interactive-office` to revisit the archived office, or `git switch main` for production source. Switching does not deploy. Do not reset shared history or delete stashes to switch concepts. Existing exported output can be stale and requires rebuilding/review before release.

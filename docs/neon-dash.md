# Neon Dash

## Wallet and cosmetics

Finish a run to deposit its collected energy coins once. Restarting, going to the menu during a paused run, or closing the page discards unbanked coins. Character Selection and Shop share the same wallet and inventory. Buy or unlock an item, then choose Equip. Skins and trails do not change gameplay; reduced motion suppresses decorative trails.

V2 stores wallet, earnings, spending, ownership, equipped cosmetics, best score and sound together under `neon-dash:v2:player-data`. If no V2 save exists, it reads the V1 high score and sound keys and leaves those keys untouched. Malformed saves are not overwritten. If storage fails, play and customization can continue for the session. Saves are browser-local with best-effort tab synchronization, not transactional across tabs.

The game fills the standard portfolio content container, using the same maximum width and responsive side margins as other pages. The canvas keeps its 2:1 aspect ratio as it resizes.

Play at `/games/neon-dash/`. The source-only tool registry includes the game in the Free Tools and Ventures directories and sitemap. It does not add a managed venture or database record. The existing Support dialog is optional and separate from play.

Use Space, Up or W to jump, Down or S to slide, and P or Escape to pause or resume. With the playfield focused, Enter starts or restarts. On touch, tap to jump or swipe down to slide, or use the dedicated buttons. The game pauses when its tab becomes hidden. The best distance and sound preference stay on this browser; blocked storage does not prevent play.

The fixed 120 Hz simulation and tunable parameters live in `src/lib/neon-dash/engine.ts`. A continuous track means jump buffering matters; there are no platform edges on which to exercise coyote time. Hazards are spaced by speed, and the generation pool adds overhead gates and moving drones as a run progresses. The Canvas renderer caches three original city layers and suppresses decorative parallax and particles when reduced motion is requested. Web Audio generates short sounds after user interaction. No engine dependency, external game assets or backend are needed.

Run `node --test tests/neon-dash.test.cjs`, typecheck, then build the static export. Verify the menu, touch and keyboard controls, pause, game over, restart, sound, best-score persistence and layout at phone and desktop widths before publishing. If art fails to load, reload the page; if sound stays silent, enable it from the menu and check browser audio settings. Use a landscape orientation if the track feels small on a phone.

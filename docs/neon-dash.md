# Neon Dash

## Phase 4 controls and recovery

Open **Settings** from the menu or pause screen to mute audio, set master and effects levels, or reduce visual effects. Preferences are saved with progression. The system reduced-motion preference also applies. There is no background music. Audio starts only after interaction; if playback is unavailable, the game remains playable.

Gameplay accepts a short tap or a deliberate downward swipe from one primary pointer. Cancelled gestures and sideways drags do not trigger actions. The page scrolls normally outside the active track. Jump and Slide buttons remain available.

The frame loop sleeps on static screens and wakes on gameplay, menu transitions or visual preference changes. Jump and slide feedback is cosmetic; the physics and hitboxes are unchanged. If graphics fail to initialize or render, use **Reload game**. Reloading does not erase saved progression, but an unfinished run is discarded.

## Daily challenges, achievements and statistics

Use **Daily Challenges**, **Achievements**, and **Player Stats** in the menu. Daily objectives are drawn deterministically from the UTC date and reset at midnight UTC, including unclaimed rewards. Claim completed rewards manually for 50, 100, or 150 wallet coins. A failed save does not credit the reward. The device clock controls the day; saves are local and not intended for competitive verification.

Completed runs credit the UTC day on which they end. Abandoned runs do not count. Jumps count when launched, slides when started, and hazards only after passing safely. Survival uses simulated time, excluding pauses, rounded down per run. Achievement unlocks are permanent. Earlier reliable distances, coin pickups and inventories are retained; counters not previously recorded start at zero. Challenge currency is excluded from collected coins.

`src/lib/neon-dash/activity.ts` contains the challenge and achievement catalogues. The existing V2 save stores daily counters and claim IDs together with the wallet, lifetime counters, and dated unlocks. Claims are synchronous within a tab; cross-tab updates are best effort, not transactional. Test the UTC reset, reload persistence and a duplicate claim before release.

## Select a world

Open **Select World** to preview and choose a circuit. Neon Downtown is available immediately. Cyber Rooftops unlocks after 750 m and Glitch District after 2,000 m of cumulative distance from completed runs. The game-over screen shows progress and announces newly unlocked worlds once. Abandoned runs do not count. Unlocks are free, and the selected world is saved in this browser.

Older V2 saves keep their wallet, cosmetics, high score and sound settings. Lifetime distance starts at zero because best score is not lifetime distance. The same save key gains lifetime distance, unlocked IDs and selected world. A missing or invalid selection falls back to Neon Downtown.

The catalogue in `src/lib/neon-dash/worlds.ts` drives the menu and renderer. Gameplay reuses three cached layers for the current world. Selection previews render once from the same artwork, without a new gameplay loop. All worlds use the same collision boxes and procedural generation; only art changes. Check all three worlds with equipped cosmetics, reduced motion, pause, restart and touch controls before a release.

## Wallet and cosmetics

Finish a run to deposit its collected energy coins once. Restarting, going to the menu during a paused run, or closing the page discards unbanked coins. Character Selection and Shop share the same wallet and inventory. Buy or unlock an item, then choose Equip. Skins and trails do not change gameplay; reduced motion suppresses decorative trails.

V2 stores wallet, earnings, spending, ownership, equipped cosmetics, best score and sound together under `neon-dash:v2:player-data`. If no V2 save exists, it reads the V1 high score and sound keys and leaves those keys untouched. Malformed saves are not overwritten. If storage fails, play and customization can continue for the session. Saves are browser-local with best-effort tab synchronization, not transactional across tabs.

The game fills the standard portfolio content container, using the same maximum width and responsive side margins as other pages. The canvas keeps its 2:1 aspect ratio as it resizes.

Play at `/games/neon-dash/`. The source-only tool registry includes the game in the Free Tools and Ventures directories and sitemap. It does not add a managed venture or database record. The existing Support dialog is optional and separate from play.

Use Space, Up or W to jump, Down or S to slide, and P or Escape to pause or resume. With the playfield focused, Enter starts or restarts. On touch, tap to jump or swipe down to slide, or use the dedicated buttons. The game pauses when its tab becomes hidden. The best distance and sound preference stay on this browser; blocked storage does not prevent play.

The fixed 120 Hz simulation and tunable parameters live in `src/lib/neon-dash/engine.ts`. A continuous track means jump buffering matters; there are no platform edges on which to exercise coyote time. Hazards are spaced by speed, and the generation pool adds overhead gates and moving drones as a run progresses. The Canvas renderer caches three original city layers and suppresses decorative parallax and particles when reduced motion is requested. Web Audio generates short sounds after user interaction. No engine dependency, external game assets or backend are needed.

Run `node --test tests/neon-dash.test.cjs`, typecheck, then build the static export. Verify the menu, touch and keyboard controls, pause, game over, restart, sound, best-score persistence and layout at phone and desktop widths before publishing. If art fails to load, reload the page; if sound stays silent, enable it from the menu and check browser audio settings. Use a landscape orientation if the track feels small on a phone.

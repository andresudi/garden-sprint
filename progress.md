Original prompt: bikin repo baru untuk execute Bunbun Carrot Dash, a lightweight web prototype for an endless runner with a cute bunny collecting carrots and avoiding garden obstacles.

## 2026-05-07

- Created the standalone `bunbun-carrot-dash` Git repository.
- Chosen implementation shape: static HTML/CSS/JS canvas game with no package install step.
- Added deterministic core logic in `src/game-core.js` and browser rendering/input in `src/game.js`.
- Added expected web-game automation hooks: `window.render_game_to_text()` and `window.advanceTime(ms)`.
- Added a dependency-free Node smoke test at `scripts/core_smoke_test.mjs`.
- Added `package.json` with `type: module` and `test:core`.
- Ran `node scripts/core_smoke_test.mjs` and confirmed it passed.
- Added `?showcase=1` QA scene so headless screenshots can verify carrots and obstacles in one frame.
- Found mobile viewport overflow in Chrome screenshot and tightened shell/canvas CSS width constraints.
- Further constrained mobile shell to 370px and overlay to 320px after Chrome headless still showed a minimum-layout-viewport crop.
- Added inline favicon to avoid noisy `/favicon.ico` 404s during browser QA.
- Renamed initial git branch to `main`.
- Started a local static server on `http://localhost:5173`.
- Tried the required web-game Playwright client; blocked because `playwright` package and `npx`/npm are not available in this environment.
- Captured and visually inspected Chrome headless screenshots:
  - `output/bunbun-gameplay.png`
  - `output/bunbun-showcase.png`
  - `output/bunbun-mobile-title-fixed-v4.png`
  - `output/bunbun-mobile-showcase-fixed.png`
- Final screenshot checks: desktop showcase renders bunny, carrots, crate, fence, HUD; mobile title and gameplay fit without clipped UI.

## TODO

- Install npm/npx plus the `playwright` package if the exact `develop-web-game` Playwright client loop is required later.
- Possible next polish: add sound effects, parallax foreground leaves, and a short carrot combo meter.

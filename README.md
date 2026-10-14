# SlideJam

Offline **traffic-jam slide puzzle**. The playable catalog contains complete 6×6 traffic levels: slide cars, buses, and trucks only along their lanes until the red target car can leave through the right-side **EXIT**. These are genuine traffic layouts, not restyled jar boards.

The repository retains older jar-puzzle source records, but unconverted boards stay **hidden from the playable menu** until they follow traffic rules and pass geometry and solver checks. Replaced jar-source records are preserved under `src/levels/legacy/` rather than discarded.

| | |
|--|--|
| **Project ID** | `proj_slidejam_001` |
| **Slug** | `slidejam` |
| **Pages base** | `/slidejam/` |
| **Stack** | Vite + TypeScript + Canvas + PWA |
| **Playable coverage** | Levels 1–20; solver routes increase from 4 to 23 lane slides |
| **Hidden coverage** | Unconverted Levels 21–50 remain outside the playable catalog |

## Play

```bash
npm install
npm run dev
```

Production build for GitHub Pages at `/slidejam/`:

```bash
npm test
npm run test:e2e
npm run build
```

Serve `dist/` under `/slidejam/`. The app can work offline after its service worker has cached the build.

## Traffic controls

- Tap/click a vehicle, then swipe or drag along its lane. Horizontal vehicles move left/right; vertical vehicles move up/down. They cannot change lanes or pass through other traffic.
- Clear the red target car's row, then slide that car right through the marked **EXIT**. The target car leaving the board completes the level; the other vehicles do not need to disappear.
- **Keyboard:** the board receives focus when a level opens. Press **Enter** to cycle vehicles, then use an arrow key along the selected vehicle's orientation. **Ctrl/⌘+Z** undoes the last move.
- **Undo**, **Hint**, and **Restart** remain available below the board. The traffic hint follows a shortest solver route for each playable level.

## Features

1. Traffic-mode road grid with original Canvas-drawn cars, bus, truck, lane markings, and a visible exit.
2. Axis-locked collision engine and bounded breadth-first solver for traffic hints and level-solvability tests.
3. Solver-verified traffic levels; unconverted jar-source boards are not selectable or reachable from the game UI.
4. Pointer/touch dragging, keyboard movement and selection, undo, hint, restart, and level selection.
5. Screen-reader descriptions and polite move feedback; keyboard focus, modal behavior, and reduced-motion preferences are supported.
6. Local progress and settings; ad and purchase integrations remain stubs.
7. PWA build, with no external or licensed vehicle artwork.

## Tests

```bash
npm test
npm run test:e2e
```

Unit tests validate every registered board's geometry, visible exit lane, solver route, legal lane moves, blocked moves, and target-exit completion. Playwright tests solve traffic levels with the keyboard and cover staged unlocking through Level 20, hidden Levels 21–50, blocked movement, undo, hints, pointer use, accessibility feedback, and the win transition.

## Roman Urdu guide

See [GUIDE-roman-urdu.md](./GUIDE-roman-urdu.md) for install, run, controls, and the coverage boundary.

## v0.2.0 (Android + meta layer)

- Android: Capacitor 8 project in `android/` (`com.offerpk.slidejam`, `webDir: dist`); `.github/workflows/android.yml` runs tests, `npm run build`, `cap sync` and builds a signed AAB/APK on every `v*` tag. Vite `base` is now `./`.
- AdMob (`public/js/ads.js`, Google **test** IDs in `public/js/ads-config.js`): rewarded ads only from a tap (extra hints, 24h skin trials). Interstitials only from the win screen's buttons; never on launch, restart, exit or in the first session (`public/js/adgate.js`). The stub ad dialogs and the fake "Remove ads" button are gone.
- Meta layer (`public/js/metakit.js` + `meta-config.js`): How to play card, 7-day daily reward + seeded Daily challenge, Skin Shop (road themes + car paint drawn on the canvas, tap to preview, 24h rewarded trial), achievements + Stats (3 stars = BFS-shortest solution), level-1 coach, accessibility settings. Coins are cosmetic only.
- Store: `LAUNCH_CHECKLIST.md`, `store/LISTING-v0.2.md`, `store/screenshots/01–08.png`, `store/feature-graphic-1024x500.png`, Play Store guard workflow (`play-store.yml`).
- Tests: `npm test` (vitest + meta/ads unit + store guard), `npm run test:e2e` (Playwright, 25 specs), and `npm run build && node tests/meta.browser.cjs http://localhost:PORT/`.

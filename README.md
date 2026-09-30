# SlideJam

Offline **traffic-jam slide puzzle**. The playable catalog contains complete 6×6 traffic levels: slide cars, buses, and trucks only along their lanes until the red target car can leave through the right-side **EXIT**. These are genuine traffic layouts, not restyled jar boards.

The repository retains older jar-puzzle source records, but unconverted boards stay **hidden from the playable menu** until they follow traffic rules and pass geometry and solver checks. Replaced jar-source records are preserved under `src/levels/legacy/` rather than discarded.

| | |
|--|--|
| **Project ID** | `proj_slidejam_001` |
| **Slug** | `slidejam` |
| **Pages base** | `/slidejam/` |
| **Stack** | Vite + TypeScript + Canvas + PWA |
| **Playable coverage** | Levels 1–10; solver routes increase from 4 to 13 lane slides |
| **Hidden coverage** | Unconverted Levels 11–50 remain outside the playable catalog |

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
5. Screen-reader descriptions and polite move feedback; keyboard focus and modal behavior remain supported.
6. Local progress and settings; ad and purchase integrations remain stubs.
7. PWA build, with no external or licensed vehicle artwork.

## Tests

```bash
npm test
npm run test:e2e
```

Unit tests validate every registered board's geometry, visible exit lane, solver route, legal lane moves, blocked moves, and target-exit completion. Playwright tests solve traffic levels with the keyboard and cover staged unlocking through Level 10, hidden Levels 11–50, blocked movement, undo, hints, pointer use, accessibility feedback, and the win transition.

## Roman Urdu guide

See [GUIDE-roman-urdu.md](./GUIDE-roman-urdu.md) for install, run, controls, and the coverage boundary.

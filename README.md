# SlideJam

Offline **traffic-jam slide puzzle**. The playable game currently contains one complete 6×6 traffic level: move a red target car, a bus, a truck, and a blocking car only along their lanes until the target car can leave through the right-side **EXIT**. This is a deliberately focused playable slice, not a restyled jar board.

The repository still contains 49 older jar-puzzle level files, but they are **not exposed as playable levels** until they are converted to traffic rules and checked for solvability. The game menu therefore offers only the verified traffic level; it will not send players to the unrevised Level 10 screenshot or other jar boards.

| | |
|--|--|
| **Project ID** | `proj_slidejam_001` |
| **Slug** | `slidejam` |
| **Pages base** | `/slidejam/` |
| **Stack** | Vite + TypeScript + Canvas + PWA |
| **Playable coverage** | One solver-validated traffic level |

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
- **Undo**, **Hint**, and **Restart** remain available below the board. The traffic hint follows a shortest solver route for the playable level.

## Features

1. Traffic-mode road grid with original Canvas-drawn cars, bus, truck, lane markings, and a visible exit.
2. Axis-locked collision engine and bounded breadth-first solver for traffic hints and level-solvability tests.
3. One active traffic level; 49 unrevised jar level files are not selectable or reachable from the game UI.
4. Pointer/touch dragging, keyboard movement and selection, undo, hint, restart, and level selection.
5. Screen-reader descriptions and polite move feedback; keyboard focus and modal behavior remain supported.
6. Local progress and settings; ad and purchase integrations remain stubs.
7. PWA build, with no external or licensed vehicle artwork.

## Tests

```bash
npm test
npm run test:e2e
```

Unit tests cover legal lane movement, blocked moves, collision, the target-exit win condition, and a solver-confirmed route for the active level. Playwright tests cover keyboard solving, undo, hints, pointer use, accessibility feedback, and the win transition.

## Roman Urdu guide

See [GUIDE-roman-urdu.md](./GUIDE-roman-urdu.md) for install, run, controls, and the coverage boundary.

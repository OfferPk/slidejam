# SlideJam

Offline **slide-to-exit** block puzzle PWA — slide soft candy / jam jars to matching color exits until the shelf is clear.

**Not GlowGrid:** there is no polyomino tray and no row/column clear. Blocks start on the board; you **slide** them.  
**Not TubeSort / Color Block Jam:** original jam-jar theme and naming — no third-party assets or IP.

| | |
|--|--|
| **Project ID** | `proj_slidejam_001` |
| **Slug** | `slidejam` |
| **Pages base** | `/slidejam/` |
| **Stack** | Vite + TypeScript + Canvas + PWA |
| **Levels** | 50 JSON (easy → hard) |

## Play

```bash
npm install
npm run dev
```

Production build (GitHub Pages path `/slidejam/`):

```bash
npm test
npm run build
```

Serve `dist/` under `/slidejam/`. Offline after first load via service worker.

## Controls

- **Tap / click** a jar to select it, then **swipe / drag** along its free axis (↔ horizontal or ↕ vertical)
- **Keyboard:** the board receives focus when a level opens; press **Enter** to cycle jars, then use the arrow matching the jar's axis. **Ctrl/⌘+Z** undoes the last move.
- Jar slides until a **wall** or **other jar**
- When a jar **fully covers** matching-color exit pads → it clears
- Clear all jars → win → next level unlocks

## Features (MVP)

1. Grid engine — walls, exits, axis-locked AABB slide
2. 50 hand/generator JSON levels
3. Touch + mouse controls, restart, level select
4. Undo stack
5. Hint (1 free per level, then rewarded ad stub)
6. localStorage: unlock, mute, adsRemoved
7. Ads stubs: interstitial (restart/win), rewarded hint, remove-ads IAP stub
8. Docs: README, [GUIDE-roman-urdu.md](./GUIDE-roman-urdu.md), STATUS.md

## Roman Urdu guide

See **[GUIDE-roman-urdu.md](./GUIDE-roman-urdu.md)** for install, run, and feature walkthrough.

## Tests

```bash
npm test
```

Covers slide bounds, collision, exit clear, fixture solve smoke, ads stubs.

## License

Original factory MVP content. No Color Block Jam / GlowGrid assets.

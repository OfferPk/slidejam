# Changelog

## Traffic level expansion — 2026-09-30

### Added
- Converted level IDs 2–4 into original 6×6 traffic puzzles with lane-locked cars and buses/trucks, a visible right-side exit, and solver-confirmed shortest routes of 5, 6, and 7 slides.
- Kept all unrevised legacy jar boards (IDs 5–50) outside the playable catalog.
- Added geometry, overlap, legal/blocked move, target-exit completion, solution-depth, progression, accessibility, and keyboard E2E coverage; existing pointer/touch controls remain unchanged.

## 0.1.0 — 2026-09-28

### Added
- SlideJam MVP: axis-locked slide-to-exit grid engine (walls, collision, exit clear)
- 50 JSON levels (easy → hard), BFS-validated
- Undo stack; hint (1 free/level then rewarded stub)
- Ads stubs: interstitial, rewarded, remove-ads, isAdsRemoved
- Screens: Home, level select, play, win; mute/settings
- Progress persistence (unlock, adsRemoved, mute) via localStorage
- Canvas jam-jar theme (original — not GlowGrid / Color Block Jam)
- PWA with `base: '/slidejam/'`
- Vitest: slide bounds, collision, exit clear, fixture, ads
- README, GUIDE-roman-urdu.md, STATUS.md

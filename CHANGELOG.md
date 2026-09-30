# Changelog

## Traffic level expansion — 2026-09-30

### Added
- Converted level IDs 2–4 into original 6×6 traffic puzzles with lane-locked cars and buses/trucks, a visible right-side exit, and solver-confirmed shortest routes of 5, 6, and 7 slides.
- Converted further hidden jar-source boards into genuine lane-based traffic puzzles, with valid vehicle geometry, visible exits, and shortest routes that advance one slide at a time.
- Converted Levels 7–8 into new 6×6 traffic layouts with lane-locked cars and buses, visible right-side exits, and solver-verified shortest routes of 10 and 11 slides.
- Archived the original Level 7–8 jar-source records under `src/levels/legacy/`; unconverted Levels 9–50 remain hidden from play.
- Kept every unconverted legacy jar board outside the playable catalog and archived the replaced source records under `src/levels/legacy/`.
- Added solver-backed geometry, overlap, legal/blocked move, target-exit completion, solution-depth, progression, accessibility, and keyboard E2E coverage; existing pointer/touch controls remain unchanged.

## Traffic level expansion — Levels 9–10 — 2026-09-30

### Added
- Converted Levels 9–10 into lane-constrained 6×6 traffic puzzles with a visible right-side EXIT and distinct car, bus, and truck vehicles.
- Solver-confirmed shortest routes extend the one-slide progression to 12 and 13 moves; original jar records are preserved under `src/levels/legacy/` and unconverted Levels 11–50 stay hidden.
- Extended geometry, collision, completion, unlock, accessibility, keyboard, undo, hint, and browser coverage; the original Canvas artwork and touch controls remain in place.

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

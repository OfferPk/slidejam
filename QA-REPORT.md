# QA Report — SlideJam MVP v0.1.0

## Traffic conversion follow-up — 2026-09-30

This addendum records the conversion follow-up from clean `main` commit `6dc6369051ba85f5a52832ac5fb954cfa11e8918`. The 2026-09-28 report remains the historical audit of the original release; unconverted jar-source levels are still kept out of the playable catalog.

| Check | Result |
|---|---|
| Active catalog | **PASS** — only verified traffic definitions are registered; each has a 6×6 road, horizontal red target, and visible right-side EXIT. Unconverted jar-source levels remain hidden. |
| Geometry and lanes | **PASS** — vehicle orientation/length, board bounds, unique IDs, non-overlap, target lane, and rendered exit layout have unit assertions. |
| Solver / difficulty | **PASS** — shortest solver routes replay through legal lane slides and finish only when the target exits; route depth rises by one slide at each progression step. |
| Unit tests | **PASS** — `npm test`: 40/40 across 6 files, including blocked/off-axis movement and solver-backed completion checks. |
| Browser E2E | **PASS** — `npm run test:e2e`: 10/10, including keyboard completion of the new Level 5, gated progression, hidden legacy IDs, accessibility feedback, and pointer input. |
| Production build | **PASS** — `npm run build` with Vite/PWA at base `/slidejam/`. |
| Patch hygiene | **PASS** — `git diff --check`. |

Keyboard, touch/pointer, undo, and hint controls were not replaced; original Canvas-drawn vehicle artwork is retained. The replaced jar-source records are archived under `src/levels/legacy/`.

---

**Date:** 2026-09-28 18:36 PKT (Asia/Karachi)  
**Project:** `/workspace/factory/projects/slidejam`  
**Version:** 0.1.0  
**HEAD audited:** `39bc276055bcdbdcb34327885cfb1b19a90ad25f` (`39bc276` — docs: STATUS source SHA = MVP commit) — **not amended**  
**Feature commit (intact):** `19bf0793c0ae14772160825409e02605f344a061` (`19bf079` — feat: SlideJam MVP 0.1.0)  
**PRD:** `/workspace/factory/research/PRD-slidejam.md`  
**BUILD:** `/workspace/factory/research/BUILD-slidejam.md`  
**STATUS claim:** `READY_FOR_QA` (Source SHA `19bf079`)  
**QA:** Independent pass (report only — no product code changes; no GitHub push; no agent messages)  
**Overall:** **PASS**

---

## Summary

MVP scope holds against Master checklist + PRD §5 / §8. Axis-locked **slide-to-exit** engine (NOT GlowGrid polyomino tray/row-clear; NOT TubeSort), 50 BFS-validated JSON levels, undo + hint (1 free/level → rewarded stub), ads stubs (interstitial restart/win, rewarded hint, remove-ads IAP), Home/Levels/Play/Win, `localStorage` key `slidejam_v1`, PWA `base: '/slidejam/'`, README + GUIDE-roman-urdu.md + STATUS + CHANGELOG 0.1.0. Automation: **`npm test` 14/14**, **`npm run build` green**. Extra QA BFS: **50/50** levels solvable (max depth 15 on L50). Preview smoke `http://127.0.0.1:4193/slidejam/` — shell/manifest/SW/assets/icons **200**. No P0/P1 ship blockers.

| Severity | Count |
|----------|------:|
| Critical / P0 | 0 |
| High / P1     | 0 |
| Medium / P2   | 0 |
| Low / P3 (residual) | 4 |

**CLEAR for publish from QA:** **YES** (host under `base: /slidejam/`).

---

## Environment

| Item | Detail |
|------|--------|
| Runtime | `npm run preview -- --host 127.0.0.1 --port 4193` → `http://127.0.0.1:4193/slidejam/` |
| Methods | PRD/BUILD/STATUS/README/GUIDE/CHANGELOG; source review (`game/engine`, `game/persist`, `ads/stubs`, `ui/app`, `render/board`, levels, PWA); vitest; production build; QA-only Node BFS solvability probe (stdin, not written to tree); HTTP smoke of `dist/` |
| Zone | Asia/Karachi (UTC+5); times PKT |
| Git | Local `master` at `39bc276`; feature `19bf079` intact; SHA not amended; no push this QA |

---

## Automation

| Check | Result |
|-------|--------|
| `npm test` | **14/14 passed** — `tests/engine.test.ts` (11: slide bounds, collision, exit clear, fixture solve, level-1 hint loop, clone) + `tests/ads.test.ts` (3: interstitial, rewarded, remove-ads skip); vitest 3.2.7; exit 0 |
| `npm run build` | **green** — `tsc && vite build`; vite 6.4.3; PWA v1.3.0 `generateSW`; **11 precache entries** (47.74 KiB); `dist/sw.js` + `workbox-*.js`; asset hrefs under `/slidejam/`; exit 0 |
| Extra BFS (QA) | **50/50** solvable; ids 1–50 contiguous; no wall/block OOB or overlap; exit cell counts match block footprints by color; sample depths L1=1, L10=5, L25=3, L50=15 |

---

## Master scope verification

| # | Item | Verdict | Evidence |
|---|------|---------|----------|
| 1 | Axis-locked slide-to-exit (NOT GlowGrid polyomino clear) | **PASS** | `src/game/engine.ts`: `slideBlock` / `axisAllows` / AABB `canPlace` / `tryClearBlock` (full matching-exit cover). No tray, no place-from-tray, no row/column clear. UI tagline + README/GUIDE/STATUS/CHANGELOG explicitly “NOT GlowGrid”. Blocks start on board with `axis: H\|V`. |
| 2 | 50 BFS levels; undo/hint; ads stubs | **PASS** | `src/levels/level-01.json`…`level-50.json` + `LEVEL_COUNT=50`. Generator `scripts/gen-levels.mjs` BFS-validates; QA re-BFS 50/50. Undo stack in `app.ts`; hint 1 free then `showRewarded('hint')` → `hintMove`. Ads: interstitial restart/win, rewarded, `purchaseRemoveAds`. |
| 3 | Home / Levels / Play / Win; localStorage | **PASS** | Screens `'home'\|'levels'\|'play'\|'win'` in `src/ui/app.ts`. Persist `slidejam_v1`: `unlocked`, `adsRemoved`, `mute`. Sequential unlock on win via `unlockLevel(next)`. |
| 4 | PWA base `/slidejam/` | **PASS** | `vite.config.ts` `base: '/slidejam/'`; `public/manifest.webmanifest` start_url/scope `/slidejam/`; dist `index.html` assets/icons/manifest under `/slidejam/`; SW `precacheAndRoute` + `NavigationRoute` → `index.html`. |
| 5 | README + GUIDE-roman-urdu.md + STATUS + CHANGELOG 0.1.0 | **PASS** | All four at project root. CHANGELOG `## 0.1.0 — 2026-09-28`. GUIDE Roman Urdu §§1–9. STATUS `READY_FOR_QA`, Source SHA `19bf079`. |

### Also verified

| Item | Verdict | Evidence |
|------|---------|----------|
| Grid engine walls / collision / exit clear | **PASS** | Vitest slide bounds, wall stop, block-block stop, full-cover clear, partial/wrong-color reject |
| Touch + mouse drag axis lock | **PASS** | Pointer capture; `axis==='H'` clamps dy=0 else dx=0; swipe threshold 24px → Dir |
| Original jam theme / IP | **PASS** | Soft candy / jam jars canvas theme; README: no Color Block Jam / GlowGrid assets; naming SlideJam |
| Offline after first load (structural) | **PASS** | SW precache + NavigationRoute; no gameplay network fetch. No live airplane-mode toggle this pass |
| No git push / SHA intact | **PASS** | HEAD remains `39bc276`; feature `19bf079` not amended; report-only |

---

## Preview smoke (HTTP)

Base: `http://127.0.0.1:4193/slidejam`

| URL | Result |
|-----|--------|
| `/` | **200** HTML — SlideJam title, `#app`, assets under `/slidejam/` |
| `/manifest.webmanifest` | **200** — name SlideJam, display standalone, start_url/scope `/slidejam/` |
| `/sw.js` | **200** — precache index/assets/icons/manifest (11 entries) + NavigationRoute |
| `/assets/index-BB9GjgiX.js`, `index-BXyCHY-T.css` | **200** |
| `/icons/icon-192.png`, `512.png`, `icon.svg` | **200** (PNG 192×192 / 512×512 valid) |

---

## PRD acceptance mapping (§8)

| Criterion | Result |
|-----------|--------|
| Slide + collision + exit-clear correct | **PASS** (engine + vitest 11) |
| 50 playable levels; sequential unlock | **PASS** (50 JSON + BFS 50/50 + unlock on win) |
| Undo + hint stubs work | **PASS** (code path + hint loop test L1) |
| PWA offline; `/slidejam/` base OK | **PASS** (structural + smoke) |
| Ads/remove-ads stubs wired | **PASS** (ads tests 3/3 + UI presenters) |
| `npm test` + `npm run build` | **PASS** (14/14 + green) |
| README + GUIDE-roman-urdu; original jam theme | **PASS** (+ STATUS + CHANGELOG 0.1.0) |
| **No** GlowGrid place-clear mechanics | **PASS** (engine + UI + docs differentiators only) |

---

## Residuals (non-blocking)

1. **P3 — Mute is preference-only:** Mute toggles `localStorage` / UI label; move path has `/* sfx stub */` only — no Audio playback yet (GUIDE “Sound pack” future).  
2. **P3 — Mid-pack BFS depths shallow:** Many mid levels solve in depth 2–5; L50 reaches 15. Still all solvable; difficulty curve polish optional.  
3. **P3 — Icons minimal PNG weight:** 192×192 ≈621 B / 512×512 ≈2660 B — valid dimensions, fine for MVP installability; richer art optional.  
4. **P3 — No live offline-network toggle:** Airplane-mode browser check not performed; SW precache + NavigationRoute satisfy structural offline gate.

---

## Blockers

**None (P0/P1).**

---

## Verdict

| Question | Answer |
|----------|--------|
| Overall | **PASS** |
| CLEAR for publish from QA? | **YES** — host `dist/` under `/slidejam/` |
| Tip SHA amended? | **No** — remains `39bc276` (MVP `19bf079` intact) |

Report only — no product code changes, no GitHub push, no agent messages.

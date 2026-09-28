# SlideJam — Security Review Report

**Date:** 2026-09-28 18:35 PKT (Asia/Karachi, UTC+05:00)  
**Project:** `/workspace/factory/projects/slidejam`  
**HEAD reviewed:** `39bc276` (`39bc276055bcdbdcb34327885cfb1b19a90ad25f`) — docs: STATUS source SHA = MVP commit (MVP code `19bf079`)  
**Version:** 0.1.0  
**Reviewer:** Security Reviewer (executor)  
**Gate:** `/workspace/factory/shared/security/RELEASE_GATE.md`  
**Verdict:** **PASS_WITH_NOTES**  
**Sign-off:** **CLEAR** (no ship blockers)

**Statement:** No product code was edited. No git push was performed. Commit `39bc276` was not amended.

---

## Ship blockers

**None.**

No secrets/API keys/tokens in source or build, no exploitable XSS from untrusted input into HTML, no unexpected network/telemetry/live AdMob SDKs, no privileged auth surface, production dependency audit clean (`npm audit --omit=dev` → 0 vulnerabilities). Offline Vite/TS Canvas slide-to-exit PWA only.

---

## Master focus summary

| Focus | Result |
|-------|--------|
| 1. XSS / storage / UI | **PASS** — ad stubs use `esc()` + `innerHTML`; home/levels/play/win use `textContent`/`createElement`; canvas board — no DOM XSS from level JSON |
| 2. localStorage hygiene | **PASS_WITH_NOTES** — key `slidejam_v1`; unlocked floored ≥1; adsRemoved/mute `=== true`; no upper clamp to `LEVEL_COUNT` (F1) |
| 3. Deps audit | **PASS** — prod audit 0; vitest-only moderate in full audit (F3) |
| 4. Secrets | **PASS** — none; ads stubs only (`src/ads/stubs.ts`); no live AdMob/network |
| 5. CSP / headers | **Info** — no CSP meta in `index.html` (Pages host can add headers) (F4) |
| 6. Offline | **PASS** — no app fetch/beacon/analytics; Workbox precache only |
| 7. `.gitignore` | **Note** — missing `.env*` (F2), same pattern as peer factory PWAs |

---

## Findings

### F1 — `unlocked` not upper-clamped to `LEVEL_COUNT` on read (Low / note)

- **File:** `src/game/persist.ts:22` (`readRaw`)
- **Evidence:** `unlocked` coerced with `typeof === 'number' && >= 1 ? Math.floor(...) : 1` — no `Math.min(..., LEVEL_COUNT)`. UI soft-caps via `Math.min(persist.unlocked, LEVEL_COUNT)` on Play (`src/ui/app.ts:168`) and level grid loops only `1..LEVEL_COUNT` (`213–214`).
- **Risk:** Client-side localStorage tampering only (offline game; no server trust). A huge `unlocked` value does not unlock past 50 in the UI and cannot inject HTML.
- **Remediation (non-blocking):** On read, `unlocked = Math.min(LEVEL_COUNT, Math.max(1, Math.floor(parsed.unlocked)))` (import `LEVEL_COUNT` or pass max), matching ArrowPath-style clamp.
- **Severity:** Low / note — not a RELEASE_GATE ship blocker.

### F2 — `.gitignore` omits `.env*` patterns (Info / note)

- **File:** `.gitignore` (lines: `node_modules`, `dist`, `.DS_Store`, `*.local`, `.dev-dist`)
- **Evidence:** No `.env`, `.env.*`, or `!.env.example`. No `.env` files present in tree; no secret-like paths tracked.
- **Risk:** Accidental commit of future AdMob/IAP env files when live ads land.
- **Remediation (non-blocking):** Add `.env`, `.env.*`, `!.env.example` before introducing real keys.

### F3 — Full `npm audit` moderate findings are Vitest-only (Info / note)

- **Evidence:** `npm audit --omit=dev` → **0 vulnerabilities** (zero production `dependencies` in `package.json`). Full audit: 2 moderate in `@vitest/mocker` / `vitest` (GHSA-82fw-gwwq-j7x9) — **dev/test tree only**, not shipped in `dist/`.
- **Risk:** Local/CI Vitest misuse only; not a runtime ship risk for the offline PWA.
- **Remediation (non-blocking):** Plan Vitest upgrade when convenient; do not expose Vitest tooling to untrusted networks.

### F4 — CSP meta absent in `index.html` (Info)

- **File:** `index.html` (no `Content-Security-Policy` meta)
- **Evidence:** Typical for factory offline PWAs hosted on GitHub Pages; headers belong on the host. No third-party scripts in the document.
- **Risk:** None material for this client-only MVP with no remote script/connect surface.
- **Remediation (optional):** When Pages (or other host) supports custom headers, prefer CSP restricting `script-src` / `connect-src` to same-origin; keep Workbox/SW registration compatible.

---

## Checklist (RELEASE_GATE)

| # | Area | Status | Notes |
|---|------|--------|-------|
| 1 | Authn / sessions / tokens | N/A → PASS | No accounts, cookies, or tokens |
| 2 | Authz / IDOR / roles | N/A → PASS | Client-only game; no privileged routes |
| 3 | Secrets & config | PASS | No keys; ads are stubs (`src/ads/stubs.ts`) |
| 4 | API surface & rate limits | N/A → PASS | No app API |
| 5 | Injection (XSS / eval / HTML) | PASS | See XSS detail; no `eval` / `document.write` / `outerHTML` / `insertAdjacentHTML` |
| 6 | Uploads & file access | N/A → PASS | None |
| 7 | Dependencies & supply chain | PASS | Prod audit clean; F3 notes vitest-only |
| 8 | Logging / error leakage | PASS | Ad stub in-memory `log` only; no remote logging |
| 9 | Transport (TLS / cookies / HSTS) | N/A → PASS | Static Pages host; no cookie auth; CSP note F4 |
| 10 | Admin / debug surfaces | PASS | No debug endpoints |

### Focus detail

**XSS / UI (`src/ui/app.ts`)**  
- Ad stub modals (`92–107`, `109–138`): `modal.innerHTML` interpolates `esc(title)` and `esc(body)` then `.replace(/\n/g, '<br/>')` — HTML-escaped before injection. Reasons are app-controlled (`'restart'`, `'win'`, `'hint'`).  
- Overlay clears via `innerHTML = ''` (safe). Screen re-renders (`home`/`levels`/`play`/`win`) clear with `innerHTML = ''` then rebuild via `createElement` / `textContent` / `button()` helper (label → `textContent`).  
- Toast (`86–89`): `textContent` only.  
- Level select buttons (`215–217`): `textContent = locked ? '🔒' : String(i)` — numeric only.  
- No `eval`, `new Function`, `document.write`, `outerHTML`, or `insertAdjacentHTML` in `src/`.

**Canvas / level JSON (`src/render/board.ts`, `src/game/engine.ts`, `src/levels/`)**  
- Levels are static bundled JSON (ids, coords, colors, axes) — no free-text narrative fields rendered as HTML.  
- `loadBoard` maps numeric geometry + color tokens into `BoardState`; renderer draws via Canvas 2D.  
- Sole `fillText` (`board.ts:142`) draws axis glyphs `'↔'` / `'↕'` — never block `id` or level strings as DOM/HTML.  
- **No DOM XSS path from level JSON.**

**localStorage (`src/game/persist.ts`)**  
- Key: `slidejam_v1`  
- Fields: `unlocked` (number), `adsRemoved` (boolean), `mute` (boolean) — progress/flags only; **no credentials**  
- Hardening: try/catch on read/write; `unlocked` floor ≥1; `adsRemoved` / `mute` require `=== true`; F1 notes missing upper clamp  
- Consumed via numeric compares / boolean gates / `textContent` — not HTML-interpolated as untrusted strings

**Ads stubs (`src/ads/stubs.ts`)**  
- `showInterstitial` / `showRewarded` / `purchaseRemoveAds` / `isAdsRemoved`  
- UI presenters in `app.ts` (`70–84`) are overlay stubs (“Ad stub — Interstitial/Rewarded”; “No real ad SDK in MVP”); no AdMob SDK, no `ca-app-pub`, no network ads  
- `purchaseRemoveAds` only sets `adsRemoved: true` in localStorage; `isAdsRemoved()` requires `=== true`

**PWA / base / offline**  
- `vite.config.ts`: `base: '/slidejam/'`; Workbox `globPatterns` for static assets; `manifest: false` (uses `public/manifest.webmanifest`)  
- `src/main.ts`: `registerSW({ immediate: true })` from `virtual:pwa-register`  
- Build evidence: `dist/sw.js` precaches app assets + `NavigationRoute` → `index.html` only — no unexpected remote app URLs  
- Grep: no app `fetch(`, `sendBeacon`, `XMLHttpRequest`, `gtag`, `analytics`, `admob` in `src/` / `public/` / `index.html`

**Secrets**  
- No API keys, tokens, passwords, or `.env` files in source/public/dist. Package has **zero** production dependencies (devDeps only: typescript, vite, vite-plugin-pwa, vitest, @types/node).

---

## Commands run (evidence)

| Command | Result |
|---------|--------|
| `git rev-parse HEAD` | `39bc276055bcdbdcb34327885cfb1b19a90ad25f` |
| `npm test` | **14/14 passed** (ads 3 + engine 11) |
| `npm audit --omit=dev` | **0 vulnerabilities** |
| `npm audit` (full) | 2 moderate (vitest / @vitest/mocker only) |
| Grep sinks / network / secrets | `innerHTML` only in `app.ts` (esc'd ad stubs + safe clears); localStorage in persist only; no committed secrets |

**Not done (per brief):** no product code edits; no git push; SHA `39bc276` not amended.

---

## Notes

- Client-controlled `localStorage` progress (unlock, adsRemoved stub, mute) is tamperable by design for an offline game — not a ship blocker with no server trust boundary.
- CSP/headers for GitHub Pages remain a hosting concern (F4); MVP ships without inline CSP meta consistently with peer factory PWAs (e.g. HexPour, DailySudoku Lite).
- STATUS.md stamps source SHA `19bf079` (MVP); review tip HEAD is `39bc276` as instructed.

---

## Sign-off

**Verdict:** PASS_WITH_NOTES  
**Ship blockers:** none  
**Sign-off:** **CLEAR** — eligible for QA / Master dual-clear publish path once Product/QA gates pass. Address F1–F4 as polish, not blockers.

Report path: `/workspace/factory/projects/slidejam/SECURITY-REPORT.md`

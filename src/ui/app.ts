/**
 * SlideJam UI — Home, level select, play, win; mute/settings; ads wired.
 * Slide-to-exit (NOT GlowGrid place/clear). Soft candy / jam jars theme.
 */
import {
  cloneBoard,
  hintMove,
  isWon,
  loadBoard,
  slideBlock,
} from '../game/engine';
import {
  loadPersist,
  savePersist,
  unlockLevel,
  type PersistData,
} from '../game/persist';
import type { BoardState, Dir } from '../game/types';
import { LEVEL_COUNT, getLevel } from '../levels/index';
import {
  computeLayout,
  drawBoard,
  hitTestBlock,
  type BoardLayout,
} from '../render/board';
import {
  isAdsRemoved,
  purchaseRemoveAds,
  setInterstitialPresenter,
  setRewardedPresenter,
  showInterstitial,
  showRewarded,
} from '../ads/stubs';

type Screen = 'home' | 'levels' | 'play' | 'win';

const SWIPE_THRESHOLD = 24;

export function mountApp(root: HTMLElement): void {
  let persist: PersistData = loadPersist();
  let screen: Screen = 'home';
  let levelId = 1;
  let board: BoardState | null = null;
  let undoStack: BoardState[] = [];
  let selectedId: string | null = null;
  let hintId: string | null = null;
  let freeHintsLeft = 1;
  let layout: BoardLayout | null = null;
  let raf = 0;

  // Pointer drag state
  let dragId: string | null = null;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragDx = 0;
  let dragDy = 0;
  let sliding = false;

  const el = {
    home: div('screen', 'home'),
    levels: div('screen', 'levels'),
    play: div('screen', 'play'),
    win: div('screen', 'win'),
    overlay: div('overlay'),
    toast: div('toast'),
  };

  root.append(el.home, el.levels, el.play, el.win, el.overlay, el.toast);

  setInterstitialPresenter(async (reason) => {
    await showModalStub(
      'Ad stub — Interstitial',
      `Reason: ${reason}\n(No real ad SDK in MVP)`,
      'Continue',
    );
  });
  setRewardedPresenter(async (reason) => {
    return showModalStubConfirm(
      'Ad stub — Rewarded',
      `Watch stub for: ${reason}\nGrant reward?`,
      'Earn reward',
      'Cancel',
    );
  });

  function showToast(msg: string): void {
    el.toast.textContent = msg;
    el.toast.classList.add('show');
    setTimeout(() => el.toast.classList.remove('show'), 1600);
  }

  function showModalStub(title: string, body: string, okLabel: string): Promise<void> {
    return new Promise((resolve) => {
      el.overlay.className = 'overlay open';
      el.overlay.innerHTML = '';
      const modal = div('modal');
      modal.innerHTML = `<div class="ad-stub"><strong>${esc(title)}</strong>${esc(body).replace(/\n/g, '<br/>')}</div>`;
      modal.append(
        button(okLabel, 'btn block', () => {
          el.overlay.className = 'overlay';
          el.overlay.innerHTML = '';
          resolve();
        }),
      );
      el.overlay.append(modal);
    });
  }

  function showModalStubConfirm(
    title: string,
    body: string,
    yes: string,
    no: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      el.overlay.className = 'overlay open';
      el.overlay.innerHTML = '';
      const modal = div('modal');
      modal.innerHTML = `<div class="ad-stub"><strong>${esc(title)}</strong>${esc(body).replace(/\n/g, '<br/>')}</div>`;
      const row = div('');
      row.style.display = 'flex';
      row.style.gap = '8px';
      row.append(
        button(no, 'btn secondary', () => {
          el.overlay.className = 'overlay';
          el.overlay.innerHTML = '';
          resolve(false);
        }),
        button(yes, 'btn', () => {
          el.overlay.className = 'overlay';
          el.overlay.innerHTML = '';
          resolve(true);
        }),
      );
      modal.append(row);
      el.overlay.append(modal);
    });
  }

  function setScreen(s: Screen): void {
    screen = s;
    for (const k of ['home', 'levels', 'play', 'win'] as const) {
      el[k].classList.toggle('active', k === s);
    }
    cancelAnimationFrame(raf);
    if (s === 'home') renderHome();
    else if (s === 'levels') renderLevels();
    else if (s === 'play') {
      renderPlayShell();
      startLoop();
    } else if (s === 'win') renderWin();
  }

  function renderHome(): void {
    el.home.innerHTML = '';
    const hero = div('home-hero');
    hero.append(div('home-jar'));
    const title = document.createElement('h1');
    title.textContent = 'SlideJam';
    const tag = div('tagline');
    tag.textContent = 'Slide candy jars to matching exits. Offline. Not a place-and-clear puzzle.';
    hero.append(title, tag);
    el.home.append(hero);

    const actions = div('home-actions');
    actions.append(
      button('Play', 'btn block', () => {
        startLevel(Math.min(persist.unlocked, LEVEL_COUNT));
      }),
      button('Levels', 'btn secondary block', () => setScreen('levels')),
    );
    el.home.append(actions);

    const settings = div('settings-row');
    settings.append(
      button(persist.mute ? 'Unmute' : 'Mute', 'btn ghost', () => {
        persist = savePersist({ mute: !persist.mute });
        showToast(persist.mute ? 'Muted' : 'Sound on (stub)');
        renderHome();
      }),
      button(
        isAdsRemoved() ? 'Ads removed' : 'Remove ads',
        'btn ghost',
        async () => {
          if (isAdsRemoved()) {
            showToast('Ads already removed');
            return;
          }
          await purchaseRemoveAds();
          persist = loadPersist();
          showToast('Remove-ads stub applied');
          renderHome();
        },
      ),
    );
    el.home.append(settings);
    const note = div('home-note');
    note.textContent = `Unlocked ${persist.unlocked}/${LEVEL_COUNT} · proj_slidejam_001`;
    el.home.append(note);
  }

  function renderLevels(): void {
    el.levels.innerHTML = '';
    const head = div('levels-head');
    const h = document.createElement('h2');
    h.textContent = 'Levels';
    head.append(
      h,
      button('Back', 'btn ghost', () => setScreen('home')),
    );
    el.levels.append(head);
    const grid = div('level-grid');
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const locked = i > persist.unlocked;
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (locked ? ' locked' : '') + (i === persist.unlocked ? ' current' : '');
      btn.textContent = locked ? '🔒' : String(i);
      btn.disabled = locked;
      if (!locked) {
        btn.addEventListener('click', () => startLevel(i));
      }
      grid.append(btn);
    }
    el.levels.append(grid);
  }

  function startLevel(id: number): void {
    const def = getLevel(id);
    if (!def) return;
    levelId = id;
    board = loadBoard(def);
    undoStack = [];
    selectedId = null;
    hintId = null;
    freeHintsLeft = 1;
    dragId = null;
    setScreen('play');
  }

  function renderPlayShell(): void {
    el.play.innerHTML = '';
    const bar = div('play-bar');
    const title = div('title');
    title.textContent = `Level ${levelId}`;
    bar.append(
      button('←', 'btn ghost', () => setScreen('levels')),
      title,
      button(persist.mute ? '🔇' : '🔊', 'btn ghost', () => {
        persist = savePersist({ mute: !persist.mute });
        renderPlayShell();
        startLoop();
      }),
    );
    el.play.append(bar);

    const wrap = div('canvas-wrap');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-label', 'SlideJam board');
    wrap.append(canvas);
    el.play.append(wrap);

    const tools = div('play-tools');
    tools.append(
      button('Undo', 'btn secondary', () => doUndo()),
      button('Hint', 'btn gold', () => void doHint()),
      button('Restart', 'btn secondary', () => void doRestart()),
    );
    el.play.append(tools);

    wireCanvas(canvas);
    resizeCanvas(canvas);
  }

  function wireCanvas(canvas: HTMLCanvasElement): void {
    const toLocal = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top) * sy,
      };
    };

    canvas.addEventListener('pointerdown', (e) => {
      if (!board || sliding) return;
      canvas.setPointerCapture(e.pointerId);
      const p = toLocal(e);
      const id = layout ? hitTestBlock(board, layout, p.x, p.y) : null;
      selectedId = id;
      hintId = null;
      if (!id) return;
      dragId = id;
      dragStartX = p.x;
      dragStartY = p.y;
      dragDx = 0;
      dragDy = 0;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!dragId || !board) return;
      const p = toLocal(e);
      const rawDx = p.x - dragStartX;
      const rawDy = p.y - dragStartY;
      const b = board.blocks.find((x) => x.id === dragId);
      if (!b) return;
      if (b.axis === 'H') {
        dragDx = rawDx;
        dragDy = 0;
      } else {
        dragDx = 0;
        dragDy = rawDy;
      }
    });

    const endDrag = async (_e: PointerEvent) => {
      if (!dragId || !board) {
        dragId = null;
        return;
      }
      const id = dragId;
      const dx = dragDx;
      const dy = dragDy;
      dragId = null;
      dragDx = 0;
      dragDy = 0;

      let dir: Dir | null = null;
      if (Math.abs(dx) >= SWIPE_THRESHOLD || Math.abs(dy) >= SWIPE_THRESHOLD) {
        if (Math.abs(dx) >= Math.abs(dy)) dir = dx > 0 ? 'R' : 'L';
        else dir = dy > 0 ? 'D' : 'U';
      }
      if (!dir) return;

      sliding = true;
      undoStack.push(cloneBoard(board));
      const result = slideBlock(board, id, dir);
      if (result.moved === 0) {
        undoStack.pop();
        showToast('Blocked');
      } else if (!persist.mute) {
        /* sfx stub */
      }
      selectedId = id;
      sliding = false;

      if (board && isWon(board)) {
        await onWin();
      }
    };

    canvas.addEventListener('pointerup', (e) => void endDrag(e));
    canvas.addEventListener('pointercancel', (e) => void endDrag(e));
  }

  function resizeCanvas(canvas: HTMLCanvasElement): void {
    const wrap = canvas.parentElement;
    if (!wrap || !board) return;
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    layout = computeLayout(board, canvas.width, canvas.height, 16 * dpr);
  }

  function startLoop(): void {
    const canvas = el.play.querySelector('canvas');
    if (!canvas || !board) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tick = () => {
      if (screen !== 'play' || !board) return;
      resizeCanvas(canvas);
      if (layout) {
        drawBoard(ctx, board, layout, {
          selectedId,
          hintId,
          dragOffset:
            dragId != null
              ? { id: dragId, dx: dragDx, dy: dragDy }
              : null,
        });
      }
      raf = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function doUndo(): void {
    if (!board || undoStack.length === 0) {
      showToast('Nothing to undo');
      return;
    }
    board = undoStack.pop()!;
    hintId = null;
    showToast('Undo');
  }

  async function doHint(): Promise<void> {
    if (!board) return;
    if (freeHintsLeft <= 0) {
      const earned = await showRewarded('hint');
      if (!earned) {
        showToast('Hint cancelled');
        return;
      }
    } else {
      freeHintsLeft--;
    }
    const h = hintMove(board);
    if (!h) {
      showToast('No moves');
      return;
    }
    hintId = h.blockId;
    selectedId = h.blockId;
    showToast(`Hint: slide ${h.dir}`);
  }

  async function doRestart(): Promise<void> {
    await showInterstitial('restart');
    startLevel(levelId);
  }

  async function onWin(): Promise<void> {
    const next = levelId + 1;
    if (next <= LEVEL_COUNT) {
      persist = unlockLevel(next);
    } else {
      persist = unlockLevel(LEVEL_COUNT);
    }
    await showInterstitial('win');
    setScreen('win');
  }

  function renderWin(): void {
    el.win.innerHTML = '';
    const hero = div('win-hero');
    const emoji = div('emoji');
    emoji.textContent = '🍓';
    const h = document.createElement('h1');
    h.textContent = 'Jar cleared!';
    const tag = div('tagline');
    tag.textContent =
      levelId >= LEVEL_COUNT
        ? 'All 50 levels done — sweet!'
        : `Level ${levelId} complete. Next jam unlocks.`;
    hero.append(emoji, h, tag);
    el.win.append(hero);
    const actions = div('win-actions');
    if (levelId < LEVEL_COUNT) {
      actions.append(
        button('Next level', 'btn block', () => startLevel(levelId + 1)),
      );
    }
    actions.append(
      button('Replay', 'btn secondary block', () => startLevel(levelId)),
      button('Levels', 'btn ghost block', () => setScreen('levels')),
    );
    el.win.append(actions);
  }

  window.addEventListener('resize', () => {
    if (screen === 'play') {
      const canvas = el.play.querySelector('canvas');
      if (canvas) resizeCanvas(canvas);
    }
  });

  setScreen('home');
}

function div(className: string, id?: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = className;
  if (id) d.id = id;
  return d;
}

function button(label: string, className: string, onClick: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = className;
  b.type = 'button';
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

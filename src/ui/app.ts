/**
 * SlideJam UI — verified traffic slice with retained legacy slide compatibility.
 * Vehicle movements stay axis-locked; undo, hints, and keyboard controls remain.
 */
import {
  axisAllows,
  hintMove,
  isWon,
  loadBoard,
  slideBlock,
} from '../game/engine';
import { getTrafficExitStatus } from '../game/traffic-feedback';
import { UndoHistory, takeUndoSnapshot } from '../game/history';
import { getBoardKeyboardAction } from './keyboard';
import { getPointerSlideAction } from './pointer';
import {
  loadPersist,
  savePersist,
  unlockLevel,
  type PersistData,
} from '../game/persist';
import type { BlockState, BoardState, ColorId, Dir } from '../game/types';
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
const COLOR_NAMES: Record<ColorId, string> = {
  R: 'Red',
  G: 'Green',
  B: 'Blue',
  Y: 'Yellow',
  P: 'Purple',
  O: 'Orange',
};

const VEHICLE_NAMES: Record<BlockState['vehicleKind'], string> = {
  car: 'car',
  bus: 'bus',
  truck: 'truck',
};

const DIRECTION_NAMES: Record<Dir, string> = {
  L: 'left',
  R: 'right',
  U: 'up',
  D: 'down',
};

export function mountApp(root: HTMLElement): void {
  let persist: PersistData = loadPersist();
  let screen: Screen = 'home';
  let levelId = 1;
  let board: BoardState | null = null;
  const undoHistory = new UndoHistory();
  let moveCount = 0;
  let moveCountDisplay: HTMLParagraphElement | null = null;
  let exitStatusDisplay: HTMLParagraphElement | null = null;
  let undoButton: HTMLButtonElement | null = null;
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
  let gestureDx = 0;
  let gestureDy = 0;
  let sliding = false;

  const el = {
    home: div('screen', 'home'),
    levels: div('screen', 'levels'),
    play: div('screen', 'play'),
    win: div('screen', 'win'),
    overlay: div('overlay'),
    toast: div('toast'),
  };

  root.setAttribute('role', 'main');
  root.append(el.home, el.levels, el.play, el.win, el.overlay, el.toast);
  el.toast.setAttribute('role', 'status');
  el.toast.setAttribute('aria-live', 'polite');
  el.toast.setAttribute('aria-atomic', 'true');

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

  function dismissModal(previousFocus: HTMLElement | null): void {
    el.overlay.className = 'overlay';
    el.overlay.innerHTML = '';
    if (previousFocus?.isConnected) previousFocus.focus();
  }

  function prepareModal(
    modal: HTMLDivElement,
    initialFocus: HTMLButtonElement,
    onEscape: () => void,
  ): void {
    modal.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = Array.from(
        modal.querySelectorAll<HTMLButtonElement>('button:not([disabled])'),
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        return;
      }
      const focusIsOutside = !modal.contains(document.activeElement);
      if (event.shiftKey && (document.activeElement === first || focusIsOutside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || focusIsOutside)) {
        event.preventDefault();
        first.focus();
      }
    });
    initialFocus.focus();
  }

  function showModalStub(title: string, body: string, okLabel: string): Promise<void> {
    return new Promise((resolve) => {
      const previousFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      el.overlay.className = 'overlay open';
      el.overlay.innerHTML = '';
      const modal = div('modal');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'ad-stub-title');
      modal.setAttribute('aria-describedby', 'ad-stub-description');
      modal.innerHTML = `<div class="ad-stub"><strong id="ad-stub-title">${esc(title)}</strong><span id="ad-stub-description">${esc(body).replace(/\n/g, '<br/>')}</span></div>`;
      const close = () => {
        dismissModal(previousFocus);
        resolve();
      };
      const continueButton = button(okLabel, 'btn block', close);
      modal.append(continueButton);
      el.overlay.append(modal);
      prepareModal(modal, continueButton, close);
    });
  }

  function showModalStubConfirm(
    title: string,
    body: string,
    yes: string,
    no: string,
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const previousFocus = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      el.overlay.className = 'overlay open';
      el.overlay.innerHTML = '';
      const modal = div('modal');
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'ad-stub-title');
      modal.setAttribute('aria-describedby', 'ad-stub-description');
      modal.innerHTML = `<div class="ad-stub"><strong id="ad-stub-title">${esc(title)}</strong><span id="ad-stub-description">${esc(body).replace(/\n/g, '<br/>')}</span></div>`;
      const row = div('');
      row.style.display = 'flex';
      row.style.gap = '8px';
      const cancel = () => {
        dismissModal(previousFocus);
        resolve(false);
      };
      const confirm = () => {
        dismissModal(previousFocus);
        resolve(true);
      };
      const cancelButton = button(no, 'btn secondary', cancel);
      row.append(cancelButton, button(yes, 'btn', confirm));
      modal.append(row);
      el.overlay.append(modal);
      prepareModal(modal, cancelButton, cancel);
    });
  }

  function setScreen(s: Screen, moveFocus = true): void {
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
    if (moveFocus) focusScreen(s);
  }

  function focusScreen(s: Screen): void {
    const target = s === 'play'
      ? el.play.querySelector<HTMLElement>('canvas')
      : el[s].querySelector<HTMLElement>('h1, h2');
    if (!target) return;
    if (s !== 'play') target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }

  function renderHome(): void {
    el.home.innerHTML = '';
    const hero = div('home-hero');
    hero.append(div('home-car'));
    const title = document.createElement('h1');
    title.textContent = 'SlideJam';
    const tag = div('tagline');
    tag.textContent =
      'Move every vehicle only along its lane, clear the traffic blocking the red target car, then drive it through EXIT.';
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
    const muteButton = button(persist.mute ? 'Unmute' : 'Mute', 'btn ghost', () => {
        persist = savePersist({ mute: !persist.mute });
        muteButton.textContent = persist.mute ? 'Unmute' : 'Mute';
        showToast(persist.mute ? 'Muted' : 'Sound on (stub)');
      });
    const removeAdsButton = button(
        isAdsRemoved() ? 'Ads removed' : 'Remove ads',
        'btn ghost',
        async () => {
          if (isAdsRemoved()) {
            showToast('Ads already removed');
            return;
          }
          await purchaseRemoveAds();
          persist = loadPersist();
          removeAdsButton.textContent = isAdsRemoved() ? 'Ads removed' : 'Remove ads';
          showToast('Remove-ads stub applied');
        },
      );
    settings.append(muteButton, removeAdsButton);
    el.home.append(settings);
    const note = div('home-note');
    note.textContent = `${LEVEL_COUNT} verified traffic levels · legacy levels remain hidden`;
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
    const unlockedLevel = Math.max(1, Math.min(persist.unlocked, LEVEL_COUNT));
    const completedCount = unlockedLevel - 1;
    const progress = document.createElement('p');
    progress.id = 'level-progress';
    progress.className = 'level-progress';
    progress.setAttribute('role', 'status');
    const clearedSummary = completedCount === 0
      ? 'No earlier levels cleared'
      : `${completedCount} earlier ${completedCount === 1 ? 'level' : 'levels'} cleared`;
    progress.textContent = `Level ${unlockedLevel} unlocked · ${clearedSummary}`;
    el.levels.append(progress);
    const grid = div('level-grid');
    for (let i = 1; i <= LEVEL_COUNT; i++) {
      const locked = i > unlockedLevel;
      const completed = i < unlockedLevel;
      const btn = document.createElement('button');
      btn.className = 'level-btn' + (locked ? ' locked' : '') + (completed ? ' completed' : '') + (i === unlockedLevel ? ' current' : '');
      btn.textContent = locked ? '🔒' : String(i);
      btn.setAttribute(
        'aria-label',
        locked ? `Level ${i}, locked` : `Level ${i}`,
      );
      if (completed) btn.setAttribute('aria-description', 'Completed');
      else if (i === unlockedLevel) btn.setAttribute('aria-description', 'Current unlocked level');
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
    undoHistory.clear();
    moveCount = 0;
    selectedId = null;
    hintId = null;
    freeHintsLeft = 1;
    dragId = null;
    setScreen('play');
  }

  function renderPlayShell(): void {
    el.play.innerHTML = '';
    const bar = div('play-bar');
    const title = document.createElement('h2');
    title.className = 'title';
    title.textContent = board?.mode === 'traffic' ? `Level ${levelId} · Traffic` : `Level ${levelId}`;
    const backButton = button('←', 'btn ghost', () => setScreen('levels'));
    backButton.setAttribute('aria-label', 'Back to levels');
    const muteButton = button(persist.mute ? '🔇' : '🔊', 'btn ghost', () => {
        persist = savePersist({ mute: !persist.mute });
        muteButton.textContent = persist.mute ? '🔇' : '🔊';
        muteButton.setAttribute('aria-label', persist.mute ? 'Unmute sound' : 'Mute sound');
      });
    muteButton.setAttribute('aria-label', persist.mute ? 'Unmute sound' : 'Mute sound');
    bar.append(backButton, title, muteButton);
    el.play.append(bar);

    const wrap = div('canvas-wrap');
    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'group');
    canvas.setAttribute(
      'aria-label',
      board?.mode === 'traffic'
        ? `Level ${levelId} traffic puzzle board with an exit on the right`
        : `Level ${levelId} puzzle board`,
    );
    canvas.setAttribute(
      'aria-describedby',
      board?.mode === 'traffic'
        ? 'board-help exit-status vehicle-descriptions'
        : 'board-help vehicle-descriptions',
    );
    canvas.tabIndex = 0;
    wrap.append(canvas);
    const help = div('play-help');
    help.id = 'board-help';
    help.textContent = board?.mode === 'traffic'
      ? 'Move vehicles only along their orientation: horizontal vehicles slide left or right; vertical vehicles slide up or down. Clear the red target car’s lane and drive it through the EXIT on the right. Tap or drag a vehicle, or focus the board and press Enter to cycle vehicles, then use the arrow keys. Ctrl/⌘+Z undoes a move.'
      : 'Tap or click a jar, then swipe or drag along its arrow. The board receives focus when a level opens. Press Enter to cycle jars, then use the arrow keys; Ctrl/⌘+Z undoes a move.';
    const vehicleDescriptions = document.createElement('ul');
    vehicleDescriptions.id = 'vehicle-descriptions';
    vehicleDescriptions.className = 'visually-hidden';
    vehicleDescriptions.setAttribute('aria-live', 'polite');
    vehicleDescriptions.setAttribute('aria-atomic', 'false');
    vehicleDescriptions.setAttribute('aria-relevant', 'additions removals text');
    exitStatusDisplay = null;
    if (board?.mode === 'traffic') {
      exitStatusDisplay = document.createElement('p');
      exitStatusDisplay.id = 'exit-status';
      exitStatusDisplay.className = 'exit-status';
      exitStatusDisplay.setAttribute('aria-live', 'polite');
      exitStatusDisplay.setAttribute('aria-atomic', 'true');
      el.play.append(wrap, help, exitStatusDisplay, vehicleDescriptions);
    } else {
      el.play.append(wrap, help, vehicleDescriptions);
    }
    syncTrafficExitStatus();
    syncVehicleDescriptions();

    moveCountDisplay = document.createElement('p');
    moveCountDisplay.id = 'move-count';
    moveCountDisplay.className = 'move-count';
    moveCountDisplay.setAttribute('aria-live', 'polite');
    moveCountDisplay.setAttribute('aria-atomic', 'true');
    el.play.append(moveCountDisplay);
    syncMoveCount();

    const tools = div('play-tools');
    undoButton = button('Undo', 'btn secondary', () => doUndo());
    tools.append(
      undoButton,
      button('Hint', 'btn gold', () => void doHint()),
      button('Restart', 'btn secondary', () => void doRestart()),
    );
    el.play.append(tools);
    syncUndoButton();

    wireCanvas(canvas);
    resizeCanvas(canvas);
  }

  function syncUndoButton(): void {
    if (undoButton) {
      undoButton.disabled = !undoHistory.canUndo || !board || isWon(board);
    }
  }

  function syncMoveCount(): void {
    if (moveCountDisplay) {
      moveCountDisplay.textContent = `Moves this attempt: ${moveCount}`;
    }
  }

  function syncTrafficExitStatus(): void {
    if (exitStatusDisplay && board) {
      exitStatusDisplay.textContent = getTrafficExitStatus(board) ?? '';
    }
  }

  function syncVehicleDescriptions(): void {
    const list = el.play.querySelector<HTMLUListElement>('#vehicle-descriptions');
    if (!list || !board) return;

    const existing = new Map<string, HTMLLIElement>();
    for (const child of Array.from(list.children)) {
      if (child instanceof HTMLLIElement && child.dataset.vehicleId) {
        existing.set(child.dataset.vehicleId, child);
      }
    }
    for (const block of board.blocks) {
      let item = existing.get(block.id);
      if (!item) {
        item = document.createElement('li');
        item.dataset.vehicleId = block.id;
        list.append(item);
      }
      const description = board.mode === 'traffic'
        ? describeVehicle(block, board.targetId === block.id)
        : describeJar(block);
      if (item.textContent !== description) item.textContent = description;
      existing.delete(block.id);
    }
    for (const item of existing.values()) item.remove();
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
      gestureDx = 0;
      gestureDy = 0;
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!dragId || !board) return;
      const p = toLocal(e);
      const rawDx = p.x - dragStartX;
      const rawDy = p.y - dragStartY;
      const b = board.blocks.find((x) => x.id === dragId);
      if (!b) return;
      gestureDx = rawDx;
      gestureDy = rawDy;
      if (b.axis === 'H') {
        dragDx = rawDx;
        dragDy = 0;
      } else {
        dragDx = 0;
        dragDy = rawDy;
      }
    });

    const endDrag = async () => {
      if (!dragId || !board) {
        dragId = null;
        dragDx = 0;
        dragDy = 0;
        gestureDx = 0;
        gestureDy = 0;
        return;
      }
      const id = dragId;
      const dx = gestureDx;
      const dy = gestureDy;
      dragId = null;
      dragDx = 0;
      dragDy = 0;
      gestureDx = 0;
      gestureDy = 0;

      const block = board.blocks.find((candidate) => candidate.id === id);
      if (!block) return;
      const action = getPointerSlideAction(dx, dy, block.axis, SWIPE_THRESHOLD);
      if (!action) {
        const index = board.blocks.findIndex((candidate) => candidate.id === id);
        showToast(selectionMessage(board, block, index));
        return;
      }
      if (action.type === 'off-axis') {
        showToast(
          board.mode === 'traffic'
            ? block.axis === 'H'
              ? 'Use left or right to move this vehicle along its lane'
              : 'Use up or down to move this vehicle along its lane'
            : block.axis === 'H'
              ? 'Use left or right to slide this jar'
              : 'Use up or down to slide this jar',
        );
        return;
      }

      await moveBlock(id, action.dir, true);
    };

    canvas.addEventListener('pointerup', () => void endDrag());
    canvas.addEventListener('pointercancel', () => {
      dragId = null;
      dragDx = 0;
      dragDy = 0;
      gestureDx = 0;
      gestureDy = 0;
    });
    canvas.addEventListener('keydown', onBoardKeyDown);
  }

  function onBoardKeyDown(e: KeyboardEvent): void {
    if (!board || screen !== 'play' || sliding) return;
    const action = getBoardKeyboardAction(e.key, e);
    if (!action) return;
    e.preventDefault();

    if (action.type === 'select-next') {
      if (board.blocks.length === 0) return;
      const currentIndex = board.blocks.findIndex((block) => block.id === selectedId);
      const nextIndex = (currentIndex + 1) % board.blocks.length;
      selectedId = board.blocks[nextIndex]!.id;
      hintId = null;
      showToast(selectionMessage(board, board.blocks[nextIndex]!, nextIndex));
      return;
    }
    if (action.type === 'undo') {
      doUndo();
      return;
    }

    if (!selectedId) {
      showToast(board.mode === 'traffic' ? 'Press Enter to select a vehicle first' : 'Press Enter to select a jar first');
      return;
    }
    const selected = board.blocks.find((block) => block.id === selectedId);
    if (!selected) {
      selectedId = null;
      return;
    }
    if (!axisAllows(selected.axis, action.dir)) {
      showToast(
        board.mode === 'traffic'
          ? selected.axis === 'H'
            ? 'Use left or right to move this vehicle along its lane'
            : 'Use up or down to move this vehicle along its lane'
          : selected.axis === 'H'
            ? 'Use left or right to slide this jar'
            : 'Use up or down to slide this jar',
      );
      return;
    }
    void moveBlock(selected.id, action.dir, true);
  }

  async function moveBlock(id: string, dir: Dir, announce = false): Promise<void> {
    if (!board || sliding) return;
    sliding = true;
    undoHistory.push(board, selectedId);
    const result = slideBlock(board, id, dir);
    if (result.moved === 0) {
      undoHistory.pop();
      syncUndoButton();
      selectedId = id;
      showToast(`No space remains to the ${DIRECTION_NAMES[dir]}`);
      sliding = false;
      return;
    }
    if (!persist.mute) {
      /* sfx stub */
    }
    hintId = null;
    moveCount++;
    syncMoveCount();
    syncTrafficExitStatus();
    selectedId = result.cleared ? null : id;
    syncVehicleDescriptions();
    syncUndoButton();
    if (announce) {
      showToast(result.cleared
        ? board.mode === 'traffic' ? 'Target vehicle escaped' : 'Jar cleared'
        : `Slid ${DIRECTION_NAMES[dir]}`);
    }
    sliding = false;
    if (board && isWon(board)) await onWin();
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
    const previous = takeUndoSnapshot(undoHistory, board);
    if (!previous) {
      showToast('Nothing to undo');
      return;
    }
    board = previous.board;
    selectedId = previous.selectedId;
    moveCount = Math.max(0, moveCount - 1);
    syncMoveCount();
    syncTrafficExitStatus();
    hintId = null;
    syncVehicleDescriptions();
    syncUndoButton();
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
    showToast(`Hint: slide ${DIRECTION_NAMES[h.dir]}`);
  }

  async function doRestart(): Promise<void> {
    if (undoHistory.canUndo) {
      const confirmed = await showModalStubConfirm(
        'Restart this level?',
        `Restart Level ${levelId}? Your current moves will be lost.`,
        'Restart',
        'Keep playing',
      );
      if (!confirmed) return;
    }
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
    const trafficWin = board?.mode === 'traffic';
    emoji.textContent = trafficWin ? '→' : '🍓';
    const h = document.createElement('h1');
    h.textContent = trafficWin ? 'Target vehicle escaped!' : 'Jar cleared!';
    const tag = div('tagline');
    tag.textContent = trafficWin
      ? 'Traffic cleared. The red target car reached EXIT.'
      : levelId >= LEVEL_COUNT
        ? 'All playable levels complete.'
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

  setScreen('home', false);
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

function describeJar(block: BlockState): string {
  const directions = block.axis === 'H'
    ? 'left or right along its horizontal axis'
    : 'up or down along its vertical axis';
  const position = block.axis === 'H'
    ? `${block.w > 1 ? `columns ${block.x + 1} to ${block.x + block.w}` : `column ${block.x + 1}`}, row ${block.y + 1}`
    : `column ${block.x + 1}, ${block.h > 1 ? `rows ${block.y + 1} to ${block.y + block.h}` : `row ${block.y + 1}`}`;
  return `${COLOR_NAMES[block.color]} jar, slides ${directions}, at ${position}.`;
}

function describeVehicle(block: BlockState, isTarget: boolean): string {
  const directions = block.axis === 'H' ? 'left or right' : 'up or down';
  const position = block.axis === 'H'
    ? `row ${block.y + 1}, columns ${block.x + 1} to ${block.x + block.w}`
    : `column ${block.x + 1}, rows ${block.y + 1} to ${block.y + block.h}`;
  return `${COLOR_NAMES[block.color]} ${isTarget ? 'target ' : ''}${VEHICLE_NAMES[block.vehicleKind]}, moves only ${directions} along its lane, at ${position}.`;
}

function selectionMessage(board: BoardState, block: BlockState, index: number): string {
  if (board.mode === 'traffic') {
    const label = board.targetId === block.id ? 'target car' : VEHICLE_NAMES[block.vehicleKind];
    return `Selected ${label} ${index + 1} of ${board.blocks.length}`;
  }
  return `Selected jar ${index + 1} of ${board.blocks.length}`;
}

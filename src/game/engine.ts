/**
 * SlideJam engine — axis-locked slide blocks to matching exits.
 * NOT GlowGrid: no tray, no row/column clear. Blocks start on board.
 */
import type {
  Axis,
  BlockState,
  BoardState,
  ColorId,
  Dir,
  LevelDef,
} from './types';
import { cellKey } from './types';

export function loadBoard(level: LevelDef): BoardState {
  const walls = new Set<string>();
  for (const [x, y] of level.walls) walls.add(cellKey(x, y));
  const exits = new Map<string, ColorId>();
  for (const e of level.exits) exits.set(cellKey(e.x, e.y), e.color);
  const blocks: BlockState[] = level.blocks.map((b) => ({
    id: b.id,
    x: b.x,
    y: b.y,
    w: b.w,
    h: b.h,
    color: b.color,
    axis: b.axis,
  }));
  return { w: level.w, h: level.h, walls, exits, blocks };
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    w: board.w,
    h: board.h,
    walls: new Set(board.walls),
    exits: new Map(board.exits),
    blocks: board.blocks.map((b) => ({ ...b })),
  };
}

/** All cells occupied by a block. */
export function blockCells(b: BlockState): [number, number][] {
  const cells: [number, number][] = [];
  for (let dy = 0; dy < b.h; dy++) {
    for (let dx = 0; dx < b.w; dx++) {
      cells.push([b.x + dx, b.y + dy]);
    }
  }
  return cells;
}

function occupancy(board: BoardState, skipId?: string): Set<string> {
  const occ = new Set<string>(board.walls);
  for (const b of board.blocks) {
    if (skipId && b.id === skipId) continue;
    for (const [x, y] of blockCells(b)) occ.add(cellKey(x, y));
  }
  return occ;
}

function inBounds(board: BoardState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < board.w && y < board.h;
}

/** Can the block occupy (nx, ny) without leaving bounds or hitting occ? */
function canPlace(
  board: BoardState,
  b: BlockState,
  nx: number,
  ny: number,
  occ: Set<string>,
): boolean {
  for (let dy = 0; dy < b.h; dy++) {
    for (let dx = 0; dx < b.w; dx++) {
      const x = nx + dx;
      const y = ny + dy;
      if (!inBounds(board, x, y)) return false;
      if (occ.has(cellKey(x, y))) return false;
    }
  }
  return true;
}

function stepDelta(dir: Dir): [number, number] {
  switch (dir) {
    case 'L':
      return [-1, 0];
    case 'R':
      return [1, 0];
    case 'U':
      return [0, -1];
    case 'D':
      return [0, 1];
  }
}

export function axisAllows(axis: Axis, dir: Dir): boolean {
  if (axis === 'H') return dir === 'L' || dir === 'R';
  return dir === 'U' || dir === 'D';
}

/**
 * Slide block along dir until wall / other block / edge.
 * Returns how many cells moved (0 = no move). Mutates board.
 */
export function slideBlock(
  board: BoardState,
  blockId: string,
  dir: Dir,
): { moved: number; cleared: boolean } {
  const b = board.blocks.find((x) => x.id === blockId);
  if (!b) return { moved: 0, cleared: false };
  if (!axisAllows(b.axis, dir)) return { moved: 0, cleared: false };

  const [dx, dy] = stepDelta(dir);
  const occ = occupancy(board, b.id);
  let moved = 0;
  let nx = b.x;
  let ny = b.y;
  while (canPlace(board, b, nx + dx, ny + dy, occ)) {
    nx += dx;
    ny += dy;
    moved++;
  }
  if (moved === 0) return { moved: 0, cleared: false };
  b.x = nx;
  b.y = ny;

  const cleared = tryClearBlock(board, b.id);
  return { moved, cleared };
}

/**
 * Clear if every cell of the block sits on a matching-color exit.
 * Removes the block (and its exit pads) when cleared.
 */
export function tryClearBlock(board: BoardState, blockId: string): boolean {
  const idx = board.blocks.findIndex((x) => x.id === blockId);
  if (idx < 0) return false;
  const b = board.blocks[idx]!;
  const cells = blockCells(b);
  for (const [x, y] of cells) {
    const c = board.exits.get(cellKey(x, y));
    if (c !== b.color) return false;
  }
  // Remove block and its covered exits
  for (const [x, y] of cells) board.exits.delete(cellKey(x, y));
  board.blocks.splice(idx, 1);
  return true;
}

export function isWon(board: BoardState): boolean {
  return board.blocks.length === 0;
}

/** Max slide distance available in dir (no mutate). */
export function maxSlide(
  board: BoardState,
  blockId: string,
  dir: Dir,
): number {
  const b = board.blocks.find((x) => x.id === blockId);
  if (!b || !axisAllows(b.axis, dir)) return 0;
  const [dx, dy] = stepDelta(dir);
  const occ = occupancy(board, b.id);
  let n = 0;
  let nx = b.x;
  let ny = b.y;
  while (canPlace(board, b, nx + dx, ny + dy, occ)) {
    nx += dx;
    ny += dy;
    n++;
  }
  return n;
}

export function listLegalMoves(
  board: BoardState,
): { blockId: string; dir: Dir; dist: number }[] {
  const out: { blockId: string; dir: Dir; dist: number }[] = [];
  const dirs: Dir[] = ['L', 'R', 'U', 'D'];
  for (const b of board.blocks) {
    for (const dir of dirs) {
      const dist = maxSlide(board, b.id, dir);
      if (dist > 0) out.push({ blockId: b.id, dir, dist });
    }
  }
  return out;
}

/** Distance from block centroid to nearest matching exit centroid. */
function exitDistance(board: BoardState, b: BlockState): number {
  const matching: [number, number][] = [];
  for (const [key, color] of board.exits) {
    if (color !== b.color) continue;
    const [x, y] = key.split(',').map(Number) as [number, number];
    matching.push([x, y]);
  }
  if (matching.length === 0) return Infinity;
  const cx = b.x + (b.w - 1) / 2;
  const cy = b.y + (b.h - 1) / 2;
  let best = Infinity;
  for (const [x, y] of matching) {
    const d = Math.abs(cx - x) + Math.abs(cy - y);
    if (d < best) best = d;
  }
  return best;
}

/**
 * Hint: pick a legal move that reduces exit distance (or any legal move).
 */
export function hintMove(
  board: BoardState,
): { blockId: string; dir: Dir } | null {
  const moves = listLegalMoves(board);
  if (moves.length === 0) return null;

  let best: { blockId: string; dir: Dir; score: number } | null = null;
  for (const m of moves) {
    const sim = cloneBoard(board);
    const before = sim.blocks.find((x) => x.id === m.blockId)!;
    const d0 = exitDistance(sim, before);
    slideBlock(sim, m.blockId, m.dir);
    const after = sim.blocks.find((x) => x.id === m.blockId);
    // Cleared = best possible
    const d1 = after ? exitDistance(sim, after) : -1;
    const score = d1 - d0; // negative = closer
    if (!best || score < best.score) {
      best = { blockId: m.blockId, dir: m.dir, score };
    }
  }
  return best ? { blockId: best.blockId, dir: best.dir } : null;
}

/** Serialize board for undo / BFS keys. */
export function boardKey(board: BoardState): string {
  const parts = board.blocks
    .map((b) => `${b.id}:${b.x},${b.y}`)
    .sort();
  return parts.join('|');
}

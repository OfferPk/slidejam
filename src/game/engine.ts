/**
 * SlideJam engine — axis-locked slide puzzles, including the traffic-jam mode.
 * Legacy jar levels keep their matching-exit rules; traffic wins when its target
 * vehicle travels through the clear lane and leaves the right-hand exit.
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

export interface LegalMove {
  blockId: string;
  dir: Dir;
  dist: number;
}

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
    vehicleKind: b.vehicleKind ?? 'car',
  }));
  return {
    w: level.w,
    h: level.h,
    mode: level.mode ?? 'jars',
    ...(level.targetId ? { targetId: level.targetId } : {}),
    ...(level.trafficExit ? { trafficExit: { ...level.trafficExit } } : {}),
    walls,
    exits,
    blocks,
  };
}

export function cloneBoard(board: BoardState): BoardState {
  return {
    w: board.w,
    h: board.h,
    mode: board.mode,
    ...(board.targetId ? { targetId: board.targetId } : {}),
    ...(board.trafficExit ? { trafficExit: { ...board.trafficExit } } : {}),
    walls: new Set(board.walls),
    exits: new Map(board.exits),
    blocks: board.blocks.map((b) => ({ ...b })),
  };
}

/** All cells occupied by a block or vehicle. */
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
    case 'L': return [-1, 0];
    case 'R': return [1, 0];
    case 'U': return [0, -1];
    case 'D': return [0, 1];
  }
}

export function axisAllows(axis: Axis, dir: Dir): boolean {
  if (axis === 'H') return dir === 'L' || dir === 'R';
  return dir === 'U' || dir === 'D';
}

/** Slide a vehicle along its own lane until traffic blocks it. */
export function slideBlock(
  board: BoardState,
  blockId: string,
  dir: Dir,
): { moved: number; cleared: boolean } {
  const b = board.blocks.find((x) => x.id === blockId);
  if (!b || !axisAllows(b.axis, dir)) return { moved: 0, cleared: false };

  const [dx, dy] = stepDelta(dir);
  const distance = maxSlide(board, blockId, dir);
  const isTargetExit =
    board.mode === 'traffic' &&
    blockId === board.targetId &&
    board.trafficExit?.side === 'right' &&
    dir === 'R' &&
    b.axis === 'H' &&
    b.y === board.trafficExit?.lane;

  if (distance === 0) {
    // Also allow an authored level to start with the target already at the gate.
    if (isTargetExit && b.x + b.w === board.w) {
      board.blocks.splice(board.blocks.indexOf(b), 1);
      return { moved: 1, cleared: true };
    }
    return { moved: 0, cleared: false };
  }

  b.x += dx * distance;
  b.y += dy * distance;

  const reachedRightEdge = b.x + b.w === board.w;
  if (isTargetExit && reachedRightEdge) {
    board.blocks.splice(board.blocks.indexOf(b), 1);
    return { moved: distance, cleared: true };
  }

  return { moved: distance, cleared: tryClearBlock(board, blockId) };
}

/** Clear legacy blocks only when they fully cover matching-color exit pads. */
export function tryClearBlock(board: BoardState, blockId: string): boolean {
  const idx = board.blocks.findIndex((x) => x.id === blockId);
  if (idx < 0) return false;
  const b = board.blocks[idx]!;
  const cells = blockCells(b);
  for (const [x, y] of cells) {
    const c = board.exits.get(cellKey(x, y));
    if (c !== b.color) return false;
  }
  for (const [x, y] of cells) board.exits.delete(cellKey(x, y));
  board.blocks.splice(idx, 1);
  return true;
}

export function isWon(board: BoardState): boolean {
  if (board.mode === 'traffic') {
    return Boolean(board.targetId && !board.blocks.some((b) => b.id === board.targetId));
  }
  return board.blocks.length === 0;
}

/** Maximum number of cells a block can slide in a direction without collision. */
export function maxSlide(board: BoardState, blockId: string, dir: Dir): number {
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

export function listLegalMoves(board: BoardState): LegalMove[] {
  const out: LegalMove[] = [];
  const dirs: Dir[] = ['L', 'R', 'U', 'D'];
  for (const b of board.blocks) {
    for (const dir of dirs) {
      const dist = maxSlide(board, b.id, dir);
      if (dist > 0) out.push({ blockId: b.id, dir, dist });
    }
  }
  return out;
}

/**
 * Find a shortest sequence of max-distance slides to a win. The default bound
 * keeps hints predictable if a later, much larger legacy board uses this helper.
 */
export function solveBoard(board: BoardState, maxStates = 50_000): LegalMove[] | null {
  if (isWon(board)) return [];

  const first = cloneBoard(board);
  const firstKey = boardKey(first);
  const states: BoardState[] = [first];
  const parents = new Map<string, { previousKey: string; move: LegalMove } | null>();
  parents.set(firstKey, null);

  const buildPath = (endKey: string): LegalMove[] | null => {
    const path: LegalMove[] = [];
    let currentKey = endKey;
    while (currentKey !== firstKey) {
      const step = parents.get(currentKey);
      if (!step) return null;
      path.push(step.move);
      currentKey = step.previousKey;
    }
    return path.reverse();
  };

  for (let i = 0; i < states.length && parents.size < maxStates; i++) {
    const current = states[i]!;
    const currentKey = boardKey(current);
    for (const move of listLegalMoves(current)) {
      const next = cloneBoard(current);
      const result = slideBlock(next, move.blockId, move.dir);
      if (result.moved === 0) continue;
      const nextKey = boardKey(next);
      if (parents.has(nextKey)) continue;
      if (parents.size >= maxStates) return null;
      parents.set(nextKey, { previousKey: currentKey, move });
      if (isWon(next)) return buildPath(nextKey);
      states.push(next);
    }
  }
  return null;
}

/** Distance from block centroid to nearest matching legacy exit centroid. */
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
    best = Math.min(best, Math.abs(cx - x) + Math.abs(cy - y));
  }
  return best;
}

/** Return a solution move for traffic levels, otherwise a legacy distance hint. */
export function hintMove(board: BoardState): { blockId: string; dir: Dir } | null {
  if (board.mode === 'traffic') {
    const solution = solveBoard(board);
    if (solution?.[0]) return { blockId: solution[0].blockId, dir: solution[0].dir };
  }

  const moves = listLegalMoves(board);
  if (moves.length === 0) return null;
  let best: { blockId: string; dir: Dir; score: number } | null = null;
  for (const move of moves) {
    const sim = cloneBoard(board);
    const before = sim.blocks.find((x) => x.id === move.blockId)!;
    const beforeDistance = exitDistance(sim, before);
    slideBlock(sim, move.blockId, move.dir);
    const after = sim.blocks.find((x) => x.id === move.blockId);
    const afterDistance = after ? exitDistance(sim, after) : -1;
    const score = afterDistance - beforeDistance;
    if (!best || score < best.score) best = { blockId: move.blockId, dir: move.dir, score };
  }
  return best ? { blockId: best.blockId, dir: best.dir } : null;
}

/** Serialize vehicle positions for undo and solver visited-state keys. */
export function boardKey(board: BoardState): string {
  return board.blocks.map((b) => `${b.id}:${b.x},${b.y}`).sort().join('|');
}

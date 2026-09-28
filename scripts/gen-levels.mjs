/**
 * Generate 50 SlideJam levels (easy → hard), BFS-validate solvability.
 * Writes src/levels/level-XX.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '../src/levels');

const COLORS = ['R', 'G', 'B', 'Y', 'P', 'O'];

function cellKey(x, y) {
  return `${x},${y}`;
}

function blockCells(b) {
  const cells = [];
  for (let dy = 0; dy < b.h; dy++)
    for (let dx = 0; dx < b.w; dx++) cells.push([b.x + dx, b.y + dy]);
  return cells;
}

function loadBoard(level) {
  const walls = new Set(level.walls.map(([x, y]) => cellKey(x, y)));
  const exits = new Map(level.exits.map((e) => [cellKey(e.x, e.y), e.color]));
  const blocks = level.blocks.map((b) => ({ ...b }));
  return { w: level.w, h: level.h, walls, exits, blocks };
}

function occupancy(board, skipId) {
  const occ = new Set(board.walls);
  for (const b of board.blocks) {
    if (skipId && b.id === skipId) continue;
    for (const [x, y] of blockCells(b)) occ.add(cellKey(x, y));
  }
  return occ;
}

function inBounds(board, x, y) {
  return x >= 0 && y >= 0 && x < board.w && y < board.h;
}

function canPlace(board, b, nx, ny, occ) {
  for (let dy = 0; dy < b.h; dy++)
    for (let dx = 0; dx < b.w; dx++) {
      const x = nx + dx,
        y = ny + dy;
      if (!inBounds(board, x, y)) return false;
      if (occ.has(cellKey(x, y))) return false;
    }
  return true;
}

function axisAllows(axis, dir) {
  if (axis === 'H') return dir === 'L' || dir === 'R';
  return dir === 'U' || dir === 'D';
}

const DELTA = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };

function maxSlide(board, blockId, dir) {
  const b = board.blocks.find((x) => x.id === blockId);
  if (!b || !axisAllows(b.axis, dir)) return 0;
  const [dx, dy] = DELTA[dir];
  const occ = occupancy(board, b.id);
  let n = 0,
    nx = b.x,
    ny = b.y;
  while (canPlace(board, b, nx + dx, ny + dy, occ)) {
    nx += dx;
    ny += dy;
    n++;
  }
  return n;
}

function tryClear(board, blockId) {
  const idx = board.blocks.findIndex((x) => x.id === blockId);
  if (idx < 0) return false;
  const b = board.blocks[idx];
  for (const [x, y] of blockCells(b)) {
    if (board.exits.get(cellKey(x, y)) !== b.color) return false;
  }
  for (const [x, y] of blockCells(b)) board.exits.delete(cellKey(x, y));
  board.blocks.splice(idx, 1);
  return true;
}

function slide(board, blockId, dir) {
  const b = board.blocks.find((x) => x.id === blockId);
  if (!b || !axisAllows(b.axis, dir)) return 0;
  const [dx, dy] = DELTA[dir];
  const occ = occupancy(board, b.id);
  let moved = 0,
    nx = b.x,
    ny = b.y;
  while (canPlace(board, b, nx + dx, ny + dy, occ)) {
    nx += dx;
    ny += dy;
    moved++;
  }
  if (!moved) return 0;
  b.x = nx;
  b.y = ny;
  tryClear(board, b.id);
  return moved;
}

function boardKey(board) {
  return board.blocks
    .map((b) => `${b.id}:${b.x},${b.y}`)
    .sort()
    .join('|');
}

function cloneBoard(board) {
  return {
    w: board.w,
    h: board.h,
    walls: new Set(board.walls),
    exits: new Map(board.exits),
    blocks: board.blocks.map((b) => ({ ...b })),
  };
}

function solve(level, maxNodes = 80000) {
  const start = loadBoard(level);
  if (start.blocks.length === 0) return true;
  const q = [start];
  const seen = new Set([boardKey(start)]);
  let nodes = 0;
  while (q.length) {
    const cur = q.shift();
    nodes++;
    if (nodes > maxNodes) return false;
    if (cur.blocks.length === 0) return true;
    for (const b of cur.blocks) {
      for (const dir of ['L', 'R', 'U', 'D']) {
        if (maxSlide(cur, b.id, dir) <= 0) continue;
        const next = cloneBoard(cur);
        slide(next, b.id, dir);
        const k = boardKey(next);
        if (seen.has(k)) continue;
        seen.add(k);
        q.push(next);
      }
    }
  }
  return false;
}

function overlaps(cells, set) {
  return cells.some(([x, y]) => set.has(cellKey(x, y)));
}

function addExitPad(exits, b, ex, ey) {
  // Place exit pad matching block size at (ex, ey)
  for (let dy = 0; dy < b.h; dy++)
    for (let dx = 0; dx < b.w; dx++)
      exits.push({ x: ex + dx, y: ey + dy, color: b.color });
}

/** Hand-authored progressive packs expanded programmatically. */
function buildLevels() {
  const levels = [];

  // —— Easy 1–10: small grids, 1–2 blocks ——
  levels.push({
    id: 1, w: 5, h: 4,
    walls: [],
    exits: [{ x: 3, y: 1, color: 'R' }, { x: 4, y: 1, color: 'R' }],
    blocks: [{ id: 'b1', x: 0, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
  });
  levels.push({
    id: 2, w: 5, h: 5,
    walls: [],
    exits: [{ x: 2, y: 0, color: 'G' }, { x: 2, y: 1, color: 'G' }],
    blocks: [{ id: 'b1', x: 2, y: 3, w: 1, h: 2, color: 'G', axis: 'V' }],
  });
  levels.push({
    id: 3, w: 6, h: 4,
    walls: [[2, 0], [2, 3]],
    exits: [{ x: 4, y: 1, color: 'B' }, { x: 5, y: 1, color: 'B' }],
    blocks: [{ id: 'b1', x: 0, y: 1, w: 2, h: 1, color: 'B', axis: 'H' }],
  });
  levels.push({
    id: 4, w: 5, h: 5,
    walls: [[0, 2], [4, 2]],
    exits: [
      { x: 3, y: 0, color: 'R' }, { x: 4, y: 0, color: 'R' },
      { x: 1, y: 4, color: 'Y' },
    ],
    blocks: [
      { id: 'b1', x: 0, y: 0, w: 2, h: 1, color: 'R', axis: 'H' },
      { id: 'b2', x: 1, y: 2, w: 1, h: 1, color: 'Y', axis: 'V' },
    ],
  });
  levels.push({
    id: 5, w: 6, h: 5,
    walls: [[3, 2]],
    exits: [
      { x: 0, y: 2, color: 'P' }, { x: 1, y: 2, color: 'P' },
      { x: 5, y: 0, color: 'O' }, { x: 5, y: 1, color: 'O' },
    ],
    blocks: [
      { id: 'b1', x: 3, y: 2, w: 2, h: 1, color: 'P', axis: 'H' },
      { id: 'b2', x: 5, y: 3, w: 1, h: 2, color: 'O', axis: 'V' },
    ],
  });
  // Fix id5: b1 starts at (3,2) but wall at (3,2) — fix
  levels[4].walls = [[3, 0]];
  levels[4].blocks[0].x = 4;
  levels[4].blocks[0].y = 2;

  levels.push({
    id: 6, w: 6, h: 5,
    walls: [[2, 1], [2, 3]],
    exits: [
      { x: 4, y: 2, color: 'R' }, { x: 5, y: 2, color: 'R' },
      { x: 0, y: 4, color: 'G' }, { x: 1, y: 4, color: 'G' }, { x: 2, y: 4, color: 'G' },
    ],
    blocks: [
      { id: 'b1', x: 0, y: 2, w: 2, h: 1, color: 'R', axis: 'H' },
      { id: 'b2', x: 0, y: 0, w: 3, h: 1, color: 'G', axis: 'H' },
    ],
  });
  levels.push({
    id: 7, w: 6, h: 6,
    walls: [[1, 1], [4, 4]],
    exits: [
      { x: 5, y: 2, color: 'B' },
      { x: 2, y: 5, color: 'Y' }, { x: 2, y: 4, color: 'Y' },
    ],
    blocks: [
      { id: 'b1', x: 0, y: 2, w: 1, h: 1, color: 'B', axis: 'H' },
      { id: 'b2', x: 2, y: 0, w: 1, h: 2, color: 'Y', axis: 'V' },
    ],
  });
  levels.push({
    id: 8, w: 6, h: 5,
    walls: [[3, 1], [3, 3]],
    exits: [
      { x: 0, y: 0, color: 'R' }, { x: 1, y: 0, color: 'R' },
      { x: 5, y: 2, color: 'G' }, { x: 5, y: 3, color: 'G' }, { x: 5, y: 4, color: 'G' },
    ],
    blocks: [
      { id: 'b1', x: 3, y: 0, w: 2, h: 1, color: 'R', axis: 'H' },
      { id: 'b2', x: 5, y: 0, w: 1, h: 3, color: 'G', axis: 'V' },
    ],
  });
  // b2 at (5,0) h=3 overlaps exit at row 2 — start higher... exits at 2,3,4 so start at y=0 is fine if we slide down. But exit cells under block at start would auto-clear if fully covering. At start b2 covers (5,0)(5,1)(5,2) — exit only at (5,2)(5,3)(5,4), so not fully covering. Good.
  // Wait b2 at y=0 covers exits partially — need all cells on exits. Only (5,2) matches of the three. OK.

  levels.push({
    id: 9, w: 7, h: 5,
    walls: [[3, 0], [3, 4], [3, 2]],
    exits: [
      { x: 5, y: 1, color: 'P' }, { x: 6, y: 1, color: 'P' },
      { x: 0, y: 3, color: 'O' }, { x: 1, y: 3, color: 'O' },
    ],
    blocks: [
      { id: 'b1', x: 0, y: 1, w: 2, h: 1, color: 'P', axis: 'H' },
      { id: 'b2', x: 5, y: 3, w: 2, h: 1, color: 'O', axis: 'H' },
    ],
  });
  // wall at (3,2) blocks both rows? b1 on y=1 can slide past (3,0) wall on different row. Good.
  // But wall (3,2) doesn't block y=1 or y=3. Need wall on those rows for challenge:
  levels[8].walls = [[3, 1], [3, 3]];

  levels.push({
    id: 10, w: 6, h: 6,
    walls: [[2, 2], [3, 3]],
    exits: [
      { x: 4, y: 0, color: 'R' }, { x: 5, y: 0, color: 'R' },
      { x: 0, y: 5, color: 'B' }, { x: 1, y: 5, color: 'B' },
      { x: 5, y: 4, color: 'Y' },
    ],
    blocks: [
      { id: 'b1', x: 0, y: 0, w: 2, h: 1, color: 'R', axis: 'H' },
      { id: 'b2', x: 0, y: 3, w: 2, h: 1, color: 'B', axis: 'H' },
      { id: 'b3', x: 5, y: 1, w: 1, h: 1, color: 'Y', axis: 'V' },
    ],
  });

  // —— Medium 11–25 ——
  const mediumSpecs = [
    // id, w, h, blocks: [color, axis, len], walls count target
  ];

  // Procedural medium/hard with validation
  function tryMake(id, w, h, pieceSpecs, wallCount, seed) {
    // pieceSpecs: {color, axis, len}[]
    let rng = seed;
    const rand = () => {
      rng = (rng * 1664525 + 1013904223) >>> 0;
      return rng / 0xffffffff;
    };
    const ri = (n) => Math.floor(rand() * n);

    for (let attempt = 0; attempt < 400; attempt++) {
      const walls = [];
      const wallSet = new Set();
      for (let i = 0; i < wallCount; i++) {
        const x = ri(w),
          y = ri(h);
        const k = cellKey(x, y);
        if (!wallSet.has(k)) {
          wallSet.add(k);
          walls.push([x, y]);
        }
      }

      const blocks = [];
      const exits = [];
      const used = new Set(wallSet);
      let ok = true;

      for (let i = 0; i < pieceSpecs.length; i++) {
        const spec = pieceSpecs[i];
        const bw = spec.axis === 'H' ? spec.len : 1;
        const bh = spec.axis === 'V' ? spec.len : 1;
        // Place exit pad first on free cells
        let placed = false;
        for (let t = 0; t < 80 && !placed; t++) {
          const ex = ri(w - bw + 1);
          const ey = ri(h - bh + 1);
          const eCells = [];
          for (let dy = 0; dy < bh; dy++)
            for (let dx = 0; dx < bw; dx++) eCells.push([ex + dx, ey + dy]);
          if (overlaps(eCells, used)) continue;
          // Place block elsewhere on same axis line
          for (let t2 = 0; t2 < 80; t2++) {
            let bx, by;
            if (spec.axis === 'H') {
              bx = ri(w - bw + 1);
              by = ey; // same row as exit
            } else {
              bx = ex;
              by = ri(h - bh + 1);
            }
            if (bx === ex && by === ey) continue;
            const bCells = [];
            for (let dy = 0; dy < bh; dy++)
              for (let dx = 0; dx < bw; dx++) bCells.push([bx + dx, by + dy]);
            if (overlaps(bCells, used)) continue;
            // Reserve
            for (const [x, y] of eCells) used.add(cellKey(x, y));
            for (const [x, y] of bCells) used.add(cellKey(x, y));
            const bid = `b${i + 1}`;
            blocks.push({
              id: bid,
              x: bx,
              y: by,
              w: bw,
              h: bh,
              color: spec.color,
              axis: spec.axis,
            });
            for (const [x, y] of eCells)
              exits.push({ x, y, color: spec.color });
            placed = true;
            break;
          }
        }
        if (!placed) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;

      const level = { id, w, h, walls, exits, blocks };
      // Must not already be won / auto-clear all
      const board = loadBoard(level);
      // Auto-clear any that start on exits (shouldn't for good levels)
      let auto = false;
      for (const b of [...board.blocks]) {
        if (tryClear(board, b.id)) auto = true;
      }
      if (auto && board.blocks.length === 0) continue;
      // Re-check with fresh — reject if any start fully on exit
      {
        const fresh = loadBoard(level);
        let badStart = false;
        for (const b of fresh.blocks) {
          const cells = blockCells(b);
          if (cells.every(([x, y]) => fresh.exits.get(cellKey(x, y)) === b.color)) {
            badStart = true;
            break;
          }
        }
        if (badStart) continue;
      }

      if (solve(level)) return level;
    }
    return null;
  }

  // Fill 11–50 with procedural
  const templates = [];
  // 11-20 medium small
  for (let id = 11; id <= 20; id++) {
    const n = id <= 15 ? 2 : 3;
    const specs = [];
    for (let i = 0; i < n; i++) {
      specs.push({
        color: COLORS[i % COLORS.length],
        axis: i % 2 === 0 ? 'H' : 'V',
        len: 1 + (i % 2),
      });
    }
    templates.push({ id, w: 6, h: 6, specs, walls: 2 + (id % 3), seed: 1000 + id * 97 });
  }
  // 21-35 denser
  for (let id = 21; id <= 35; id++) {
    const n = id <= 28 ? 3 : 4;
    const specs = [];
    for (let i = 0; i < n; i++) {
      specs.push({
        color: COLORS[i % COLORS.length],
        axis: (id + i) % 2 === 0 ? 'H' : 'V',
        len: 1 + ((i + id) % 3 === 0 ? 2 : 1),
      });
    }
    templates.push({
      id,
      w: 6 + (id > 30 ? 1 : 0),
      h: 6 + (id > 30 ? 1 : 0),
      specs,
      walls: 3 + (id % 4),
      seed: 2000 + id * 131,
    });
  }
  // 36-50 hard
  for (let id = 36; id <= 50; id++) {
    const n = id <= 42 ? 4 : 5;
    const specs = [];
    for (let i = 0; i < n; i++) {
      specs.push({
        color: COLORS[i % COLORS.length],
        axis: (id + i) % 2 === 0 ? 'V' : 'H',
        len: 1 + ((i + id) % 2),
      });
    }
    templates.push({
      id,
      w: 7,
      h: 7,
      specs,
      walls: 4 + (id % 5),
      seed: 3000 + id * 173,
    });
  }

  // Fix early hand levels ids and validate; replace failures
  const final = [];
  for (const L of levels) {
    if (!solve(L)) {
      console.warn('Hand level', L.id, 'unsolvable — regenerating');
      const specs = L.blocks.map((b) => ({
        color: b.color,
        axis: b.axis,
        len: b.axis === 'H' ? b.w : b.h,
      }));
      const gen = tryMake(L.id, L.w, L.h, specs, L.walls.length || 1, 5000 + L.id);
      if (!gen) throw new Error('Cannot gen level ' + L.id);
      final.push(gen);
    } else {
      final.push(L);
    }
  }

  for (const t of templates) {
    let gen = tryMake(t.id, t.w, t.h, t.specs, t.walls, t.seed);
    if (!gen) {
      // relax
      gen = tryMake(t.id, t.w + 1, t.h + 1, t.specs, Math.max(1, t.walls - 2), t.seed + 999);
    }
    if (!gen) {
      // simplify pieces
      const simple = t.specs.slice(0, Math.max(2, t.specs.length - 1)).map((s) => ({
        ...s,
        len: Math.min(s.len, 2),
      }));
      gen = tryMake(t.id, 7, 7, simple, 2, t.seed + 7777);
    }
    if (!gen) throw new Error('Failed level ' + t.id);
    final.push(gen);
  }

  return final.sort((a, b) => a.id - b.id);
}

fs.mkdirSync(OUT, { recursive: true });
const levels = buildLevels();
for (const L of levels) {
  const name = `level-${String(L.id).padStart(2, '0')}.json`;
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(L, null, 2) + '\n');
}
console.log('Wrote', levels.length, 'levels');
let fail = 0;
for (const L of levels) {
  if (!solve(L)) {
    console.error('UNSOLVABLE', L.id);
    fail++;
  }
}
console.log('Unsolvable count:', fail);

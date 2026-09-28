import { describe, expect, it } from 'vitest';
import {
  cloneBoard,
  hintMove,
  isWon,
  listLegalMoves,
  loadBoard,
  maxSlide,
  slideBlock,
  tryClearBlock,
} from '../src/game/engine';
import type { LevelDef } from '../src/game/types';
import { getLevel } from '../src/levels/index';

const fixture: LevelDef = {
  id: 99,
  w: 6,
  h: 4,
  walls: [[2, 0], [2, 3]],
  exits: [
    { x: 4, y: 1, color: 'R' },
    { x: 5, y: 1, color: 'R' },
  ],
  blocks: [{ id: 'b1', x: 0, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
};

describe('slide bounds', () => {
  it('slides until edge then stops', () => {
    const board = loadBoard({
      id: 1,
      w: 5,
      h: 3,
      walls: [],
      exits: [],
      blocks: [{ id: 'b1', x: 1, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
    });
    const r = slideBlock(board, 'b1', 'L');
    expect(r.moved).toBe(1);
    expect(board.blocks[0]!.x).toBe(0);
    const r2 = slideBlock(board, 'b1', 'L');
    expect(r2.moved).toBe(0);
  });

  it('rejects off-axis slide', () => {
    const board = loadBoard(fixture);
    const r = slideBlock(board, 'b1', 'U');
    expect(r.moved).toBe(0);
  });

  it('maxSlide reports remaining cells', () => {
    const board = loadBoard(fixture);
    expect(maxSlide(board, 'b1', 'R')).toBe(4);
    expect(maxSlide(board, 'b1', 'L')).toBe(0);
  });
});

describe('collision', () => {
  it('stops before wall', () => {
    const board = loadBoard({
      id: 2,
      w: 6,
      h: 3,
      walls: [[3, 1]],
      exits: [],
      blocks: [{ id: 'b1', x: 0, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
    });
    const r = slideBlock(board, 'b1', 'R');
    expect(r.moved).toBe(1); // lands at x=1, wall at 3 blocks further
    expect(board.blocks[0]!.x).toBe(1);
  });

  it('stops before another block', () => {
    const board = loadBoard({
      id: 3,
      w: 7,
      h: 3,
      walls: [],
      exits: [],
      blocks: [
        { id: 'a', x: 0, y: 1, w: 2, h: 1, color: 'R', axis: 'H' },
        { id: 'b', x: 4, y: 1, w: 2, h: 1, color: 'G', axis: 'H' },
      ],
    });
    const r = slideBlock(board, 'a', 'R');
    expect(r.moved).toBe(2);
    expect(board.blocks.find((x) => x.id === 'a')!.x).toBe(2);
  });
});

describe('exit clear', () => {
  it('clears when block fully covers matching exits', () => {
    const board = loadBoard(fixture);
    const r = slideBlock(board, 'b1', 'R');
    expect(r.moved).toBeGreaterThan(0);
    expect(r.cleared).toBe(true);
    expect(board.blocks.length).toBe(0);
    expect(isWon(board)).toBe(true);
  });

  it('does not clear on partial cover', () => {
    const board = loadBoard({
      id: 4,
      w: 5,
      h: 3,
      walls: [],
      exits: [{ x: 2, y: 1, color: 'R' }],
      blocks: [{ id: 'b1', x: 1, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
    });
    // Already covering (2,1) but not (1,1) exit — only one exit under half
    expect(tryClearBlock(board, 'b1')).toBe(false);
    expect(board.blocks.length).toBe(1);
  });

  it('rejects wrong-color exit', () => {
    const board = loadBoard({
      id: 5,
      w: 4,
      h: 3,
      walls: [],
      exits: [
        { x: 2, y: 1, color: 'G' },
        { x: 3, y: 1, color: 'G' },
      ],
      blocks: [{ id: 'b1', x: 2, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
    });
    expect(tryClearBlock(board, 'b1')).toBe(false);
  });
});

describe('fixture solve path smoke', () => {
  it('fixture wins in one right slide', () => {
    const board = loadBoard(fixture);
    expect(listLegalMoves(board).length).toBeGreaterThan(0);
    slideBlock(board, 'b1', 'R');
    expect(isWon(board)).toBe(true);
  });

  it('level 1 from pack is solvable via hint loop', () => {
    const level = getLevel(1);
    expect(level).toBeTruthy();
    const board = loadBoard(level!);
    let guard = 40;
    while (!isWon(board) && guard-- > 0) {
      const h = hintMove(board);
      expect(h).not.toBeNull();
      slideBlock(board, h!.blockId, h!.dir);
    }
    expect(isWon(board)).toBe(true);
  });

  it('cloneBoard is independent', () => {
    const board = loadBoard(fixture);
    const c = cloneBoard(board);
    slideBlock(c, 'b1', 'R');
    expect(board.blocks[0]!.x).toBe(0);
    expect(isWon(c)).toBe(true);
  });
});

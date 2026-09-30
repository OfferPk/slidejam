import { describe, expect, it } from 'vitest';
import { UndoHistory } from '../src/game/history';
import { isWon, loadBoard, slideBlock } from '../src/game/engine';
import type { LevelDef } from '../src/game/types';

const clearingJarLevel: LevelDef = {
  id: 99,
  w: 5,
  h: 4,
  walls: [],
  exits: [
    { x: 3, y: 1, color: 'R' },
    { x: 4, y: 1, color: 'R' },
  ],
  blocks: [
    { id: 'clearing-jar', x: 0, y: 1, w: 2, h: 1, color: 'R', axis: 'H' },
    { id: 'other-jar', x: 1, y: 3, w: 2, h: 1, color: 'B', axis: 'H' },
  ],
};

describe('undo history', () => {
  it('restores the selected jar when undo reverses a clear mid-level', () => {
    const history = new UndoHistory();
    const board = loadBoard(clearingJarLevel);
    history.push(board, 'clearing-jar');

    expect(slideBlock(board, 'clearing-jar', 'R').cleared).toBe(true);
    expect(isWon(board)).toBe(false);

    const previous = history.pop();
    expect(previous).not.toBeNull();
    expect(previous!.selectedId).toBe('clearing-jar');
    expect(previous!.board.blocks.map((block) => block.id)).toEqual([
      'clearing-jar',
      'other-jar',
    ]);
    expect(isWon(previous!.board)).toBe(false);
  });
});

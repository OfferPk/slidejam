import { describe, expect, it } from 'vitest';
import { loadBoard, slideBlock } from '../src/game/engine';
import { getTrafficExitStatus } from '../src/game/traffic-feedback';
import type { LevelDef } from '../src/game/types';
import { getLevel } from '../src/levels/index';

describe('traffic exit-path status', () => {
  it('lists each vehicle occupying the target route in order', () => {
    const board = loadBoard(getLevel(1)!);
    expect(getTrafficExitStatus(board)).toBe(
      'Exit path blocked by 2 vehicles: blue bus, yellow car.',
    );
  });

  it('updates when a vehicle slides out of the target lane', () => {
    const board = loadBoard(getLevel(1)!);
    expect(slideBlock(board, 'yellow-car', 'D').moved).toBeGreaterThan(0);
    expect(getTrafficExitStatus(board)).toBe(
      'Exit path blocked by 1 vehicle: blue bus.',
    );
  });

  it('reports a clear route and recognizes an exited target', () => {
    const board = loadBoard(getLevel(1)!);
    board.blocks = board.blocks.filter((block) => block.id === board.targetId);
    expect(getTrafficExitStatus(board)).toBe(
      'Exit path clear. Slide the red target car right through EXIT.',
    );

    board.blocks = [];
    expect(getTrafficExitStatus(board)).toBe(
      'The red target car has exited through EXIT.',
    );
  });

  it('does not add traffic guidance to legacy boards', () => {
    const level: LevelDef = {
      id: 99,
      w: 4,
      h: 3,
      walls: [],
      exits: [],
      blocks: [
        { id: 'jar', x: 0, y: 1, w: 2, h: 1, color: 'R', axis: 'H' },
      ],
    };
    expect(getTrafficExitStatus(loadBoard(level))).toBeNull();
  });
});

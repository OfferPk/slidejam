import { describe, expect, it } from 'vitest';
import {
  axisAllows,
  cloneBoard,
  hintMove,
  isWon,
  listLegalMoves,
  loadBoard,
  maxSlide,
  slideBlock,
  solveBoard,
  tryClearBlock,
} from '../src/game/engine';
import type { LevelDef } from '../src/game/types';
import { getLevel, LEVEL_COUNT } from '../src/levels/index';

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

const trafficLevel = getLevel(1)!;

describe('slide bounds and lane constraints', () => {
  it('slides a legacy block until an edge then stops', () => {
    const board = loadBoard({
      id: 1,
      w: 5,
      h: 3,
      walls: [],
      exits: [],
      blocks: [{ id: 'b1', x: 1, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
    });
    const result = slideBlock(board, 'b1', 'L');
    expect(result.moved).toBe(1);
    expect(board.blocks[0]!.x).toBe(0);
    expect(slideBlock(board, 'b1', 'L').moved).toBe(0);
  });

  it('rejects off-axis vehicle movement without changing its lane', () => {
    const board = loadBoard(trafficLevel);
    const before = board.blocks.find((block) => block.id === 'target-car')!;
    const result = slideBlock(board, 'target-car', 'U');
    expect(result).toEqual({ moved: 0, cleared: false });
    expect(board.blocks.find((block) => block.id === 'target-car')).toMatchObject({
      x: before.x,
      y: before.y,
    });
    expect(axisAllows(before.axis, 'U')).toBe(false);
  });

  it('keeps every listed legal vehicle move on that vehicle axis', () => {
    const board = loadBoard(trafficLevel);
    for (const move of listLegalMoves(board)) {
      const vehicle = board.blocks.find((block) => block.id === move.blockId)!;
      expect(move.dist).toBeGreaterThan(0);
      expect(axisAllows(vehicle.axis, move.dir)).toBe(true);
    }
  });

  it('reports the remaining legacy slide distance', () => {
    const board = loadBoard(fixture);
    expect(maxSlide(board, 'b1', 'R')).toBe(4);
    expect(maxSlide(board, 'b1', 'L')).toBe(0);
  });
});

describe('collision and blocked traffic', () => {
  it('stops before a wall', () => {
    const board = loadBoard({
      id: 2,
      w: 6,
      h: 3,
      walls: [[3, 1]],
      exits: [],
      blocks: [{ id: 'b1', x: 0, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
    });
    const result = slideBlock(board, 'b1', 'R');
    expect(result.moved).toBe(1);
    expect(board.blocks[0]!.x).toBe(1);
  });

  it('stops before another legacy block', () => {
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
    expect(slideBlock(board, 'a', 'R').moved).toBe(2);
    expect(board.blocks.find((block) => block.id === 'a')!.x).toBe(2);
  });

  it('rejects a bus move blocked by the delivery truck', () => {
    const board = loadBoard(trafficLevel);
    const bus = board.blocks.find((block) => block.id === 'city-bus')!;
    expect(slideBlock(board, 'city-bus', 'D')).toEqual({ moved: 0, cleared: false });
    expect(board.blocks.find((block) => block.id === 'city-bus')).toMatchObject({
      x: bus.x,
      y: bus.y,
    });
  });

  it('does not complete when the target car is still blocked in its lane', () => {
    const board = loadBoard(trafficLevel);
    const result = slideBlock(board, 'target-car', 'R');
    expect(result).toEqual({ moved: 1, cleared: false });
    expect(board.blocks.find((block) => block.id === 'target-car')!.x).toBe(1);
    expect(isWon(board)).toBe(false);
  });
});

describe('legacy matching exits', () => {
  it('clears a block when every cell reaches a matching exit', () => {
    const board = loadBoard(fixture);
    const result = slideBlock(board, 'b1', 'R');
    expect(result.moved).toBeGreaterThan(0);
    expect(result.cleared).toBe(true);
    expect(board.blocks).toHaveLength(0);
    expect(isWon(board)).toBe(true);
  });

  it('does not clear on a partial cover', () => {
    const board = loadBoard({
      id: 4,
      w: 5,
      h: 3,
      walls: [],
      exits: [{ x: 2, y: 1, color: 'R' }],
      blocks: [{ id: 'b1', x: 1, y: 1, w: 2, h: 1, color: 'R', axis: 'H' }],
    });
    expect(tryClearBlock(board, 'b1')).toBe(false);
    expect(board.blocks).toHaveLength(1);
  });

  it('rejects a wrong-color exit', () => {
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

describe('traffic target exit and solver', () => {
  it('level 1 visibly declares a right-side target exit and includes a bus and truck', () => {
    expect(LEVEL_COUNT).toBe(4);
    expect([getLevel(1)?.id, getLevel(2)?.id, getLevel(3)?.id, getLevel(4)?.id]).toEqual([1, 2, 3, 4]);
    expect(trafficLevel.mode).toBe('traffic');
    expect(trafficLevel.targetId).toBe('target-car');
    expect(trafficLevel.trafficExit).toEqual({ side: 'right', lane: 2 });
    expect(trafficLevel.blocks.map((block) => block.vehicleKind)).toContain('bus');
    expect(trafficLevel.blocks.map((block) => block.vehicleKind)).toContain('truck');
    expect(getLevel(5)).toBeUndefined();
    expect(getLevel(10)).toBeUndefined();
  });

  it('solves level 1 using legal lane slides and wins only after the target exits', () => {
    const board = loadBoard(trafficLevel);
    const solution = solveBoard(board);
    expect(solution).not.toBeNull();
    expect(solution!.length).toBeGreaterThan(0);
    expect(solution!.length).toBeLessThanOrEqual(8);

    for (const move of solution!) {
      const legal = listLegalMoves(board).find(
        (candidate) => candidate.blockId === move.blockId && candidate.dir === move.dir,
      );
      expect(legal).toBeTruthy();
      const vehicle = board.blocks.find((block) => block.id === move.blockId)!;
      const previousX = vehicle.x;
      const previousY = vehicle.y;
      expect(axisAllows(vehicle.axis, move.dir)).toBe(true);
      const result = slideBlock(board, move.blockId, move.dir);
      expect(result.moved).toBeGreaterThan(0);
      const movedVehicle = board.blocks.find((block) => block.id === move.blockId);
      if (movedVehicle) {
        if (vehicle.axis === 'H') expect(movedVehicle.y).toBe(previousY);
        else expect(movedVehicle.x).toBe(previousX);
      }
    }

    expect(isWon(board)).toBe(true);
    expect(board.blocks.some((block) => block.id === 'target-car')).toBe(false);
    expect(board.blocks.length).toBeGreaterThan(0);
  });

  it('uses the solver’s first legal step as the traffic hint', () => {
    const board = loadBoard(trafficLevel);
    const solution = solveBoard(board);
    expect(solution?.[0]).toBeTruthy();
    expect(hintMove(board)).toEqual({
      blockId: solution![0]!.blockId,
      dir: solution![0]!.dir,
    });
  });

  it('cloneBoard remains independent for both traffic and legacy boards', () => {
    const board = loadBoard(trafficLevel);
    const copy = cloneBoard(board);
    const solution = solveBoard(copy)!;
    for (const move of solution) slideBlock(copy, move.blockId, move.dir);
    expect(isWon(copy)).toBe(true);
    expect(isWon(board)).toBe(false);
  });
});

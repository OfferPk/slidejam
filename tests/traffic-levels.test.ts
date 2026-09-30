import { describe, expect, it } from 'vitest';
import { blockCells, isWon, listLegalMoves, loadBoard, slideBlock, solveBoard } from '../src/game/engine';
import type { LevelDef } from '../src/game/types';
import { computeLayout } from '../src/render/board';
import { getLevel, LEVEL_COUNT, LEVELS } from '../src/levels/index';
import levelFifteenJar from '../src/levels/legacy/level-15-jar.json';
import levelSixteenJar from '../src/levels/legacy/level-16-jar.json';

const trafficLevels = LEVELS.filter((level) => level.mode === 'traffic');

describe('verified traffic level pack', () => {
  it('exposes only converted IDs 1–16 and leaves remaining legacy IDs hidden', () => {
    expect(trafficLevels.map((level) => level.id)).toEqual(Array.from({ length: 16 }, (_, index) => index + 1));
    expect(LEVEL_COUNT).toBe(16);
    expect([17, 18, 25, 50].map((id) => getLevel(id))).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('retains the replaced Level 15–16 jar source records in the archive', () => {
    expect(levelFifteenJar).toMatchObject({ id: 15, walls: [[4, 3], [3, 4]] });
    expect(levelSixteenJar).toMatchObject({ id: 16, walls: [[0, 5], [5, 3], [4, 4]] });
    expect(levelFifteenJar).not.toHaveProperty('mode');
    expect(levelSixteenJar).not.toHaveProperty('mode');
    expect(levelFifteenJar.blocks).toHaveLength(2);
    expect(levelSixteenJar.blocks).toHaveLength(3);
  });

  it('gives Levels 9–16 distinct car, bus, and truck artwork with a measured difficulty increase', () => {
    for (const id of [9, 10, 11, 12, 13, 14, 15, 16]) {
      const level = getLevel(id)!;
      expect(level.blocks.map((block) => block.vehicleKind)).toEqual(
        expect.arrayContaining(['car', 'bus', 'truck']),
      );
    }
    expect(solveBoard(loadBoard(getLevel(13)!))?.length).toBe(16);
    expect(solveBoard(loadBoard(getLevel(14)!))?.length).toBe(17);
    expect(solveBoard(loadBoard(getLevel(15)!))?.length).toBe(18);
    expect(solveBoard(loadBoard(getLevel(16)!))?.length).toBe(19);
  }, 10_000);

  it.each(trafficLevels.map((level) => [level.id, level] as const))(
    'level %i has valid vehicle geometry, a visible exit, and a replayable solver route',
    (_id, level) => {
      expect(level.mode).toBe('traffic');
      expect(level.w).toBe(6);
      expect(level.h).toBe(6);
      expect(level.walls).toEqual([]);
      expect(level.exits).toEqual([]);
      expect(level.trafficExit).toEqual({ side: 'right', lane: 2 });

      const target = level.blocks.find((block) => block.id === level.targetId);
      expect(target).toBeDefined();
      expect(target).toMatchObject({ x: 0, y: level.trafficExit!.lane, w: 2, h: 1, axis: 'H', color: 'R', vehicleKind: 'car' });

      const occupied = new Set<string>();
      expect(new Set(level.blocks.map((block) => block.id)).size).toBe(level.blocks.length);
      for (const vehicle of level.blocks) {
        expect(vehicle.id.length).toBeGreaterThan(0);
        if (vehicle.axis === 'H') {
          expect(vehicle.h).toBe(1);
          expect([2, 3]).toContain(vehicle.w);
        } else {
          expect(vehicle.w).toBe(1);
          expect([2, 3]).toContain(vehicle.h);
        }
        const length = vehicle.axis === 'H' ? vehicle.w : vehicle.h;
        if (vehicle.vehicleKind === 'car') expect(length).toBe(2);
        else expect(length).toBe(3);

        for (const [x, y] of blockCells(vehicle)) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(level.w);
          expect(y).toBeLessThan(level.h);
          const key = `${x},${y}`;
          expect(occupied.has(key)).toBe(false);
          occupied.add(key);
        }
      }

      const board = loadBoard(level);
      const layout = computeLayout(board, 480, 480);
      expect(layout.exitWidth).toBeGreaterThan(0);
      expect(layout.originX + layout.width + layout.exitWidth).toBeLessThanOrEqual(480);
      const exitTop = layout.originY + level.trafficExit!.lane * layout.cell;
      expect(exitTop).toBeGreaterThanOrEqual(layout.originY);
      expect(exitTop + layout.cell).toBeLessThanOrEqual(layout.originY + layout.height);

      const solution = solveBoard(board);
      expect(solution).not.toBeNull();
      expect(solution!.length).toBeGreaterThan(0);
      expect(isWon(board)).toBe(false);
      solution!.forEach((move, index) => {
        const legal = listLegalMoves(board).find(
          (candidate) => candidate.blockId === move.blockId && candidate.dir === move.dir,
        );
        expect(legal).toBeDefined();
        expect(legal!.dist).toBeGreaterThan(0);
        const vehicle = board.blocks.find((block) => block.id === move.blockId)!;
        expect(vehicle.axis === 'H' ? ['L', 'R'] : ['U', 'D']).toContain(move.dir);
        const result = slideBlock(board, move.blockId, move.dir);
        expect(result.moved).toBe(legal!.dist);
        if (index < solution!.length - 1) {
          expect(result.cleared).toBe(false);
          expect(isWon(board)).toBe(false);
        } else {
          expect(move.blockId).toBe(level.targetId);
          expect(result.cleared).toBe(true);
          expect(isWon(board)).toBe(true);
        }
      });
      expect(board.blocks.some((block) => block.id === level.targetId)).toBe(false);
      expect(board.blocks.length).toBeGreaterThan(0);
    },
  );

  it('raises shortest solution difficulty in one-slide steps through Level 16', () => {
    const shortestLengths = trafficLevels.map((level) => solveBoard(loadBoard(level))?.length ?? -1);
    expect(shortestLengths).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    for (let i = 1; i < shortestLengths.length; i++) {
      expect(shortestLengths[i]!).toBeGreaterThan(shortestLengths[i - 1]!);
    }
  }, 15_000);

  it('rejects lane-changing and blocked moves without completing or moving the target', () => {
    const blockedTraffic: LevelDef = {
      id: 99,
      w: 4,
      h: 2,
      mode: 'traffic',
      targetId: 'target-car',
      trafficExit: { side: 'right', lane: 0 },
      walls: [],
      exits: [],
      blocks: [
        { id: 'target-car', x: 0, y: 0, w: 2, h: 1, color: 'R', axis: 'H', vehicleKind: 'car' },
        { id: 'lane-blocker', x: 2, y: 0, w: 1, h: 2, color: 'B', axis: 'V', vehicleKind: 'car' },
      ],
    };
    const board = loadBoard(blockedTraffic);
    const before = board.blocks.map((block) => ({ ...block }));

    expect(slideBlock(board, 'target-car', 'U')).toEqual({ moved: 0, cleared: false });
    expect(slideBlock(board, 'target-car', 'R')).toEqual({ moved: 0, cleared: false });
    expect(board.blocks).toEqual(before);
    expect(isWon(board)).toBe(false);
  });

  it.each([9, 10, 11, 12, 13, 14, 15, 16])('keeps the Level %i target blocked until its lane is clear', (id) => {
    const board = loadBoard(getLevel(id)!);
    const before = board.blocks.map((block) => ({ ...block }));

    expect(slideBlock(board, 'target-car', 'R')).toEqual({ moved: 0, cleared: false });
    expect(slideBlock(board, 'target-car', 'U')).toEqual({ moved: 0, cleared: false });
    expect(board.blocks).toEqual(before);
    expect(isWon(board)).toBe(false);
  });
});

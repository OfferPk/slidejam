import levelOne from './level-01.json';
import levelTwo from './level-02.json';
import levelThree from './level-03.json';
import levelFour from './level-04.json';
import type { LevelDef } from '../game/types';

/**
 * Levels 1–4 are verified traffic puzzles. Legacy jar JSON files for levels
 * 5–50 remain in the repository as source material and are not exposed until
 * each is converted and receives geometry and solvability checks.
 */
export const LEVELS: LevelDef[] = [
  levelOne as unknown as LevelDef,
  levelTwo as unknown as LevelDef,
  levelThree as unknown as LevelDef,
  levelFour as unknown as LevelDef,
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((level) => level.id === id);
}

export const LEVEL_COUNT = LEVELS.length;

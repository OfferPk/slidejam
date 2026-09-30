import levelOne from './level-01.json';
import levelTwo from './level-02.json';
import levelThree from './level-03.json';
import levelFour from './level-04.json';
import levelFive from './level-05.json';
import levelSix from './level-06.json';
import levelSeven from './level-07.json';
import levelEight from './level-08.json';
import type { LevelDef } from '../game/types';

/**
 * Levels 1–8 are verified traffic puzzles. Replaced jar sources for Levels
 * 5–8 are archived under ./legacy; unconverted Levels 9–50 remain hidden.
 */
export const LEVELS: LevelDef[] = [
  levelOne as unknown as LevelDef,
  levelTwo as unknown as LevelDef,
  levelThree as unknown as LevelDef,
  levelFour as unknown as LevelDef,
  levelFive as unknown as LevelDef,
  levelSix as unknown as LevelDef,
  levelSeven as unknown as LevelDef,
  levelEight as unknown as LevelDef,
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((level) => level.id === id);
}

export const LEVEL_COUNT = LEVELS.length;

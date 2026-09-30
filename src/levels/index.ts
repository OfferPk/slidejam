import levelOne from './level-01.json';
import levelTwo from './level-02.json';
import levelThree from './level-03.json';
import levelFour from './level-04.json';
import levelFive from './level-05.json';
import levelSix from './level-06.json';
import levelSeven from './level-07.json';
import levelEight from './level-08.json';
import levelNine from './level-09.json';
import levelTen from './level-10.json';
import levelEleven from './level-11.json';
import levelTwelve from './level-12.json';
import levelThirteen from './level-13.json';
import levelFourteen from './level-14.json';
import levelFifteen from './level-15.json';
import levelSixteen from './level-16.json';
import type { LevelDef } from '../game/types';

/**
 * Levels 1–16 are verified traffic puzzles. Replaced jar sources for Levels
 * 5–16 are archived under ./legacy; unconverted Levels 17–50 remain hidden.
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
  levelNine as unknown as LevelDef,
  levelTen as unknown as LevelDef,
  levelEleven as unknown as LevelDef,
  levelTwelve as unknown as LevelDef,
  levelThirteen as unknown as LevelDef,
  levelFourteen as unknown as LevelDef,
  levelFifteen as unknown as LevelDef,
  levelSixteen as unknown as LevelDef,
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((level) => level.id === id);
}

export const LEVEL_COUNT = LEVELS.length;

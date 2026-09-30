import levelOne from './level-01.json';
import type { LevelDef } from '../game/types';

/**
 * Only level 1 is currently playable. The remaining legacy jar JSON files stay
 * in the repository as source material, but are intentionally not exposed until
 * they are converted to traffic levels and each receives a solvability check.
 */
export const LEVELS: LevelDef[] = [levelOne as unknown as LevelDef];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((level) => level.id === id);
}

export const LEVEL_COUNT = LEVELS.length;

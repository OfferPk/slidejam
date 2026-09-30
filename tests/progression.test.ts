import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getLevel, LEVEL_COUNT } from '../src/levels/index';
import { loadPersist, unlockLevel } from '../src/game/persist';

const values = new Map<string, string>();
const storage = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => { values.set(key, value); },
  removeItem: (key: string) => { values.delete(key); },
  clear: () => values.clear(),
  key: (index: number) => [...values.keys()][index] ?? null,
  get length() { return values.size; },
} as Storage;

beforeEach(() => {
  values.clear();
  vi.stubGlobal('localStorage', storage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('verified catalog progression', () => {
  it('keeps Levels 19–20 in the catalog and every later level hidden', () => {
    expect(LEVEL_COUNT).toBe(20);
    expect(getLevel(19)?.mode).toBe('traffic');
    expect(getLevel(20)?.mode).toBe('traffic');
    expect(Array.from({ length: 30 }, (_, index) => getLevel(index + 21)))
      .toEqual(Array(30).fill(undefined));
  });

  it('persists sequential unlock progress without allowing it to regress', () => {
    expect(loadPersist().unlocked).toBe(1);
    expect(unlockLevel(18).unlocked).toBe(18);
    expect(unlockLevel(19).unlocked).toBe(19);
    expect(unlockLevel(18).unlocked).toBe(19);
    expect(unlockLevel(20).unlocked).toBe(20);
    expect(loadPersist().unlocked).toBe(20);
  });
});

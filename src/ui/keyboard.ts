import type { Dir } from '../game/types';

export type BoardKeyboardAction =
  | { type: 'slide'; dir: Dir }
  | { type: 'select-next' }
  | { type: 'undo' };

type KeyModifiers = Pick<KeyboardEvent, 'ctrlKey' | 'metaKey' | 'shiftKey'>;

const ARROW_DIRECTIONS: Readonly<Record<string, Dir>> = {
  ArrowLeft: 'L',
  ArrowRight: 'R',
  ArrowUp: 'U',
  ArrowDown: 'D',
};

export function getBoardKeyboardAction(
  key: string,
  modifiers: KeyModifiers,
): BoardKeyboardAction | null {
  const dir = ARROW_DIRECTIONS[key];
  if (dir) return { type: 'slide', dir };
  if (key === 'Enter' && !modifiers.ctrlKey && !modifiers.metaKey) {
    return { type: 'select-next' };
  }
  if (
    (modifiers.ctrlKey || modifiers.metaKey) &&
    !modifiers.shiftKey &&
    key.toLowerCase() === 'z'
  ) {
    return { type: 'undo' };
  }
  return null;
}

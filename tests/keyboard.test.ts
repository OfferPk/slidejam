import { describe, expect, it } from 'vitest';
import { getBoardKeyboardAction } from '../src/ui/keyboard';

const plain = { ctrlKey: false, metaKey: false, shiftKey: false };

describe('board keyboard controls', () => {
  it('maps all arrow keys to slide directions', () => {
    expect(getBoardKeyboardAction('ArrowLeft', plain)).toEqual({ type: 'slide', dir: 'L' });
    expect(getBoardKeyboardAction('ArrowRight', plain)).toEqual({ type: 'slide', dir: 'R' });
    expect(getBoardKeyboardAction('ArrowUp', plain)).toEqual({ type: 'slide', dir: 'U' });
    expect(getBoardKeyboardAction('ArrowDown', plain)).toEqual({ type: 'slide', dir: 'D' });
  });

  it('uses Enter to cycle selectable pieces and Ctrl/Command+Z to undo', () => {
    expect(getBoardKeyboardAction('Enter', plain)).toEqual({ type: 'select-next' });
    expect(getBoardKeyboardAction('z', { ...plain, ctrlKey: true })).toEqual({ type: 'undo' });
    expect(getBoardKeyboardAction('Z', { ...plain, metaKey: true })).toEqual({ type: 'undo' });
  });

  it('ignores unrelated keys and leaves redo chords untouched', () => {
    expect(getBoardKeyboardAction('x', plain)).toBeNull();
    expect(getBoardKeyboardAction('Tab', plain)).toBeNull();
    expect(getBoardKeyboardAction('z', { ...plain, ctrlKey: true, shiftKey: true })).toBeNull();
    expect(getBoardKeyboardAction('Enter', { ...plain, ctrlKey: true })).toBeNull();
  });
});

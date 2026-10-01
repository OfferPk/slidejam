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

  it('uses Enter to cycle pieces and supports undo and redo shortcuts', () => {
    expect(getBoardKeyboardAction('Enter', plain)).toEqual({ type: 'select-next' });
    expect(getBoardKeyboardAction('z', { ...plain, ctrlKey: true })).toEqual({ type: 'undo' });
    expect(getBoardKeyboardAction('Z', { ...plain, metaKey: true })).toEqual({ type: 'undo' });
    expect(getBoardKeyboardAction('z', { ...plain, ctrlKey: true, shiftKey: true })).toEqual({ type: 'redo' });
    expect(getBoardKeyboardAction('Z', { ...plain, metaKey: true, shiftKey: true })).toEqual({ type: 'redo' });
    expect(getBoardKeyboardAction('y', { ...plain, ctrlKey: true })).toEqual({ type: 'redo' });
    expect(getBoardKeyboardAction('Y', { ...plain, metaKey: true })).toEqual({ type: 'redo' });
  });

  it('ignores unrelated keys and unsupported shortcut variants', () => {
    expect(getBoardKeyboardAction('x', plain)).toBeNull();
    expect(getBoardKeyboardAction('Tab', plain)).toBeNull();
    expect(getBoardKeyboardAction('Enter', { ...plain, ctrlKey: true })).toBeNull();
    expect(getBoardKeyboardAction('y', { ...plain, ctrlKey: true, shiftKey: true })).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import type { Axis, Dir } from '../src/game/types';
import { getBoardKeyboardAction } from '../src/ui/keyboard';
import { getPointerSlideAction } from '../src/ui/pointer';

const plain = { ctrlKey: false, metaKey: false, shiftKey: false };
const threshold = 24;
const parityCases: {
  axis: Axis;
  dx: number;
  dy: number;
  key: string;
  dir: Dir;
}[] = [
  { axis: 'H', dx: -48, dy: 0, key: 'ArrowLeft', dir: 'L' },
  { axis: 'H', dx: 48, dy: 0, key: 'ArrowRight', dir: 'R' },
  { axis: 'V', dx: 0, dy: -48, key: 'ArrowUp', dir: 'U' },
  { axis: 'V', dx: 0, dy: 48, key: 'ArrowDown', dir: 'D' },
];

describe('pointer controls', () => {
  it.each(parityCases)(
    'matches $key for an $axis-axis jar',
    ({ axis, dx, dy, key, dir }) => {
      const pointerAction = getPointerSlideAction(dx, dy, axis, threshold);
      const keyboardAction = getBoardKeyboardAction(key, plain);

      expect(pointerAction).toEqual({ type: 'slide', dir });
      expect(keyboardAction).toEqual(pointerAction);
    },
  );

  it('treats short movement as a tap rather than a slide', () => {
    expect(getPointerSlideAction(threshold - 1, 0, 'H', threshold)).toBeNull();
    expect(getPointerSlideAction(threshold, 0, 'H', threshold)).toEqual({
      type: 'slide',
      dir: 'R',
    });
  });

  it('identifies a clear off-axis swipe for keyboard-equivalent guidance', () => {
    expect(getPointerSlideAction(0, -48, 'H', threshold)).toEqual({
      type: 'off-axis',
    });
    expect(getPointerSlideAction(48, 0, 'V', threshold)).toEqual({
      type: 'off-axis',
    });
  });
});

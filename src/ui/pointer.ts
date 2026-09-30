import type { Axis, Dir } from '../game/types';

export type PointerSlideAction =
  | { type: 'slide'; dir: Dir }
  | { type: 'off-axis' };

/** Resolve a drag using the same direction vocabulary as the board's arrow keys. */
export function getPointerSlideAction(
  dx: number,
  dy: number,
  axis: Axis,
  threshold: number,
): PointerSlideAction | null {
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx < threshold && absDy < threshold) return null;

  const dir: Dir =
    absDx >= absDy
      ? dx > 0 ? 'R' : 'L'
      : dy > 0 ? 'D' : 'U';
  const allowed =
    axis === 'H'
      ? dir === 'L' || dir === 'R'
      : dir === 'U' || dir === 'D';
  return allowed ? { type: 'slide', dir } : { type: 'off-axis' };
}

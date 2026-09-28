/** Soft candy / jam jar color tokens. */
export type ColorId = 'R' | 'G' | 'B' | 'Y' | 'P' | 'O';

export const COLORS: readonly ColorId[] = ['R', 'G', 'B', 'Y', 'P', 'O'] as const;

/** Soft candy / jam palette (original — not Color Block Jam). */
export const COLOR_HEX: Record<ColorId, string> = {
  R: '#e85d7a',
  G: '#5ecf8e',
  B: '#6ec5ff',
  Y: '#f5d78e',
  P: '#c89bff',
  O: '#ffb070',
};

export type Axis = 'H' | 'V';

export interface ExitDef {
  x: number;
  y: number;
  color: ColorId;
}

export interface BlockDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: ColorId;
  axis: Axis;
}

export interface LevelDef {
  id: number;
  w: number;
  h: number;
  walls: [number, number][];
  exits: ExitDef[];
  blocks: BlockDef[];
}

export interface BlockState {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: ColorId;
  axis: Axis;
}

export interface BoardState {
  w: number;
  h: number;
  /** Set of "x,y" wall cells. */
  walls: Set<string>;
  /** Map "x,y" → color. */
  exits: Map<string, ColorId>;
  blocks: BlockState[];
}

export type Dir = 'L' | 'R' | 'U' | 'D';

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

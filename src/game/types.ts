/** SlideJam's original pastel palette, reused by jars and traffic vehicles. */
export type ColorId = 'R' | 'G' | 'B' | 'Y' | 'P' | 'O';

export const COLORS: readonly ColorId[] = ['R', 'G', 'B', 'Y', 'P', 'O'] as const;

export const COLOR_HEX: Record<ColorId, string> = {
  R: '#e85d7a',
  G: '#5ecf8e',
  B: '#6ec5ff',
  Y: '#f5d78e',
  P: '#c89bff',
  O: '#ffb070',
};

export type Axis = 'H' | 'V';
export type GameMode = 'jars' | 'traffic';
export type VehicleKind = 'car' | 'bus' | 'truck';

export interface ExitDef {
  x: number;
  y: number;
  color: ColorId;
}

export interface TrafficExitDef {
  side: 'right';
  /** Zero-based row occupied by the target vehicle's exit lane. */
  lane: number;
}

export interface BlockDef {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: ColorId;
  axis: Axis;
  /** Omitted for legacy jar levels; traffic vehicles default to a car. */
  vehicleKind?: VehicleKind;
}

export interface LevelDef {
  id: number;
  w: number;
  h: number;
  walls: [number, number][];
  exits: ExitDef[];
  blocks: BlockDef[];
  /** Legacy jar levels default to jars; verified traffic levels opt in explicitly. */
  mode?: GameMode;
  targetId?: string;
  trafficExit?: TrafficExitDef;
}

export interface BlockState {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: ColorId;
  axis: Axis;
  vehicleKind: VehicleKind;
}

export interface BoardState {
  w: number;
  h: number;
  mode: GameMode;
  targetId?: string;
  trafficExit?: TrafficExitDef;
  /** Set of "x,y" wall cells. */
  walls: Set<string>;
  /** Map "x,y" → color for legacy jar exits. */
  exits: Map<string, ColorId>;
  blocks: BlockState[];
}

export type Dir = 'L' | 'R' | 'U' | 'D';

export function cellKey(x: number, y: number): string {
  return `${x},${y}`;
}

import type { BlockState, BoardState } from './types';

const COLOR_NAMES: Record<BlockState['color'], string> = {
  R: 'red',
  G: 'green',
  B: 'blue',
  Y: 'yellow',
  P: 'purple',
  O: 'orange',
};

const VEHICLE_NAMES: Record<BlockState['vehicleKind'], string> = {
  car: 'car',
  bus: 'bus',
  truck: 'truck',
};

/** Describe vehicles currently occupying the target car's route to its exit. */
export function getTrafficExitStatus(board: BoardState): string | null {
  if (board.mode !== 'traffic' || !board.targetId || !board.trafficExit) {
    return null;
  }

  const target = board.blocks.find((block) => block.id === board.targetId);
  if (!target) return 'The red target car has exited through EXIT.';

  const blockers = board.blocks
    .filter((block) =>
      block.id !== target.id &&
      target.y >= block.y &&
      target.y < block.y + block.h &&
      block.x + block.w > target.x + target.w
    )
    .sort((a, b) => a.x - b.x || a.y - b.y);

  if (blockers.length === 0) {
    return 'Exit path clear. Slide the red target car right through EXIT.';
  }

  const vehicleList = blockers
    .map((block) => `${COLOR_NAMES[block.color]} ${VEHICLE_NAMES[block.vehicleKind]}`)
    .join(', ');
  const countLabel = blockers.length === 1 ? 'vehicle' : 'vehicles';
  return `Exit path blocked by ${blockers.length} ${countLabel}: ${vehicleList}.`;
}

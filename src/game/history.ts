import { cloneBoard, isWon } from './engine';
import type { BoardState } from './types';

export interface UndoSnapshot {
  board: BoardState;
  selectedId: string | null;
}

/** Take the previous state only while the active level is still in progress. */
export function takeUndoSnapshot(
  history: UndoHistory,
  board: BoardState | null,
): UndoSnapshot | null {
  if (!board || isWon(board)) return null;
  return history.pop();
}

/** Store a restorable board and its active selection before a move. */
export class UndoHistory {
  private snapshots: UndoSnapshot[] = [];

  push(board: BoardState, selectedId: string | null): void {
    this.snapshots.push({ board: cloneBoard(board), selectedId });
  }

  pop(): UndoSnapshot | null {
    return this.snapshots.pop() ?? null;
  }

  clear(): void {
    this.snapshots = [];
  }
}

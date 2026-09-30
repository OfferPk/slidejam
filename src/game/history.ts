import { cloneBoard } from './engine';
import type { BoardState } from './types';

export interface UndoSnapshot {
  board: BoardState;
  selectedId: string | null;
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

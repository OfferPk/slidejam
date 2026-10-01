import { cloneBoard, isWon } from './engine';
import type { BoardState } from './types';

export interface UndoSnapshot {
  board: BoardState;
  selectedId: string | null;
}

function snapshot(board: BoardState, selectedId: string | null): UndoSnapshot {
  return { board: cloneBoard(board), selectedId };
}

/** Take the previous state only while the active level is still in progress. */
export function takeUndoSnapshot(
  history: UndoHistory,
  board: BoardState | null,
  selectedId: string | null = null,
): UndoSnapshot | null {
  if (!board) return null;
  return history.undo(board, selectedId);
}

/** Restore a move only while the active level is still in progress. */
export function takeRedoSnapshot(
  history: UndoHistory,
  board: BoardState | null,
  selectedId: string | null = null,
): UndoSnapshot | null {
  if (!board) return null;
  return history.redo(board, selectedId);
}

/** Store restorable board states before moves and shuttle them between stacks. */
export class UndoHistory {
  private undoSnapshots: UndoSnapshot[] = [];
  private redoSnapshots: UndoSnapshot[] = [];

  get canUndo(): boolean {
    return this.undoSnapshots.length > 0;
  }

  get canRedo(): boolean {
    return this.redoSnapshots.length > 0;
  }

  /** Record a new successful-move boundary and discard any abandoned redo path. */
  push(board: BoardState, selectedId: string | null): void {
    this.undoSnapshots.push(snapshot(board, selectedId));
    this.redoSnapshots = [];
  }

  undo(board: BoardState, selectedId: string | null): UndoSnapshot | null {
    if (isWon(board)) return null;
    const previous = this.undoSnapshots.pop() ?? null;
    if (!previous) return null;
    this.redoSnapshots.push(snapshot(board, selectedId));
    return previous;
  }

  redo(board: BoardState, selectedId: string | null): UndoSnapshot | null {
    if (isWon(board)) return null;
    const next = this.redoSnapshots.pop() ?? null;
    if (!next) return null;
    this.undoSnapshots.push(snapshot(board, selectedId));
    return next;
  }

  /** Kept for direct history inspection in unit tests. */
  pop(): UndoSnapshot | null {
    return this.undoSnapshots.pop() ?? null;
  }

  clear(): void {
    this.undoSnapshots = [];
    this.redoSnapshots = [];
  }
}

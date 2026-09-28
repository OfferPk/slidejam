/**
 * Canvas renderer for SlideJam grid — soft candy / jam jars theme.
 */
import { blockCells } from '../game/engine';
import type { BoardState } from '../game/types';
import { COLOR_HEX, cellKey } from '../game/types';

export interface BoardLayout {
  originX: number;
  originY: number;
  cell: number;
  width: number;
  height: number;
}

export interface RenderOpts {
  selectedId: string | null;
  hintId: string | null;
  dragOffset?: { id: string; dx: number; dy: number } | null;
}

export function computeLayout(
  board: BoardState,
  canvasW: number,
  canvasH: number,
  pad = 12,
): BoardLayout {
  const usableW = canvasW - pad * 2;
  const usableH = canvasH - pad * 2;
  const cell = Math.floor(Math.min(usableW / board.w, usableH / board.h));
  const width = cell * board.w;
  const height = cell * board.h;
  const originX = Math.floor((canvasW - width) / 2);
  const originY = Math.floor((canvasH - height) / 2);
  return { originX, originY, cell, width, height };
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardState,
  layout: BoardLayout,
  opts: RenderOpts,
): void {
  const { originX, originY, cell, width, height } = layout;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Board panel
  roundRect(ctx, originX - 6, originY - 6, width + 12, height + 12, 16);
  ctx.fillStyle = '#3a2445';
  ctx.fill();

  // Grid cells
  for (let y = 0; y < board.h; y++) {
    for (let x = 0; x < board.w; x++) {
      const px = originX + x * cell;
      const py = originY + y * cell;
      const key = cellKey(x, y);
      if (board.walls.has(key)) {
        ctx.fillStyle = '#1a0f20';
        roundRect(ctx, px + 2, py + 2, cell - 4, cell - 4, 8);
        ctx.fill();
        continue;
      }
      // Empty jam shelf
      ctx.fillStyle = (x + y) % 2 === 0 ? '#4a3058' : '#443054';
      roundRect(ctx, px + 2, py + 2, cell - 4, cell - 4, 8);
      ctx.fill();

      const exitColor = board.exits.get(key);
      if (exitColor) {
        const hex = COLOR_HEX[exitColor];
        ctx.strokeStyle = hex;
        ctx.lineWidth = Math.max(2, cell * 0.08);
        ctx.setLineDash([cell * 0.12, cell * 0.08]);
        roundRect(ctx, px + cell * 0.18, py + cell * 0.18, cell * 0.64, cell * 0.64, 8);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = hex;
        roundRect(ctx, px + cell * 0.22, py + cell * 0.22, cell * 0.56, cell * 0.56, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // Blocks (jam jars)
  for (const b of board.blocks) {
    let ox = 0;
    let oy = 0;
    if (opts.dragOffset && opts.dragOffset.id === b.id) {
      ox = opts.dragOffset.dx;
      oy = opts.dragOffset.dy;
    }
    const px = originX + b.x * cell + ox;
    const py = originY + b.y * cell + oy;
    const bw = b.w * cell;
    const bh = b.h * cell;
    const hex = COLOR_HEX[b.color];
    const isSel = opts.selectedId === b.id;
    const isHint = opts.hintId === b.id;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    roundRect(ctx, px + 4, py + 6, bw - 8, bh - 8, 12);
    ctx.fill();

    // Body
    const grad = ctx.createLinearGradient(px, py, px, py + bh);
    grad.addColorStop(0, shade(hex, 1.15));
    grad.addColorStop(1, shade(hex, 0.85));
    ctx.fillStyle = grad;
    roundRect(ctx, px + 3, py + 3, bw - 6, bh - 6, 12);
    ctx.fill();

    // Lid / rim
    ctx.fillStyle = shade(hex, 0.7);
    if (b.axis === 'H') {
      roundRect(ctx, px + 8, py + 3, bw - 16, Math.max(6, cell * 0.14), 6);
    } else {
      roundRect(ctx, px + 3, py + 8, Math.max(6, cell * 0.14), bh - 16, 6);
    }
    ctx.fill();

    // Gloss
    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    roundRect(ctx, px + cell * 0.15, py + cell * 0.12, bw * 0.35, Math.max(4, cell * 0.12), 4);
    ctx.fill();

    if (isSel || isHint) {
      ctx.strokeStyle = isHint ? '#f5d78e' : '#ffffff';
      ctx.lineWidth = isHint ? 3 : 2;
      roundRect(ctx, px + 1, py + 1, bw - 2, bh - 2, 14);
      ctx.stroke();
    }

    // Axis hint chevrons
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.font = `bold ${Math.max(10, Math.floor(cell * 0.28))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.axis === 'H' ? '↔' : '↕', px + bw / 2, py + bh / 2);
  }
}

export function hitTestBlock(
  board: BoardState,
  layout: BoardLayout,
  px: number,
  py: number,
): string | null {
  const gx = Math.floor((px - layout.originX) / layout.cell);
  const gy = Math.floor((py - layout.originY) / layout.cell);
  if (gx < 0 || gy < 0 || gx >= board.w || gy >= board.h) return null;
  for (let i = board.blocks.length - 1; i >= 0; i--) {
    const b = board.blocks[i]!;
    for (const [x, y] of blockCells(b)) {
      if (x === gx && y === gy) return b.id;
    }
  }
  return null;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255;
  let g = (n >> 8) & 255;
  let b = n & 255;
  r = Math.min(255, Math.max(0, Math.round(r * factor)));
  g = Math.min(255, Math.max(0, Math.round(g * factor)));
  b = Math.min(255, Math.max(0, Math.round(b * factor)));
  return `rgb(${r},${g},${b})`;
}

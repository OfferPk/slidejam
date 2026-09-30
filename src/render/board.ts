import { blockCells } from '../game/engine';
import type { BlockState, BoardState } from '../game/types';
import { COLOR_HEX, cellKey } from '../game/types';

export interface BoardLayout {
  originX: number;
  originY: number;
  cell: number;
  width: number;
  height: number;
  exitWidth: number;
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
  const exitCells = board.mode === 'traffic' && board.trafficExit ? 1.25 : 0;
  const cell = Math.max(1, Math.floor(Math.min(usableW / (board.w + exitCells), usableH / board.h)));
  const width = cell * board.w;
  const height = cell * board.h;
  const exitWidth = cell * exitCells;
  const originX = Math.floor((canvasW - width - exitWidth) / 2);
  const originY = Math.floor((canvasH - height) / 2);
  return { originX, originY, cell, width, height, exitWidth };
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardState,
  layout: BoardLayout,
  opts: RenderOpts,
): void {
  if (board.mode === 'traffic') {
    drawTrafficBoard(ctx, board, layout, opts);
    return;
  }
  drawJarBoard(ctx, board, layout, opts);
}

function drawJarBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardState,
  layout: BoardLayout,
  opts: RenderOpts,
): void {
  const { originX, originY, cell, width, height } = layout;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  roundRect(ctx, originX - 6, originY - 6, width + 12, height + 12, 16);
  ctx.fillStyle = '#3a2445';
  ctx.fill();

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

  for (const block of board.blocks) drawJar(ctx, block, layout, opts);
}

function drawJar(
  ctx: CanvasRenderingContext2D,
  block: BlockState,
  layout: BoardLayout,
  opts: RenderOpts,
): void {
  const { originX, originY, cell } = layout;
  const offset = opts.dragOffset?.id === block.id ? opts.dragOffset : null;
  const px = originX + block.x * cell + (offset?.dx ?? 0);
  const py = originY + block.y * cell + (offset?.dy ?? 0);
  const bw = block.w * cell;
  const bh = block.h * cell;
  const hex = COLOR_HEX[block.color];
  const isSelected = opts.selectedId === block.id;
  const isHint = opts.hintId === block.id;

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  roundRect(ctx, px + 4, py + 6, bw - 8, bh - 8, 12);
  ctx.fill();
  const gradient = ctx.createLinearGradient(px, py, px, py + bh);
  gradient.addColorStop(0, shade(hex, 1.15));
  gradient.addColorStop(1, shade(hex, 0.85));
  ctx.fillStyle = gradient;
  roundRect(ctx, px + 3, py + 3, bw - 6, bh - 6, 12);
  ctx.fill();
  ctx.fillStyle = shade(hex, 0.7);
  if (block.axis === 'H') {
    roundRect(ctx, px + 8, py + 3, bw - 16, Math.max(6, cell * 0.14), 6);
  } else {
    roundRect(ctx, px + 3, py + 8, Math.max(6, cell * 0.14), bh - 16, 6);
  }
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  roundRect(ctx, px + cell * 0.15, py + cell * 0.12, bw * 0.35, Math.max(4, cell * 0.12), 4);
  ctx.fill();
  if (isSelected || isHint) {
    ctx.strokeStyle = isHint ? '#f5d78e' : '#ffffff';
    ctx.lineWidth = isHint ? 3 : 2;
    roundRect(ctx, px + 1, py + 1, bw - 2, bh - 2, 14);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `bold ${Math.max(10, Math.floor(cell * 0.28))}px system-ui`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(block.axis === 'H' ? '↔' : '↕', px + bw / 2, py + bh / 2);
}

function drawTrafficBoard(
  ctx: CanvasRenderingContext2D,
  board: BoardState,
  layout: BoardLayout,
  opts: RenderOpts,
): void {
  const { originX, originY, cell, width, height, exitWidth } = layout;
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  roundRect(ctx, originX - 7, originY - 7, width + exitWidth + 14, height + 14, 18);
  ctx.fillStyle = '#151e26';
  ctx.fill();
  ctx.fillStyle = '#303a43';
  roundRect(ctx, originX - 2, originY - 2, width + exitWidth + 4, height + 4, 13);
  ctx.fill();

  ctx.save();
  ctx.strokeStyle = 'rgba(235, 240, 238, 0.27)';
  ctx.lineWidth = Math.max(1, cell * 0.022);
  ctx.setLineDash([cell * 0.22, cell * 0.18]);
  for (let row = 1; row < board.h; row++) {
    const y = originY + row * cell;
    ctx.beginPath();
    ctx.moveTo(originX + cell * 0.12, y);
    ctx.lineTo(originX + width + exitWidth - cell * 0.1, y);
    ctx.stroke();
  }
  for (let col = 1; col < board.w; col++) {
    const x = originX + col * cell;
    ctx.beginPath();
    ctx.moveTo(x, originY + cell * 0.12);
    ctx.lineTo(x, originY + height - cell * 0.12);
    ctx.stroke();
  }
  ctx.restore();

  if (board.trafficExit && exitWidth > 0) {
    drawExit(ctx, board.trafficExit.lane, layout);
  }

  // Curb lines stop at the exit opening, leaving a clear path off the board.
  ctx.save();
  ctx.strokeStyle = '#b8c4c5';
  ctx.lineWidth = Math.max(2, cell * 0.045);
  if (board.trafficExit) {
    const gapTop = originY + board.trafficExit.lane * cell + cell * 0.08;
    const gapBottom = gapTop + cell * 0.84;
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX + width, originY);
    ctx.moveTo(originX, originY + height);
    ctx.lineTo(originX + width, originY + height);
    ctx.moveTo(originX, originY);
    ctx.lineTo(originX, originY + height);
    ctx.moveTo(originX + width, originY);
    ctx.lineTo(originX + width, gapTop);
    ctx.moveTo(originX + width, gapBottom);
    ctx.lineTo(originX + width, originY + height);
    ctx.stroke();
  }
  ctx.restore();

  for (const vehicle of board.blocks) drawVehicle(ctx, vehicle, board, layout, opts);
}

function drawExit(ctx: CanvasRenderingContext2D, lane: number, layout: BoardLayout): void {
  const { originX, originY, cell, width, exitWidth } = layout;
  const x = originX + width;
  const y = originY + lane * cell;
  ctx.fillStyle = 'rgba(62, 177, 119, 0.32)';
  roundRect(ctx, x + 2, y + cell * 0.09, exitWidth - 3, cell * 0.82, 9);
  ctx.fill();
  ctx.strokeStyle = '#76e3a9';
  ctx.lineWidth = Math.max(2, cell * 0.035);
  ctx.setLineDash([cell * 0.13, cell * 0.09]);
  roundRect(ctx, x + 3, y + cell * 0.11, exitWidth - 5, cell * 0.78, 8);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#fff0b0';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `bold ${Math.max(9, Math.floor(cell * 0.17))}px system-ui`;
  ctx.fillText('EXIT', x + exitWidth * 0.5, y + cell * 0.68);
  ctx.font = `bold ${Math.max(18, Math.floor(cell * 0.34))}px system-ui`;
  ctx.fillText('→', x + exitWidth * 0.5, y + cell * 0.36);
}

function drawVehicle(
  ctx: CanvasRenderingContext2D,
  vehicle: BlockState,
  board: BoardState,
  layout: BoardLayout,
  opts: RenderOpts,
): void {
  const { originX, originY, cell } = layout;
  const offset = opts.dragOffset?.id === vehicle.id ? opts.dragOffset : null;
  const px = originX + vehicle.x * cell + (offset?.dx ?? 0);
  const py = originY + vehicle.y * cell + (offset?.dy ?? 0);
  const bw = vehicle.w * cell;
  const bh = vehicle.h * cell;
  const color = COLOR_HEX[vehicle.color];
  const isTarget = board.targetId === vehicle.id;
  const isSelected = opts.selectedId === vehicle.id;
  const isHint = opts.hintId === vehicle.id;
  const inset = Math.max(3, cell * 0.075);
  const bodyX = px + inset;
  const bodyY = py + inset;
  const bodyW = bw - inset * 2;
  const bodyH = bh - inset * 2;
  const minor = Math.min(bodyW, bodyH);
  const wheelLong = Math.max(5, minor * 0.2);
  const wheelShort = Math.max(4, minor * 0.14);

  // Dark sidewall wheels peek out from beneath the body, in pairs along the lane.
  ctx.fillStyle = '#11171c';
  if (vehicle.axis === 'H') {
    for (const fraction of [0.25, 0.75]) {
      const wheelX = px + bw * fraction - wheelLong / 2;
      roundRect(ctx, wheelX, py + cell * 0.025, wheelLong, wheelShort, wheelShort / 2);
      ctx.fill();
      roundRect(ctx, wheelX, py + bh - wheelShort - cell * 0.025, wheelLong, wheelShort, wheelShort / 2);
      ctx.fill();
    }
  } else {
    for (const fraction of [0.25, 0.75]) {
      const wheelY = py + bh * fraction - wheelLong / 2;
      roundRect(ctx, px + cell * 0.025, wheelY, wheelShort, wheelLong, wheelShort / 2);
      ctx.fill();
      roundRect(ctx, px + bw - wheelShort - cell * 0.025, wheelY, wheelShort, wheelLong, wheelShort / 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  roundRect(ctx, bodyX + 1, bodyY + 3, bodyW, bodyH, Math.min(cell * 0.22, minor * 0.3));
  ctx.fill();
  const gradient = ctx.createLinearGradient(bodyX, bodyY, bodyX, bodyY + bodyH);
  gradient.addColorStop(0, shade(color, 1.16));
  gradient.addColorStop(1, shade(color, 0.83));
  ctx.fillStyle = gradient;
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, Math.min(cell * 0.22, minor * 0.3));
  ctx.fill();
  ctx.strokeStyle = isTarget ? '#ffe69a' : shade(color, 0.72);
  ctx.lineWidth = isTarget ? Math.max(2, cell * 0.045) : Math.max(1, cell * 0.025);
  roundRect(ctx, bodyX, bodyY, bodyW, bodyH, Math.min(cell * 0.22, minor * 0.3));
  ctx.stroke();

  if (vehicle.vehicleKind === 'bus') {
    drawBusWindows(ctx, vehicle, bodyX, bodyY, bodyW, bodyH, cell);
  } else if (vehicle.vehicleKind === 'truck') {
    drawTruckCab(ctx, vehicle, bodyX, bodyY, bodyW, bodyH, cell);
  } else {
    drawCarWindows(ctx, vehicle, bodyX, bodyY, bodyW, bodyH, cell);
  }
  drawLights(ctx, vehicle, bodyX, bodyY, bodyW, bodyH, cell);

  if (isTarget) {
    ctx.fillStyle = '#fff0b0';
    ctx.font = `bold ${Math.max(8, Math.floor(cell * 0.13))}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TARGET', bodyX + bodyW / 2, bodyY + bodyH * 0.82);
  }

  if (isSelected || isHint) {
    ctx.strokeStyle = isHint ? '#fff0a8' : isTarget ? '#fff0a8' : '#f5fbff';
    ctx.lineWidth = isHint ? Math.max(3, cell * 0.055) : Math.max(2, cell * 0.04);
    roundRect(ctx, px + 1, py + 1, bw - 2, bh - 2, Math.min(cell * 0.2, minor * 0.3));
    ctx.stroke();
  }
}

function drawCarWindows(
  ctx: CanvasRenderingContext2D,
  vehicle: BlockState,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: number,
): void {
  ctx.fillStyle = '#193c4b';
  if (vehicle.axis === 'H') {
    roundRect(ctx, x + w * 0.27, y + h * 0.2, w * 0.48, h * 0.58, cell * 0.1);
    ctx.fill();
    ctx.fillStyle = 'rgba(176, 233, 247, 0.64)';
    roundRect(ctx, x + w * 0.31, y + h * 0.24, w * 0.2, h * 0.5, cell * 0.07);
    ctx.fill();
  } else {
    roundRect(ctx, x + w * 0.2, y + h * 0.27, w * 0.58, h * 0.48, cell * 0.1);
    ctx.fill();
    ctx.fillStyle = 'rgba(176, 233, 247, 0.64)';
    roundRect(ctx, x + w * 0.24, y + h * 0.31, w * 0.5, h * 0.2, cell * 0.07);
    ctx.fill();
  }
}

function drawBusWindows(
  ctx: CanvasRenderingContext2D,
  vehicle: BlockState,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: number,
): void {
  ctx.fillStyle = '#153d50';
  if (vehicle.axis === 'H') {
    const count = Math.max(3, vehicle.w + 1);
    for (let i = 0; i < count; i++) {
      const windowW = w * 0.11;
      const windowX = x + w * 0.12 + i * (w * 0.76 / (count - 1));
      roundRect(ctx, windowX - windowW / 2, y + h * 0.22, windowW, h * 0.42, cell * 0.055);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(211, 243, 249, 0.72)';
    roundRect(ctx, x + w * 0.78, y + h * 0.69, w * 0.12, h * 0.12, cell * 0.04);
    ctx.fill();
  } else {
    const count = Math.max(3, vehicle.h + 1);
    for (let i = 0; i < count; i++) {
      const windowH = h * 0.11;
      const windowY = y + h * 0.12 + i * (h * 0.76 / (count - 1));
      roundRect(ctx, x + w * 0.22, windowY - windowH / 2, w * 0.42, windowH, cell * 0.055);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(211, 243, 249, 0.72)';
    roundRect(ctx, x + w * 0.69, y + h * 0.78, w * 0.12, h * 0.12, cell * 0.04);
    ctx.fill();
  }
}

function drawTruckCab(
  ctx: CanvasRenderingContext2D,
  vehicle: BlockState,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: number,
): void {
  ctx.fillStyle = shade(COLOR_HEX[vehicle.color], 0.73);
  if (vehicle.axis === 'H') {
    roundRect(ctx, x + w * 0.07, y + h * 0.18, w * 0.56, h * 0.64, cell * 0.08);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(1, cell * 0.018);
    for (let i = 1; i <= 3; i++) {
      const ribX = x + w * (0.1 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(ribX, y + h * 0.23);
      ctx.lineTo(ribX, y + h * 0.77);
      ctx.stroke();
    }
    ctx.fillStyle = '#173b49';
    roundRect(ctx, x + w * 0.68, y + h * 0.2, w * 0.24, h * 0.6, cell * 0.09);
    ctx.fill();
    ctx.fillStyle = 'rgba(174, 230, 242, 0.76)';
    roundRect(ctx, x + w * 0.74, y + h * 0.25, w * 0.13, h * 0.5, cell * 0.06);
    ctx.fill();
  } else {
    roundRect(ctx, x + w * 0.18, y + h * 0.07, w * 0.64, h * 0.56, cell * 0.08);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(1, cell * 0.018);
    for (let i = 1; i <= 3; i++) {
      const ribY = y + h * (0.1 + i * 0.12);
      ctx.beginPath();
      ctx.moveTo(x + w * 0.23, ribY);
      ctx.lineTo(x + w * 0.77, ribY);
      ctx.stroke();
    }
    ctx.fillStyle = '#173b49';
    roundRect(ctx, x + w * 0.2, y + h * 0.68, w * 0.6, h * 0.24, cell * 0.09);
    ctx.fill();
    ctx.fillStyle = 'rgba(174, 230, 242, 0.76)';
    roundRect(ctx, x + w * 0.25, y + h * 0.74, w * 0.5, h * 0.13, cell * 0.06);
    ctx.fill();
  }
}

function drawLights(
  ctx: CanvasRenderingContext2D,
  vehicle: BlockState,
  x: number,
  y: number,
  w: number,
  h: number,
  cell: number,
): void {
  const light = Math.max(3, cell * 0.085);
  ctx.fillStyle = '#fff0a6';
  if (vehicle.axis === 'H') {
    roundRect(ctx, x + w - light * 0.78, y + h * 0.17, light * 0.55, light * 0.7, light * 0.2);
    ctx.fill();
    roundRect(ctx, x + w - light * 0.78, y + h * 0.83 - light * 0.7, light * 0.55, light * 0.7, light * 0.2);
    ctx.fill();
    ctx.fillStyle = '#ff5f66';
    roundRect(ctx, x + light * 0.22, y + h * 0.18, light * 0.4, light * 0.65, light * 0.15);
    ctx.fill();
    roundRect(ctx, x + light * 0.22, y + h * 0.82 - light * 0.65, light * 0.4, light * 0.65, light * 0.15);
    ctx.fill();
  } else {
    roundRect(ctx, x + w * 0.17, y + h - light * 0.78, light * 0.7, light * 0.55, light * 0.2);
    ctx.fill();
    roundRect(ctx, x + w * 0.83 - light * 0.7, y + h - light * 0.78, light * 0.7, light * 0.55, light * 0.2);
    ctx.fill();
    ctx.fillStyle = '#ff5f66';
    roundRect(ctx, x + w * 0.18, y + light * 0.22, light * 0.65, light * 0.4, light * 0.15);
    ctx.fill();
    roundRect(ctx, x + w * 0.82 - light * 0.65, y + light * 0.22, light * 0.65, light * 0.4, light * 0.15);
    ctx.fill();
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
    const block = board.blocks[i]!;
    for (const [x, y] of blockCells(block)) {
      if (x === gx && y === gy) return block.id;
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
  if (w <= 0 || h <= 0) return;
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
  const number = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, Math.round(((number >> 16) & 255) * factor)));
  const g = Math.min(255, Math.max(0, Math.round(((number >> 8) & 255) * factor)));
  const b = Math.min(255, Math.max(0, Math.round((number & 255) * factor)));
  return `rgb(${r},${g},${b})`;
}

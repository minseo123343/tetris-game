import {
  BOARD_COLS,
  BOARD_ROWS,
  BUFFER_ROWS,
  TETROMINO_COLORS,
  TETROMINO_SHAPES,
} from './tetrisConstants';
import { Board, FloatingText, Particle, Piece } from '../types/tetris';

export function renderBlock(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  alpha: number = 1.0,
  isGhost: boolean = false
) {
  ctx.save();
  ctx.globalAlpha = alpha;

  if (isGhost) {
    // Ghost piece: neon outline with hollow interior
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.strokeRect(x + 2, y + 2, size - 4, size - 4);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.15;
    ctx.fillRect(x + 2, y + 2, size - 4, size - 4);
    ctx.restore();
    return;
  }

  const radius = Math.max(2, Math.floor(size * 0.12));
  const innerPad = Math.max(2, Math.floor(size * 0.12));

  // Base background
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, size - 2, size - 2, radius);
  ctx.fill();

  // Top/Left bevel highlight
  const highlightGrad = ctx.createLinearGradient(x, y, x, y + size);
  highlightGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  highlightGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)');
  ctx.fillStyle = highlightGrad;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, size - 2, (size - 2) * 0.5, [radius, radius, 0, 0]);
  ctx.fill();

  // Bottom/Right bevel shadow
  const shadowGrad = ctx.createLinearGradient(x, y + size * 0.5, x, y + size);
  shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
  shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = shadowGrad;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + size * 0.5, size - 2, (size - 2) * 0.5, [0, 0, radius, radius]);
  ctx.fill();

  // Inner glossy center gem
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.roundRect(x + innerPad, y + innerPad, size - innerPad * 2, size - innerPad * 2, Math.max(1, radius - 1));
  ctx.fill();

  ctx.restore();
}

export function drawBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  cellSize: number,
  clearingLines: number[] = [],
  clearFlashAlpha: number = 0
) {
  const width = BOARD_COLS * cellSize;
  const height = BOARD_ROWS * cellSize;

  // Clear playfield background
  ctx.fillStyle = '#090d16'; // Deep arcade slate navy
  ctx.fillRect(0, 0, width, height);

  // Subtle interior grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let c = 1; c < BOARD_COLS; c++) {
    const x = c * cellSize;
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, height);
  }
  for (let r = 1; r < BOARD_ROWS; r++) {
    const y = r * cellSize;
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(width, y + 0.5);
  }
  ctx.stroke();

  // Draw placed cells (excluding hidden buffer rows 0 and 1)
  for (let r = BUFFER_ROWS; r < board.length; r++) {
    const displayY = (r - BUFFER_ROWS) * cellSize;
    const isClearing = clearingLines.includes(r);

    for (let c = 0; c < BOARD_COLS; c++) {
      const cell = board[r][c];
      if (cell) {
        const displayX = c * cellSize;
        if (isClearing) {
          // Line clear flash: brilliant white / glow overlay
          renderBlock(ctx, displayX, displayY, cellSize, '#ffffff', 0.95);
        } else {
          renderBlock(ctx, displayX, displayY, cellSize, cell.color);
        }
      }
    }
  }

  // Draw line clearing overlay horizontal laser flash
  if (clearingLines.length > 0 && clearFlashAlpha > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${clearFlashAlpha * 0.85})`;
    for (const r of clearingLines) {
      const displayY = (r - BUFFER_ROWS) * cellSize;
      ctx.fillRect(0, displayY, width, cellSize);
    }
    ctx.restore();
  }
}

export function drawGhostPiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  ghostY: number,
  cellSize: number
) {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  const colorDef = TETROMINO_COLORS[piece.type];

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardY = ghostY + r;
        const boardX = piece.x + c;

        // Only draw if within visible board
        if (boardY >= BUFFER_ROWS && boardY < BUFFER_ROWS + BOARD_ROWS) {
          const displayX = boardX * cellSize;
          const displayY = (boardY - BUFFER_ROWS) * cellSize;
          renderBlock(ctx, displayX, displayY, cellSize, colorDef.primary, 0.65, true);
        }
      }
    }
  }
}

export function drawActivePiece(
  ctx: CanvasRenderingContext2D,
  piece: Piece,
  cellSize: number
) {
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];
  const colorDef = TETROMINO_COLORS[piece.type];

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardY = piece.y + r;
        const boardX = piece.x + c;

        if (boardY >= BUFFER_ROWS && boardY < BUFFER_ROWS + BOARD_ROWS) {
          const displayX = boardX * cellSize;
          const displayY = (boardY - BUFFER_ROWS) * cellSize;
          renderBlock(ctx, displayX, displayY, cellSize, colorDef.primary);
        }
      }
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  ctx.save();
  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, texts: FloatingText[]) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const ft of texts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, ft.alpha);
    ctx.font = `800 ${Math.round(20 * ft.scale)}px 'Outfit', sans-serif`;

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillText(ft.text, ft.x + 1.5, ft.y + 1.5);

    // Glow outline
    ctx.strokeStyle = ft.color;
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);

    // Fill
    ctx.fillStyle = '#ffffff';
    ctx.fillText(ft.text, ft.x, ft.y);
    ctx.restore();
  }
  ctx.restore();
}

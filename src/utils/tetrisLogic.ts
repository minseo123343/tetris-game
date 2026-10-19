import {
  BOARD_COLS,
  BOARD_ROWS,
  BUFFER_ROWS,
  TOTAL_ROWS,
  TETROMINO_SHAPES,
  WALL_KICKS_JLSTZ,
  WALL_KICKS_I,
} from './tetrisConstants';
import { Board, Cell, Piece, TetrominoType } from '../types/tetris';

// Create an empty board (22 rows x 10 cols)
export function createEmptyBoard(): Board {
  return Array.from({ length: TOTAL_ROWS }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );
}

// 7-Bag Randomizer
export function generateBag(): TetrominoType[] {
  const pieces: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
  // Fisher-Yates shuffle
  for (let i = pieces.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
  }
  return pieces;
}

// Spawn coordinates for each tetromino
export function getSpawnPosition(type: TetrominoType): { x: number; y: number } {
  switch (type) {
    case 'O':
      return { x: 4, y: 1 };
    case 'I':
      return { x: 3, y: 0 };
    default:
      return { x: 3, y: 1 };
  }
}

export function createNewPiece(type: TetrominoType): Piece {
  const spawn = getSpawnPosition(type);
  return {
    type,
    x: spawn.x,
    y: spawn.y,
    rotation: 0,
  };
}

// Check if piece collision occurs
export function checkCollision(
  piece: Piece,
  board: Board,
  offsetX: number = 0,
  offsetY: number = 0,
  targetRotation: number = piece.rotation
): boolean {
  const shape = TETROMINO_SHAPES[piece.type][targetRotation];
  const targetX = piece.x + offsetX;
  const targetY = piece.y + offsetY;

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardX = targetX + c;
        const boardY = targetY + r;

        // Check horizontal bounds
        if (boardX < 0 || boardX >= BOARD_COLS) {
          return true;
        }

        // Check bottom bound
        if (boardY >= TOTAL_ROWS) {
          return true;
        }

        // Check board occupied cells (ignore above board)
        if (boardY >= 0 && board[boardY][boardX] !== null) {
          return true;
        }
      }
    }
  }

  return false;
}

// Calculate ghost piece (where the current piece would land)
export function getGhostPieceY(piece: Piece, board: Board): number {
  let dropY = piece.y;
  while (!checkCollision(piece, board, 0, dropY - piece.y + 1)) {
    dropY++;
  }
  return dropY;
}

// Super Rotation System (SRS) rotation attempt
export function tryRotate(
  piece: Piece,
  board: Board,
  direction: 'CW' | 'CCW'
): Piece | null {
  const currentRot = piece.rotation;
  const targetRot = direction === 'CW' ? (currentRot + 1) % 4 : (currentRot + 3) % 4;

  // O piece doesn't need wall kicks or real rotation
  if (piece.type === 'O') {
    return { ...piece, rotation: targetRot };
  }

  const kickKey = `${currentRot}->${targetRot}`;
  const kickTable = piece.type === 'I' ? WALL_KICKS_I : WALL_KICKS_JLSTZ;
  const kicks = kickTable[kickKey] || [[0, 0]];

  for (const [kx, ky] of kicks) {
    if (!checkCollision(piece, board, kx, ky, targetRot)) {
      return {
        ...piece,
        x: piece.x + kx,
        y: piece.y + ky,
        rotation: targetRot,
      };
    }
  }

  return null; // Rotation failed (blocked)
}

// Lock a piece into the board and return the new board
export function lockPiece(
  piece: Piece,
  board: Board,
  color: string
): Board {
  const newBoard = board.map((row) => [...row]);
  const shape = TETROMINO_SHAPES[piece.type][piece.rotation];

  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const boardX = piece.x + c;
        const boardY = piece.y + r;
        if (boardY >= 0 && boardY < TOTAL_ROWS && boardX >= 0 && boardX < BOARD_COLS) {
          newBoard[boardY][boardX] = {
            type: piece.type,
            color,
            lockedAt: Date.now(),
          };
        }
      }
    }
  }

  return newBoard;
}

// Detect full lines and return indices (visible 2 to 21)
export function findFullLines(board: Board): number[] {
  const fullLines: number[] = [];
  for (let r = 0; r < TOTAL_ROWS; r++) {
    if (board[r].every((cell) => cell !== null)) {
      fullLines.push(r);
    }
  }
  return fullLines;
}

// Clear specified lines from the board and add empty rows at the top
export function clearLines(board: Board, linesToClear: number[]): Board {
  if (linesToClear.length === 0) return board;

  const linesSet = new Set(linesToClear);
  const remainingRows = board.filter((_, index) => !linesSet.has(index));
  const newEmptyRows: (Cell | null)[][] = Array.from({ length: linesToClear.length }, () =>
    Array.from({ length: BOARD_COLS }, () => null)
  );

  return [...newEmptyRows, ...remainingRows];
}

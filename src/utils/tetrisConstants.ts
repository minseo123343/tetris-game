import { TetrominoType } from '../types/tetris';

export const BOARD_COLS = 10;
export const BOARD_ROWS = 20;
export const BUFFER_ROWS = 2; // Hidden buffer rows at top
export const TOTAL_ROWS = BOARD_ROWS + BUFFER_ROWS; // 22

// Tetromino colors with primary, highlight, shadow and glow
export interface TetrominoColorDef {
  primary: string;
  light: string;
  dark: string;
  glow: string;
}

export const TETROMINO_COLORS: Record<TetrominoType, TetrominoColorDef> = {
  I: {
    primary: '#06b6d4', // Cyan
    light: '#67e8f9',
    dark: '#0891b2',
    glow: 'rgba(6, 182, 212, 0.45)',
  },
  O: {
    primary: '#eab308', // Yellow
    light: '#fde047',
    dark: '#ca8a04',
    glow: 'rgba(234, 179, 8, 0.45)',
  },
  T: {
    primary: '#a855f7', // Purple
    light: '#d8b4fe',
    dark: '#9333ea',
    glow: 'rgba(168, 85, 247, 0.45)',
  },
  S: {
    primary: '#22c55e', // Green
    light: '#86efac',
    dark: '#16a34a',
    glow: 'rgba(34, 197, 94, 0.45)',
  },
  Z: {
    primary: '#ef4444', // Red
    light: '#fca5a5',
    dark: '#dc2626',
    glow: 'rgba(239, 68, 68, 0.45)',
  },
  J: {
    primary: '#3b82f6', // Blue
    light: '#93c5fd',
    dark: '#2563eb',
    glow: 'rgba(59, 130, 246, 0.45)',
  },
  L: {
    primary: '#f97316', // Orange
    light: '#fdba74',
    dark: '#ea580c',
    glow: 'rgba(249, 115, 22, 0.45)',
  },
};

// Tetromino matrices for 4 rotation states (0 = spawn, 1 = 90° CW, 2 = 180°, 3 = 270° CW)
export const TETROMINO_SHAPES: Record<TetrominoType, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

// Super Rotation System (SRS) Wall Kick Data
// Offsets are [dx, dy] where dy is positive downwards
export const WALL_KICKS_JLSTZ: Record<string, [number, number][]> = {
  '0->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '1->0': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '1->2': [[0, 0], [1, 0], [1, 1], [0, -2], [1, -2]],
  '2->1': [[0, 0], [-1, 0], [-1, -1], [0, 2], [-1, 2]],
  '2->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
  '3->2': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '3->0': [[0, 0], [-1, 0], [-1, 1], [0, -2], [-1, -2]],
  '0->3': [[0, 0], [1, 0], [1, -1], [0, 2], [1, 2]],
};

export const WALL_KICKS_I: Record<string, [number, number][]> = {
  '0->1': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '1->0': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '1->2': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
  '2->1': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '2->3': [[0, 0], [2, 0], [-1, 0], [2, -1], [-1, 2]],
  '3->2': [[0, 0], [-2, 0], [1, 0], [-2, 1], [1, -2]],
  '3->0': [[0, 0], [1, 0], [-2, 0], [1, 2], [-2, -1]],
  '0->3': [[0, 0], [-1, 0], [2, 0], [-1, -2], [2, 1]],
};

// Fall speed in milliseconds per level
export const LEVEL_SPEEDS: number[] = [
  800, // Level 1
  710, // Level 2
  620, // Level 3
  530, // Level 4
  440, // Level 5
  350, // Level 6
  260, // Level 7
  180, // Level 8
  120, // Level 9
  90,  // Level 10
  70,  // Level 11
  55,  // Level 12
  45,  // Level 13
  38,  // Level 14
  32,  // Level 15+
];

// Lock delay: 500ms before a piece on ground locks into place
export const LOCK_DELAY_MS = 500;
// Max number of move/rotate resets allowed before mandatory lock
export const MAX_LOCK_RESETS = 15;

// DAS (Delayed Auto Shift) and ARR (Auto Repeat Rate) in ms
export const DAS_DELAY_MS = 140;
export const ARR_INTERVAL_MS = 32;

// Soft drop speed in ms
export const SOFT_DROP_INTERVAL_MS = 35;

// Scoring Guidelines
export const SCORE_SINGLE = 100;
export const SCORE_DOUBLE = 300;
export const SCORE_TRIPLE = 500;
export const SCORE_TETRIS = 800;
export const SCORE_BACK_TO_BACK_TETRIS = 1200;
export const SCORE_SOFT_DROP_PER_CELL = 1;
export const SCORE_HARD_DROP_PER_CELL = 2;
export const SCORE_COMBO_BONUS = 50;

// Sprint Mode target lines
export const SPRINT_TARGET_LINES = 40;
// Ultra Mode target time (2 minutes = 120 seconds)
export const ULTRA_TARGET_SECONDS = 120;

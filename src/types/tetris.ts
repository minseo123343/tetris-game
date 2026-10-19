export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export type GameMode = 'marathon' | 'sprint' | 'ultra';

export type GameState = 'TITLE' | 'PLAYING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export interface Cell {
  type: TetrominoType;
  color: string;
  lockedAt?: number;
}

export type Board = (Cell | null)[][]; // 22 rows (2 hidden buffer, 20 visible) x 10 cols

export interface Piece {
  type: TetrominoType;
  x: number;
  y: number;
  rotation: number; // 0, 1, 2, 3
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  scale: number;
  alpha: number;
  createdAt: number;
}

export interface GameStats {
  score: number;
  lines: number;
  level: number;
  combo: number;
  maxCombo: number;
  singles: number;
  doubles: number;
  triples: number;
  tetrises: number;
  hardDrops: number;
  startTime: number;
  elapsedTime: number; // in seconds
  lastClearType: string | null;
}

export interface HighScoreRecord {
  marathonScore: number;
  marathonLines: number;
  sprintBestTime: number | null; // seconds
  ultraBestScore: number;
}

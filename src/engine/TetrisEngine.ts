import {
  BOARD_COLS,
  BOARD_ROWS,
  BUFFER_ROWS,
  TOTAL_ROWS,
  LEVEL_SPEEDS,
  LOCK_DELAY_MS,
  MAX_LOCK_RESETS,
  DAS_DELAY_MS,
  ARR_INTERVAL_MS,
  SOFT_DROP_INTERVAL_MS,
  SCORE_SINGLE,
  SCORE_DOUBLE,
  SCORE_TRIPLE,
  SCORE_TETRIS,
  SCORE_BACK_TO_BACK_TETRIS,
  SCORE_SOFT_DROP_PER_CELL,
  SCORE_HARD_DROP_PER_CELL,
  SCORE_COMBO_BONUS,
  SPRINT_TARGET_LINES,
  ULTRA_TARGET_SECONDS,
  TETROMINO_COLORS,
} from '../utils/tetrisConstants';
import {
  Board,
  Cell,
  FloatingText,
  GameMode,
  GameState,
  GameStats,
  Particle,
  Piece,
  TetrominoType,
} from '../types/tetris';
import {
  checkCollision,
  clearLines,
  createEmptyBoard,
  createNewPiece,
  findFullLines,
  generateBag,
  getGhostPieceY,
  lockPiece,
  tryRotate,
} from '../utils/tetrisLogic';
import {
  drawActivePiece,
  drawBoard,
  drawFloatingTexts,
  drawGhostPiece,
  drawParticles,
} from '../utils/canvasRenderer';
import { soundManager } from '../utils/sound';

export interface EngineCallbacks {
  onStateChange: (state: GameState) => void;
  onStatsUpdate: (stats: GameStats, hold: TetrominoType | null, canHold: boolean, nextQueue: TetrominoType[]) => void;
  onGameOver: (stats: GameStats, isVictory: boolean) => void;
}

export class TetrisEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: EngineCallbacks;

  // Game state
  public mode: GameMode = 'marathon';
  public state: GameState = 'TITLE';

  // Board & Pieces
  private board: Board = createEmptyBoard();
  private activePiece: Piece | null = null;
  private ghostY: number = 0;
  private holdPiece: TetrominoType | null = null;
  private canHold: boolean = true;
  private bag: TetrominoType[] = [];
  private nextQueue: TetrominoType[] = [];

  // Timers & Counters
  private fallTimer: number = 0;
  private lockTimer: number = 0;
  private lockResets: number = 0;
  private isTouchingGround: boolean = false;
  private clearingLines: number[] = [];
  private clearFlashTimer: number = 0;
  private hitStopTimer: number = 0;

  // DAS & ARR continuous horizontal shifting
  private dasTimer: number = 0;
  private arrTimer: number = 0;
  private dasDirection: 'left' | 'right' | null = null;

  // Soft drop active flag
  private isSoftDropping: boolean = false;
  private softDropTimer: number = 0;

  // Effects & Feedback
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];
  private nextFloatingTextId: number = 1;
  private shakeIntensity: number = 0;
  private shakeOffset: { x: number; y: number } = { x: 0, y: 0 };

  // Scoring & Stats
  private stats: GameStats = {
    score: 0,
    lines: 0,
    level: 1,
    combo: -1,
    maxCombo: 0,
    singles: 0,
    doubles: 0,
    triples: 0,
    tetrises: 0,
    hardDrops: 0,
    startTime: 0,
    elapsedTime: 0,
    lastClearType: null,
  };
  private backToBack: boolean = false;

  // Loop management
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private isDestroyed: boolean = false;

  // Input states
  private keysHeld: Set<string> = new Set();

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get 2D canvas context');
    this.ctx = context;
    this.callbacks = callbacks;

    this.bindEvents();
    this.startLoop();
  }

  private bindEvents() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.handleBlur);
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.handleBlur);
  }

  private handleBlur = () => {
    // Clear held keys on blur to prevent stuck infinite movements
    this.keysHeld.clear();
    this.dasDirection = null;
    this.isSoftDropping = false;
  };

  public startGame(mode: GameMode) {
    this.mode = mode;
    this.board = createEmptyBoard();
    this.holdPiece = null;
    this.canHold = true;
    this.bag = [];
    this.nextQueue = [];
    this.particles = [];
    this.floatingTexts = [];
    this.clearingLines = [];
    this.clearFlashTimer = 0;
    this.shakeIntensity = 0;
    this.shakeOffset = { x: 0, y: 0 };
    this.hitStopTimer = 0;
    this.backToBack = false;

    // Reset stats
    this.stats = {
      score: 0,
      lines: 0,
      level: 1,
      combo: -1,
      maxCombo: 0,
      singles: 0,
      doubles: 0,
      triples: 0,
      tetrises: 0,
      hardDrops: 0,
      startTime: performance.now(),
      elapsedTime: 0,
      lastClearType: null,
    };

    // Fill initial next queue (at least 7 pieces)
    this.replenishQueue();

    // Spawn first piece
    this.spawnNextPiece();

    this.state = 'PLAYING';
    this.callbacks.onStateChange('PLAYING');
    this.notifyStats();
  }

  public pauseGame() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.callbacks.onStateChange('PAUSED');
    }
  }

  public resumeGame() {
    if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.lastTime = performance.now();
      this.callbacks.onStateChange('PLAYING');
    }
  }

  private replenishQueue() {
    while (this.nextQueue.length < 7) {
      if (this.bag.length === 0) {
        this.bag = generateBag();
      }
      this.nextQueue.push(this.bag.pop()!);
    }
  }

  private spawnNextPiece(): boolean {
    this.replenishQueue();
    const nextType = this.nextQueue.shift()!;
    this.replenishQueue();

    this.activePiece = createNewPiece(nextType);
    this.canHold = true;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.fallTimer = 0;

    // Update ghost piece
    this.updateGhostY();

    // Check immediate collision at spawn -> Top Out (Game Over)
    if (checkCollision(this.activePiece, this.board)) {
      this.handleGameOver(false);
      return false;
    }

    this.notifyStats();
    return true;
  }

  private updateGhostY() {
    if (!this.activePiece) return;
    this.ghostY = getGhostPieceY(this.activePiece, this.board);
    this.isTouchingGround = this.activePiece.y === this.ghostY;
  }

  // Handle player inputs
  private handleKeyDown = (e: KeyboardEvent) => {
    // Only capture game controls if playing or paused
    if (this.state !== 'PLAYING') {
      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (this.state === 'PAUSED') {
          this.resumeGame();
        }
      }
      return;
    }

    if (e.code === 'Escape' || e.code === 'KeyP') {
      e.preventDefault();
      this.pauseGame();
      return;
    }

    // Ignore browser default scrolling for arrow keys, space
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (this.keysHeld.has(e.code)) return;
    this.keysHeld.add(e.code);

    switch (e.code) {
      case 'ArrowLeft':
      case 'KeyA':
        this.startMove('left');
        break;
      case 'ArrowRight':
      case 'KeyD':
        this.startMove('right');
        break;
      case 'ArrowUp':
      case 'KeyW':
      case 'KeyX':
        this.rotatePiece('CW');
        break;
      case 'KeyZ':
      case 'ControlLeft':
      case 'ControlRight':
        this.rotatePiece('CCW');
        break;
      case 'ArrowDown':
      case 'KeyS':
        this.startSoftDrop();
        break;
      case 'Space':
        this.hardDrop();
        break;
      case 'KeyC':
      case 'ShiftLeft':
      case 'ShiftRight':
        this.holdCurrentPiece();
        break;
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    this.keysHeld.delete(e.code);

    if (
      (e.code === 'ArrowLeft' || e.code === 'KeyA') &&
      this.dasDirection === 'left'
    ) {
      if (this.keysHeld.has('ArrowRight') || this.keysHeld.has('KeyD')) {
        this.startMove('right');
      } else {
        this.dasDirection = null;
      }
    } else if (
      (e.code === 'ArrowRight' || e.code === 'KeyD') &&
      this.dasDirection === 'right'
    ) {
      if (this.keysHeld.has('ArrowLeft') || this.keysHeld.has('KeyA')) {
        this.startMove('left');
      } else {
        this.dasDirection = null;
      }
    }

    if (
      (e.code === 'ArrowDown' || e.code === 'KeyS') &&
      !this.keysHeld.has('ArrowDown') &&
      !this.keysHeld.has('KeyS')
    ) {
      this.isSoftDropping = false;
    }
  };

  // Move left or right with DAS
  public startMove(dir: 'left' | 'right') {
    if (!this.activePiece || this.state !== 'PLAYING') return;

    this.dasDirection = dir;
    this.dasTimer = 0;
    this.arrTimer = 0;

    const dx = dir === 'left' ? -1 : 1;
    this.applyMove(dx);
  }

  public stopMove(dir?: 'left' | 'right') {
    if (!dir || this.dasDirection === dir) {
      this.dasDirection = null;
    }
  }

  private applyMove(dx: number): boolean {
    if (!this.activePiece) return false;

    if (!checkCollision(this.activePiece, this.board, dx, 0)) {
      this.activePiece.x += dx;
      this.onPieceManipulated();
      soundManager.playMove();
      return true;
    }
    return false;
  }

  // Rotate piece (CW or CCW) with SRS
  public rotatePiece(dir: 'CW' | 'CCW') {
    if (!this.activePiece || this.state !== 'PLAYING') return;

    const rotated = tryRotate(this.activePiece, this.board, dir);
    if (rotated) {
      this.activePiece = rotated;
      this.onPieceManipulated();
      soundManager.playRotate();
    }
  }

  public startSoftDrop() {
    this.isSoftDropping = true;
    this.softDropTimer = 0;
  }

  public stopSoftDrop() {
    this.isSoftDropping = false;
  }

  // Instant Hard drop
  public hardDrop() {
    if (!this.activePiece || this.state !== 'PLAYING') return;

    const dropDistance = this.ghostY - this.activePiece.y;
    this.activePiece.y = this.ghostY;
    this.stats.score += dropDistance * SCORE_HARD_DROP_PER_CELL;
    this.stats.hardDrops++;

    // Hitstop & Camera shake
    this.triggerScreenShake(dropDistance > 8 ? 6 : 4);
    this.hitStopTimer = 0.04; // 40ms simulation hitstop for impact punch!

    soundManager.playHardDrop();

    // Lock immediately
    this.lockActivePiece();
  }

  // Hold current piece
  public holdCurrentPiece() {
    if (!this.activePiece || !this.canHold || this.state !== 'PLAYING') return;

    const currentType = this.activePiece.type;

    if (this.holdPiece === null) {
      this.holdPiece = currentType;
      this.spawnNextPiece();
    } else {
      const swappedType = this.holdPiece;
      this.holdPiece = currentType;
      this.activePiece = createNewPiece(swappedType);
      this.updateGhostY();
    }

    this.canHold = false;
    soundManager.playHold();
    this.notifyStats();
  }

  private onPieceManipulated() {
    this.updateGhostY();
    // If piece was on ground, reset lock timer (up to limit)
    if (this.isTouchingGround && this.lockResets < MAX_LOCK_RESETS) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  private lockActivePiece() {
    if (!this.activePiece) return;

    const colorDef = TETROMINO_COLORS[this.activePiece.type];
    this.board = lockPiece(this.activePiece, this.board, colorDef.primary);
    this.activePiece = null;

    // Detect full lines
    const fullLines = findFullLines(this.board);

    if (fullLines.length > 0) {
      // Trigger line clearing phase
      this.clearingLines = fullLines;
      this.clearFlashTimer = 0.16; // 160ms flash animation
      this.hitStopTimer = fullLines.length === 4 ? 0.08 : 0.04;

      // Spawn particles & floating text
      this.spawnLineClearEffects(fullLines);

      // Play audio
      this.stats.combo++;
      if (this.stats.combo > this.stats.maxCombo) {
        this.stats.maxCombo = this.stats.combo;
      }
      soundManager.playLineClear(fullLines.length, this.stats.combo);
    } else {
      // Combo broken
      this.stats.combo = -1;
      this.spawnNextPiece();
    }

    this.notifyStats();
  }

  private spawnLineClearEffects(lines: number[]) {
    const cellSize = this.canvas.width / BOARD_COLS;
    const isTetris = lines.length === 4;

    // Shake camera on clear
    this.triggerScreenShake(isTetris ? 10 : 4 + lines.length * 1.5);

    // Spawn 24 glowing particles per cleared line
    for (const lineRow of lines) {
      const rowY = (lineRow - BUFFER_ROWS + 0.5) * cellSize;
      for (let i = 0; i < 24; i++) {
        const colX = (Math.random() * BOARD_COLS) * cellSize;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 180 + 60;
        this.particles.push({
          x: colX,
          y: rowY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          size: Math.random() * 3 + 2,
          color: isTetris ? '#38bdf8' : '#fde047',
          alpha: 1.0,
          life: 0,
          maxLife: Math.random() * 0.35 + 0.25,
        });
      }
    }

    // Floating text feedback
    const centerY = (lines[Math.floor(lines.length / 2)] - BUFFER_ROWS) * cellSize;
    let label = '';
    let textColor = '#ffffff';

    if (lines.length === 1) {
      label = 'SINGLE +100';
      textColor = '#93c5fd';
      this.stats.singles++;
    } else if (lines.length === 2) {
      label = 'DOUBLE +300';
      textColor = '#86efac';
      this.stats.doubles++;
    } else if (lines.length === 3) {
      label = 'TRIPLE +500';
      textColor = '#fdba74';
      this.stats.triples++;
    } else if (lines.length === 4) {
      const b2bText = this.backToBack ? 'B2B TETRIS!' : 'TETRIS!';
      label = `${b2bText} +${this.backToBack ? SCORE_BACK_TO_BACK_TETRIS : SCORE_TETRIS}`;
      textColor = '#38bdf8';
      this.stats.tetrises++;
      this.backToBack = true;
    }

    if (lines.length < 4) {
      this.backToBack = false;
    }

    this.floatingTexts.push({
      id: this.nextFloatingTextId++,
      text: label,
      x: this.canvas.width / 2,
      y: Math.max(40, centerY),
      color: textColor,
      scale: isTetris ? 1.4 : 1.1,
      alpha: 1.0,
      createdAt: performance.now(),
    });

    if (this.stats.combo > 0) {
      this.floatingTexts.push({
        id: this.nextFloatingTextId++,
        text: `${this.stats.combo} COMBO!`,
        x: this.canvas.width / 2,
        y: Math.max(70, centerY + 28),
        color: '#f59e0b',
        scale: 1.05,
        alpha: 1.0,
        createdAt: performance.now(),
      });
    }

    // Calculate score points
    let points = 0;
    const lvl = this.stats.level;
    if (lines.length === 1) points = SCORE_SINGLE * lvl;
    else if (lines.length === 2) points = SCORE_DOUBLE * lvl;
    else if (lines.length === 3) points = SCORE_TRIPLE * lvl;
    else if (lines.length === 4) {
      points = (this.backToBack ? SCORE_BACK_TO_BACK_TETRIS : SCORE_TETRIS) * lvl;
    }

    if (this.stats.combo > 0) {
      points += SCORE_COMBO_BONUS * this.stats.combo * lvl;
    }

    this.stats.score += points;
    this.stats.lines += lines.length;
    this.stats.lastClearType = label;

    // Check level progression (every 10 lines in Marathon mode)
    const newLevel = Math.min(15, Math.floor(this.stats.lines / 10) + 1);
    if (newLevel > this.stats.level) {
      this.stats.level = newLevel;
      soundManager.playLevelUp();
      this.floatingTexts.push({
        id: this.nextFloatingTextId++,
        text: `LEVEL UP! Lv.${newLevel}`,
        x: this.canvas.width / 2,
        y: 120,
        color: '#a855f7',
        scale: 1.3,
        alpha: 1.0,
        createdAt: performance.now(),
      });
    }

    // Check Sprint victory condition (40 lines)
    if (this.mode === 'sprint' && this.stats.lines >= SPRINT_TARGET_LINES) {
      this.handleGameOver(true);
    }
  }

  private triggerScreenShake(amount: number) {
    this.shakeIntensity = Math.min(this.shakeIntensity + amount, 14);
  }

  private handleGameOver(isVictory: boolean) {
    this.state = isVictory ? 'VICTORY' : 'GAME_OVER';
    if (isVictory) {
      soundManager.playVictory();
    } else {
      soundManager.playGameOver();
    }
    this.callbacks.onGameOver(this.stats, isVictory);
  }

  private notifyStats() {
    this.callbacks.onStatsUpdate(
      { ...this.stats },
      this.holdPiece,
      this.canHold,
      [...this.nextQueue]
    );
  }

  // Main 60fps simulation loop
  private startLoop() {
    this.lastTime = performance.now();

    const frame = (time: number) => {
      if (this.isDestroyed) return;

      const rawDt = (time - this.lastTime) / 1000;
      this.lastTime = time;
      // Clamp frame delta time as requested in game craft guidelines
      const dt = Math.min(rawDt, 0.05);

      this.update(dt);
      this.render();

      this.animFrameId = requestAnimationFrame(frame);
    };

    this.animFrameId = requestAnimationFrame(frame);
  }

  private update(dt: number) {
    // Decay camera shake smoothly
    if (this.shakeIntensity > 0) {
      this.shakeIntensity = Math.max(0, this.shakeIntensity - dt * 25);
      const angle = Math.random() * Math.PI * 2;
      this.shakeOffset = {
        x: Math.cos(angle) * this.shakeIntensity,
        y: Math.sin(angle) * this.shakeIntensity,
      };
    } else {
      this.shakeOffset = { x: 0, y: 0 };
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 380 * dt; // gravity
      p.alpha = 1 - p.life / p.maxLife;
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 35 * dt; // Float upwards
      ft.alpha -= 1.1 * dt; // Fade out
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    if (this.state !== 'PLAYING') return;

    // Simulation hitstop check
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= dt;
      return;
    }

    // Track elapsed time
    this.stats.elapsedTime += dt;

    // Check Ultra mode time limit (120 seconds)
    if (this.mode === 'ultra' && this.stats.elapsedTime >= ULTRA_TARGET_SECONDS) {
      this.handleGameOver(true);
      return;
    }

    // Line clear flash delay
    if (this.clearFlashTimer > 0) {
      this.clearFlashTimer -= dt;
      if (this.clearFlashTimer <= 0) {
        // Complete clearing the lines
        this.board = clearLines(this.board, this.clearingLines);
        this.clearingLines = [];
        this.spawnNextPiece();
      }
      return;
    }

    // Update DAS & ARR
    if (this.dasDirection) {
      this.dasTimer += dt * 1000;
      if (this.dasTimer >= DAS_DELAY_MS) {
        this.arrTimer += dt * 1000;
        if (this.arrTimer >= ARR_INTERVAL_MS) {
          this.arrTimer = 0;
          const dx = this.dasDirection === 'left' ? -1 : 1;
          this.applyMove(dx);
        }
      }
    }

    if (!this.activePiece) return;

    // Determine current fall speed
    const baseSpeed = LEVEL_SPEEDS[Math.min(this.stats.level - 1, LEVEL_SPEEDS.length - 1)];
    const fallInterval = this.isSoftDropping
      ? Math.min(SOFT_DROP_INTERVAL_MS, baseSpeed * 0.15)
      : baseSpeed;

    this.fallTimer += dt * 1000;

    if (this.fallTimer >= fallInterval) {
      this.fallTimer = 0;

      // Attempt to move piece down 1 cell
      if (!checkCollision(this.activePiece, this.board, 0, 1)) {
        this.activePiece.y += 1;
        this.updateGhostY();
        if (this.isSoftDropping) {
          this.stats.score += SCORE_SOFT_DROP_PER_CELL;
          soundManager.playSoftDrop();
        }
      } else {
        this.isTouchingGround = true;
      }
    }

    // Lock delay handling when touching ground
    if (this.isTouchingGround) {
      this.lockTimer += dt * 1000;
      if (this.lockTimer >= LOCK_DELAY_MS) {
        this.lockActivePiece();
      }
    } else {
      this.lockTimer = 0;
    }
  }

  private render() {
    const cellSize = this.canvas.width / BOARD_COLS;

    this.ctx.save();
    // Apply camera shake transform
    this.ctx.translate(this.shakeOffset.x, this.shakeOffset.y);

    // Draw board & placed cells
    const flashAlpha = this.clearFlashTimer > 0 ? this.clearFlashTimer / 0.16 : 0;
    drawBoard(this.ctx, this.board, cellSize, this.clearingLines, flashAlpha);

    // Draw ghost piece & active piece if playing
    if (this.activePiece && this.state === 'PLAYING') {
      drawGhostPiece(this.ctx, this.activePiece, this.ghostY, cellSize);
      drawActivePiece(this.ctx, this.activePiece, cellSize);
    }

    // Draw line clear particles
    if (this.particles.length > 0) {
      drawParticles(this.ctx, this.particles);
    }

    // Draw floating floating texts
    if (this.floatingTexts.length > 0) {
      drawFloatingTexts(this.ctx, this.floatingTexts);
    }

    this.ctx.restore();
  }
}

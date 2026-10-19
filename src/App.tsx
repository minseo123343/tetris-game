import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Pause,
  RotateCcw,
  Sparkles,
  Smartphone,
  Trophy,
} from 'lucide-react';
import {
  GameMode,
  GameState,
  GameStats,
  HighScoreRecord,
  TetrominoType,
} from './types/tetris';
import { TetrisEngine } from './engine/TetrisEngine';
import { TitleScreen } from './components/TitleScreen';
import { PiecePreview } from './components/PiecePreview';
import { TouchControls } from './components/TouchControls';
import { PauseModal } from './components/PauseModal';
import { GameOverModal } from './components/GameOverModal';
import { soundManager } from './utils/sound';
import { SPRINT_TARGET_LINES, ULTRA_TARGET_SECONDS } from './utils/tetrisConstants';

const HIGH_SCORE_KEY = 'tetris_arcade_high_scores_v1';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<TetrisEngine | null>(null);

  // High scores state
  const [highScores, setHighScores] = useState<HighScoreRecord>(() => {
    try {
      const stored = localStorage.getItem(HIGH_SCORE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {}
    return {
      marathonScore: 0,
      marathonLines: 0,
      sprintBestTime: null,
      ultraBestScore: 0,
    };
  });

  // Game UI States
  const [gameState, setGameState] = useState<GameState>('TITLE');
  const [gameMode, setGameMode] = useState<GameMode>('marathon');
  const [holdPiece, setHoldPiece] = useState<TetrominoType | null>(null);
  const [canHold, setCanHold] = useState<boolean>(true);
  const [nextQueue, setNextQueue] = useState<TetrominoType[]>([]);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [isNewRecord, setIsNewRecord] = useState<boolean>(false);

  // Audio toggles state
  const [sfxMuted, setSfxMuted] = useState<boolean>(() => soundManager.getSfxMuted());
  const [bgmMuted, setBgmMuted] = useState<boolean>(() => soundManager.getBgmMuted());

  // Show touch controls toggle (default true on touch/mobile)
  const [showTouchControls, setShowTouchControls] = useState<boolean>(() => {
    return (
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    );
  });

  // Current stats synced from engine
  const [stats, setStats] = useState<GameStats>({
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
  });

  // Handle Game Over / Record Check
  const handleGameOver = useCallback((finalStats: GameStats, victory: boolean) => {
    setIsVictory(victory);
    setGameState(victory ? 'VICTORY' : 'GAME_OVER');

    setHighScores((prev) => {
      let updated = false;
      const nextScores = { ...prev };

      if (gameMode === 'marathon') {
        if (finalStats.score > prev.marathonScore) {
          nextScores.marathonScore = finalStats.score;
          nextScores.marathonLines = Math.max(prev.marathonLines, finalStats.lines);
          updated = true;
        }
      } else if (gameMode === 'sprint' && victory) {
        if (prev.sprintBestTime === null || finalStats.elapsedTime < prev.sprintBestTime) {
          nextScores.sprintBestTime = finalStats.elapsedTime;
          updated = true;
        }
      } else if (gameMode === 'ultra') {
        if (finalStats.score > prev.ultraBestScore) {
          nextScores.ultraBestScore = finalStats.score;
          updated = true;
        }
      }

      if (updated) {
        setIsNewRecord(true);
        try {
          localStorage.setItem(HIGH_SCORE_KEY, JSON.stringify(nextScores));
        } catch {}
      } else {
        setIsNewRecord(false);
      }

      return nextScores;
    });
  }, [gameMode]);

  // Initialize engine once canvas mounts
  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new TetrisEngine(canvasRef.current, {
      onStateChange: (newState) => {
        setGameState(newState);
      },
      onStatsUpdate: (newStats, hold, holdable, queue) => {
        setStats(newStats);
        setHoldPiece(hold);
        setCanHold(holdable);
        setNextQueue(queue);
      },
      onGameOver: (finalStats, victory) => {
        handleGameOver(finalStats, victory);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [handleGameOver]);

  // Start new game
  const handleStartGame = (mode: GameMode) => {
    setGameMode(mode);
    setIsNewRecord(false);
    setIsVictory(false);
    if (engineRef.current) {
      engineRef.current.startGame(mode);
    }
  };

  // Pause & Resume
  const handlePause = () => {
    if (engineRef.current && gameState === 'PLAYING') {
      engineRef.current.pauseGame();
    }
  };

  const handleResume = () => {
    if (engineRef.current && gameState === 'PAUSED') {
      engineRef.current.resumeGame();
    }
  };

  const handleRestart = () => {
    if (engineRef.current) {
      engineRef.current.startGame(gameMode);
    }
  };

  const handleQuitToTitle = () => {
    if (engineRef.current) {
      engineRef.current.state = 'TITLE';
    }
    setGameState('TITLE');
  };

  // Audio toggles
  const handleToggleSfx = () => {
    const nextVal = soundManager.toggleSfx();
    setSfxMuted(nextVal);
  };

  const handleToggleBgm = () => {
    const nextVal = soundManager.toggleBgm();
    setBgmMuted(nextVal);
  };

  // Remaining time in Ultra mode
  const ultraTimeRemaining = Math.max(0, ULTRA_TARGET_SECONDS - stats.elapsedTime);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 text-slate-100 flex flex-col items-center justify-between font-['Outfit',sans-serif]">
      {/* Title Screen View */}
      {gameState === 'TITLE' && (
        <TitleScreen
          onStartGame={handleStartGame}
          highScores={highScores}
          sfxMuted={sfxMuted}
          bgmMuted={bgmMuted}
          onToggleSfx={handleToggleSfx}
          onToggleBgm={handleToggleBgm}
        />
      )}

      {/* Active Game Shell (Playing, Paused, Game Over) */}
      <div
        className={`relative w-full h-full flex flex-col items-center justify-between ${
          gameState === 'TITLE' ? 'hidden' : 'flex'
        }`}
      >
        {/* Top Minimal Perimeter Header */}
        <header className="w-full max-w-4xl px-4 py-2 flex items-center justify-between border-b border-slate-800/80 shrink-0 z-10">
          <div className="flex items-center gap-3">
            <span className="text-base font-black tracking-wider text-cyan-400">
              TETRIS
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs font-mono uppercase text-slate-400">
              {gameMode === 'marathon'
                ? '마라톤'
                : gameMode === 'sprint'
                ? '40줄 스프린트'
                : '2분 울트라'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowTouchControls((prev) => !prev)}
              className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center gap-1 sm:hidden ${
                showTouchControls
                  ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title="가상 터치 버튼 토글"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleToggleBgm}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                !bgmMuted
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="BGM 토글"
            >
              <Music className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToggleSfx}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                !sfxMuted
                  ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
              title="SFX 토글"
            >
              {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handlePause}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-colors"
              title="일시정지 (Esc)"
            >
              <Pause className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Center Playing Field & Perimeter Clusters */}
        <main className="relative flex-1 w-full max-w-4xl flex items-center justify-center gap-3 sm:gap-6 px-2 py-1 min-h-0">
          {/* Left Perimeter Cluster: HOLD & High Score */}
          <aside className="hidden sm:flex flex-col items-center justify-between h-[520px] w-28 shrink-0 py-2 select-none">
            <div className="flex flex-col items-center w-full">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                홀드 (HOLD)
              </span>
              <PiecePreview type={holdPiece} disabled={!canHold} size={16} />
              <span className="text-[10px] font-mono text-slate-500 mt-1">
                KEY: C / SHIFT
              </span>
            </div>

            <div className="flex flex-col items-center w-full p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Trophy className="w-3 h-3 text-amber-400" /> 최고 기록
              </span>
              <span className="text-sm font-bold font-mono text-amber-300 tabular-nums mt-0.5">
                {gameMode === 'marathon' && highScores.marathonScore.toLocaleString()}
                {gameMode === 'sprint' &&
                  (highScores.sprintBestTime !== null
                    ? `${highScores.sprintBestTime.toFixed(1)}s`
                    : '-')}
                {gameMode === 'ultra' && highScores.ultraBestScore.toLocaleString()}
              </span>
            </div>
          </aside>

          {/* Primary Canvas Container (Isolated 60fps playfield) */}
          <div className="relative flex flex-col items-center justify-center shrink-0">
            {/* Mobile Top Bar (Hold & Next miniature preview for small screens) */}
            <div className="flex items-center justify-between w-full sm:hidden px-1 mb-1 text-[11px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">HOLD:</span>
                <span className="text-amber-300 font-bold">{holdPiece || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500">SCORE:</span>
                <span className="text-cyan-400 font-bold tabular-nums">{stats.score}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">NEXT:</span>
                <span className="text-purple-300 font-bold">{nextQueue[0] || '-'}</span>
              </div>
            </div>

            {/* Glowing frame around canvas */}
            <div className="relative rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-[0_0_35px_rgba(6,182,212,0.18)] bg-slate-950">
              <canvas
                ref={canvasRef}
                width={300}
                height={600}
                className="block w-[240px] h-[480px] xs:w-[270px] xs:h-[540px] sm:w-[300px] sm:h-[600px] max-h-[68vh] aspect-[1/2]"
              />

              {/* In-play Combo Floating Badge */}
              {stats.combo > 0 && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-500/90 text-slate-950 text-xs font-black font-mono shadow-lg animate-pulse pointer-events-none">
                  COMBO x{stats.combo}
                </div>
              )}
            </div>
          </div>

          {/* Right Perimeter Cluster: NEXT Queue & HUD Metrics */}
          <aside className="hidden sm:flex flex-col items-center justify-between h-[520px] w-32 shrink-0 py-2 select-none">
            {/* NEXT Pieces Queue */}
            <div className="flex flex-col items-center w-full">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">
                다음 (NEXT)
              </span>
              <div className="flex flex-col gap-1.5">
                <PiecePreview type={nextQueue[0] || null} size={15} />
                <PiecePreview type={nextQueue[1] || null} size={13} />
                <PiecePreview type={nextQueue[2] || null} size={13} />
              </div>
            </div>

            {/* Score & Lines & Level Box */}
            <div className="w-full flex flex-col gap-2 p-3 rounded-xl bg-slate-900/70 border border-slate-800/90">
              <div>
                <span className="text-[10px] font-mono text-slate-500 block">점수 SCORE</span>
                <span className="text-lg font-extrabold font-mono text-cyan-400 tabular-nums block">
                  {stats.score.toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1 border-t border-slate-800 pt-1.5">
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block">
                    {gameMode === 'sprint' ? '남은 줄' : '클리어'}
                  </span>
                  <span className="text-xs font-bold font-mono text-slate-200 tabular-nums">
                    {gameMode === 'sprint'
                      ? Math.max(0, SPRINT_TARGET_LINES - stats.lines)
                      : stats.lines}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] font-mono text-slate-500 block">레벨</span>
                  <span className="text-xs font-bold font-mono text-purple-300 tabular-nums">
                    Lv.{stats.level}
                  </span>
                </div>
              </div>

              {/* Time display for Sprint / Ultra */}
              {(gameMode === 'sprint' || gameMode === 'ultra') && (
                <div className="border-t border-slate-800 pt-1.5">
                  <span className="text-[9px] font-mono text-slate-500 block">
                    {gameMode === 'ultra' ? '남은 시간' : '소요 시간'}
                  </span>
                  <span className="text-xs font-bold font-mono text-amber-300 tabular-nums">
                    {gameMode === 'ultra'
                      ? `${ultraTimeRemaining.toFixed(1)}s`
                      : `${stats.elapsedTime.toFixed(1)}s`}
                  </span>
                </div>
              )}
            </div>
          </aside>
        </main>

        {/* Touch Controls for Mobile/Tablet */}
        {showTouchControls && gameState === 'PLAYING' && (
          <div className="w-full shrink-0 z-20">
            <TouchControls
              onMoveLeft={() => engineRef.current?.startMove('left')}
              onMoveRight={() => engineRef.current?.startMove('right')}
              onRotateCW={() => engineRef.current?.rotatePiece('CW')}
              onRotateCCW={() => engineRef.current?.rotatePiece('CCW')}
              onSoftDropStart={() => engineRef.current?.startSoftDrop()}
              onSoftDropEnd={() => engineRef.current?.stopSoftDrop()}
              onHardDrop={() => engineRef.current?.hardDrop()}
              onHold={() => engineRef.current?.holdCurrentPiece()}
            />
          </div>
        )}
      </div>

      {/* Paused Modal */}
      {gameState === 'PAUSED' && (
        <PauseModal
          onResume={handleResume}
          onRestart={handleRestart}
          onQuit={handleQuitToTitle}
          sfxMuted={sfxMuted}
          bgmMuted={bgmMuted}
          onToggleSfx={handleToggleSfx}
          onToggleBgm={handleToggleBgm}
        />
      )}

      {/* Game Over or Victory Modal */}
      {(gameState === 'GAME_OVER' || gameState === 'VICTORY') && (
        <GameOverModal
          mode={gameMode}
          isVictory={isVictory}
          stats={stats}
          isNewRecord={isNewRecord}
          onRestart={handleRestart}
          onQuit={handleQuitToTitle}
        />
      )}
    </div>
  );
}

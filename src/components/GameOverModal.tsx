import React from 'react';
import { RotateCcw, Home, Trophy, Award, Zap, Clock } from 'lucide-react';
import { GameMode, GameStats } from '../types/tetris';

interface GameOverModalProps {
  mode: GameMode;
  isVictory: boolean;
  stats: GameStats;
  isNewRecord: boolean;
  onRestart: () => void;
  onQuit: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  mode,
  isVictory,
  stats,
  isNewRecord,
  onRestart,
  onQuit,
}) => {
  // Tetris rate calculation: percentage of lines cleared that came from 4-line Tetrises
  const tetrisLines = stats.tetrises * 4;
  const tetrisRate = stats.lines > 0 ? Math.round((tetrisLines / stats.lines) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Title & Badge */}
        <div className="mb-4">
          {isVictory ? (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono mb-2">
              <Trophy className="w-3.5 h-3.5" />
              <span>미션 클리어 (VICTORY)</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-mono mb-2">
              <span>게임 오버 (GAME OVER)</span>
            </div>
          )}

          <h2 className="text-3xl font-black tracking-tight text-white">
            {isVictory ? '승리 달성!' : '블록 누적'}
          </h2>

          {isNewRecord && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-400 text-amber-300 text-xs font-bold animate-bounce">
              <Award className="w-4 h-4" />
              <span>새로운 최고 기록 달성!</span>
            </div>
          )}
        </div>

        {/* Primary highlight stat */}
        <div className="w-full p-4 rounded-xl bg-slate-950/70 border border-slate-800 mb-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            {mode === 'sprint' ? '클리어 소요 시간 (TIME)' : '최종 점수 (FINAL SCORE)'}
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-400 tabular-nums">
            {mode === 'sprint'
              ? `${stats.elapsedTime.toFixed(2)}초`
              : stats.score.toLocaleString()}
          </div>
        </div>

        {/* Detailed Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 w-full mb-6 text-left">
          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-mono text-slate-400 block">클리어한 줄 (LINES)</span>
            <span className="text-base font-bold font-mono text-slate-100 tabular-nums">
              {stats.lines}줄
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-mono text-slate-400 block">테트리스 비율 (TETRIS %)</span>
            <span className="text-base font-bold font-mono text-indigo-300 tabular-nums">
              {tetrisRate}% ({stats.tetrises}회)
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-mono text-slate-400 block">최대 콤보 (MAX COMBO)</span>
            <span className="text-base font-bold font-mono text-amber-300 tabular-nums">
              {stats.maxCombo > 0 ? `${stats.maxCombo} Combo` : '-'}
            </span>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
            <span className="text-[10px] font-mono text-slate-400 block">플레이 시간 (PLAY TIME)</span>
            <span className="text-base font-bold font-mono text-slate-200 tabular-nums">
              {Math.floor(stats.elapsedTime / 60)}분 {Math.floor(stats.elapsedTime % 60)}초
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={onRestart}
            className="w-full py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4 fill-slate-950" />
            <span>다시 플레이 (Play Again)</span>
          </button>

          <button
            type="button"
            onClick={onQuit}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>메인 메뉴로 (Title Menu)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

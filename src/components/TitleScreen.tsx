import React, { useEffect, useState } from 'react';
import { Play, Volume2, VolumeX, Music, Trophy, Zap, Clock, Shield } from 'lucide-react';
import { GameMode, HighScoreRecord } from '../types/tetris';
import { soundManager } from '../utils/sound';

interface TitleScreenProps {
  onStartGame: (mode: GameMode) => void;
  highScores: HighScoreRecord;
  sfxMuted: boolean;
  bgmMuted: boolean;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  onStartGame,
  highScores,
  sfxMuted,
  bgmMuted,
  onToggleSfx,
  onToggleBgm,
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>('marathon');

  // Keyboard shortcut to start game with Enter or Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        onStartGame(selectedMode);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onStartGame, selectedMode]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between py-6 px-4 bg-slate-950 overflow-y-auto">
      {/* Background ambient neon glow elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      {/* Header controls (Sound toggles) */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>ARCADE EDITION</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleBgm}
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-mono ${
              !bgmMuted
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="배경음악 토글 (BGM)"
          >
            <Music className="w-3.5 h-3.5" />
            <span>BGM</span>
          </button>

          <button
            type="button"
            onClick={onToggleSfx}
            className={`p-2 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-mono ${
              !sfxMuted
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
            title="효과음 토글 (SFX)"
          >
            {sfxMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span>SFX</span>
          </button>
        </div>
      </div>

      {/* Centerpiece Hero: Bespoke SVG Title Lockup */}
      <div className="z-10 flex flex-col items-center text-center my-auto max-w-xl">
        <div className="relative mb-6">
          {/* Inline SVG Tetris Title Lockup with vibrant neon arcade aesthetic */}
          <svg
            className="w-72 sm:w-88 h-auto drop-shadow-[0_0_25px_rgba(6,182,212,0.35)]"
            viewBox="0 0 400 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="tetrisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="25%" stopColor="#3b82f6" />
                <stop offset="50%" stopColor="#a855f7" />
                <stop offset="75%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#eab308" />
              </linearGradient>
            </defs>
            {/* TETRIS block letter stylization */}
            <text
              x="200"
              y="74"
              textAnchor="middle"
              fill="url(#tetrisGrad)"
              style={{
                fontFamily: "'Outfit', 'Impact', sans-serif",
                fontWeight: 900,
                fontSize: '78px',
                letterSpacing: '5px',
              }}
            >
              TETRIS
            </text>
          </svg>

          {/* Subtitle kicker */}
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-cyan-300/80 tracking-widest uppercase">
            <span>정통 테트리스 아케이드</span>
            <span>·</span>
            <span>SUPER ROTATION SYSTEM</span>
          </div>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-6">
          {/* Marathon */}
          <button
            type="button"
            onClick={() => {
              setSelectedMode('marathon');
              soundManager.playMove();
            }}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
              selectedMode === 'marathon'
                ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-mono font-semibold text-cyan-400 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5" /> 마라톤
              </span>
              <span className="text-[10px] font-mono text-slate-500">CLASSIC</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug mb-2">
              점점 빨라지는 15레벨의 한계에 도전하세요.
            </p>
            <div className="text-[11px] font-mono text-cyan-300 tabular-nums">
              최고: {highScores.marathonScore.toLocaleString()}점
            </div>
          </button>

          {/* Sprint */}
          <button
            type="button"
            onClick={() => {
              setSelectedMode('sprint');
              soundManager.playMove();
            }}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
              selectedMode === 'sprint'
                ? 'bg-purple-950/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-mono font-semibold text-purple-400 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" /> 40줄 스프린트
              </span>
              <span className="text-[10px] font-mono text-slate-500">SPEED</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug mb-2">
              40줄을 최단 시간에 클리어하는 타임어택.
            </p>
            <div className="text-[11px] font-mono text-purple-300 tabular-nums">
              최고:{' '}
              {highScores.sprintBestTime !== null
                ? `${highScores.sprintBestTime.toFixed(2)}초`
                : '기록 없음'}
            </div>
          </button>

          {/* Ultra */}
          <button
            type="button"
            onClick={() => {
              setSelectedMode('ultra');
              soundManager.playMove();
            }}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
              selectedMode === 'ultra'
                ? 'bg-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-1.5">
              <span className="text-xs font-mono font-semibold text-amber-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> 2분 울트라
              </span>
              <span className="text-[10px] font-mono text-slate-500">TIME</span>
            </div>
            <p className="text-xs text-slate-300 leading-snug mb-2">
              120초 제한시간 동안 최고 득점을 기록하세요.
            </p>
            <div className="text-[11px] font-mono text-amber-300 tabular-nums">
              최고: {highScores.ultraBestScore.toLocaleString()}점
            </div>
          </button>
        </div>

        {/* Primary Start CTA Button */}
        <button
          type="button"
          onClick={() => onStartGame(selectedMode)}
          className="group relative inline-flex items-center justify-center gap-3 px-8 py-3.5 text-base font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 active:scale-95 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer whitespace-nowrap"
        >
          <Play className="w-5 h-5 fill-slate-950" />
          <span>게임 시작 (ENTER / SPACE)</span>
        </button>
      </div>

      {/* Footer: Flat Single-Line Control Hints */}
      <div className="z-10 w-full max-w-3xl flex flex-col items-center gap-2 pt-4 border-t border-slate-800/80">
        <div className="text-xs font-mono text-slate-400 text-center flex flex-wrap justify-center items-center gap-x-3 gap-y-1">
          <span>← → / AD 이동</span>
          <span className="text-slate-600">·</span>
          <span>↑ / W / X 회전</span>
          <span className="text-slate-600">·</span>
          <span>Z 반회전</span>
          <span className="text-slate-600">·</span>
          <span>↓ / S 소프트 드롭</span>
          <span className="text-slate-600">·</span>
          <span>Space 하드 드롭</span>
          <span className="text-slate-600">·</span>
          <span>C / Shift 홀드</span>
          <span className="text-slate-600">·</span>
          <span>Esc / P 일시정지</span>
        </div>
      </div>
    </div>
  );
};

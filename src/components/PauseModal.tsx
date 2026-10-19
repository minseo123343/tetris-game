import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX, Music } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
  sfxMuted: boolean;
  bgmMuted: boolean;
  onToggleSfx: () => void;
  onToggleBgm: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onQuit,
  sfxMuted,
  bgmMuted,
  onToggleSfx,
  onToggleBgm,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700/70 p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black tracking-wider text-slate-100 uppercase mb-1">
          일시정지 (PAUSED)
        </h2>
        <p className="text-xs text-slate-400 font-mono mb-6">
          잠시 쉬어가는 시간입니다.
        </p>

        {/* Audio toggles row */}
        <div className="flex items-center gap-3 w-full mb-6">
          <button
            type="button"
            onClick={onToggleBgm}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-2 transition-colors ${
              !bgmMuted
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Music className="w-4 h-4" />
            <span>BGM {bgmMuted ? 'OFF' : 'ON'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSfx}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-mono flex items-center justify-center gap-2 transition-colors ${
              !sfxMuted
                ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            {sfxMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>SFX {sfxMuted ? 'OFF' : 'ON'}</span>
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 w-full">
          <button
            type="button"
            onClick={onResume}
            className="w-full py-3 px-4 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>계속하기 (Resume)</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" />
            <span>다시 시작 (Restart)</span>
          </button>

          <button
            type="button"
            onClick={onQuit}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-medium text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Home className="w-4 h-4" />
            <span>메인 메뉴로 (Title Menu)</span>
          </button>
        </div>
      </div>
    </div>
  );
};

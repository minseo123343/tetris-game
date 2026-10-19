import React from 'react';
import {
  RotateCcw,
  RotateCw,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ChevronsDown,
  Layers,
} from 'lucide-react';

interface TouchControlsProps {
  onMoveLeft: () => void;
  onMoveRight: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onSoftDropStart: () => void;
  onSoftDropEnd: () => void;
  onHardDrop: () => void;
  onHold: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  onMoveLeft,
  onMoveRight,
  onRotateCW,
  onRotateCCW,
  onSoftDropStart,
  onSoftDropEnd,
  onHardDrop,
  onHold,
}) => {
  return (
    <div className="w-full max-w-md mx-auto select-none pt-2 pb-3 px-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left cluster: D-Pad navigation */}
        <div className="grid grid-cols-3 gap-1.5 w-44">
          <div />
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onHardDrop();
            }}
            className="flex flex-col items-center justify-center h-12 rounded-xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 active:bg-cyan-500 active:text-slate-950 transition-transform active:scale-95 shadow-sm"
            title="하드 드롭 (Hard Drop)"
          >
            <ChevronsDown className="w-5 h-5" />
            <span className="text-[9px] font-bold tracking-tighter">DROP</span>
          </button>
          <div />

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onMoveLeft();
            }}
            className="flex items-center justify-center h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 active:bg-cyan-500 active:text-slate-950 transition-transform active:scale-95 shadow-sm"
            title="왼쪽 이동"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onSoftDropStart();
            }}
            onPointerUp={(e) => {
              e.preventDefault();
              onSoftDropEnd();
            }}
            onPointerLeave={() => onSoftDropEnd()}
            className="flex items-center justify-center h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 active:bg-amber-500 active:text-slate-950 transition-transform active:scale-95 shadow-sm"
            title="소프트 드롭"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onMoveRight();
            }}
            className="flex items-center justify-center h-12 rounded-xl bg-slate-900/80 border border-slate-700/60 text-slate-200 active:bg-cyan-500 active:text-slate-950 transition-transform active:scale-95 shadow-sm"
            title="오른쪽 이동"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Hold button */}
        <div className="flex flex-col items-center justify-center">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onHold();
            }}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-300 active:bg-amber-500 active:text-slate-950 transition-transform active:scale-95 shadow-sm"
            title="홀드 (Hold)"
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">HOLD</span>
          </button>
        </div>

        {/* Right cluster: Rotation buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onRotateCCW();
            }}
            className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-500/40 text-purple-300 active:bg-purple-500 active:text-slate-950 transition-transform active:scale-95 shadow-sm"
            title="반시계 회전 (CCW)"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[9px] font-bold">CCW</span>
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onRotateCW();
            }}
            className="flex flex-col items-center justify-center w-16 h-16 rounded-2xl bg-indigo-900/70 border border-indigo-400/50 text-indigo-200 active:bg-indigo-400 active:text-slate-950 transition-transform active:scale-95 shadow-md"
            title="시계방향 회전 (CW)"
          >
            <RotateCw className="w-6 h-6" />
            <span className="text-[10px] font-black">ROTATE</span>
          </button>
        </div>
      </div>
    </div>
  );
};

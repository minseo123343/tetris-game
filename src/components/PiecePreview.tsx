import React from 'react';
import { TetrominoType } from '../types/tetris';
import { TETROMINO_COLORS, TETROMINO_SHAPES } from '../utils/tetrisConstants';

interface PiecePreviewProps {
  type: TetrominoType | null;
  size?: number; // Size of individual mini block
  disabled?: boolean;
}

export const PiecePreview: React.FC<PiecePreviewProps> = ({
  type,
  size = 18,
  disabled = false,
}) => {
  if (!type) {
    return (
      <div
        className="flex items-center justify-center rounded-lg bg-slate-900/50 border border-slate-800/80"
        style={{ width: size * 4 + 16, height: size * 4 + 16 }}
      >
        <span className="text-xs text-slate-600 font-mono">-</span>
      </div>
    );
  }

  const shape = TETROMINO_SHAPES[type][0];
  const colorDef = TETROMINO_COLORS[type];
  const color = disabled ? '#64748b' : colorDef.primary;
  const lightColor = disabled ? '#94a3b8' : colorDef.light;
  const darkColor = disabled ? '#475569' : colorDef.dark;

  const rows = shape.length;
  const cols = shape[0].length;

  return (
    <div
      className="flex items-center justify-center p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 shadow-inner"
      style={{ width: size * 4 + 16, height: size * 4 + 16 }}
    >
      <div
        className="grid gap-[2px]"
        style={{
          gridTemplateColumns: `repeat(${cols}, ${size}px)`,
          gridTemplateRows: `repeat(${rows}, ${size}px)`,
        }}
      >
        {shape.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <div
              key={`${rIdx}-${cIdx}`}
              style={{ width: size, height: size }}
              className="relative"
            >
              {cell === 1 && (
                <div
                  className="w-full h-full rounded-[3px] shadow-sm relative overflow-hidden"
                  style={{
                    backgroundColor: color,
                    borderTop: `1.5px solid ${lightColor}`,
                    borderLeft: `1.5px solid ${lightColor}`,
                    borderBottom: `1.5px solid ${darkColor}`,
                    borderRight: `1.5px solid ${darkColor}`,
                  }}
                >
                  <div
                    className="absolute inset-[2px] rounded-[1px] bg-white/20 pointer-events-none"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

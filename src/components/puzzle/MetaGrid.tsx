import React, { useState, useCallback } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import type { MetaGrid as MetaGridType } from '../../lib/types';

interface MetaGridProps {
  grid: MetaGridType;
  activeCoordinate?: { row: number; col: number } | null;
  revealedCoordinates: { row: number; col: number; pinDigit: number }[];
  onCellClick?: (row: number, col: number) => void;
}

const THEME_LABELS: Record<string, { row: string; col: string }> = {
  agent: { row: 'meta.grid.floor', col: 'meta.grid.room' },
  space: { row: 'meta.grid.row', col: 'meta.grid.col' },
  treasure: { row: 'meta.grid.row', col: 'meta.grid.col' },
  detective: { row: 'meta.grid.street', col: 'meta.grid.house' },
};

export function MetaGrid({ grid, activeCoordinate, revealedCoordinates, onCellClick }: MetaGridProps) {
  const { theme, themeId } = useTheme();
  const { t } = useTranslation();
  const labels = THEME_LABELS[themeId] ?? THEME_LABELS.treasure;

  const [wrongCell, setWrongCell] = useState<string | null>(null);

  const isRevealed = (r: number, c: number) =>
    revealedCoordinates.some((rc) => rc.row === r && rc.col === c);

  const handleClick = useCallback((r: number, c: number) => {
    if (!onCellClick) return;
    onCellClick(r, c);
    // If cell is not the correct one and not already revealed, show wrong feedback
    if (activeCoordinate && (r !== activeCoordinate.row || c !== activeCoordinate.col) && !isRevealed(r, c)) {
      const key = `${r}-${c}`;
      setWrongCell(key);
      setTimeout(() => setWrongCell(null), 600);
    }
  }, [onCellClick, activeCoordinate, revealedCoordinates]);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-[340px]">
        {/* Column headers */}
        <div className="flex">
          <div className="w-10 h-8 flex-shrink-0 flex items-center justify-center text-[10px] text-white/40 border border-transparent">
            {t(labels.row)}↓ {t(labels.col)}→
          </div>
          {Array.from({ length: 10 }, (_, c) => (
            <div
              key={c}
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white/50 border border-transparent"
            >
              {c}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {grid.cells.map((row, r) => (
          <div key={r} className="flex">
            {/* Row header */}
            <div
              className="w-10 h-8 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white/50 border border-transparent"
            >
              {r}
            </div>

            {/* Cells */}
            {row.map((cell, c) => {
              const revealed = isRevealed(r, c);
              const isWrong = wrongCell === `${r}-${c}`;
              return (
                <div
                  key={c}
                  onClick={() => handleClick(r, c)}
                  className={`w-8 h-8 flex-shrink-0 flex items-center justify-center text-sm font-mono
                    border border-white/10 transition-all duration-300 cursor-default
                    ${revealed ? 'bg-green-500/20 text-green-400 font-bold border-green-500/30' : ''}
                    ${isWrong ? 'bg-red-500/30 text-red-400 border-red-500/50 animate-shake' : ''}
                    ${!revealed && !isWrong ? 'text-white/70 hover:bg-white/5' : ''}
                    ${onCellClick ? 'cursor-pointer' : ''}`}
                >
                  {cell}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

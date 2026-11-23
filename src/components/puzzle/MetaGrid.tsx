import { useState, useEffect, useRef } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import type { MetaGrid as MetaGridType } from '../../lib/types';

interface MetaGridProps {
  grid: MetaGridType;
  activeCoordinate?: { row: number; col: number } | null;
  revealedCoordinates: { row: number; col: number; pinDigit: number }[];
  onCellClick?: (row: number, col: number) => void;
  /** Ignore taps (e.g. during a phase transition). */
  disabled?: boolean;
}

/** Translation keys for the row/column axis names per theme. */
export const META_AXIS_LABELS: Record<string, { row: string; col: string }> = {
  agent: { row: 'meta.grid.floor', col: 'meta.grid.room' },
  space: { row: 'meta.grid.row', col: 'meta.grid.col' },
  treasure: { row: 'meta.grid.row', col: 'meta.grid.col' },
  detective: { row: 'meta.grid.street', col: 'meta.grid.house' },
};

export function metaAxisLabels(themeId: string) {
  return META_AXIS_LABELS[themeId] ?? META_AXIS_LABELS.treasure;
}

const WRONG_FLASH_MS = 600;

export function MetaGrid({ grid, activeCoordinate, revealedCoordinates, onCellClick, disabled }: MetaGridProps) {
  const { themeId } = useTheme();
  const { t } = useTranslation();
  const labels = metaAxisLabels(themeId);
  const rowLabel = t(labels.row);
  const colLabel = t(labels.col);

  const [wrongCell, setWrongCell] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const isRevealed = (r: number, c: number) =>
    revealedCoordinates.some((rc) => rc.row === r && rc.col === c);

  const handleClick = (r: number, c: number) => {
    if (!onCellClick || disabled) return;
    onCellClick(r, c);
    if (activeCoordinate && (r !== activeCoordinate.row || c !== activeCoordinate.col) && !isRevealed(r, c)) {
      setWrongCell(`${r}-${c}`);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setWrongCell(null), WRONG_FLASH_MS);
    }
  };

  const cols = grid.cells[0]?.length ?? 0;
  // Header column + N cells. Cells shrink on narrow phones (no horizontal
  // scroll at 360px) and grow to 40-44px on wider screens.
  const template = `minmax(1.5rem, 2rem) repeat(${cols}, minmax(0, 2.75rem))`;

  return (
    <div className="w-full max-w-[30rem] mx-auto">
      <p className="mb-1 text-center text-xs text-white/50" aria-hidden="true">
        {rowLabel} ↓ · {colLabel} →
      </p>
      <div
        role="group"
        aria-label={t('meta.grid.title')}
        className="grid gap-px w-full justify-center"
        style={{ gridTemplateColumns: template }}
      >
        <div className="contents" aria-hidden="true">
          <div
            className="flex items-center justify-center text-[9px] leading-tight text-white/40 text-center"
            title={`${rowLabel} ↓ ${colLabel} →`}
          >
            <span aria-hidden="true">↓→</span>
          </div>
          {Array.from({ length: cols }, (_, c) => (
            <div
              key={c}
              className="aspect-square flex items-center justify-center text-xs font-bold text-white/50"
            >
              {c}
            </div>
          ))}
        </div>

        {grid.cells.map((row, r) => (
          <div key={r} className="contents">
            <div
              aria-hidden="true"
              className="flex items-center justify-center text-xs font-bold text-white/50"
            >
              {r}
            </div>
            {row.map((cell, c) => {
              const revealed = isRevealed(r, c);
              const isWrong = wrongCell === `${r}-${c}`;
              return (
                <div key={c} className="aspect-square">
                  <button
                    type="button"
                    onClick={() => handleClick(r, c)}
                    aria-label={`${rowLabel} ${r}, ${colLabel} ${c}: ${cell}`}
                    aria-pressed={revealed || undefined}
                    disabled={!onCellClick}
                    className={`w-full h-full flex items-center justify-center text-sm sm:text-base font-mono
                      rounded-[3px] border border-white/10 transition-colors duration-300
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70
                      ${revealed ? 'bg-green-500/20 text-green-400 font-bold border-green-500/30' : ''}
                      ${isWrong ? 'bg-red-500/30 text-red-400 border-red-500/50 animate-shake' : ''}
                      ${!revealed && !isWrong ? 'bg-white/5 text-white/80 hover:bg-white/15' : ''}
                      ${onCellClick ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {cell}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

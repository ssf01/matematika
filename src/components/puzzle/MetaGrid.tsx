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
  // scroll at 360px) and grow to ~44-48px on wider screens.
  const template = `minmax(1.5rem, 2rem) repeat(${cols}, minmax(0, 3rem))`;
  // Highlight the target row/column headers to help the child cross-reference.
  const headerClass = (on: boolean) =>
    `num flex items-center justify-center rounded-md text-sm sm:text-base font-black ${
      on ? 'bg-accent text-on-accent' : 'text-white/80'
    }`;

  return (
    <div className="w-full max-w-[34rem] mx-auto">
      <p className="mb-2 text-center text-sm font-semibold text-white/85" aria-hidden="true">
        {rowLabel} ↓ · {colLabel} →
      </p>
      <div
        role="group"
        aria-label={t('meta.grid.title')}
        className="grid gap-[3px] w-full justify-center"
        style={{ gridTemplateColumns: template }}
      >
        <div className="contents" aria-hidden="true">
          <div
            className="flex items-center justify-center text-xs leading-tight text-white/70 text-center"
            title={`${rowLabel} ↓ ${colLabel} →`}
          >
            <span aria-hidden="true">↓→</span>
          </div>
          {Array.from({ length: cols }, (_, c) => (
            <div key={c} className={`aspect-square ${headerClass(activeCoordinate?.col === c)}`}>
              {c}
            </div>
          ))}
        </div>
        {grid.cells.map((row, r) => (
          <div key={r} className="contents">
            <div aria-hidden="true" className={headerClass(activeCoordinate?.row === r)}>
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
                    className={`num w-full h-full flex items-center justify-center text-sm sm:text-lg font-bold
                      rounded-md border transition-colors duration-200
                      ${revealed ? 'accent-gradient text-on-accent font-black border-transparent' : ''}
                      ${isWrong ? 'bg-red-600 text-white border-red-300 animate-shake' : ''}
                      ${!revealed && !isWrong ? 'bg-white/10 text-white border-white/10 hover:bg-white/25' : ''}
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

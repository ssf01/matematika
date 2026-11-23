import { useEffect, useMemo, useState } from 'react';
import { PuzzleSection } from './PuzzleSection';
import { MetaGrid, metaAxisLabels } from './MetaGrid';
import { StoryCard, useChainAnswerHandler, useFadeTransition, fadeClass } from './shared';
import { fillTemplate, tOr } from './format';
import { useGameStore, selectMetaDigitsFound } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { Button } from '../ui/Button';
import { TopBarSlot } from '../ui/TopBar';
import { DigitChips } from './DigitChips';
import type { Puzzle } from '../../lib/types';

interface MetaPuzzleFlowProps {
  puzzle: Puzzle;
}

/**
 * Meta puzzle phases:
 * intro → [solve-row → solve-col → coordinate-reveal → grid-lookup → digit-found] × 4 → all-complete
 * Pair i uses chain 2i for the row and chain 2i+1 for the column.
 */
type MetaPhase =
  | 'intro'
  | 'solve-row'
  | 'solve-col'
  | 'coordinate-reveal'
  | 'grid-lookup'
  | 'digit-found'
  | 'all-complete';

export const META_REVEAL_DELAY_MS = 3000;

function initialProgress(puzzle: Puzzle): { pair: number; phase: MetaPhase } {
  const total = puzzle.meta!.coordinates.length;
  const { metaCoordinatesRevealed, completedChains, answers } = useGameStore.getState();
  // First pair whose coordinate hasn't been found yet.
  let pair = 0;
  while (pair < total && metaCoordinatesRevealed.includes(pair)) pair++;
  if (pair >= total) return { pair: total - 1, phase: 'all-complete' };
  if (completedChains.includes(pair * 2 + 1)) return { pair, phase: 'coordinate-reveal' };
  if (completedChains.includes(pair * 2)) return { pair, phase: 'solve-col' };
  const started =
    metaCoordinatesRevealed.length > 0 || completedChains.length > 0 || Object.keys(answers).length > 0;
  return { pair, phase: started ? 'solve-row' : 'intro' };
}

export function MetaPuzzleFlow({ puzzle }: MetaPuzzleFlowProps) {
  const { t } = useTranslation();
  const { theme, themeId } = useTheme();
  const meta = puzzle.meta!;
  const labels = metaAxisLabels(themeId);

  const answers = useGameStore((s) => s.answers);
  const completedChains = useGameStore((s) => s.completedChains);
  const setCurrentStep = useGameStore((s) => s.setCurrentStep);
  const metaCoordinatesRevealed = useGameStore((s) => s.metaCoordinatesRevealed);
  const revealMetaCoordinate = useGameStore((s) => s.revealMetaCoordinate);
  const handleAnswer = useChainAnswerHandler(puzzle);
  const { visible, run, isBusy } = useFadeTransition();

  const [initial] = useState(() => initialProgress(puzzle));
  const [activePairIndex, setActivePairIndex] = useState(initial.pair);
  const [phase, setPhase] = useState<MetaPhase>(initial.phase);

  const digitsFound = useMemo(
    () => selectMetaDigitsFound({ puzzle, metaCoordinatesRevealed }),
    [puzzle, metaCoordinatesRevealed],
  );

  const rowChainIdx = activePairIndex * 2;
  const colChainIdx = activePairIndex * 2 + 1;
  const coord = meta.coordinates[activePairIndex];
  const totalPairs = meta.coordinates.length;

  useEffect(() => {
    if (phase === 'solve-row' && completedChains.includes(rowChainIdx)) {
      run(() => setPhase('solve-col'));
    } else if (phase === 'solve-col' && completedChains.includes(colChainIdx)) {
      run(() => setPhase('coordinate-reveal'));
    }
  }, [completedChains, rowChainIdx, colChainIdx, phase, run]);

  useEffect(() => {
    if (phase !== 'all-complete') return;
    const timer = setTimeout(() => setCurrentStep('reveal'), META_REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [phase, setCurrentStep]);

  const handleCellClick = (r: number, c: number) => {
    // Only the first tap on the right cell counts; taps during the fade are ignored.
    if (phase !== 'grid-lookup' || isBusy()) return;
    if (r !== coord.row || c !== coord.col) return;
    revealMetaCoordinate(activePairIndex);
    run(() => setPhase('digit-found'));
  };

  const handleNextPair = () =>
    run(() => {
      const next = activePairIndex + 1;
      if (next >= totalPairs) {
        setPhase('all-complete');
      } else {
        setActivePairIndex(next);
        setPhase('solve-row');
      }
    });

  const metaText = (key: string, params?: Record<string, string | number>) => {
    const raw = t(`story.${themeId}.meta.${key}`);
    return params ? fillTemplate(raw, params) : raw;
  };

  const rowName = t(labels.row);
  const colName = t(labels.col);
  const pairTitle = (axis: string) => `${t('meta.coordinatePair')} ${activePairIndex + 1} — ${axis}`;
  const coordinateHint = tOr(t, 'puzzle.lastDigitHintCoordinate', t('puzzle.multiplicationHint'));

  const chipDigits = meta.coordinates.map((c, i) => (metaCoordinatesRevealed.includes(i) ? c.pinDigit : null));
  const nextButton = (onClick: () => void) => (
    <Button size="lg" onClick={onClick} className="mt-6 w-full sm:w-auto sm:min-w-64">
      {t('story.next')}
    </Button>
  );

  return (
    <div className="screen-h w-full max-w-2xl mx-auto px-4 pt-4 pb-10 sm:pt-6">
      <TopBarSlot>
        <DigitChips digits={chipDigits} activeIndex={phase === 'intro' || phase === 'all-complete' ? null : activePairIndex} />
      </TopBarSlot>

      {phase !== 'intro' && phase !== 'all-complete' && (
        <p className="mb-3 flex items-center justify-center gap-2 text-white/90 font-bold">
          <span aria-hidden="true">🗺️</span>
          <span className="num">
            {`${t('meta.coordinatePair')} ${Math.min(activePairIndex + 1, totalPairs)} ${t('story.of')} ${totalPairs}`}
          </span>
        </p>
      )}

      <div className={`transition-all duration-300 ease-out ${fadeClass(visible)}`}>
        {phase === 'intro' && (
          <div className="flex flex-col items-center pt-4 sm:pt-10">
            <StoryCard emoji={theme.emoji}>
              <p className="text-white text-xl sm:text-2xl leading-relaxed font-medium">{metaText('intro')}</p>
            </StoryCard>
            {nextButton(() => run(() => setPhase('solve-row')))}
          </div>
        )}

        {(phase === 'solve-row' || phase === 'solve-col') && (
          <div className="space-y-4">
            <StoryCard emoji={theme.emoji} compact>
              <p className="text-white text-base sm:text-lg leading-snug">
                {metaText(phase === 'solve-row' ? 'findRow' : 'findCol')}
              </p>
            </StoryCard>
            {phase === 'solve-row' ? (
              <PuzzleSection
                key={rowChainIdx}
                chain={puzzle.chains[rowChainIdx]}
                chainIndex={rowChainIdx}
                answers={answers}
                onAnswer={handleAnswer}
                isCompleted={completedChains.includes(rowChainIdx)}
                title={pairTitle(rowName)}
                resultLabel={rowName}
                hint={coordinateHint}
              />
            ) : (
              <PuzzleSection
                key={colChainIdx}
                chain={puzzle.chains[colChainIdx]}
                chainIndex={colChainIdx}
                answers={answers}
                onAnswer={handleAnswer}
                isCompleted={completedChains.includes(colChainIdx)}
                title={pairTitle(colName)}
                resultLabel={colName}
                hint={coordinateHint}
              />
            )}
          </div>
        )}

        {phase === 'coordinate-reveal' && (
          <div className="flex flex-col items-center pt-4 sm:pt-10">
            <StoryCard emoji={theme.emoji} glow>
              <p className="text-accent text-2xl font-black mb-5">
                {metaText('coordinateFound', { row: coord.row, col: coord.col })}
              </p>
              <div className="flex items-stretch justify-center gap-3">
                {[
                  [rowName, coord.row],
                  [colName, coord.col],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 px-5 py-3 min-w-28">
                    <span className="text-white/90 font-bold">{label}</span>
                    <span className="num text-5xl font-black text-accent animate-digit-reveal">{value}</span>
                  </div>
                ))}
              </div>
            </StoryCard>
            {nextButton(() => run(() => setPhase('grid-lookup')))}
          </div>
        )}

        {phase === 'grid-lookup' && (
          <div className="flex flex-col items-center gap-4">
            <StoryCard emoji={theme.emoji} compact>
              <p className="text-white text-base sm:text-lg leading-snug">
                {metaText('checkGrid', { row: coord.row, col: coord.col })}
              </p>
            </StoryCard>
            <div className="surface w-full rounded-3xl p-2 sm:p-4">
              <MetaGrid
                grid={meta}
                activeCoordinate={{ row: coord.row, col: coord.col }}
                revealedCoordinates={meta.coordinates.filter((_, i) =>
                  metaCoordinatesRevealed.includes(i),
                )}
                onCellClick={handleCellClick}
                disabled={!visible}
              />
            </div>
            <p className="text-white/90 text-base font-semibold text-center" aria-live="polite">
              {t('meta.grid.findDigit')} ({rowName} {coord.row}, {colName} {coord.col})
            </p>
          </div>
        )}

        {phase === 'digit-found' && (
          <div className="flex flex-col items-center pt-4 sm:pt-10" aria-live="polite">
            <StoryCard emoji={theme.emoji} glow>
              <p className="text-accent text-2xl font-black mb-5">
                {metaText('digitFound', { digit: coord.pinDigit })}
              </p>
              <span className="num inline-flex w-24 h-28 rounded-3xl accent-gradient text-on-accent items-center justify-center text-7xl font-black shadow-xl shadow-black/30 animate-digit-reveal">
                {coord.pinDigit}
              </span>
            </StoryCard>
            {nextButton(handleNextPair)}
          </div>
        )}

        {phase === 'all-complete' && (
          <div className="flex flex-col items-center pt-4 sm:pt-10">
            <StoryCard emoji={theme.emoji} glow>
              <p className="text-accent text-2xl sm:text-3xl font-black mb-5">{t('puzzle.completed')}</p>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {digitsFound.map((digit, idx) => (
                  <span
                    key={idx}
                    className="num inline-flex w-16 h-20 sm:w-20 sm:h-24 rounded-2xl accent-gradient text-on-accent items-center justify-center text-5xl sm:text-6xl font-black shadow-lg shadow-black/30 animate-digit-reveal"
                    style={{ animationDelay: `${idx * 150}ms` }}
                  >
                    {digit}
                  </span>
                ))}
              </div>
            </StoryCard>
          </div>
        )}
      </div>
    </div>
  );
}

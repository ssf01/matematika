import { useEffect, useMemo, useState } from 'react';
import { PuzzleSection } from './PuzzleSection';
import { MetaGrid, metaAxisLabels } from './MetaGrid';
import { StoryCard, useChainAnswerHandler, useFadeTransition, fadeClass } from './shared';
import { fillTemplate, tOr } from './format';
import { useGameStore, selectMetaDigitsFound } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
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
  const resultLabel = (key: string, axis: string) => fillTemplate(tOr(t, key, axis), { label: axis });
  const coordinateHint = tOr(t, 'puzzle.lastDigitHintCoordinate', t('puzzle.multiplicationHint'));

  return (
    <div className="min-h-dvh px-3 py-4 sm:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <ProgressBar current={metaCoordinatesRevealed.length} total={totalPairs} />
        <p className="text-center text-white/50 text-sm mt-2">
          {phase === 'intro'
            ? `0 / ${totalPairs}`
            : `${t('meta.coordinatePair')} ${Math.min(activePairIndex + 1, totalPairs)} ${t('story.of')} ${totalPairs}`}
        </p>
      </div>

      <div className={`transition-all duration-300 ease-out ${fadeClass(visible)}`}>
        {phase === 'intro' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme}>
              <p className="text-white/90 text-lg leading-relaxed">{metaText('intro')}</p>
            </StoryCard>
            <Button
              variant="primary"
              size="lg"
              onClick={() => run(() => setPhase('solve-row'))}
              className="mt-8 text-lg px-10 py-5 animate-pulse"
            >
              {t('story.next')}
            </Button>
          </div>
        )}

        {(phase === 'solve-row' || phase === 'solve-col') && (
          <div>
            <StoryCard emoji={theme.emoji} themeConfig={theme} compact>
              <p className="text-white/80 text-base leading-relaxed">
                {metaText(phase === 'solve-row' ? 'findRow' : 'findCol')}
              </p>
            </StoryCard>
            <div className="mt-6">
              {phase === 'solve-row' ? (
                <PuzzleSection
                  key={rowChainIdx}
                  chain={puzzle.chains[rowChainIdx]}
                  chainIndex={rowChainIdx}
                  answers={answers}
                  onAnswer={handleAnswer}
                  isCompleted={completedChains.includes(rowChainIdx)}
                  title={pairTitle(rowName)}
                  resultLabel={resultLabel('meta.rowResult', rowName)}
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
                  resultLabel={resultLabel('meta.colResult', colName)}
                  hint={coordinateHint}
                />
              )}
            </div>
          </div>
        )}

        {phase === 'coordinate-reveal' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-3">
                  {metaText('coordinateFound', { row: coord.row, col: coord.col })}
                </p>
                <div className="flex items-center justify-center gap-4 text-2xl font-mono">
                  <span className="text-yellow-400">({coord.row}, {coord.col})</span>
                </div>
              </div>
            </StoryCard>
            <Button
              variant="primary"
              size="lg"
              onClick={() => run(() => setPhase('grid-lookup'))}
              className="mt-8 text-lg px-10 py-5 animate-pulse"
            >
              {t('story.next')}
            </Button>
          </div>
        )}

        {phase === 'grid-lookup' && (
          <div className="flex flex-col items-center mt-4">
            <StoryCard emoji={theme.emoji} themeConfig={theme} compact>
              <p className="text-white/80 text-base leading-relaxed">
                {metaText('checkGrid', { row: coord.row, col: coord.col })}
              </p>
            </StoryCard>
            <div className="mt-6 w-full">
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
            <p className="text-white/50 text-sm mt-4 text-center" aria-live="polite">
              {t('meta.grid.findDigit')} ({rowName} {coord.row}, {colName} {coord.col})
            </p>
          </div>
        )}

        {phase === 'digit-found' && (
          <div className="flex flex-col items-center justify-center mt-8" aria-live="polite">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-3">
                  {metaText('digitFound', { digit: coord.pinDigit })}
                </p>
                <span className="text-4xl font-bold text-green-400 animate-digit-reveal inline-block">
                  {coord.pinDigit}
                </span>
              </div>
            </StoryCard>
            <Button
              variant="primary"
              size="lg"
              onClick={handleNextPair}
              className="mt-8 text-lg px-10 py-5 animate-pulse"
            >
              {t('story.next')}
            </Button>
          </div>
        )}

        {phase === 'all-complete' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-4">{t('puzzle.completed')}</p>
                <div className="flex items-center justify-center gap-3">
                  {digitsFound.map((digit, idx) => (
                    <span
                      key={idx}
                      className="text-3xl font-bold text-green-400 animate-bounce"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      {digit}
                    </span>
                  ))}
                </div>
              </div>
            </StoryCard>
          </div>
        )}
      </div>
    </div>
  );
}

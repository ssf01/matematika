import React, { useEffect, useState, useCallback } from 'react';
import { PuzzleSection } from './PuzzleSection';
import { MetaGrid } from './MetaGrid';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { validateStep } from '../../lib/validator';
import type { Puzzle } from '../../lib/types';

interface MetaPuzzleFlowProps {
  puzzle: Puzzle;
}

/**
 * Meta puzzle phases:
 * intro → [solve-row → solve-col → coordinate-reveal → grid-lookup → digit-found] × 4 → all-complete
 */
type MetaPhase =
  | 'intro'
  | 'solve-row'
  | 'solve-col'
  | 'coordinate-reveal'
  | 'grid-lookup'
  | 'digit-found'
  | 'all-complete';

function tParam(template: string, params: Record<string, string | number>): string {
  let result = template;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, String(value));
  }
  return result;
}

export function MetaPuzzleFlow({ puzzle }: MetaPuzzleFlowProps) {
  const { t } = useTranslation();
  const { theme, themeId } = useTheme();
  const meta = puzzle.meta!;

  const answers = useGameStore((s) => s.answers);
  const completedChains = useGameStore((s) => s.completedChains);
  const setAnswer = useGameStore((s) => s.setAnswer);
  const markChainCompleted = useGameStore((s) => s.markChainCompleted);
  const setCurrentStep = useGameStore((s) => s.setCurrentStep);
  const metaCoordinatesRevealed = useGameStore((s) => s.metaCoordinatesRevealed);
  const metaDigitsFound = useGameStore((s) => s.metaDigitsFound);
  const markMetaCoordinateRevealed = useGameStore((s) => s.markMetaCoordinateRevealed);
  const addMetaDigitFound = useGameStore((s) => s.addMetaDigitFound);

  // Which coordinate pair we're working on (0-3)
  const [activePairIndex, setActivePairIndex] = useState(0);
  const [phase, setPhase] = useState<MetaPhase>('intro');
  const [fadeIn, setFadeIn] = useState(true);

  // Chain indexes: pair i → row chain = i*2, col chain = i*2+1
  const rowChainIdx = activePairIndex * 2;
  const colChainIdx = activePairIndex * 2 + 1;

  // Restore state on mount
  useEffect(() => {
    const revealedCount = metaCoordinatesRevealed.length;
    if (revealedCount >= meta.coordinates.length) {
      setActivePairIndex(meta.coordinates.length - 1);
      setPhase('all-complete');
    } else if (revealedCount > 0) {
      setActivePairIndex(revealedCount);
      // Figure out which sub-phase we're in
      const rIdx = revealedCount * 2;
      const cIdx = revealedCount * 2 + 1;
      if (completedChains.includes(cIdx)) {
        setPhase('coordinate-reveal');
      } else if (completedChains.includes(rIdx)) {
        setPhase('solve-col');
      } else {
        setPhase('solve-row');
      }
    }
  }, []); // Only on mount

  const triggerTransition = useCallback((callback: () => void) => {
    setFadeIn(false);
    setTimeout(() => {
      callback();
      setFadeIn(true);
    }, 300);
  }, []);

  // Watch for chain completion during solve phases
  useEffect(() => {
    if (phase === 'solve-row' && completedChains.includes(rowChainIdx)) {
      triggerTransition(() => setPhase('solve-col'));
    }
  }, [completedChains, rowChainIdx, phase, triggerTransition]);

  useEffect(() => {
    if (phase === 'solve-col' && completedChains.includes(colChainIdx)) {
      triggerTransition(() => setPhase('coordinate-reveal'));
    }
  }, [completedChains, colChainIdx, phase, triggerTransition]);

  // Auto-transition to reveal after all-complete
  useEffect(() => {
    if (phase === 'all-complete') {
      const timer = setTimeout(() => setCurrentStep('reveal'), 3000);
      return () => clearTimeout(timer);
    }
  }, [phase, setCurrentStep]);

  const handleAnswer = (chainIdx: number, stepIdx: number, value: number): boolean => {
    const step = puzzle.chains[chainIdx].steps[stepIdx];
    const correct = validateStep(step, value);

    if (correct) {
      setAnswer(chainIdx, stepIdx, value);

      const chain = puzzle.chains[chainIdx];
      const allDone = chain.steps.every((s, i) => {
        if (i === stepIdx) return true;
        const ans = answers[`${chainIdx}-${i}`];
        return ans !== null && ans !== undefined && ans === s.result;
      });

      if (allDone) {
        markChainCompleted(chainIdx);
      }
    }

    return correct;
  };

  const coord = meta.coordinates[activePairIndex];

  const handleShowGrid = () => {
    triggerTransition(() => setPhase('grid-lookup'));
  };

  const handleDigitFound = () => {
    markMetaCoordinateRevealed(activePairIndex);
    addMetaDigitFound(coord.pinDigit);
    triggerTransition(() => setPhase('digit-found'));
  };

  const handleNextPair = () => {
    const nextPair = activePairIndex + 1;
    if (nextPair >= meta.coordinates.length) {
      triggerTransition(() => setPhase('all-complete'));
    } else {
      triggerTransition(() => {
        setActivePairIndex(nextPair);
        setPhase('solve-row');
      });
    }
  };

  const getMetaText = (key: string, params?: Record<string, string | number>): string => {
    const raw = t(`story.${themeId}.meta.${key}`);
    return params ? tParam(raw, params) : raw;
  };

  const fadeClass = fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';

  const totalPairs = meta.coordinates.length;
  const donePairs = metaCoordinatesRevealed.length;

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <ProgressBar current={donePairs} total={totalPairs} />
        <p className="text-center text-white/50 text-sm mt-2">
          {phase === 'intro'
            ? `0 / ${totalPairs}`
            : `${t('meta.coordinatePair')} ${Math.min(activePairIndex + 1, totalPairs)} ${t('story.of')} ${totalPairs}`}
        </p>
      </div>

      <div className={`transition-all duration-300 ease-out ${fadeClass}`}>

        {/* INTRO */}
        {phase === 'intro' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme}>
              <p className="text-white/90 text-lg leading-relaxed">
                {getMetaText('intro')}
              </p>
            </StoryCard>
            <Button
              variant="primary"
              size="lg"
              onClick={() => triggerTransition(() => setPhase('solve-row'))}
              className="mt-8 text-lg px-10 py-5 animate-pulse"
            >
              {t('story.next')}
            </Button>
          </div>
        )}

        {/* SOLVE ROW */}
        {phase === 'solve-row' && (
          <div>
            <StoryCard emoji={theme.emoji} themeConfig={theme} compact>
              <p className="text-white/80 text-base leading-relaxed">
                {getMetaText('findRow')}
              </p>
              <p className="text-white/40 text-xs mt-1">
                {t('meta.coordinatePair')} {activePairIndex + 1} — {t('meta.grid.row')}
              </p>
            </StoryCard>
            <div className="mt-6">
              <PuzzleSection
                chain={puzzle.chains[rowChainIdx]}
                chainIndex={rowChainIdx}
                answers={answers}
                onAnswer={handleAnswer}
                isCompleted={completedChains.includes(rowChainIdx)}
              />
            </div>
          </div>
        )}

        {/* SOLVE COL */}
        {phase === 'solve-col' && (
          <div>
            <StoryCard emoji={theme.emoji} themeConfig={theme} compact>
              <p className="text-white/80 text-base leading-relaxed">
                {getMetaText('findCol')}
              </p>
              <p className="text-white/40 text-xs mt-1">
                {t('meta.coordinatePair')} {activePairIndex + 1} — {t('meta.grid.col')}
              </p>
            </StoryCard>
            <div className="mt-6">
              <PuzzleSection
                chain={puzzle.chains[colChainIdx]}
                chainIndex={colChainIdx}
                answers={answers}
                onAnswer={handleAnswer}
                isCompleted={completedChains.includes(colChainIdx)}
              />
            </div>
          </div>
        )}

        {/* COORDINATE REVEAL */}
        {phase === 'coordinate-reveal' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-3">
                  {getMetaText('coordinateFound', { row: coord.row, col: coord.col })}
                </p>
                <div className="flex items-center justify-center gap-4 text-2xl font-mono">
                  <span className="text-yellow-400">({coord.row}, {coord.col})</span>
                </div>
              </div>
            </StoryCard>
            <Button
              variant="primary"
              size="lg"
              onClick={handleShowGrid}
              className="mt-8 text-lg px-10 py-5 animate-pulse"
            >
              {t('story.next')}
            </Button>
          </div>
        )}

        {/* GRID LOOKUP */}
        {phase === 'grid-lookup' && (
          <div className="flex flex-col items-center mt-4">
            <StoryCard emoji={theme.emoji} themeConfig={theme} compact>
              <p className="text-white/80 text-base leading-relaxed">
                {getMetaText('checkGrid', { row: coord.row, col: coord.col })}
              </p>
            </StoryCard>
            <div className="mt-6 flex justify-center">
              <MetaGrid
                grid={meta}
                activeCoordinate={{ row: coord.row, col: coord.col }}
                revealedCoordinates={meta.coordinates.filter((_, i) =>
                  metaCoordinatesRevealed.includes(i)
                )}
                onCellClick={(r, c) => {
                  if (r === coord.row && c === coord.col) {
                    handleDigitFound();
                  }
                }}
              />
            </div>
            <p className="text-white/40 text-sm mt-4 text-center">
              {t('meta.grid.findDigit')} ({coord.row}, {coord.col})
            </p>
          </div>
        )}

        {/* DIGIT FOUND */}
        {phase === 'digit-found' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-3">
                  {getMetaText('digitFound', { digit: coord.pinDigit })}
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

        {/* ALL COMPLETE */}
        {phase === 'all-complete' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-4">
                  {t('puzzle.completed')}
                </p>
                <div className="flex items-center justify-center gap-3">
                  {metaDigitsFound.map((digit, idx) => (
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

/* ─── Story card sub-component ─── */

interface StoryCardProps {
  children: React.ReactNode;
  emoji: string;
  themeConfig: { primaryColor: string; glowColor: string };
  compact?: boolean;
  glow?: boolean;
}

function StoryCard({ children, emoji, themeConfig, compact, glow }: StoryCardProps) {
  return (
    <Card
      className={`relative overflow-hidden ${glow ? 'ring-2 ring-green-500/50' : ''}`}
      glow={glow}
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${themeConfig.glowColor}, transparent 70%)`,
        }}
      />
      <div className="relative">
        <div className={`flex items-start gap-4 ${compact ? '' : 'flex-col items-center text-center'}`}>
          <span className={compact ? 'text-3xl flex-shrink-0 mt-0.5' : 'text-6xl mb-2 animate-float'}>
            {emoji}
          </span>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </Card>
  );
}

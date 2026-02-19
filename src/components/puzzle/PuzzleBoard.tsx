import React, { useEffect, useState, useCallback } from 'react';
import { PuzzleSection } from './PuzzleSection';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ShimmerButton } from '../ui/ShimmerButton';
import { Sparkles } from '../ui/Sparkles';
import { validateStep } from '../../lib/validator';
import type { Puzzle } from '../../lib/types';
import { MetaPuzzleFlow } from './MetaPuzzleFlow';

interface PuzzleBoardProps {
  puzzle: Puzzle;
}

type StoryPhase = 'intro' | 'solving' | 'chain-complete' | 'all-complete';

export function PuzzleBoard({ puzzle }: PuzzleBoardProps) {
  const { t } = useTranslation();
  const { theme, themeId } = useTheme();
  const answers = useGameStore((s) => s.answers);
  const completedChains = useGameStore((s) => s.completedChains);
  const setAnswer = useGameStore((s) => s.setAnswer);
  const markChainCompleted = useGameStore((s) => s.markChainCompleted);
  const setCurrentStep = useGameStore((s) => s.setCurrentStep);

  const [activeChainIndex, setActiveChainIndex] = useState(0);
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('intro');
  const [fadeIn, setFadeIn] = useState(true);

  // Meta mode: delegate to MetaPuzzleFlow
  if (puzzle.meta) {
    return <MetaPuzzleFlow puzzle={puzzle} />;
  }

  // On mount, figure out where we left off (in case of page reload with persisted state)
  useEffect(() => {
    if (completedChains.length > 0) {
      const nextIncomplete = puzzle.chains.findIndex(
        (_, idx) => !completedChains.includes(idx),
      );
      if (nextIncomplete === -1) {
        // All chains already done
        setActiveChainIndex(puzzle.chains.length - 1);
        setStoryPhase('all-complete');
      } else {
        setActiveChainIndex(nextIncomplete);
        setStoryPhase('solving');
      }
    }
  }, []); // Only on mount

  // Trigger fade-in animation on phase/chain changes
  const triggerTransition = useCallback((callback: () => void) => {
    setFadeIn(false);
    setTimeout(() => {
      callback();
      setFadeIn(true);
    }, 300);
  }, []);

  // When a chain is completed, transition to chain-complete phase
  useEffect(() => {
    if (storyPhase === 'solving' && completedChains.includes(activeChainIndex)) {
      triggerTransition(() => {
        if (completedChains.length >= puzzle.chains.length) {
          setStoryPhase('all-complete');
        } else {
          setStoryPhase('chain-complete');
        }
      });
    }
  }, [completedChains, activeChainIndex, storyPhase, puzzle.chains.length, triggerTransition]);

  // When all chains complete, go to reveal after a delay
  useEffect(() => {
    if (storyPhase === 'all-complete') {
      const timer = setTimeout(() => setCurrentStep('reveal'), 2500);
      return () => clearTimeout(timer);
    }
  }, [storyPhase, setCurrentStep]);

  const handleAnswer = (chainIdx: number, stepIdx: number, value: number): boolean => {
    const step = puzzle.chains[chainIdx].steps[stepIdx];
    const correct = validateStep(step, value);

    if (correct) {
      setAnswer(chainIdx, stepIdx, value);

      // Check if this was the last step in the chain
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

  const handleStartAdventure = () => {
    triggerTransition(() => setStoryPhase('solving'));
  };

  const handleNextChain = () => {
    triggerTransition(() => {
      const nextIndex = activeChainIndex + 1;
      setActiveChainIndex(nextIndex);
      setStoryPhase('solving');
    });
  };

  const getStoryText = (key: string): string => {
    return t(`story.${themeId}.${key}`);
  };

  const fadeClass = fadeIn
    ? 'opacity-100 translate-y-0'
    : 'opacity-0 translate-y-4';

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Step indicators */}
      <div className="mb-6 flex items-center justify-center gap-2">
        {puzzle.chains.map((_, idx) => {
          const done = completedChains.includes(idx);
          const active = storyPhase === 'solving' && idx === activeChainIndex;
          return (
            <div
              key={idx}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${done
                  ? 'bg-green-500/25 text-green-400 ring-2 ring-green-500/50'
                  : active
                    ? 'bg-white/15 text-white ring-2 ring-white/40 scale-110'
                    : 'bg-white/5 text-white/30'}`}
            >
              {done ? '✓' : idx + 1}
            </div>
          );
        })}
      </div>

      {/* Story content with fade transitions */}
      <div className={`transition-all duration-300 ease-out ${fadeClass}`}>

        {/* INTRO PHASE */}
        {storyPhase === 'intro' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme}>
              <p className="text-white/90 text-lg leading-relaxed">
                {getStoryText('intro')}
              </p>
            </StoryCard>
            <ShimmerButton
              onClick={handleStartAdventure}
              shimmerColor={theme.accentColor + '66'}
              className="mt-8"
            >
              {t('story.next')}
            </ShimmerButton>
          </div>
        )}

        {/* SOLVING PHASE */}
        {storyPhase === 'solving' && (
          <div>
            <StoryCard emoji={theme.emoji} themeConfig={theme} compact>
              <p className="text-white/80 text-base leading-relaxed">
                {getStoryText(`chapter${activeChainIndex + 1}`)}
              </p>
            </StoryCard>

            <div className="mt-6">
              <PuzzleSection
                chain={puzzle.chains[activeChainIndex]}
                chainIndex={activeChainIndex}
                answers={answers}
                onAnswer={handleAnswer}
                isCompleted={completedChains.includes(activeChainIndex)}
              />
            </div>
          </div>
        )}

        {/* CHAIN COMPLETE PHASE */}
        {storyPhase === 'chain-complete' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-3">
                  {getStoryText(`complete${activeChainIndex + 1}`)}
                </p>
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <span className="text-sm">{t('puzzle.digit')} {activeChainIndex + 1} =</span>
                  <Sparkles color={theme.accentColor} count={5}>
                    <span className="text-3xl font-bold text-green-400">
                      {puzzle.chains[activeChainIndex].targetDigit}
                    </span>
                  </Sparkles>
                </div>
              </div>
            </StoryCard>
            <ShimmerButton
              onClick={handleNextChain}
              shimmerColor={theme.accentColor + '66'}
              className="mt-8"
            >
              {t('story.next')}
            </ShimmerButton>
          </div>
        )}

        {/* ALL COMPLETE PHASE */}
        {storyPhase === 'all-complete' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-4">
                  {getStoryText(`complete${puzzle.chains.length}`)}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Sparkles color={theme.accentColor} count={8}>
                    <span className="flex gap-3">
                      {puzzle.chains.map((chain, idx) => (
                        <span
                          key={idx}
                          className="text-3xl font-bold text-green-400 animate-bounce"
                          style={{ animationDelay: `${idx * 150}ms` }}
                        >
                          {chain.targetDigit}
                        </span>
                      ))}
                    </span>
                  </Sparkles>
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
      shine={glow}
      shineColor="rgba(34,197,94,0.4)"
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

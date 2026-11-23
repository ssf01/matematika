import { useEffect, useState } from 'react';
import { PuzzleSection } from './PuzzleSection';
import { MetaPuzzleFlow } from './MetaPuzzleFlow';
import { StoryCard, useChainAnswerHandler, useFadeTransition, fadeClass } from './shared';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { ShimmerButton } from '../ui/ShimmerButton';
import { Sparkles } from '../ui/Sparkles';
import type { Puzzle } from '../../lib/types';

interface PuzzleBoardProps {
  puzzle: Puzzle;
}

/** Routes to the right flow; holds no hooks itself. */
export function PuzzleBoard({ puzzle }: PuzzleBoardProps) {
  return puzzle.meta ? <MetaPuzzleFlow puzzle={puzzle} /> : <StandardPuzzleFlow puzzle={puzzle} />;
}

type StoryPhase = 'intro' | 'solving' | 'chain-complete' | 'all-complete';

/** Where to resume after a reload, derived from persisted progress. */
function initialProgress(puzzle: Puzzle): { chain: number; phase: StoryPhase } {
  const { completedChains, answers } = useGameStore.getState();
  const next = puzzle.chains.findIndex((_, idx) => !completedChains.includes(idx));
  if (next === -1) return { chain: puzzle.chains.length - 1, phase: 'all-complete' };
  const started = completedChains.length > 0 || Object.keys(answers).length > 0;
  return { chain: next, phase: started ? 'solving' : 'intro' };
}

export const REVEAL_DELAY_MS = 2500;

export function StandardPuzzleFlow({ puzzle }: PuzzleBoardProps) {
  const { t } = useTranslation();
  const { theme, themeId } = useTheme();
  const answers = useGameStore((s) => s.answers);
  const completedChains = useGameStore((s) => s.completedChains);
  const setCurrentStep = useGameStore((s) => s.setCurrentStep);
  const handleAnswer = useChainAnswerHandler(puzzle);
  const { visible, run } = useFadeTransition();

  const [initial] = useState(() => initialProgress(puzzle));
  const [activeChainIndex, setActiveChainIndex] = useState(initial.chain);
  const [storyPhase, setStoryPhase] = useState<StoryPhase>(initial.phase);

  // When the active chain is completed, move on to the chapter ending.
  useEffect(() => {
    if (storyPhase === 'solving' && completedChains.includes(activeChainIndex)) {
      run(() =>
        setStoryPhase(
          completedChains.length >= puzzle.chains.length ? 'all-complete' : 'chain-complete',
        ),
      );
    }
  }, [completedChains, activeChainIndex, storyPhase, puzzle.chains.length, run]);

  useEffect(() => {
    if (storyPhase !== 'all-complete') return;
    const timer = setTimeout(() => setCurrentStep('reveal'), REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [storyPhase, setCurrentStep]);

  const handleNextChain = () =>
    run(() => {
      const next = puzzle.chains.findIndex((_, idx) => !completedChains.includes(idx));
      if (next === -1) {
        setStoryPhase('all-complete');
      } else {
        setActiveChainIndex(next);
        setStoryPhase('solving');
      }
    });

  const story = (key: string) => t(`story.${themeId}.${key}`);

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Chain indicators */}
      <ol className="mb-6 flex items-center justify-center gap-2" aria-label={t('puzzle.pinDigit')}>
        {puzzle.chains.map((_, idx) => {
          const done = completedChains.includes(idx);
          const active = storyPhase === 'solving' && idx === activeChainIndex;
          return (
            <li
              key={idx}
              aria-current={active ? 'step' : undefined}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                ${done
                  ? 'bg-green-500/25 text-green-400 ring-2 ring-green-500/50'
                  : active
                    ? 'bg-white/15 text-white ring-2 ring-white/40 scale-110'
                    : 'bg-white/5 text-white/30'}`}
            >
              {done ? '✓' : idx + 1}
            </li>
          );
        })}
      </ol>

      <div className={`transition-all duration-300 ease-out ${fadeClass(visible)}`}>
        {storyPhase === 'intro' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme}>
              <p className="text-white/90 text-lg leading-relaxed">{story('intro')}</p>
            </StoryCard>
            <ShimmerButton
              onClick={() => run(() => setStoryPhase('solving'))}
              shimmerColor={theme.accentColor + '66'}
              className="mt-8"
            >
              {t('story.next')}
            </ShimmerButton>
          </div>
        )}

        {storyPhase === 'solving' && (
          <div>
            <StoryCard emoji={theme.emoji} themeConfig={theme} compact>
              <p className="text-white/80 text-base leading-relaxed">
                {story(`chapter${activeChainIndex + 1}`)}
              </p>
            </StoryCard>
            <div className="mt-6">
              <PuzzleSection
                key={activeChainIndex}
                chain={puzzle.chains[activeChainIndex]}
                chainIndex={activeChainIndex}
                answers={answers}
                onAnswer={handleAnswer}
                isCompleted={completedChains.includes(activeChainIndex)}
              />
            </div>
          </div>
        )}

        {storyPhase === 'chain-complete' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-3">
                  {story(`complete${activeChainIndex + 1}`)}
                </p>
                <div className="flex items-center justify-center gap-2 text-white/60">
                  <span className="text-sm">
                    {t('puzzle.digit')} {activeChainIndex + 1} =
                  </span>
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

        {storyPhase === 'all-complete' && (
          <div className="flex flex-col items-center justify-center mt-8">
            <StoryCard emoji={theme.emoji} themeConfig={theme} glow>
              <div className="text-center">
                <p className="text-green-400 text-xl font-bold mb-4">
                  {story(`complete${puzzle.chains.length}`)}
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

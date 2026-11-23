import { useEffect, useState } from 'react';
import { PuzzleSection } from './PuzzleSection';
import { MetaPuzzleFlow } from './MetaPuzzleFlow';
import { StoryCard, useChainAnswerHandler, useFadeTransition, fadeClass } from './shared';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { Button } from '../ui/Button';
import { Sparkles } from '../ui/Sparkles';
import { TopBarSlot } from '../ui/TopBar';
import { DigitChips } from './DigitChips';
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
  const foundDigits = puzzle.chains.map((chain, idx) =>
    completedChains.includes(idx) ? chain.targetDigit : null,
  );

  return (
    <div className="screen-h w-full max-w-2xl mx-auto px-4 pt-4 pb-10 sm:pt-6">
      <TopBarSlot>
        <DigitChips digits={foundDigits} activeIndex={storyPhase === 'solving' ? activeChainIndex : null} />
      </TopBarSlot>

      <div className={`transition-all duration-300 ease-out ${fadeClass(visible)}`}>
        {storyPhase === 'intro' && (
          <div className="flex flex-col items-center pt-4 sm:pt-10">
            <StoryCard emoji={theme.emoji}>
              <p className="text-white text-xl sm:text-2xl leading-relaxed font-medium">{story('intro')}</p>
            </StoryCard>
            <Button size="lg" onClick={() => run(() => setStoryPhase('solving'))} className="mt-6 w-full sm:w-auto sm:min-w-64">
              {t('story.next')}
            </Button>
          </div>
        )}

        {storyPhase === 'solving' && (
          <div className="space-y-4">
            <StoryCard emoji={theme.emoji} compact>
              <p className="text-white text-base sm:text-lg leading-snug">
                {story(`chapter${activeChainIndex + 1}`)}
              </p>
            </StoryCard>
            <PuzzleSection
              key={activeChainIndex}
              chain={puzzle.chains[activeChainIndex]}
              chainIndex={activeChainIndex}
              answers={answers}
              onAnswer={handleAnswer}
              isCompleted={completedChains.includes(activeChainIndex)}
            />
          </div>
        )}

        {storyPhase === 'chain-complete' && (
          <div className="flex flex-col items-center pt-4 sm:pt-10">
            <StoryCard emoji={theme.emoji} glow>
              <p className="text-accent text-2xl sm:text-3xl font-black mb-5">
                {story(`complete${activeChainIndex + 1}`)}
              </p>
              <div className="flex flex-col items-center gap-2">
                <span className="text-white/90 text-lg font-bold">
                  {t('puzzle.digit')} {activeChainIndex + 1}
                </span>
                <Sparkles color="var(--th-accent)" count={6}>
                  <span className="num inline-flex w-24 h-28 rounded-3xl accent-gradient text-on-accent items-center justify-center text-7xl font-black shadow-xl shadow-black/30 animate-digit-reveal">
                    {puzzle.chains[activeChainIndex].targetDigit}
                  </span>
                </Sparkles>
              </div>
            </StoryCard>
            <Button size="lg" onClick={handleNextChain} className="mt-6 w-full sm:w-auto sm:min-w-64">
              {t('story.next')}
            </Button>
          </div>
        )}

        {storyPhase === 'all-complete' && (
          <div className="flex flex-col items-center pt-4 sm:pt-10">
            <StoryCard emoji={theme.emoji} glow>
              <p className="text-accent text-2xl sm:text-3xl font-black mb-5">
                {story(`complete${puzzle.chains.length}`)}
              </p>
              <Sparkles color="var(--th-accent)" count={8}>
                <span className="flex gap-2 sm:gap-3">
                  {puzzle.chains.map((chain, idx) => (
                    <span
                      key={idx}
                      className="num inline-flex w-16 h-20 sm:w-20 sm:h-24 rounded-2xl accent-gradient text-on-accent items-center justify-center text-5xl sm:text-6xl font-black shadow-lg shadow-black/30 animate-digit-reveal"
                      style={{ animationDelay: `${idx * 150}ms` }}
                    >
                      {chain.targetDigit}
                    </span>
                  ))}
                </span>
              </Sparkles>
            </StoryCard>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { MathStep } from './MathStep';
import type { StepState } from './MathStep';
import { CorrectAnswerEffect } from './CorrectAnswerEffect';
import { BorderBeam } from '../ui/BorderBeam';
import { Sparkles } from '../ui/Sparkles';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import { isStepSolved } from './shared';
import type { PuzzleChain } from '../../lib/types';
import { Card } from '../ui/Card';

interface PuzzleSectionProps {
  chain: PuzzleChain;
  chainIndex: number;
  answers: Record<string, number | null>;
  onAnswer: (chainIdx: number, stepIdx: number, value: number) => boolean;
  isCompleted: boolean;
  /** Heading; defaults to "Цифра N". */
  title?: string;
  /** Label before the final value once solved; defaults to "Цифра". */
  resultLabel?: string;
  /** Hint under the steps for last-digit chains; defaults to the PIN hint. */
  hint?: string;
}

export function PuzzleSection({
  chain,
  chainIndex,
  answers,
  onAnswer,
  isCompleted,
  title,
  resultLabel,
  hint,
}: PuzzleSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCompleted = useRef(isCompleted);
  const endBurst = useCallback(() => setJustCompleted(false), []);

  useEffect(() => {
    if (isCompleted && !prevCompleted.current) setJustCompleted(true);
    prevCompleted.current = isCompleted;
  }, [isCompleted]);

  // Steps are solved strictly in order, whatever the chain mode
  // ('full', 'onesDigit' or 'independent'): the first unsolved step is active.
  const solved = chain.steps.map((s, i) => isStepSolved(answers, chainIndex, i, s.result));
  const activeStep = solved.findIndex((done) => !done);

  const stateOf = (i: number): StepState =>
    solved[i] && (activeStep === -1 || i < activeStep) ? 'done' : i === activeStep ? 'active' : 'locked';

  const heading = title ?? `${t('puzzle.digit')} ${chainIndex + 1}`;
  const finalLabel = resultLabel ?? t('puzzle.digit');

  return (
    <Card
      className={`relative transition-all duration-300 overflow-hidden ${isCompleted ? 'ring-2 ring-green-500/50' : ''}`}
      glow={isCompleted}
      shine={isCompleted}
      shineColor="rgba(34,197,94,0.4)"
    >
      {!isCompleted && activeStep >= 0 && (
        <BorderBeam colorFrom={theme.accentColor} colorTo={theme.glowColor} duration="3s" />
      )}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg">{heading}</h3>
        {isCompleted && <span className="text-green-400 text-xl" aria-hidden="true">✓</span>}
      </div>

      <div className="space-y-3">
        {chain.steps.map((step, stepIdx) => (
          <MathStep
            key={stepIdx}
            step={step}
            stepIndex={stepIdx}
            state={stateOf(stepIdx)}
            answer={answers[`${chainIndex}-${stepIdx}`]}
            onCorrect={(value) => onAnswer(chainIndex, stepIdx, value)}
          />
        ))}
      </div>

      {chain.useLastDigit && !isCompleted && (
        <p className="mt-4 text-xs text-white/50 italic">{hint ?? t('puzzle.multiplicationHint')}</p>
      )}

      <div aria-live="polite">
        {isCompleted && (
          <div className="relative mt-3 pt-3 border-t border-white/10 text-center">
            <span className="text-white/60 text-sm">{finalLabel} = </span>
            <Sparkles color="#22c55e" count={4}>
              <span className="text-2xl font-bold text-green-400">{chain.targetDigit}</span>
            </Sparkles>
            {justCompleted && (
              <CorrectAnswerEffect emojis={theme.rewardEmojis} burst onComplete={endBurst} />
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

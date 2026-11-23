import { useState, useEffect, useRef, useCallback } from 'react';
import { MathStep } from './MathStep';
import type { StepState } from './MathStep';
import { CorrectAnswerEffect } from './CorrectAnswerEffect';
import { Sparkles } from '../ui/Sparkles';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import { isStepSolved } from './shared';
import type { PuzzleChain } from '../../lib/types';

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
  const doneCount = activeStep === -1 ? chain.steps.length : activeStep;
  const total = chain.steps.length;

  const heading = title ?? `${t('puzzle.digit')} ${chainIndex + 1}`;
  const finalLabel = resultLabel ?? t('puzzle.digit');

  return (
    <section
      className={`surface relative rounded-3xl p-3 sm:p-5 transition-[border-color,box-shadow] duration-300
        ${isCompleted ? 'border-2 border-success! shadow-[0_0_40px_-10px_var(--color-success)]' : ''}`}
    >
      <div className="flex items-center justify-between gap-3 px-1 mb-2">
        <h3 className="font-black text-xl sm:text-2xl flex items-center gap-2 min-w-0">
          <span aria-hidden="true" className="text-2xl">{theme.emoji}</span>
          <span className="truncate">{heading}</span>
        </h3>
        <span
          className={`num shrink-0 rounded-full px-3 py-1 text-base font-black
            ${isCompleted ? 'bg-success text-green-950' : 'bg-white/12 text-white'}`}
        >
          <span aria-hidden="true">
            {isCompleted ? '✓ ' : ''}
            {doneCount}/{total}
          </span>
          <span className="sr-only">{t('a11y.stepsSolved', { done: doneCount, total })}</span>
        </span>
      </div>

      {/* Decorative per-chain progress (the pill above carries the accessible text). */}
      <div aria-hidden="true" className="mx-1 mb-3 h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out ${isCompleted ? 'bg-success' : 'accent-gradient'}`}
          style={{ width: `${Math.round((doneCount / total) * 100)}%` }}
        />
      </div>

      <div className="space-y-2">
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
        <p className="mt-4 mx-1 flex gap-2 items-start rounded-2xl bg-accent/12 border border-accent/40 px-3 py-2 text-base text-white">
          <span aria-hidden="true">💡</span>
          <span>{hint ?? t('puzzle.multiplicationHint')}</span>
        </p>
      )}

      <div aria-live="polite">
        {isCompleted && (
          <div className="relative mt-4 pt-4 border-t border-white/15 flex items-center justify-center gap-3">
            <span className="text-white/90 text-lg font-bold">{finalLabel} =</span>
            <Sparkles color="var(--th-accent)" count={4}>
              <span className="num inline-flex w-14 h-16 rounded-2xl accent-gradient text-on-accent items-center justify-center text-4xl font-black animate-digit-reveal">
                {chain.targetDigit}
              </span>
            </Sparkles>
            {justCompleted && (
              <CorrectAnswerEffect emojis={theme.rewardEmojis} burst onComplete={endBurst} />
            )}
          </div>
        )}
      </div>
    </section>
  );
}

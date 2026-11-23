import { useCallback, useEffect, useRef, useState } from 'react';
import { AnswerInput } from './AnswerInput';
import { CorrectAnswerEffect } from './CorrectAnswerEffect';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import { opSymbol } from './format';
import type { MathStep as MathStepType } from '../../lib/types';

export type StepState = 'locked' | 'active' | 'done';

/** Shared row grid so operands, operators and answers line up across rows. */
const ROW = `num grid grid-cols-[minmax(2ch,auto)_1ch_minmax(2ch,auto)_1ch_1fr] items-center
  gap-x-2 sm:gap-x-3 rounded-2xl px-3 sm:px-4 text-3xl sm:text-4xl font-bold`;

interface MathStepProps {
  step: MathStepType;
  stepIndex: number;
  state: StepState;
  /** The stored (correct) answer, shown for solved steps. */
  answer?: number | null;
  onCorrect: (value: number) => void;
}

export function MathStep({ step, stepIndex, state, answer, onCorrect }: MathStepProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const rowRef = useRef<HTMLDivElement>(null);
  const prevState = useRef(state);
  const [celebrate, setCelebrate] = useState(false);
  const op = opSymbol(step.operator);
  const endCelebrate = useCallback(() => setCelebrate(false), []);

  useEffect(() => {
    if (prevState.current === 'active' && state === 'done') setCelebrate(true);
    prevState.current = state;
    if (state === 'active' && stepIndex > 0) {
      rowRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  }, [state, stepIndex]);

  if (state === 'locked') {
    // Never render a locked step's numbers: they would leak earlier answers.
    return (
      <div
        className={`${ROW} py-1.5 opacity-45 select-none`}
        aria-hidden="true"
        data-testid="step-locked"
      >
        <span className="text-right text-white/70">?</span>
        <span className="text-center text-white/70">{op}</span>
        <span className="text-white/70">?</span>
        <span className="text-center text-white/60">=</span>
        <span className="block w-20 h-12 rounded-xl border-2 border-dashed border-white/35" />
      </div>
    );
  }

  const active = state === 'active';
  return (
    <div
      ref={rowRef}
      className={`${ROW} transition-colors duration-300
        ${active
          ? 'py-3 bg-white/12 border-2 border-accent shadow-[0_0_0_4px_color-mix(in_oklab,var(--th-accent)_20%,transparent)] has-[[role=status]:not(:empty)]:pb-12'
          : `py-1.5 border-2 border-transparent ${celebrate ? 'animate-flash-success' : ''}`}`}
      data-testid={active ? 'step-active' : 'step-done'}
    >
      <span className={`text-right ${active ? 'text-white' : 'text-white/85'}`}>{step.left}</span>
      <span className={`text-center ${active ? 'text-accent' : 'text-white/70'}`}>{op}</span>
      <span className={active ? 'text-white' : 'text-white/85'}>{step.right}</span>
      <span className="text-center text-white/70">=</span>
      {active ? (
        <AnswerInput
          expected={step.result}
          onCorrect={onCorrect}
          label={`${t('a11y.answer')}: ${step.left} ${op} ${step.right}`}
          autoFocus
        />
      ) : (
        <span
          className={`relative inline-flex items-center justify-center w-20 h-12 rounded-xl
            bg-success/15 border-2 border-success/70 text-success font-black ${celebrate ? 'animate-pop' : ''}`}
        >
          {answer ?? step.result}
          {celebrate && (
            <CorrectAnswerEffect emojis={theme.rewardEmojis} onComplete={endCelebrate} />
          )}
        </span>
      )}
    </div>
  );
}

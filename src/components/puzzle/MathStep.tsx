import { useCallback, useEffect, useRef, useState } from 'react';
import { AnswerInput } from './AnswerInput';
import { CorrectAnswerEffect } from './CorrectAnswerEffect';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import { opSymbol } from './format';
import type { MathStep as MathStepType } from '../../lib/types';

export type StepState = 'locked' | 'active' | 'done';

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
        className="flex items-center gap-2 text-2xl font-mono py-2 opacity-30 select-none"
        aria-hidden="true"
        data-testid="step-locked"
      >
        <span className="text-white/60 min-w-[2ch] text-right">?</span>
        <span className="text-white/50">{op}</span>
        <span className="text-white/60 min-w-[2ch]">?</span>
        <span className="text-white/40">=</span>
        <span className="inline-block w-20 h-14 rounded-lg border-2 border-dashed border-white/20" />
      </div>
    );
  }

  return (
    <div
      ref={rowRef}
      className="flex items-center gap-2 text-2xl font-mono py-2 transition-all duration-300"
      data-testid={state === 'active' ? 'step-active' : 'step-done'}
    >
      <span className="text-white/80 min-w-[2ch] text-right">{step.left}</span>
      <span className="text-white/60">{op}</span>
      <span className="text-white/80 min-w-[2ch]">{step.right}</span>
      <span className="text-white/40">=</span>
      {state === 'active' ? (
        <AnswerInput
          expected={step.result}
          onCorrect={onCorrect}
          label={`${t('a11y.answer')}: ${step.left} ${op} ${step.right}`}
          autoFocus
        />
      ) : (
        <span
          className="relative inline-flex items-center justify-center w-20 h-14 rounded-lg
            bg-green-500/20 border-2 border-green-500 text-2xl font-bold animate-glow"
          style={{ color: '#22c55e' }}
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

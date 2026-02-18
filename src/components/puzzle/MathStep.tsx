import React from 'react';
import { AnswerInput } from './AnswerInput';
import type { MathStep as MathStepType } from '../../lib/types';

interface MathStepProps {
  step: MathStepType;
  stepIndex: number;
  isActive: boolean;
  isCompleted: boolean;
  onAnswer: (value: number) => boolean;
}

const OP_SYMBOLS: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

export function MathStep({ step, stepIndex, isActive, isCompleted, onAnswer }: MathStepProps) {
  return (
    <div className={`flex items-center gap-2 text-2xl font-mono py-2 transition-all duration-300
      ${!isActive && !isCompleted ? 'opacity-30 blur-[2px]' : ''}`}>
      <span className="text-white/80 min-w-[2ch] text-right">{step.left}</span>
      <span className="text-white/60">{OP_SYMBOLS[step.operator] || step.operator}</span>
      <span className="text-white/80 min-w-[2ch]">{step.right}</span>
      <span className="text-white/40">=</span>
      <AnswerInput
        onSubmit={onAnswer}
        isCorrect={isCompleted ? true : null}
        disabled={!isActive}
        autoFocus={isActive}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { MathStep } from './MathStep';
import { CorrectAnswerEffect } from './CorrectAnswerEffect';
import { BorderBeam } from '../ui/BorderBeam';
import { Sparkles } from '../ui/Sparkles';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import type { PuzzleChain } from '../../lib/types';
import { Card } from '../ui/Card';

interface PuzzleSectionProps {
  chain: PuzzleChain;
  chainIndex: number;
  answers: Record<string, number | null>;
  onAnswer: (chainIdx: number, stepIdx: number, value: number) => boolean;
  isCompleted: boolean;
}

export function PuzzleSection({ chain, chainIndex, answers, onAnswer, isCompleted }: PuzzleSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [justCompleted, setJustCompleted] = useState(false);
  const prevCompleted = useRef(isCompleted);

  useEffect(() => {
    if (isCompleted && !prevCompleted.current) {
      setJustCompleted(true);
    }
    prevCompleted.current = isCompleted;
  }, [isCompleted]);

  const isStepCompleted = (stepIdx: number) => {
    const answer = answers[`${chainIndex}-${stepIdx}`];
    return answer !== null && answer !== undefined && answer === chain.steps[stepIdx].result;
  };

  const getActiveStepIndex = () => {
    for (let i = 0; i < chain.steps.length; i++) {
      if (!isStepCompleted(i)) return i;
    }
    return -1;
  };

  const activeStep = getActiveStepIndex();

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
        <h3 className="font-bold text-lg">
          {t(`puzzle.digit`)} {chainIndex + 1}
        </h3>
        {isCompleted && (
          <span className="text-green-400 text-xl">✓</span>
        )}
      </div>

      <div className="space-y-1">
        {chain.steps.map((step, stepIdx) => (
          <MathStep
            key={stepIdx}
            step={step}
            stepIndex={stepIdx}
            isActive={stepIdx === activeStep}
            isCompleted={isStepCompleted(stepIdx)}
            onAnswer={(value) => onAnswer(chainIndex, stepIdx, value)}
          />
        ))}
      </div>

      {chain.useLastDigit && !isCompleted && (
        <p className="mt-2 text-xs text-white/40 italic">{t('puzzle.multiplicationHint')}</p>
      )}

      {isCompleted && (
        <div className="relative mt-3 pt-3 border-t border-white/10 text-center">
          <span className="text-white/60 text-sm">{t('puzzle.digit')} = </span>
          <Sparkles color="#22c55e" count={4}>
            <span className="text-2xl font-bold text-green-400">
              {chain.targetDigit}
            </span>
          </Sparkles>
          {justCompleted && (
            <CorrectAnswerEffect
              emojis={theme.rewardEmojis}
              burst
              onComplete={() => setJustCompleted(false)}
            />
          )}
        </div>
      )}
    </Card>
  );
}

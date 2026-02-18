import React, { useEffect } from 'react';
import { PuzzleSection } from './PuzzleSection';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { ProgressBar } from '../ui/ProgressBar';
import { validateStep } from '../../lib/validator';
import type { Puzzle } from '../../lib/types';

interface PuzzleBoardProps {
  puzzle: Puzzle;
}

export function PuzzleBoard({ puzzle }: PuzzleBoardProps) {
  const { t } = useTranslation();
  const answers = useGameStore((s) => s.answers);
  const completedChains = useGameStore((s) => s.completedChains);
  const setAnswer = useGameStore((s) => s.setAnswer);
  const markChainCompleted = useGameStore((s) => s.markChainCompleted);
  const setCurrentStep = useGameStore((s) => s.setCurrentStep);

  useEffect(() => {
    if (completedChains.length >= puzzle.chains.length) {
      const timer = setTimeout(() => setCurrentStep('reveal'), 800);
      return () => clearTimeout(timer);
    }
  }, [completedChains.length, puzzle.chains.length, setCurrentStep]);

  const handleAnswer = (chainIdx: number, stepIdx: number, value: number): boolean => {
    const step = puzzle.chains[chainIdx].steps[stepIdx];
    const correct = validateStep(step, value);

    if (correct) {
      setAnswer(chainIdx, stepIdx, value);

      // Check if this was the last step in the chain
      const chain = puzzle.chains[chainIdx];
      const allDone = chain.steps.every((s, i) => {
        if (i === stepIdx) return true; // the one we just answered
        const ans = answers[`${chainIdx}-${i}`];
        return ans !== null && ans !== undefined && ans === s.result;
      });

      if (allDone) {
        markChainCompleted(chainIdx);
      }
    }

    return correct;
  };

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <ProgressBar current={completedChains.length} total={puzzle.chains.length} />
        <p className="text-center text-white/50 text-sm mt-2">
          {completedChains.length} / {puzzle.chains.length}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {puzzle.chains.map((chain, idx) => (
          <PuzzleSection
            key={idx}
            chain={chain}
            chainIndex={idx}
            answers={answers}
            onAnswer={handleAnswer}
            isCompleted={completedChains.includes(idx)}
          />
        ))}
      </div>
    </div>
  );
}

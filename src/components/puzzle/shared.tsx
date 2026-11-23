import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Card } from '../ui/Card';
import { useGameStore } from '../../stores/gameStore';
import { validateStep } from '../../lib/validator';
import type { Puzzle } from '../../lib/types';

/* ─── Story card ─── */

interface StoryCardProps {
  children: ReactNode;
  emoji: string;
  themeConfig: { glowColor: string };
  compact?: boolean;
  glow?: boolean;
}

export function StoryCard({ children, emoji, themeConfig, compact, glow }: StoryCardProps) {
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
          <span
            aria-hidden="true"
            className={compact ? 'text-3xl flex-shrink-0 mt-0.5' : 'text-6xl mb-2 animate-float'}
          >
            {emoji}
          </span>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Answer handling shared by the standard and meta flows ─── */

export type ChainAnswerHandler = (chainIdx: number, stepIdx: number, value: number) => boolean;

/**
 * Validates an answer, stores it and marks the chain complete once every step
 * has a correct stored answer. Reads fresh store state so rapid answers never
 * see a stale `answers` snapshot.
 */
export function useChainAnswerHandler(puzzle: Puzzle): ChainAnswerHandler {
  const setAnswer = useGameStore((s) => s.setAnswer);
  const markChainCompleted = useGameStore((s) => s.markChainCompleted);

  return useCallback(
    (chainIdx, stepIdx, value) => {
      const chain = puzzle.chains[chainIdx];
      const step = chain?.steps[stepIdx];
      if (!step || !validateStep(step, value)) return false;

      setAnswer(chainIdx, stepIdx, value);
      const answers = useGameStore.getState().answers;
      const allDone = chain.steps.every((s, i) => answers[`${chainIdx}-${i}`] === s.result);
      if (allDone) markChainCompleted(chainIdx);
      return true;
    },
    [puzzle, setAnswer, markChainCompleted],
  );
}

export function isStepSolved(
  answers: Record<string, number | null>,
  chainIdx: number,
  stepIdx: number,
  expected: number,
): boolean {
  return answers[`${chainIdx}-${stepIdx}`] === expected;
}

/* ─── Fade transition between phases ─── */

export const TRANSITION_MS = 300;

/**
 * Fade-out → callback → fade-in. While a transition is running further calls
 * are ignored (so double taps can't fire an action twice). Timer is cleared on
 * unmount.
 */
export function useFadeTransition(ms = TRANSITION_MS) {
  const [visible, setVisible] = useState(true);
  const busy = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const run = useCallback(
    (callback: () => void): boolean => {
      if (busy.current) return false;
      busy.current = true;
      setVisible(false);
      timer.current = setTimeout(() => {
        timer.current = null;
        callback();
        setVisible(true);
        busy.current = false;
      }, ms);
      return true;
    },
    [ms],
  );

  const isBusy = useCallback(() => busy.current, []);

  return { visible, run, isBusy };
}

export const fadeClass = (visible: boolean) =>
  visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4';

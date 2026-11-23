import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { validateStep } from '../../lib/validator';
import type { Puzzle } from '../../lib/types';

/* ─── Story card ─── */

interface StoryCardProps {
  children: ReactNode;
  emoji: string;
  /** Small inline card (emoji left of the text) shown above the puzzle. */
  compact?: boolean;
  /** Success styling (chain / digit found). */
  glow?: boolean;
}

export function StoryCard({ children, emoji, compact, glow }: StoryCardProps) {
  const frame = glow
    ? 'border-2 border-accent shadow-[0_0_40px_-8px_var(--th-accent)]'
    : '';
  if (compact) {
    return (
      <div className={`surface rounded-3xl p-4 flex items-start gap-3 ${frame}`}>
        <span
          aria-hidden="true"
          className="shrink-0 w-12 h-12 rounded-2xl bg-accent/20 ring-2 ring-accent/50 flex items-center justify-center text-2xl"
        >
          {emoji}
        </span>
        <div className="flex-1 min-w-0 self-center">{children}</div>
      </div>
    );
  }
  return (
    <div className={`surface w-full rounded-3xl px-5 pt-8 pb-6 sm:px-8 flex flex-col items-center text-center ${frame}`}>
      <span
        aria-hidden="true"
        className="mb-4 w-24 h-24 rounded-full bg-accent/15 ring-4 ring-accent/50 flex items-center justify-center
          text-6xl shadow-[0_0_48px_-6px_var(--th-accent)] animate-float"
      >
        {emoji}
      </span>
      <div className="w-full">{children}</div>
    </div>
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

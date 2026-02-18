import { describe, it, expect } from 'vitest';
import { validateStep, validateChain, getChainFinalDigit, validateMultiplicationAnswer } from './validator';
import type { MathStep, PuzzleChain } from './types';

describe('validateStep', () => {
  it('returns true for correct answer', () => {
    const step: MathStep = { left: 3, operator: '+', right: 4, result: 7 };
    expect(validateStep(step, 7)).toBe(true);
  });

  it('returns false for incorrect answer', () => {
    const step: MathStep = { left: 3, operator: '+', right: 4, result: 7 };
    expect(validateStep(step, 8)).toBe(false);
  });

  it('returns false for zero when answer is nonzero', () => {
    const step: MathStep = { left: 5, operator: '-', right: 5, result: 0 };
    expect(validateStep(step, 1)).toBe(false);
  });

  it('returns true for zero answer', () => {
    const step: MathStep = { left: 5, operator: '-', right: 5, result: 0 };
    expect(validateStep(step, 0)).toBe(true);
  });
});

describe('validateChain', () => {
  const chain: PuzzleChain = {
    targetDigit: 7,
    steps: [
      { left: 2, operator: '+', right: 8, result: 10 },
      { left: 10, operator: '-', right: 4, result: 6 },
      { left: 6, operator: '+', right: 1, result: 7 },
    ],
  };

  it('returns true for all correct answers', () => {
    expect(validateChain(chain, [10, 6, 7])).toBe(true);
  });

  it('returns false for one wrong answer', () => {
    expect(validateChain(chain, [10, 5, 7])).toBe(false);
  });

  it('returns false for wrong length', () => {
    expect(validateChain(chain, [10, 6])).toBe(false);
  });

  it('returns false for empty answers', () => {
    expect(validateChain(chain, [])).toBe(false);
  });
});

describe('getChainFinalDigit', () => {
  it('returns the last step result', () => {
    const chain: PuzzleChain = {
      targetDigit: 5,
      steps: [
        { left: 2, operator: '+', right: 1, result: 3 },
        { left: 3, operator: '+', right: 2, result: 5 },
      ],
    };
    expect(getChainFinalDigit(chain)).toBe(5);
  });

  it('returns targetDigit for empty chain', () => {
    const chain: PuzzleChain = { targetDigit: 3, steps: [] };
    expect(getChainFinalDigit(chain)).toBe(3);
  });
});

describe('validateMultiplicationAnswer', () => {
  it('returns true for correct multiplication', () => {
    expect(validateMultiplicationAnswer(7, 8, 56)).toBe(true);
  });

  it('returns false for incorrect multiplication', () => {
    expect(validateMultiplicationAnswer(7, 8, 54)).toBe(false);
  });

  it('handles zero correctly', () => {
    expect(validateMultiplicationAnswer(0, 5, 0)).toBe(true);
    expect(validateMultiplicationAnswer(5, 0, 0)).toBe(true);
  });
});

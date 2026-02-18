import { describe, it, expect } from 'vitest';
import { generateChain, generatePuzzle, generateMultiplicationTable, randInt, shuffle } from './generator';
import { DIFFICULTY_CONSTRAINTS } from './constants';
import type { Difficulty, Operation } from './types';

describe('randInt', () => {
  it('returns values within range', () => {
    for (let i = 0; i < 100; i++) {
      const val = randInt(3, 7);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
    }
  });

  it('returns exact value when min === max', () => {
    expect(randInt(5, 5)).toBe(5);
  });
});

describe('shuffle', () => {
  it('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const shuffled = shuffle([...arr]);
    expect(shuffled.sort()).toEqual(arr.sort());
  });

  it('returns same length', () => {
    const arr = [1, 2, 3];
    expect(shuffle([...arr])).toHaveLength(3);
  });
});

describe('generateChain', () => {
  const allOps: Operation[] = ['+', '-', '*', '/'];

  it('generates a chain for each digit 0-9 (easy)', () => {
    for (let digit = 0; digit <= 9; digit++) {
      const chain = generateChain(digit, 'easy', ['+', '-']);
      expect(chain.targetDigit).toBe(digit);
      expect(chain.steps.length).toBeGreaterThanOrEqual(6);
      expect(chain.steps.length).toBeLessThanOrEqual(9);
      // Last step result must equal target digit
      expect(chain.steps[chain.steps.length - 1].result).toBe(digit);
    }
  });

  it('generates a chain for each digit 0-9 (medium)', () => {
    for (let digit = 0; digit <= 9; digit++) {
      const chain = generateChain(digit, 'medium', ['+', '-']);
      expect(chain.targetDigit).toBe(digit);
      expect(chain.steps[chain.steps.length - 1].result).toBe(digit);
    }
  });

  it('generates a chain for each digit 0-9 (hard)', () => {
    for (let digit = 0; digit <= 9; digit++) {
      const chain = generateChain(digit, 'hard', ['+', '-']);
      expect(chain.targetDigit).toBe(digit);
      expect(chain.steps[chain.steps.length - 1].result).toBe(digit);
    }
  });

  it('respects easy mode constraints (values ≤ 10)', () => {
    for (let i = 0; i < 20; i++) {
      const chain = generateChain(randInt(0, 9), 'easy', ['+', '-']);
      for (const step of chain.steps) {
        expect(step.left).toBeGreaterThanOrEqual(0);
        expect(step.left).toBeLessThanOrEqual(10);
        expect(step.right).toBeGreaterThanOrEqual(0);
        expect(step.right).toBeLessThanOrEqual(10);
        expect(step.result).toBeGreaterThanOrEqual(0);
        expect(step.result).toBeLessThanOrEqual(10);
      }
    }
  });

  it('respects medium mode constraints (values ≤ 18)', () => {
    for (let i = 0; i < 20; i++) {
      const chain = generateChain(randInt(0, 9), 'medium', ['+', '-']);
      for (const step of chain.steps) {
        expect(step.left).toBeGreaterThanOrEqual(0);
        expect(step.left).toBeLessThanOrEqual(18);
        expect(step.result).toBeGreaterThanOrEqual(0);
        expect(step.result).toBeLessThanOrEqual(18);
      }
    }
  });

  it('chains are mathematically valid (each step computes correctly)', () => {
    const difficulties: Difficulty[] = ['easy', 'medium', 'hard'];
    for (const diff of difficulties) {
      for (let digit = 0; digit <= 9; digit++) {
        const chain = generateChain(digit, diff, ['+', '-']);
        for (const step of chain.steps) {
          let expected: number;
          switch (step.operator) {
            case '+': expected = step.left + step.right; break;
            case '-': expected = step.left - step.right; break;
            case '*': expected = step.left * step.right; break;
            case '/': expected = step.left / step.right; break;
            default: expected = NaN;
          }
          expect(step.result).toBe(expected);
        }
      }
    }
  });

  it('works with multiplication and division', () => {
    for (let digit = 1; digit <= 9; digit++) {
      const chain = generateChain(digit, 'medium', ['*', '/']);
      expect(chain.targetDigit).toBe(digit);
      // With independent chain generation, last step's ones digit equals target
      const lastResult = chain.steps[chain.steps.length - 1].result;
      if (chain.useLastDigit) {
        expect(lastResult % 10).toBe(digit);
      } else {
        expect(lastResult).toBe(digit);
      }
      // All division results should be integers
      for (const step of chain.steps) {
        if (step.operator === '/') {
          expect(Number.isInteger(step.result)).toBe(true);
        }
      }
    }
  });

  it('handles digit 0 correctly', () => {
    for (let i = 0; i < 10; i++) {
      const chain = generateChain(0, 'easy', ['+', '-']);
      expect(chain.targetDigit).toBe(0);
      expect(chain.steps[chain.steps.length - 1].result).toBe(0);
    }
  });
});

describe('generatePuzzle', () => {
  it('generates correct number of chains for 4-digit PIN', () => {
    const puzzle = generatePuzzle('1234', 'easy', ['+', '-']);
    expect(puzzle.pin).toBe('1234');
    expect(puzzle.chains).toHaveLength(4);
    expect(puzzle.chains[0].targetDigit).toBe(1);
    expect(puzzle.chains[1].targetDigit).toBe(2);
    expect(puzzle.chains[2].targetDigit).toBe(3);
    expect(puzzle.chains[3].targetDigit).toBe(4);
  });

  it('handles PIN with zeros', () => {
    const puzzle = generatePuzzle('0000', 'easy', ['+', '-']);
    expect(puzzle.chains).toHaveLength(4);
    for (const chain of puzzle.chains) {
      expect(chain.targetDigit).toBe(0);
      expect(chain.steps[chain.steps.length - 1].result).toBe(0);
    }
  });

  it('handles PIN with all 9s', () => {
    const puzzle = generatePuzzle('9999', 'medium', ['+', '-']);
    for (const chain of puzzle.chains) {
      expect(chain.targetDigit).toBe(9);
      expect(chain.steps[chain.steps.length - 1].result).toBe(9);
    }
  });
});

describe('generateMultiplicationTable', () => {
  it('generates 10 problems by default', () => {
    const steps = generateMultiplicationTable(7);
    expect(steps).toHaveLength(10);
  });

  it('contains all multipliers 1-10', () => {
    const steps = generateMultiplicationTable(5);
    const rights = steps.map((s) => s.right).sort((a, b) => a - b);
    expect(rights).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('all results are correct', () => {
    const num = 8;
    const steps = generateMultiplicationTable(num);
    for (const step of steps) {
      expect(step.left).toBe(num);
      expect(step.operator).toBe('*');
      expect(step.result).toBe(num * step.right);
    }
  });

  it('respects custom maxMultiplier', () => {
    const steps = generateMultiplicationTable(3, 5);
    expect(steps).toHaveLength(5);
  });
});

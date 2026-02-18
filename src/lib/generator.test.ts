import { describe, it, expect } from 'vitest';
import { generateChain, generatePuzzle, generateMultiplicationTable, generateMetaGrid, generateMetaPuzzle, randInt, shuffle } from './generator';
import { DIFFICULTY_CONSTRAINTS, META_CHAIN_LENGTH } from './constants';
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

describe('generateMetaGrid', () => {
  it('returns a 10x10 grid', () => {
    const grid = generateMetaGrid('1234');
    expect(grid.cells).toHaveLength(10);
    for (const row of grid.cells) {
      expect(row).toHaveLength(10);
    }
  });

  it('all cells contain digits 0-9', () => {
    const grid = generateMetaGrid('5678');
    for (const row of grid.cells) {
      for (const cell of row) {
        expect(cell).toBeGreaterThanOrEqual(0);
        expect(cell).toBeLessThanOrEqual(9);
      }
    }
  });

  it('PIN digits are placed at the correct coordinates', () => {
    const grid = generateMetaGrid('1234');
    for (const coord of grid.coordinates) {
      expect(grid.cells[coord.row][coord.col]).toBe(coord.pinDigit);
    }
  });

  it('all coordinates are unique (no two share the same row,col)', () => {
    const grid = generateMetaGrid('1234');
    const seen = new Set<string>();
    for (const coord of grid.coordinates) {
      const key = `${coord.row},${coord.col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
  });

  it('number of coordinates equals PIN length', () => {
    const pin = '1234';
    const grid = generateMetaGrid(pin);
    expect(grid.coordinates).toHaveLength(pin.length);
  });
});

describe('generateMetaPuzzle', () => {
  it('returns 8 chains for a 4-digit PIN (2 per digit)', () => {
    const puzzle = generateMetaPuzzle('1234', 'easy', ['+', '-']);
    expect(puzzle.chains).toHaveLength(8);
  });

  it('has a meta field with grid and coordinates', () => {
    const puzzle = generateMetaPuzzle('1234', 'easy', ['+', '-']);
    expect(puzzle.meta).toBeDefined();
    expect(puzzle.meta!.cells).toHaveLength(10);
    expect(puzzle.meta!.coordinates).toHaveLength(4);
  });

  it('chain pairs target correct row/col from meta coordinates', () => {
    const puzzle = generateMetaPuzzle('1234', 'easy', ['+', '-']);
    const meta = puzzle.meta!;
    for (let i = 0; i < meta.coordinates.length; i++) {
      const rowChain = puzzle.chains[i * 2];
      const colChain = puzzle.chains[i * 2 + 1];
      expect(rowChain.targetDigit).toBe(meta.coordinates[i].row);
      expect(colChain.targetDigit).toBe(meta.coordinates[i].col);
    }
  });

  it('all chains have reasonable step counts', () => {
    // Easy +/- uses shorter chains (5-7) to avoid repetition with small numbers
    const easyPuzzle = generateMetaPuzzle('1234', 'easy', ['+', '-']);
    for (const chain of easyPuzzle.chains) {
      expect(chain.steps.length).toBeGreaterThanOrEqual(5);
      expect(chain.steps.length).toBeLessThanOrEqual(7);
    }
    // Hard uses full META_CHAIN_LENGTH
    const hardPuzzle = generateMetaPuzzle('1234', 'hard', ['+', '-']);
    for (const chain of hardPuzzle.chains) {
      expect(chain.steps.length).toBeGreaterThanOrEqual(META_CHAIN_LENGTH.min);
      expect(chain.steps.length).toBeLessThanOrEqual(META_CHAIN_LENGTH.max);
    }
  });

  it('all steps are mathematically valid', () => {
    const puzzle = generateMetaPuzzle('1234', 'medium', ['+', '-']);
    for (const chain of puzzle.chains) {
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
  });

  it('last step result equals targetDigit for + and - chains', () => {
    // Run multiple times to catch probabilistic issues
    for (let run = 0; run < 20; run++) {
      const puzzle = generateMetaPuzzle('5079', 'easy', ['+', '-']);
      for (const chain of puzzle.chains) {
        const lastStep = chain.steps[chain.steps.length - 1];
        expect(lastStep.result).toBe(chain.targetDigit);
      }
    }
  });
});

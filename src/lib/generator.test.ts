import { describe, it, expect } from 'vitest';
import {
  generateChain,
  generatePuzzle,
  generateMultiplicationTable,
  generateMultiplicationPinChain,
  generateMultiplicationPinPuzzle,
  generateMetaGrid,
  generateMetaPuzzle,
  getChainStrategy,
  randInt,
  shuffle,
} from './generator';
import { getChainFinalDigit } from './validator';
import { mulberry32 } from './rng';
import {
  CHAIN_LENGTH,
  DIFFICULTY_CONSTRAINTS,
  META_CHAIN_LENGTH_BY_DIFFICULTY,
  MULTIPLICATION_PIN_CHAIN_LENGTH,
  MULTIPLICATION_PIN_ODD_CHAIN_LENGTH,
  MAX_CHAIN_LENGTH,
} from './constants';
import type { Difficulty, MathStep, Operation, PuzzleChain } from './types';

// ---------------------------------------------------------------------------
// Independent invariant checker (does not reuse generator internals)
// ---------------------------------------------------------------------------

const ALL_OPS: Operation[] = ['+', '-', '*', '/'];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const OP_SUBSETS: Operation[][] = Array.from({ length: 15 }, (_, i) =>
  ALL_OPS.filter((_, bit) => (i + 1) & (1 << bit)),
);

/**
 * Cases where the digit cannot be encoded within the difficulty's own facts
 * without a trivial step, so the FINAL step escalates (key: ops|difficulty|digit).
 */
const ESCALATION_EXCEPTIONS = new Set([
  '+|easy|1', // values ≤ 10: 1 is neither a non-trivial sum nor the ones digit of one → 5 + 6 = 11
  '*|easy|3', // only 7 × 9 = 63 ends in 3 → hard table fact
  '*|medium|3',
]);
/** Cases where the only in-bounds encoding is n − n = 0 or n ÷ n = 1 as the final step. */
const TRIVIAL_FINAL_EXCEPTIONS = new Set([
  '-|easy|0',
  '/|easy|1',
  '/|medium|1',
  '/|hard|1',
  '+/|easy|1',
]);

function key(ops: Operation[], difficulty: Difficulty, digit: number) {
  return `${ops.join('')}|${difficulty}|${digit}`;
}

function arithmetic(s: MathStep): number {
  switch (s.operator) {
    case '+': return s.left + s.right;
    case '-': return s.left - s.right;
    case '*': return s.left * s.right;
    case '/': return s.left / s.right;
  }
}

function isTrivial(s: MathStep): boolean {
  if (s.left === 0 || s.right === 0) return true;
  if (s.operator === '*') return s.left === 1 || s.right === 1;
  if (s.operator === '/') return s.right === 1 || s.left === s.right;
  if (s.operator === '-') return s.left === s.right;
  return false;
}

function inBounds(s: MathStep, difficulty: Difficulty): boolean {
  const c = DIFFICULTY_CONSTRAINTS[difficulty];
  const tablePair = (a: number, b: number) =>
    a >= 2 && a <= 10 && b >= 2 && b <= 10 && (c.tables.includes(a) || c.tables.includes(b));
  switch (s.operator) {
    case '+':
    case '-':
      return Math.max(s.left, s.right, s.result) <= c.maxValue && s.right >= c.minRight;
    case '*':
      return tablePair(s.left, s.right);
    case '/':
      return tablePair(s.right, s.result);
  }
}

interface Expectation {
  difficulty: Difficulty;
  ops: Operation[];
  digit: number;
  length: { min: number; max: number };
  mode: 'full' | 'onesDigit' | 'independent';
}

function factKey(s: MathStep) {
  return `${s.left}${s.operator}${s.right}`;
}

/** Throws (via expect) on any violated invariant. Returns flags for statistics. */
function checkChain(chain: PuzzleChain, e: Expectation) {
  const ctx = `${key(e.ops, e.difficulty, e.digit)} ${JSON.stringify(chain)}`;
  const fail = (msg: string) => expect.fail(`${msg}: ${ctx}`);
  const n = chain.steps.length;
  if (chain.targetDigit !== e.digit) fail('targetDigit');
  if (n < e.length.min || n > e.length.max) fail('length');
  if ((chain.chainMode ?? 'full') !== e.mode) fail('chainMode');

  const seen = new Set<string>();
  let escalated = false;
  let trivialFinal = false;
  chain.steps.forEach((s, i) => {
    const isLast = i === n - 1;
    if (!e.ops.includes(s.operator)) fail(`op ${s.operator} not selected`);
    for (const v of [s.left, s.right, s.result]) {
      if (!Number.isInteger(v) || v < 0) fail('non-negative integers');
    }
    if (arithmetic(s) !== s.result) fail('arithmetic');
    if (seen.has(factKey(s))) fail(`duplicate fact ${factKey(s)}`);
    seen.add(factKey(s));

    if (isTrivial(s)) {
      const okTrivial =
        isLast &&
        ((s.operator === '-' && s.result === 0) || (s.operator === '/' && s.result === 1)) &&
        s.left === s.right &&
        TRIVIAL_FINAL_EXCEPTIONS.has(key(e.ops, e.difficulty, e.digit));
      if (!okTrivial) fail(`trivial step ${factKey(s)}`);
      trivialFinal = true;
    } else if (e.mode === 'onesDigit') {
      if (s.operator !== '*' || s.left < 2 || s.left > 9 || s.right < 2 || s.right > 9) fail('ones-digit fact');
    } else if (!inBounds(s, e.difficulty)) {
      const higher = DIFFICULTIES.slice(DIFFICULTIES.indexOf(e.difficulty) + 1);
      if (!(isLast && ESCALATION_EXCEPTIONS.has(key(e.ops, e.difficulty, e.digit)) && higher.some((d) => inBounds(s, d)))) {
        fail(`out of ${e.difficulty} bounds ${factKey(s)}`);
      }
      escalated = true;
    }

    if (i > 0) {
      const prev = chain.steps[i - 1].result;
      if (e.mode === 'full' && s.left !== prev) fail('continuity');
      if (e.mode === 'onesDigit' && s.left !== prev % 10) fail('ones-digit continuity');
      if (e.mode === 'independent' && s.left === prev) fail('independent chain looks chained');
    }
  });

  const last = chain.steps[n - 1].result;
  if (chain.useLastDigit) {
    // A ones-digit chain may end on a one-digit product (2 × 2 = 4); otherwise the result is ≥ 10.
    if ((e.mode !== 'onesDigit' && last < 10) || last % 10 !== e.digit) fail('ones-digit encoding');
  } else if (last !== e.digit) {
    fail('exact encoding');
  }
  if (getChainFinalDigit(chain) !== e.digit) fail('getChainFinalDigit');
  return { escalated, trivialFinal };
}

const SEEDS = 200;

// ---------------------------------------------------------------------------
// Property tests
// ---------------------------------------------------------------------------

describe('generateChain property test (15 op subsets × 3 difficulties × 10 digits × 200 seeds)', () => {
  for (const ops of OP_SUBSETS) {
    it(`ops {${ops.join(' ')}}`, () => {
      const mode = getChainStrategy(ops) === 'chained' ? 'full' : 'independent';
      const escalations = new Set<string>();
      const trivials = new Set<string>();
      for (const difficulty of DIFFICULTIES) {
        for (let digit = 0; digit <= 9; digit++) {
          for (let seed = 0; seed < SEEDS; seed++) {
            const rng = mulberry32(seed * 1000 + digit);
            const chain = generateChain(digit, difficulty, ops, undefined, rng);
            const flags = checkChain(chain, { difficulty, ops, digit, length: CHAIN_LENGTH, mode });
            if (flags.escalated) escalations.add(key(ops, difficulty, digit));
            if (flags.trivialFinal) trivials.add(key(ops, difficulty, digit));
          }
        }
      }
      // The exception lists are exact: every listed case is actually needed.
      const expected = (set: Set<string>) => [...set].filter((k) => k.startsWith(`${ops.join('')}|`)).sort();
      expect([...escalations].sort()).toEqual(expected(ESCALATION_EXCEPTIONS));
      expect([...trivials].sort()).toEqual(expected(TRIVIAL_FINAL_EXCEPTIONS));
    });
  }

  it('is deterministic for a given seed', () => {
    const a = generateChain(5, 'hard', ALL_OPS, undefined, mulberry32(42));
    const b = generateChain(5, 'hard', ALL_OPS, undefined, mulberry32(42));
    expect(a).toEqual(b);
  });

  it('honours chainLengthOverride', () => {
    for (const ops of OP_SUBSETS) {
      for (let seed = 0; seed < 20; seed++) {
        const chain = generateChain(seed % 10, 'medium', ops, { min: 3, max: 4 }, mulberry32(seed));
        expect(chain.steps.length).toBeGreaterThanOrEqual(3);
        expect(chain.steps.length).toBeLessThanOrEqual(4);
      }
    }
  });
});

describe('generateMetaPuzzle property test', () => {
  it('meets the chain invariants for every op subset and difficulty', () => {
    for (const ops of OP_SUBSETS) {
      const mode = getChainStrategy(ops) === 'chained' ? 'full' : 'independent';
      for (const difficulty of DIFFICULTIES) {
        for (let seed = 0; seed < 15; seed++) {
          const rng = mulberry32(seed);
          const pin = String(randInt(0, 9999, rng)).padStart(4, '0');
          const puzzle = generateMetaPuzzle(pin, difficulty, ops, rng);
          expect(puzzle.chains).toHaveLength(8);
          const total = puzzle.chains.reduce((sum, c) => sum + c.steps.length, 0);
          expect(total).toBeLessThanOrEqual(8 * META_CHAIN_LENGTH_BY_DIFFICULTY[difficulty].max);
          puzzle.meta!.coordinates.forEach((coord, i) => {
            expect(puzzle.meta!.cells[coord.row][coord.col]).toBe(Number(pin[i]));
            for (const [chain, digit] of [[puzzle.chains[2 * i], coord.row], [puzzle.chains[2 * i + 1], coord.col]] as const) {
              checkChain(chain, { difficulty, ops, digit, length: META_CHAIN_LENGTH_BY_DIFFICULTY[difficulty], mode });
            }
          });
        }
      }
    }
  });

  it('caps hard meta workload at ≈72 steps on average, independent of op count', () => {
    for (const ops of [['+'], ALL_OPS] as Operation[][]) {
      let total = 0;
      for (let seed = 0; seed < 50; seed++) {
        total += generateMetaPuzzle('1234', 'hard', ops, mulberry32(seed)).chains.reduce((s, c) => s + c.steps.length, 0);
      }
      expect(total / 50).toBeLessThanOrEqual(76);
    }
  });
});

describe('multiplication-PIN mode property test', () => {
  it('builds valid ones-digit chains without repeated facts', () => {
    let chainsWithDuplicates = 0;
    let chains = 0;
    for (let digit = 0; digit <= 9; digit++) {
      for (let seed = 0; seed < SEEDS; seed++) {
        const chain = generateMultiplicationPinChain(digit, mulberry32(seed * 10 + digit));
        expect(chain.useLastDigit).toBe(true);
        const keys = chain.steps.map(factKey);
        if (new Set(keys).size !== keys.length) chainsWithDuplicates++;
        chains++;
        // Odd targets are parity-locked to the 6 odd facts among 3, 7, 9 → kept short (3–4 steps).
        checkChain(chain, {
          difficulty: 'hard',
          ops: ['*'],
          digit,
          length: digit % 2 === 1 ? MULTIPLICATION_PIN_ODD_CHAIN_LENGTH : MULTIPLICATION_PIN_CHAIN_LENGTH,
          mode: 'onesDigit',
        });
        for (let i = 1; i < chain.steps.length; i++) expect([0, 1, 5]).not.toContain(chain.steps[i].left);
      }
    }
    expect(chainsWithDuplicates / chains).toBeLessThan(0.05);
  });

  it('generateMultiplicationPinPuzzle makes 4 ones-digit chains', () => {
    const puzzle = generateMultiplicationPinPuzzle('0719', mulberry32(3));
    expect(puzzle.chains.map((c) => c.targetDigit)).toEqual([0, 7, 1, 9]);
    for (const c of puzzle.chains) expect(c.chainMode).toBe('onesDigit');
  });
});

// ---------------------------------------------------------------------------
// Regression tests for the verified bugs (G1–G12)
// ---------------------------------------------------------------------------

describe('regressions', () => {
  const steps = (c: PuzzleChain) => c.steps;

  it('G1: monotone op sets use only selected ops, distinct facts, full length (no fallback)', () => {
    for (let seed = 0; seed < 100; seed++) {
      const chain = generateChain(1, 'easy', ['+'], undefined, mulberry32(seed));
      expect(chain.chainMode).toBe('independent');
      expect(steps(chain).every((s) => s.operator === '+')).toBe(true);
      expect(steps(chain).length).toBeGreaterThanOrEqual(CHAIN_LENGTH.min);
      expect(steps(chain).some((s) => s.right === 0 || s.left === 0)).toBe(false);
      const loose = steps(chain).map((s) => `${Math.min(s.left, s.right)}+${Math.max(s.left, s.right)}`);
      expect(new Set(loose).size).toBe(loose.length);
    }
    for (const ops of [['-'], ['+', '*'], ['-', '/']] as Operation[][]) {
      const chain = generateChain(0, 'hard', ops, undefined, mulberry32(1));
      expect(steps(chain).every((s) => ops.includes(s.operator))).toBe(true);
      expect(Math.max(...steps(chain).map((s) => s.result))).toBeGreaterThan(17);
    }
  });

  it('G1: {+,÷} and {+,×,÷} reach target 0 without unselected ops', () => {
    for (const ops of [['+', '/'], ['+', '*', '/']] as Operation[][]) {
      for (let seed = 0; seed < 50; seed++) {
        const chain = generateChain(0, 'medium', ops, undefined, mulberry32(seed));
        expect(chain.chainMode).toBe('full');
        expect(steps(chain).every((s) => ops.includes(s.operator))).toBe(true);
        expect(getChainFinalDigit(chain)).toBe(0);
      }
    }
  });

  it('G2: hard single-op chains never use the other operation', () => {
    for (let seed = 0; seed < 100; seed++) {
      expect(steps(generateChain(4, 'hard', ['+'], undefined, mulberry32(seed))).every((s) => s.operator === '+')).toBe(true);
      expect(steps(generateChain(4, 'hard', ['-'], undefined, mulberry32(seed))).every((s) => s.operator === '-')).toBe(true);
    }
  });

  it('G3: ×/÷ respect difficulty tables (no 200, no 112:7, no factors 12/15)', () => {
    for (let seed = 0; seed < 200; seed++) {
      for (const s of steps(generateChain(seed % 10, 'easy', ['/'], undefined, mulberry32(seed)))) {
        if (s.left === s.right) continue; // n ÷ n = 1: the documented final-step exception for digit 1
        expect(s.left).toBeLessThanOrEqual(100);
        expect([2, 3, 5, 10].includes(s.right) || [2, 3, 5, 10].includes(s.result)).toBe(true);
      }
      for (const s of steps(generateChain(seed % 10, 'hard', ['*', '/'], undefined, mulberry32(seed)))) {
        expect(Math.max(s.left, s.right, s.result)).toBeLessThanOrEqual(100);
        expect([12, 15]).not.toContain(s.right);
      }
    }
  });

  it('G4: pure ÷ uses only division, also for target 0', () => {
    for (let digit = 0; digit <= 9; digit++) {
      const chain = generateChain(digit, 'medium', ['/'], undefined, mulberry32(digit));
      expect(steps(chain).every((s) => s.operator === '/')).toBe(true);
    }
  });

  it('G5: no trivial steps (0×4, 0:10, 1×2, 4:4, 2−2)', () => {
    for (const ops of OP_SUBSETS) {
      for (let seed = 0; seed < 30; seed++) {
        const chain = generateChain(5, 'medium', ops, undefined, mulberry32(seed));
        expect(steps(chain).some(isTrivial)).toBe(false);
      }
    }
  });

  it('G6: hard +/− steps always have a two-digit right operand', () => {
    for (const ops of [['+', '-'], ALL_OPS, ['-', '/']] as Operation[][]) {
      for (let seed = 0; seed < 100; seed++) {
        for (const s of steps(generateChain(seed % 10, 'hard', ops, undefined, mulberry32(seed)))) {
          if (s.operator === '+' || s.operator === '-') expect(s.right).toBeGreaterThanOrEqual(10);
        }
      }
    }
  });

  it('G7: ones-digit × chains never repeat a fact and leave {3,7,9} for even targets', () => {
    let evenLeftSeen = false;
    for (let seed = 0; seed < 100; seed++) {
      const chain = generateMultiplicationPinChain(seed % 10, mulberry32(seed));
      const keys = steps(chain).map(factKey);
      expect(new Set(keys).size).toBe(keys.length);
      if (chain.targetDigit % 2 === 0 && steps(chain).some((s) => s.left % 2 === 0)) evenLeftSeen = true;
    }
    expect(evenLeftSeen).toBe(true);
  });

  it('G8: invalid input throws', () => {
    expect(() => generatePuzzle('12a4', 'easy', ['+'])).toThrow();
    expect(() => generatePuzzle('123', 'easy', ['+'])).toThrow();
    expect(() => generatePuzzle('12345', 'easy', ['+'])).toThrow();
    expect(() => generatePuzzle('1234', 'easy', [])).toThrow();
    expect(() => generateChain(3, 'easy', [])).toThrow();
    expect(() => generateChain(10, 'easy', ['+'])).toThrow();
    expect(() => generateChain(Number.NaN, 'easy', ['+'])).toThrow();
    expect(() => generateMetaPuzzle('abcd', 'easy', ['+'])).toThrow();
    expect(() => generateMultiplicationPinPuzzle('99')).toThrow();
  });

  it('G10: getChainFinalDigit honours useLastDigit', () => {
    const chain = generateChain(0, 'easy', ['+', '-'], undefined, mulberry32(7));
    expect(chain.useLastDigit).toBe(true);
    expect(getChainFinalDigit(chain)).toBe(0);
  });

  it('G11: standard puzzle workload is ≤ 36 steps regardless of op count', () => {
    for (let seed = 0; seed < 50; seed++) {
      const total = generatePuzzle('8642', 'hard', ALL_OPS, mulberry32(seed)).chains.reduce((s, c) => s + c.steps.length, 0);
      expect(total).toBeLessThanOrEqual(4 * CHAIN_LENGTH.max);
    }
  });

  it('G12: seeded generation is reproducible', () => {
    expect(generatePuzzle('2580', 'medium', ['+', '*'], mulberry32(9))).toEqual(
      generatePuzzle('2580', 'medium', ['+', '*'], mulberry32(9)),
    );
    expect(generateMetaPuzzle('2580', 'easy', ['-', '/'], mulberry32(9))).toEqual(
      generateMetaPuzzle('2580', 'easy', ['-', '/'], mulberry32(9)),
    );
  });
});

// ---------------------------------------------------------------------------
// Quality regressions (Q1–Q5): variety, op coverage, no near-undo, few ±1
// ---------------------------------------------------------------------------

function looseKey(s: MathStep) {
  return s.operator === '+' || s.operator === '*'
    ? `${Math.min(s.left, s.right)}${s.operator}${Math.max(s.left, s.right)}`
    : factKey(s);
}

/** Share of steps whose (loose) fact also appears in another chain of the same puzzle. */
function crossChainRepetition(puzzles: { chains: PuzzleChain[] }[]) {
  let repeated = 0;
  let total = 0;
  for (const { chains } of puzzles) {
    chains.forEach((chain, i) => {
      const others = new Set(chains.filter((_, j) => j !== i).flatMap((c) => c.steps.map(looseKey)));
      for (const s of chain.steps) {
        total++;
        if (others.has(looseKey(s))) repeated++;
      }
    });
  }
  return repeated / total;
}

function expectDistinctChains(chains: PuzzleChain[]) {
  const signatures = chains.map((c) => c.steps.map(factKey).join(','));
  expect(new Set(signatures).size).toBe(signatures.length);
}

describe('quality regressions', () => {
  it('Q1: multiplication-PIN puzzles spread facts across chains and never repeat a chain', () => {
    // The reported case: 4 near-identical chains.
    const reported = generateMultiplicationPinPuzzle('1379', mulberry32(1));
    expectDistinctChains(reported.chains);

    // Odd digits only have 6 usable facts (parity), so odd chains are kept short:
    // an all-odd PIN is ≈ 14 steps instead of ≈ 26 mostly-repeated ones.
    const oddPuzzles = Array.from({ length: 100 }, (_, seed) => generateMultiplicationPinPuzzle('1379', mulberry32(seed)));
    const avgOddSteps = oddPuzzles.reduce((a, p) => a + p.chains.reduce((b, c) => b + c.steps.length, 0), 0) / oddPuzzles.length;
    expect(avgOddSteps).toBeLessThanOrEqual(16);

    const evenPuzzles = Array.from({ length: 100 }, (_, seed) => generateMultiplicationPinPuzzle('2468', mulberry32(seed)));
    // Was ≈ 66 % before puzzle-level usage counts; now ≈ 31 %.
    expect(crossChainRepetition(evenPuzzles)).toBeLessThan(0.4);

    for (let seed = 0; seed < 200; seed++) {
      const rng = mulberry32(seed);
      const pin = String(randInt(0, 9999, rng)).padStart(4, '0');
      for (const p of [pin, '3333', '9999', '1111']) {
        const puzzle = generateMultiplicationPinPuzzle(p, mulberry32(seed));
        expectDistinctChains(puzzle.chains);
        puzzle.chains.forEach((chain, i) => {
          const digit = Number(p[i]);
          checkChain(chain, {
            difficulty: 'hard',
            ops: ['*'],
            digit,
            length: digit % 2 === 1 ? MULTIPLICATION_PIN_ODD_CHAIN_LENGTH : MULTIPLICATION_PIN_CHAIN_LENGTH,
            mode: 'onesDigit',
          });
          // Parity: an odd target forces every carried digit to be odd (3, 7 or 9).
          if (digit % 2 === 1) for (const s of chain.steps) expect([3, 7, 9]).toContain(s.left);
        });
      }
    }
  });

  it('Q2: repeated-digit PINs never produce identical chains (standard and meta)', () => {
    const reported = generatePuzzle('5555', 'easy', ['-', '*'], mulberry32(25));
    expectDistinctChains(reported.chains);

    const puzzles = [];
    for (const ops of OP_SUBSETS) {
      for (const difficulty of DIFFICULTIES) {
        for (let seed = 0; seed < 10; seed++) {
          for (const pin of ['5555', '0000', '1111', '7777']) {
            const puzzle = generatePuzzle(pin, difficulty, ops, mulberry32(seed));
            expectDistinctChains(puzzle.chains);
            puzzles.push(puzzle);
          }
          expectDistinctChains(generateMetaPuzzle('3333', difficulty, ops, mulberry32(seed)).chains);
        }
      }
    }
    // Was ≈ 24 % before puzzle-level usage counts; now ≈ 6 %.
    expect(crossChainRepetition(puzzles)).toBeLessThan(0.12);
  });

  it('Q3: every selected operation appears in every chained chain (standard lengths)', () => {
    const cases: [Difficulty, Operation[]][] = [
      ['hard', ['+', '-', '*']],
      ['hard', ALL_OPS],
      ['medium', ALL_OPS],
      ['easy', ALL_OPS],
      ['easy', ['+', '-', '*']],
    ];
    for (const [difficulty, ops] of cases) {
      let missing = 0;
      for (let seed = 0; seed < 100; seed++) {
        for (let digit = 0; digit <= 9; digit++) {
          const chain = generateChain(digit, difficulty, ops, undefined, mulberry32(seed * 10 + digit));
          const used = new Set(chain.steps.map((s) => s.operator));
          if (ops.some((op) => !used.has(op))) missing++;
        }
      }
      // Was 49 % (hard +−×) and 30 % (hard +−×÷).
      expect(missing, `${difficulty} ${ops.join('')}`).toBe(0);
    }
  });

  it('Q4: chained walks avoid near-undo, commuted repeats and most ±1 steps', () => {
    let plusMinus = 0;
    let plusMinusOne = 0;
    for (const ops of [['+', '-'], ALL_OPS] as Operation[][]) {
      for (let seed = 0; seed < 500; seed++) {
        const chain = generateChain(seed % 10, 'easy', ops, undefined, mulberry32(seed));
        const loose = chain.steps.map(looseKey);
        expect(new Set(loose).size).toBe(loose.length);
        chain.steps.forEach((s, i) => {
          if (i > 0) expect(s.result).not.toBe(chain.steps[i - 1].left);
          if (s.operator === '+' || s.operator === '-') {
            plusMinus++;
            if (s.right === 1) plusMinusOne++;
          }
        });
      }
    }
    // Was ≈ 25 % of easy +/− steps; now ≈ 6 %.
    expect(plusMinusOne / plusMinus).toBeLessThan(0.1);
  });

  it('Q5: length overrides up to MAX_CHAIN_LENGTH work; longer ones throw', () => {
    for (const ops of OP_SUBSETS) {
      for (const difficulty of DIFFICULTIES) {
        for (let digit = 0; digit <= 9; digit += 3) {
          const chain = generateChain(digit, difficulty, ops, { min: MAX_CHAIN_LENGTH, max: MAX_CHAIN_LENGTH }, mulberry32(digit));
          expect(chain.steps).toHaveLength(MAX_CHAIN_LENGTH);
          expect(getChainFinalDigit(chain)).toBe(digit);
        }
      }
    }
    expect(() => generateChain(1, 'easy', ['+'], { min: 2, max: MAX_CHAIN_LENGTH + 1 })).toThrow();
  });
});

describe('getChainStrategy', () => {
  it('chains sets that can go both up and down', () => {
    expect(getChainStrategy(['+', '-'])).toBe('chained');
    expect(getChainStrategy(['*', '/'])).toBe('chained');
    expect(getChainStrategy(['+', '/'])).toBe('chained');
    expect(getChainStrategy(['-', '*'])).toBe('chained');
    expect(getChainStrategy(['+'])).toBe('independent');
    expect(getChainStrategy(['+', '*'])).toBe('independent');
    expect(getChainStrategy(['-', '/'])).toBe('independent');
  });
});

// ---------------------------------------------------------------------------
// Basic API behaviour
// ---------------------------------------------------------------------------

describe('randInt / shuffle', () => {
  it('randInt returns values within range', () => {
    const rng = mulberry32(1);
    for (let i = 0; i < 100; i++) {
      const val = randInt(3, 7, rng);
      expect(val).toBeGreaterThanOrEqual(3);
      expect(val).toBeLessThanOrEqual(7);
    }
    expect(randInt(5, 5)).toBe(5);
  });

  it('shuffle preserves all elements', () => {
    expect(shuffle([1, 2, 3, 4, 5], mulberry32(2)).sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('generatePuzzle', () => {
  it('generates one chain per PIN digit', () => {
    const puzzle = generatePuzzle('1234', 'easy', ['+', '-']);
    expect(puzzle.pin).toBe('1234');
    expect(puzzle.chains.map((c) => c.targetDigit)).toEqual([1, 2, 3, 4]);
    for (const c of puzzle.chains) expect(getChainFinalDigit(c)).toBe(c.targetDigit);
  });

  it('handles PIN with zeros', () => {
    const puzzle = generatePuzzle('0000', 'easy', ['+', '-']);
    for (const chain of puzzle.chains) expect(getChainFinalDigit(chain)).toBe(0);
  });
});

describe('generateMultiplicationTable', () => {
  it('contains all multipliers 1-10 with correct results', () => {
    const steps = generateMultiplicationTable(8);
    expect(steps.map((s) => s.right).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const step of steps) expect(step.result).toBe(8 * step.right);
  });

  it('respects custom maxMultiplier', () => {
    expect(generateMultiplicationTable(3, 5)).toHaveLength(5);
  });
});

describe('generateMetaGrid', () => {
  it('returns a 10x10 digit grid with unique PIN coordinates', () => {
    const grid = generateMetaGrid('1234', mulberry32(5));
    expect(grid.cells).toHaveLength(10);
    for (const row of grid.cells) {
      expect(row).toHaveLength(10);
      for (const cell of row) expect(cell >= 0 && cell <= 9).toBe(true);
    }
    expect(grid.coordinates).toHaveLength(4);
    const seen = new Set(grid.coordinates.map((c) => `${c.row},${c.col}`));
    expect(seen.size).toBe(4);
    for (const coord of grid.coordinates) expect(grid.cells[coord.row][coord.col]).toBe(coord.pinDigit);
  });
});

import type { Operation, Difficulty, MathStep, PuzzleChain, Puzzle, MetaGrid, MetaCoordinate } from './types';
import {
  DIFFICULTY_CONSTRAINTS,
  CHAIN_LENGTH,
  META_CHAIN_LENGTH_BY_DIFFICULTY,
  META_GRID_SIZE,
  MIN_FACTOR,
  MAX_FACTOR,
  MULTIPLICATION_PIN_CHAIN_LENGTH,
} from './constants';
import type { Rng } from './rng';

/*
 * Math engine
 * ===========
 *
 * Every chain is built from a finite set of allowed "facts" (MathStep) for the
 * chosen difficulty and operations. Trivial facts are never in that set:
 * operand 0, ×1, 1×, ÷1, n÷n, 0÷n, n−n (results are always ≥ 1).
 *
 * Strategy by operation set (see getChainStrategy):
 * - 'chained' — the set has an increasing op (+ or ×) AND a decreasing op
 *   (− or ÷). Each step's left operand is the previous result. The walk is
 *   constructed forwards over a precomputed "can still reach the final step in
 *   exactly k steps" table, with backtracking, so it cannot dead-end.
 *   {×, ÷} is chained too; every step is a real times-table fact.
 * - 'independent' — monotone sets ({+}, {−}, {×}, {÷}, {+,×}, {−,÷}) cannot walk
 *   back down (or up) to a digit, so the chain is a list of distinct,
 *   unrelated facts using only the selected ops; only the LAST fact encodes the
 *   digit.
 *
 * The last fact encodes the target digit, in order of preference:
 *   1. exactly (result === digit),
 *   2. by its ones digit (result ≥ 10, e.g. 4 + 6 = 10 → 0), useLastDigit: true,
 *   3. a trivial final step: n − n = 0 (digit 0) or n ÷ n = 1 (digit 1),
 *   4. the same three options with the next difficulty's facts (final step only).
 * Option 3/4 are only reached when 1/2 are impossible; see
 * ENCODING_EXCEPTIONS in generator.test.ts for the complete list.
 */

const OPERATIONS: Operation[] = ['+', '-', '*', '/'];
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];
const INVERSE: Record<Operation, Operation> = { '+': '-', '-': '+', '*': '/', '/': '*' };
/** Values are 0..100 (10 × 10 is the largest product). */
const NODE_COUNT = MAX_FACTOR * MAX_FACTOR + 1;
/** Max DFS expansions per chain before giving up (never hit in practice). */
const SEARCH_BUDGET = 50_000;

export type ChainStrategy = 'chained' | 'independent';

interface Fact extends MathStep {
  /** Node the next step continues from (result, or its ones digit). */
  to: number;
  key: string;
}

interface Graph {
  byOp: Map<Operation, Fact[]>;
  /** Outgoing facts per node (index = left operand). */
  out: Fact[][];
}

interface FinalPlan {
  facts: Fact[];
  byLeft: Map<number, Fact[]>;
  useLastDigit: boolean;
}

// ---------------------------------------------------------------------------
// Randomness helpers
// ---------------------------------------------------------------------------

export function randInt(min: number, max: number, rng: Rng = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: T[], rng: Rng = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i, rng);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pick<T>(arr: T[], rng: Rng): T {
  return arr[randInt(0, arr.length - 1, rng)];
}

// ---------------------------------------------------------------------------
// Input guards
// ---------------------------------------------------------------------------

function assertPin(pin: string): void {
  if (typeof pin !== 'string' || !/^\d{4}$/.test(pin)) {
    throw new Error(`PIN must be exactly 4 digits, got "${pin}"`);
  }
}

function normalizeOps(operations: Operation[]): Operation[] {
  if (!Array.isArray(operations) || operations.length === 0) {
    throw new Error('At least one operation must be selected');
  }
  for (const op of operations) {
    if (!OPERATIONS.includes(op)) throw new Error(`Unknown operation "${op}"`);
  }
  return OPERATIONS.filter((op) => operations.includes(op));
}

function assertDigit(digit: number): void {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
    throw new Error(`Target digit must be an integer 0-9, got ${digit}`);
  }
}

function assertDifficulty(difficulty: Difficulty): void {
  if (!DIFFICULTIES.includes(difficulty)) throw new Error(`Unknown difficulty "${difficulty}"`);
}

function assertLength(len: { min: number; max: number }): void {
  if (!Number.isInteger(len.min) || !Number.isInteger(len.max) || len.min < 1 || len.max < len.min) {
    throw new Error(`Invalid chain length range ${len.min}..${len.max}`);
  }
}

// ---------------------------------------------------------------------------
// Fact sets
// ---------------------------------------------------------------------------

function makeFact(left: number, operator: Operation, right: number, result: number, to = result): Fact {
  return { left, operator, right, result, to, key: `${left}${operator}${right}` };
}

function isTablePair(a: number, b: number, tables: number[]): boolean {
  return (
    a >= MIN_FACTOR && a <= MAX_FACTOR && b >= MIN_FACTOR && b <= MAX_FACTOR &&
    (tables.includes(a) || tables.includes(b))
  );
}

const factCache = new Map<string, Fact[]>();

/** All non-trivial facts for one operation at one difficulty. */
function factsFor(op: Operation, difficulty: Difficulty): Fact[] {
  const cacheKey = `${difficulty}${op}`;
  const cached = factCache.get(cacheKey);
  if (cached) return cached;

  const { maxValue, minRight, tables } = DIFFICULTY_CONSTRAINTS[difficulty];
  const facts: Fact[] = [];
  switch (op) {
    case '+':
      for (let a = 1; a < maxValue; a++) {
        for (let b = Math.max(1, minRight); a + b <= maxValue; b++) facts.push(makeFact(a, '+', b, a + b));
      }
      break;
    case '-':
      for (let a = 2; a <= maxValue; a++) {
        for (let b = Math.max(1, minRight); b < a; b++) facts.push(makeFact(a, '-', b, a - b));
      }
      break;
    case '*':
      for (let a = MIN_FACTOR; a <= MAX_FACTOR; a++) {
        for (let b = MIN_FACTOR; b <= MAX_FACTOR; b++) {
          if (isTablePair(a, b, tables)) facts.push(makeFact(a, '*', b, a * b));
        }
      }
      break;
    case '/':
      for (let divisor = MIN_FACTOR; divisor <= MAX_FACTOR; divisor++) {
        for (let quotient = MIN_FACTOR; quotient <= MAX_FACTOR; quotient++) {
          if (isTablePair(divisor, quotient, tables)) {
            facts.push(makeFact(divisor * quotient, '/', divisor, quotient));
          }
        }
      }
      break;
  }
  factCache.set(cacheKey, facts);
  return facts;
}

/** Trivial facts that are allowed ONLY as the final step, and only when unavoidable. */
function trivialFinalFacts(digit: number, ops: Operation[], difficulty: Difficulty): Fact[] {
  const { maxValue, minRight } = DIFFICULTY_CONSTRAINTS[difficulty];
  const facts: Fact[] = [];
  if (digit === 0 && ops.includes('-')) {
    for (let n = Math.max(2, minRight); n <= maxValue; n++) facts.push(makeFact(n, '-', n, 0));
  }
  if (digit === 1 && ops.includes('/')) {
    for (let n = MIN_FACTOR; n <= MAX_FACTOR; n++) facts.push(makeFact(n, '/', n, 1));
  }
  return facts;
}

const graphCache = new Map<string, Graph>();

function buildGraph(facts: Map<Operation, Fact[]>): Graph {
  const out: Fact[][] = Array.from({ length: NODE_COUNT }, () => []);
  for (const list of facts.values()) for (const f of list) out[f.left].push(f);
  return { byOp: facts, out };
}

function getGraph(difficulty: Difficulty, ops: Operation[]): Graph {
  const key = `${difficulty}|${ops.join('')}`;
  let g = graphCache.get(key);
  if (!g) {
    g = buildGraph(new Map(ops.map((op) => [op, factsFor(op, difficulty)])));
    graphCache.set(key, g);
  }
  return g;
}

function makePlan(facts: Fact[], useLastDigit: boolean): FinalPlan {
  const byLeft = new Map<number, Fact[]>();
  for (const f of facts) {
    const list = byLeft.get(f.left);
    if (list) list.push(f);
    else byLeft.set(f.left, [f]);
  }
  return { facts, byLeft, useLastDigit };
}

const planCache = new Map<string, FinalPlan[]>();

/** Candidate final-step fact sets for a digit, most preferred first. */
function finalPlans(digit: number, difficulty: Difficulty, ops: Operation[]): FinalPlan[] {
  const key = `${difficulty}|${ops.join('')}|${digit}`;
  const cached = planCache.get(key);
  if (cached) return cached;

  const plans: FinalPlan[] = [];
  for (const level of DIFFICULTIES.slice(DIFFICULTIES.indexOf(difficulty))) {
    const all = ops.flatMap((op) => factsFor(op, level));
    const exact = all.filter((f) => f.result === digit);
    if (exact.length > 0) plans.push(makePlan(exact, false));
    const ones = all.filter((f) => f.result >= 10 && f.result % 10 === digit);
    if (ones.length > 0) plans.push(makePlan(ones, true));
    const trivial = trivialFinalFacts(digit, ops, level);
    if (trivial.length > 0) plans.push(makePlan(trivial, false));
  }
  if (plans.length === 0) {
    throw new Error(`Cannot encode digit ${digit} with operations ${ops.join(' ')}`);
  }
  planCache.set(key, plans);
  return plans;
}

// ---------------------------------------------------------------------------
// Chained walk (full and ones-digit continuity)
// ---------------------------------------------------------------------------

const reachCache = new Map<string, Uint8Array[]>();

/**
 * reach[k][v] === 1 ⇔ from node v there is a walk of exactly k graph steps
 * followed by one final-plan step.
 */
function reachTable(cacheKey: string, graph: Graph, plan: FinalPlan, k: number): Uint8Array[] {
  let table = reachCache.get(cacheKey);
  if (!table) {
    const first = new Uint8Array(NODE_COUNT);
    for (const left of plan.byLeft.keys()) first[left] = 1;
    table = [first];
    reachCache.set(cacheKey, table);
  }
  while (table.length <= k) {
    const prev = table[table.length - 1];
    const next = new Uint8Array(NODE_COUNT);
    for (let v = 0; v < NODE_COUNT; v++) {
      for (const f of graph.out[v]) {
        if (prev[f.to]) {
          next[v] = 1;
          break;
        }
      }
    }
    table.push(next);
  }
  return table;
}

/** Pick an operation, favouring the ones used least so far in this chain. */
function pickOp(ops: Operation[], use: Map<Operation, number>, rng: Rng): Operation {
  const weights = ops.map((op) => 1 / (1 + (use.get(op) ?? 0)) ** 2);
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < ops.length; i++) {
    r -= weights[i];
    if (r < 0) return ops[i];
  }
  return ops[ops.length - 1];
}

function removeAt<T>(arr: T[], i: number): T {
  const item = arr[i];
  arr[i] = arr[arr.length - 1];
  arr.pop();
  return item;
}

/**
 * Builds a walk of exactly `length` facts whose last fact is from `plan`.
 * Facts never repeat and a step never immediately undoes the previous one
 * (5 × 2 = 10 → 10 ÷ 2 = 5). Returns null only if no such walk exists.
 */
function chainedWalk(
  graph: Graph,
  plan: FinalPlan,
  reach: Uint8Array[],
  length: number,
  rng: Rng,
): Fact[] | null {
  const path: Fact[] = [];
  const used = new Set<string>();
  const visits = new Uint8Array(NODE_COUNT);
  const opUse = new Map<Operation, number>();
  let budget = SEARCH_BUDGET;

  const dfs = (v: number, stepIdx: number): boolean => {
    if (--budget < 0) return false;
    const remaining = length - 1 - stepIdx;
    const prev = path[path.length - 1];
    const source = remaining === 0 ? (plan.byLeft.get(v) ?? []) : graph.out[v];
    const nextReach = remaining === 0 ? null : reach[remaining - 1];

    // Group candidates by op, unvisited targets first.
    const fresh = new Map<Operation, Fact[]>();
    const stale = new Map<Operation, Fact[]>();
    for (const f of source) {
      if (nextReach && !nextReach[f.to]) continue;
      if (used.has(f.key)) continue;
      if (prev && f.to === prev.left && f.right === prev.right && f.operator === INVERSE[prev.operator]) continue;
      const bucket = visits[f.to] ? stale : fresh;
      const list = bucket.get(f.operator);
      if (list) list.push(f);
      else bucket.set(f.operator, [f]);
    }

    const ops = OPERATIONS.filter((op) => fresh.has(op) || stale.has(op));
    while (ops.length > 0) {
      const op = pickOp(ops, opUse, rng);
      const list = fresh.get(op)?.length ? fresh.get(op)! : stale.get(op);
      if (!list || list.length === 0) {
        ops.splice(ops.indexOf(op), 1);
        continue;
      }
      const f = removeAt(list, randInt(0, list.length - 1, rng));

      used.add(f.key);
      path.push(f);
      opUse.set(op, (opUse.get(op) ?? 0) + 1);
      visits[f.to]++;
      if (remaining === 0 || dfs(f.to, stepIdx + 1)) return true;
      visits[f.to]--;
      opUse.set(op, opUse.get(op)! - 1);
      path.pop();
      used.delete(f.key);
      if (budget < 0) return false;
    }
    return false;
  };

  const starts: number[] = [];
  for (let v = 0; v < NODE_COUNT; v++) if (reach[length - 1][v]) starts.push(v);
  shuffle(starts, rng);
  for (const start of starts) {
    visits[start] = 1;
    if (dfs(start, 0)) return path;
    visits[start] = 0;
    if (budget < 0) return null;
  }
  return null;
}

function toSteps(facts: Fact[]): MathStep[] {
  return facts.map(({ left, operator, right, result }) => ({ left, operator, right, result }));
}

function generateChainedChain(
  targetDigit: number,
  difficulty: Difficulty,
  ops: Operation[],
  length: number,
  rng: Rng,
): PuzzleChain {
  const graph = getGraph(difficulty, ops);
  const plans = finalPlans(targetDigit, difficulty, ops);
  for (let p = 0; p < plans.length; p++) {
    const plan = plans[p];
    const reach = reachTable(`${difficulty}|${ops.join('')}|${targetDigit}|${p}`, graph, plan, length - 1);
    if (!reach[length - 1].some(Boolean)) continue;
    const facts = chainedWalk(graph, plan, reach, length, rng);
    if (!facts) continue;
    return { targetDigit, steps: toSteps(facts), useLastDigit: plan.useLastDigit, chainMode: 'full' };
  }
  throw new Error(`Impossible: no ${length}-step chain to ${targetDigit} (${difficulty}, ${ops.join(' ')})`);
}

// ---------------------------------------------------------------------------
// Independent facts (monotone operation sets)
// ---------------------------------------------------------------------------

/** Order-insensitive key for commutative facts, so 3 + 4 and 4 + 3 count once. */
function looseKey(f: MathStep): string {
  if (f.operator === '+' || f.operator === '*') {
    return `${Math.min(f.left, f.right)}${f.operator}${Math.max(f.left, f.right)}`;
  }
  return `${f.left}${f.operator}${f.right}`;
}

function generateIndependentChain(
  targetDigit: number,
  difficulty: Difficulty,
  ops: Operation[],
  length: number,
  rng: Rng,
): PuzzleChain {
  const graph = getGraph(difficulty, ops);
  const plan = finalPlans(targetDigit, difficulty, ops)[0];
  const used = new Set<string>();
  const opUse = new Map<Operation, number>();
  const steps: Fact[] = [];

  const choose = (byOp: Map<Operation, Fact[]>, acceptable: (f: Fact) => boolean): Fact => {
    const ops = [...byOp.keys()];
    for (let attempt = 0; attempt < 40; attempt++) {
      const f = pick(byOp.get(pickOp(ops, opUse, rng))!, rng);
      if (acceptable(f)) return f;
    }
    const all = [...byOp.values()].flat().filter(acceptable);
    if (all.length === 0) throw new Error('Impossible: ran out of distinct facts');
    return pick(all, rng);
  };

  const take = (f: Fact): void => {
    used.add(looseKey(f));
    opUse.set(f.operator, (opUse.get(f.operator) ?? 0) + 1);
  };

  // The encoding fact is chosen first (its pool can be tiny, e.g. only 2 × 2 = 4).
  const finalByOp = new Map<Operation, Fact[]>();
  for (const f of plan.facts) {
    const list = finalByOp.get(f.operator);
    if (list) list.push(f);
    else finalByOp.set(f.operator, [f]);
  }
  const finalFact = choose(finalByOp, () => true);
  take(finalFact);

  for (let i = 0; i < length - 1; i++) {
    const prev = steps[steps.length - 1];
    const isLastBeforeFinal = i === length - 2;
    const f = choose(graph.byOp, (f) =>
      !used.has(looseKey(f)) &&
      // Never accidentally look chained (print would blank the left operand).
      (!prev || f.left !== prev.result) &&
      (!isLastBeforeFinal || f.result !== finalFact.left),
    );
    take(f);
    steps.push(f);
  }
  steps.push(finalFact);

  return { targetDigit, steps: toSteps(steps), useLastDigit: plan.useLastDigit, chainMode: 'independent' };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * 'chained' when the set can both grow (+, ×) and shrink (−, ÷); otherwise
 * 'independent'.
 */
export function getChainStrategy(operations: Operation[]): ChainStrategy {
  const ops = normalizeOps(operations);
  const up = ops.includes('+') || ops.includes('*');
  const down = ops.includes('-') || ops.includes('/');
  return up && down ? 'chained' : 'independent';
}

/**
 * Generate one chain whose final step encodes `targetDigit` (exactly, or by
 * the ones digit of the last result when `useLastDigit` is true).
 */
export function generateChain(
  targetDigit: number,
  difficulty: Difficulty,
  operations: Operation[],
  chainLengthOverride?: { min: number; max: number },
  rng: Rng = Math.random,
): PuzzleChain {
  assertDigit(targetDigit);
  assertDifficulty(difficulty);
  const ops = normalizeOps(operations);
  const lengths = chainLengthOverride ?? CHAIN_LENGTH;
  assertLength(lengths);
  const length = randInt(lengths.min, lengths.max, rng);

  return getChainStrategy(ops) === 'chained'
    ? generateChainedChain(targetDigit, difficulty, ops, length, rng)
    : generateIndependentChain(targetDigit, difficulty, ops, length, rng);
}

export function generatePuzzle(
  pin: string,
  difficulty: Difficulty,
  operations: Operation[],
  rng: Rng = Math.random,
): Puzzle {
  assertPin(pin);
  normalizeOps(operations);
  const chains = pin.split('').map((d) => generateChain(Number(d), difficulty, operations, undefined, rng));
  return { pin, chains };
}

export function generateMultiplicationTable(
  number: number,
  maxMultiplier: number = 10,
  rng: Rng = Math.random,
): MathStep[] {
  const steps: MathStep[] = [];
  for (let m = 1; m <= maxMultiplier; m++) {
    steps.push({ left: number, operator: '*', right: m, result: number * m });
  }
  return shuffle(steps, rng);
}

// ---------------------------------------------------------------------------
// Multiplication-PIN mode (ones-digit chaining)
// ---------------------------------------------------------------------------

/** Ones digits that may be carried into the next step (0, 1 are trivial; 5 only loops to 5/0). */
const CARRY_DIGITS = [2, 3, 4, 6, 7, 8, 9];
const ONES_FACTORS = [2, 3, 4, 5, 6, 7, 8, 9];

let onesGraph: Graph | null = null;
function getOnesGraph(): Graph {
  if (!onesGraph) {
    const facts: Fact[] = [];
    for (const a of CARRY_DIGITS) {
      for (const b of ONES_FACTORS) {
        const to = (a * b) % 10;
        if (CARRY_DIGITS.includes(to)) facts.push(makeFact(a, '*', b, a * b, to));
      }
    }
    onesGraph = buildGraph(new Map([['*', facts]]));
  }
  return onesGraph;
}

/**
 * Chained multiplication facts: the ONES DIGIT of each result is the left
 * operand of the next step, and the ones digit of the last result is the PIN
 * digit. Example for 7:  4 × 8 = 32 → 2 × 6 = 12 → 2 × 9 = 18 → … → 9 × 3 = 27.
 *
 * Built forwards over a reachability table, so it cannot dead-end; no fact
 * repeats. Parity makes odd targets (1, 3, 5, 7, 9) use only the six odd facts
 * among 3, 7, 9, so those chains are capped at 6–7 steps.
 */
export function generateMultiplicationPinChain(targetDigit: number, rng: Rng = Math.random): PuzzleChain {
  assertDigit(targetDigit);
  const graph = getOnesGraph();
  const finals: Fact[] = [];
  for (const a of CARRY_DIGITS) {
    for (const b of ONES_FACTORS) {
      if ((a * b) % 10 === targetDigit) finals.push(makeFact(a, '*', b, a * b, targetDigit));
    }
  }
  const plan = makePlan(finals, true);
  const { min, max } = MULTIPLICATION_PIN_CHAIN_LENGTH;
  for (let length = randInt(min, max, rng); length >= 2; length--) {
    const reach = reachTable(`ones|${targetDigit}`, graph, plan, length - 1);
    if (!reach[length - 1].some(Boolean)) continue;
    const facts = chainedWalk(graph, plan, reach, length, rng);
    if (facts) return { targetDigit, steps: toSteps(facts), useLastDigit: true, chainMode: 'onesDigit' };
  }
  throw new Error(`Impossible: no ones-digit chain to ${targetDigit}`);
}

export function generateMultiplicationPinPuzzle(pin: string, rng: Rng = Math.random): Puzzle {
  assertPin(pin);
  const chains = pin.split('').map((d) => generateMultiplicationPinChain(Number(d), rng));
  return { pin, chains };
}

// ---------------------------------------------------------------------------
// Adventure (meta) mode
// ---------------------------------------------------------------------------

export function generateMetaGrid(pin: string, rng: Rng = Math.random): MetaGrid {
  assertPin(pin);
  // Create 10×10 grid filled with random digits 0-9
  const cells: number[][] = [];
  for (let r = 0; r < META_GRID_SIZE; r++) {
    const row: number[] = [];
    for (let c = 0; c < META_GRID_SIZE; c++) {
      row.push(randInt(0, 9, rng));
    }
    cells.push(row);
  }

  // Place each PIN digit at a unique random position
  const usedPositions = new Set<string>();
  const coordinates: MetaCoordinate[] = [];

  for (const ch of pin) {
    const pinDigit = Number(ch);
    let row: number, col: number;
    do {
      row = randInt(0, META_GRID_SIZE - 1, rng);
      col = randInt(0, META_GRID_SIZE - 1, rng);
    } while (usedPositions.has(`${row},${col}`));
    usedPositions.add(`${row},${col}`);
    cells[row][col] = pinDigit;
    coordinates.push({ row, col, pinDigit });
  }

  return { cells, coordinates };
}

/** 8 chains (row, col per PIN digit) with per-difficulty lengths (≈ 72 steps max avg). */
export function generateMetaPuzzle(
  pin: string,
  difficulty: Difficulty,
  operations: Operation[],
  rng: Rng = Math.random,
): Puzzle {
  assertPin(pin);
  assertDifficulty(difficulty);
  normalizeOps(operations);
  const meta = generateMetaGrid(pin, rng);
  const chainLen = META_CHAIN_LENGTH_BY_DIFFICULTY[difficulty];

  const chains: PuzzleChain[] = [];
  for (const coord of meta.coordinates) {
    chains.push(generateChain(coord.row, difficulty, operations, chainLen, rng));
    chains.push(generateChain(coord.col, difficulty, operations, chainLen, rng));
  }

  return { pin, chains, meta };
}

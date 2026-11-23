import type { Operation, Difficulty, MathStep, PuzzleChain, Puzzle, MetaGrid, MetaCoordinate } from './types';
import {
  DIFFICULTY_CONSTRAINTS,
  CHAIN_LENGTH,
  META_CHAIN_LENGTH_BY_DIFFICULTY,
  META_GRID_SIZE,
  MIN_FACTOR,
  MAX_FACTOR,
  MULTIPLICATION_PIN_CHAIN_LENGTH,
  MULTIPLICATION_PIN_ODD_CHAIN_LENGTH,
  MAX_CHAIN_LENGTH,
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
 *   constructed forwards over a precomputed "which op sets can still reach the
 *   final step in exactly k steps" table, with backtracking, so it cannot
 *   dead-end and can insist that every selected op appears (when possible).
 *   {×, ÷} is chained too; every step is a real times-table fact.
 * - 'independent' — monotone sets ({+}, {−}, {×}, {÷}, {+,×}, {−,÷}) cannot walk
 *   back down (or up) to a digit, so the chain is a list of distinct,
 *   unrelated facts using only the selected ops; only the LAST fact encodes the
 *   digit.
 *
 * Variety: no fact repeats within a chain (9 + 1 and 1 + 9 count as one), no
 * step returns straight to the previous left operand, ±1 steps are rare, and
 * the chains of one puzzle prefer facts the other chains have not used and are
 * never identical.
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
const OP_BIT: Record<Operation, number> = { '+': 1, '-': 2, '*': 4, '/': 8 };
/** Values are 0..100 (10 × 10 is the largest product). */
const NODE_COUNT = MAX_FACTOR * MAX_FACTOR + 1;
/** Max DFS expansions per walk attempt before giving up. */
const SEARCH_BUDGET = 20_000;
/** Budget for the first, strictest pass (every selected op must appear). */
const COVERAGE_BUDGET = 3_000;
/** Attempts per pass when a walk runs out of budget (a fresh random order often succeeds). */
const WALK_ATTEMPTS = 2;
/** Re-rolls per chain when it would be identical to an earlier chain of the same puzzle. */
const DISTINCT_CHAIN_ATTEMPTS = 20;
/** Relative weight of a ±1 step (9 + 1, 7 − 1): allowed, but much rarer than other facts. */
const PLUS_MINUS_ONE_WEIGHT = 0.2;

export type ChainStrategy = 'chained' | 'independent';

interface Fact extends MathStep {
  /** Node the next step continues from (result, or its ones digit). */
  to: number;
  /** Exact key: 3*4 and 4*3 differ. */
  key: string;
  /** Commutative-loose key: 3 + 4 and 4 + 3 are the same fact. */
  loose: string;
  /** OP_BIT of the operator. */
  bit: number;
  /** Selection weight (±1 steps are down-weighted). */
  weight: number;
}

/** Puzzle-level state shared by the chains of one puzzle. */
interface FactUsage {
  /** Usage counts per loose fact key; chains prefer facts used least. */
  counts: Map<string, number>;
  /** Signatures of the chains already in the puzzle; a new chain must differ. */
  taken: Set<string>;
}

function newUsage(): FactUsage {
  return { counts: new Map(), taken: new Set() };
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
  if (
    !Number.isInteger(len.min) || !Number.isInteger(len.max) ||
    len.min < 1 || len.max < len.min || len.max > MAX_CHAIN_LENGTH
  ) {
    throw new Error(`Invalid chain length range ${len.min}..${len.max} (allowed 1..${MAX_CHAIN_LENGTH})`);
  }
}

// ---------------------------------------------------------------------------
// Fact sets
// ---------------------------------------------------------------------------

function makeFact(left: number, operator: Operation, right: number, result: number, to = result): Fact {
  const plusMinusOne = (operator === '+' || operator === '-') && right === 1;
  return {
    left, operator, right, result, to,
    key: `${left}${operator}${right}`,
    loose: looseKey({ left, operator, right, result }),
    bit: OP_BIT[operator],
    weight: plusMinusOne ? PLUS_MINUS_ONE_WEIGHT : 1,
  };
}

/** Order-insensitive key for commutative facts, so 3 + 4 and 4 + 3 count once. */
function looseKey(f: MathStep): string {
  if (f.operator === '+' || f.operator === '*') {
    return `${Math.min(f.left, f.right)}${f.operator}${Math.max(f.left, f.right)}`;
  }
  return `${f.left}${f.operator}${f.right}`;
}

/** Weighted random index into a list of facts. */
function pickWeightedIndex(list: Fact[], rng: Rng): number {
  let total = 0;
  for (const f of list) total += f.weight;
  let r = rng() * total;
  for (let i = 0; i < list.length; i++) {
    r -= list[i].weight;
    if (r < 0) return i;
  }
  return list.length - 1;
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

/** SUPERSETS[need] = 16-bit set of op masks m with (m & need) === need. */
const SUPERSETS = Array.from({ length: 16 }, (_, need) => {
  let set = 0;
  for (let m = 0; m < 16; m++) if ((m & need) === need) set |= 1 << m;
  return set;
});

const liftCache = new Map<number, number>();
/** Maps a set of op masks S to { m | bit : m ∈ S }. */
function lift(set: number, bit: number): number {
  const cacheKey = set * 16 + bit;
  let out = liftCache.get(cacheKey);
  if (out === undefined) {
    out = 0;
    for (let m = 0; m < 16; m++) if (set & (1 << m)) out |= 1 << (m | bit);
    liftCache.set(cacheKey, out);
  }
  return out;
}

const coverCache = new Map<string, Uint16Array[]>();

/**
 * cover[k][v] is the set (16-bit, one bit per op mask) of operation masks
 * that a walk of exactly k graph steps followed by one final-plan step can
 * use, starting at node v. cover[k][v] === 0 ⇔ no such walk exists.
 * (Ignores the "no repeated fact" rule, so the DFS still backtracks.)
 */
function coverTable(cacheKey: string, graph: Graph, plan: FinalPlan, k: number): Uint16Array[] {
  let table = coverCache.get(cacheKey);
  if (!table) {
    const first = new Uint16Array(NODE_COUNT);
    for (const [left, facts] of plan.byLeft) for (const f of facts) first[left] |= 1 << f.bit;
    table = [first];
    coverCache.set(cacheKey, table);
  }
  while (table.length <= k) {
    const prev = table[table.length - 1];
    const next = new Uint16Array(NODE_COUNT);
    for (let v = 0; v < NODE_COUNT; v++) {
      let set = 0;
      for (const f of graph.out[v]) if (prev[f.to]) set |= lift(prev[f.to], f.bit);
      next[v] = set;
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

interface WalkOptions {
  /** Every operation of the graph must appear at least once. */
  requireAllOps: boolean;
  /** 'loose': 9 + 1 and 1 + 9 count as the same fact; 'key': only exact repeats are blocked. */
  usedKey: 'loose' | 'key';
  /** Returning straight to the previous left operand (5 + 3 = 8 → 8 − 3 = 5): forbidden or merely avoided. */
  nearUndo: 'block' | 'soft';
  budget: number;
}

interface WalkResult {
  path: Fact[] | null;
  /** true when the search stopped because the budget ran out (a retry may succeed). */
  outOfBudget: boolean;
}

/**
 * Builds a walk of exactly `length` facts whose last fact is from `plan`.
 * Facts never repeat, a step never immediately undoes the previous one
 * (5 × 2 = 10 → 10 ÷ 2 = 5), and with requireAllOps every graph operation is
 * used. Soft preferences, in order: facts used least elsewhere in the puzzle
 * (`usage`), no near-undo / commuted repeat, balanced operations, unvisited
 * values, and few ±1 steps.
 */
function chainedWalk(
  graph: Graph,
  plan: FinalPlan,
  cover: Uint16Array[],
  length: number,
  rng: Rng,
  usage: FactUsage,
  opts: WalkOptions,
): WalkResult {
  const path: Fact[] = [];
  const used = new Set<string>();
  const usedLoose = new Set<string>();
  const visits = new Uint8Array(NODE_COUNT);
  const opUse = new Map<Operation, number>();
  let allMask = 0;
  for (const op of graph.byOp.keys()) allMask |= OP_BIT[op];
  let budget = opts.budget;

  const dfs = (v: number, stepIdx: number, mask: number): boolean => {
    if (--budget < 0) return false;
    const remaining = length - 1 - stepIdx;
    const prev = path[path.length - 1];
    const source = remaining === 0 ? (plan.byLeft.get(v) ?? []) : graph.out[v];
    const nextCover = remaining === 0 ? null : cover[remaining - 1];

    // tier (lower is better) → op → [unvisited targets, visited targets]
    const tiers = new Map<number, Map<Operation, [Fact[], Fact[]]>>();
    for (const f of source) {
      const reachable = nextCover ? nextCover[f.to] : 1;
      if (!reachable) continue;
      if (opts.requireAllOps) {
        const need = allMask & ~(mask | f.bit);
        if (nextCover ? !(reachable & SUPERSETS[need]) : need !== 0) continue;
      }
      if (used.has(opts.usedKey === 'loose' ? f.loose : f.key)) continue;
      if (prev && f.to === prev.left && f.right === prev.right && f.operator === INVERSE[prev.operator]) continue;
      const nearUndo = prev !== undefined && f.to === prev.left;
      if (nearUndo && opts.nearUndo === 'block') continue;

      const tier =
        (usage.counts.get(f.loose) ?? 0) * 4 +
        (nearUndo ? 2 : 0) +
        (usedLoose.has(f.loose) ? 2 : 0) +
        // ±1 steps only when the alternatives are worse (they stay possible).
        (f.weight < 1 && rng() >= f.weight ? 1 : 0);
      let byOp = tiers.get(tier);
      if (!byOp) tiers.set(tier, (byOp = new Map()));
      let lists = byOp.get(f.operator);
      if (!lists) byOp.set(f.operator, (lists = [[], []]));
      lists[visits[f.to] ? 1 : 0].push(f);
    }

    for (const tier of [...tiers.keys()].sort((a, b) => a - b)) {
      const byOp = tiers.get(tier)!;
      const ops = OPERATIONS.filter((op) => byOp.has(op));
      while (ops.length > 0) {
        const op = pickOp(ops, opUse, rng);
        const [fresh, stale] = byOp.get(op)!;
        const list = fresh.length > 0 ? fresh : stale;
        if (list.length === 0) {
          ops.splice(ops.indexOf(op), 1);
          continue;
        }
        const f = removeAt(list, pickWeightedIndex(list, rng));

        used.add(opts.usedKey === 'loose' ? f.loose : f.key);
        const newLoose = !usedLoose.has(f.loose);
        if (newLoose) usedLoose.add(f.loose);
        path.push(f);
        opUse.set(op, (opUse.get(op) ?? 0) + 1);
        visits[f.to]++;
        if (remaining === 0 ? !usage.taken.has(stepsSignature(path)) : dfs(f.to, stepIdx + 1, mask | f.bit)) {
          return true;
        }
        visits[f.to]--;
        opUse.set(op, opUse.get(op)! - 1);
        path.pop();
        if (newLoose) usedLoose.delete(f.loose);
        used.delete(opts.usedKey === 'loose' ? f.loose : f.key);
        if (budget < 0) return false;
      }
    }
    return false;
  };

  const starts: number[] = [];
  const startNeed = opts.requireAllOps ? SUPERSETS[allMask] : 0xffff;
  for (let v = 0; v < NODE_COUNT; v++) if (cover[length - 1][v] & startNeed) starts.push(v);
  shuffle(starts, rng);
  for (const start of starts) {
    visits[start] = 1;
    if (dfs(start, 0, 0)) return { path, outOfBudget: false };
    visits[start] = 0;
    if (budget < 0) return { path: null, outOfBudget: true };
  }
  return { path: null, outOfBudget: false };
}

/**
 * Runs the walk with progressively looser rules. Each pass is retried when it
 * only ran out of budget; a pass whose search space is exhausted moves on.
 */
function walkWithFallbacks(
  graph: Graph,
  plan: FinalPlan,
  cover: Uint16Array[],
  length: number,
  rng: Rng,
  usage: FactUsage,
  passes: WalkOptions[],
): Fact[] | null {
  for (const opts of passes) {
    for (let attempt = 0; attempt < WALK_ATTEMPTS; attempt++) {
      const { path, outOfBudget } = chainedWalk(graph, plan, cover, length, rng, usage, opts);
      if (path) return path;
      if (!outOfBudget) break;
    }
  }
  return null;
}

const CHAINED_PASSES: WalkOptions[] = [
  { requireAllOps: true, usedKey: 'loose', nearUndo: 'block', budget: COVERAGE_BUDGET },
  { requireAllOps: false, usedKey: 'loose', nearUndo: 'block', budget: SEARCH_BUDGET },
  // Last resort, the original rules (never needed for the standard lengths).
  { requireAllOps: false, usedKey: 'key', nearUndo: 'soft', budget: SEARCH_BUDGET },
];

/** Exact identity of a chain (two chains with equal signatures are identical). */
function stepsSignature(steps: MathStep[]): string {
  return steps.map((s) => `${s.left}${s.operator}${s.right}`).join(',');
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
  usage: FactUsage,
): PuzzleChain {
  const graph = getGraph(difficulty, ops);
  const plans = finalPlans(targetDigit, difficulty, ops);
  for (let p = 0; p < plans.length; p++) {
    const plan = plans[p];
    const cover = coverTable(`${difficulty}|${ops.join('')}|${targetDigit}|${p}`, graph, plan, length - 1);
    if (!cover[length - 1].some(Boolean)) continue;
    const facts = walkWithFallbacks(graph, plan, cover, length, rng, usage, CHAINED_PASSES);
    if (!facts) continue;
    return { targetDigit, steps: toSteps(facts), useLastDigit: plan.useLastDigit, chainMode: 'full' };
  }
  throw new Error(`Impossible: no ${length}-step chain to ${targetDigit} (${difficulty}, ${ops.join(' ')})`);
}

// ---------------------------------------------------------------------------
// Independent facts (monotone operation sets)
// ---------------------------------------------------------------------------

function generateIndependentChain(
  targetDigit: number,
  difficulty: Difficulty,
  ops: Operation[],
  length: number,
  rng: Rng,
  usage: FactUsage,
): PuzzleChain {
  const graph = getGraph(difficulty, ops);
  const plan = finalPlans(targetDigit, difficulty, ops)[0];
  const used = new Set<string>();
  const opUse = new Map<Operation, number>();
  const steps: Fact[] = [];

  const choose = (byOp: Map<Operation, Fact[]>, acceptable: (f: Fact) => boolean): Fact => {
    const ops = [...byOp.keys()];
    // Prefer facts not used elsewhere in the puzzle and not ±1, then relax.
    for (let attempt = 0; attempt < 80; attempt++) {
      const f = pick(byOp.get(pickOp(ops, opUse, rng))!, rng);
      if (!acceptable(f)) continue;
      if (attempt < 40 && usage.counts.has(f.loose)) continue;
      if (f.weight < 1 && rng() >= f.weight) continue;
      return f;
    }
    const all = [...byOp.values()].flat().filter(acceptable);
    if (all.length === 0) throw new Error('Impossible: ran out of distinct facts');
    const fresh = all.filter((f) => !usage.counts.has(f.loose));
    const pool = fresh.length > 0 ? fresh : all;
    return pool[pickWeightedIndex(pool, rng)];
  };

  const take = (f: Fact): void => {
    used.add(f.loose);
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
      !used.has(f.loose) &&
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
// Puzzle-level variety
// ---------------------------------------------------------------------------

/**
 * Builds the chains of one puzzle in order. Each chain prefers facts the
 * earlier chains have not used (soft), and no two chains are identical (hard:
 * walks reject a taken signature at the leaf and backtrack; anything else
 * identical is re-rolled).
 */
function buildChains(
  count: number,
  make: (index: number, usage: FactUsage) => PuzzleChain,
): PuzzleChain[] {
  const usage = newUsage();
  const chains: PuzzleChain[] = [];
  for (let i = 0; i < count; i++) {
    let chain = make(i, usage);
    for (let attempt = 1; usage.taken.has(stepsSignature(chain.steps)); attempt++) {
      if (attempt >= DISTINCT_CHAIN_ATTEMPTS) throw new Error('Impossible: could not build distinct chains');
      chain = make(i, usage);
    }
    usage.taken.add(stepsSignature(chain.steps));
    for (const s of chain.steps) {
      const k = looseKey(s);
      usage.counts.set(k, (usage.counts.get(k) ?? 0) + 1);
    }
    chains.push(chain);
  }
  return chains;
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

function generateChainWithUsage(
  targetDigit: number,
  difficulty: Difficulty,
  operations: Operation[],
  chainLengthOverride: { min: number; max: number } | undefined,
  rng: Rng,
  usage: FactUsage,
): PuzzleChain {
  assertDigit(targetDigit);
  assertDifficulty(difficulty);
  const ops = normalizeOps(operations);
  const lengths = chainLengthOverride ?? CHAIN_LENGTH;
  assertLength(lengths);
  const length = randInt(lengths.min, lengths.max, rng);

  return getChainStrategy(ops) === 'chained'
    ? generateChainedChain(targetDigit, difficulty, ops, length, rng, usage)
    : generateIndependentChain(targetDigit, difficulty, ops, length, rng, usage);
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
  return generateChainWithUsage(targetDigit, difficulty, operations, chainLengthOverride, rng, newUsage());
}

export function generatePuzzle(
  pin: string,
  difficulty: Difficulty,
  operations: Operation[],
  rng: Rng = Math.random,
): Puzzle {
  assertPin(pin);
  normalizeOps(operations);
  const chains = buildChains(4, (i, usage) =>
    generateChainWithUsage(Number(pin[i]), difficulty, operations, undefined, rng, usage),
  );
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

/**
 * Ones digits that may be carried into the next step (0 and 1 are trivial).
 * 5 is absorbing (5 × odd ends in 5, 5 × even ends in 0), so the reachability
 * table only routes chains through 5 when they end on 5 or 0 — it adds the
 * ×5 facts (5×3=15, 5×7=35, 5×9=45, …) as variety for the digit 5.
 */
const CARRY_DIGITS = [2, 3, 4, 5, 6, 7, 8, 9];
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
 * Ones-digit walks keep exact keys (3 × 9 and 9 × 3 may both appear, as
 * different carries) but avoid near-undo and commuted repeats when they can.
 */
const ONES_PASSES: WalkOptions[] = [
  { requireAllOps: false, usedKey: 'key', nearUndo: 'soft', budget: SEARCH_BUDGET },
];

function onesDigitChain(targetDigit: number, rng: Rng, usage: FactUsage): PuzzleChain {
  assertDigit(targetDigit);
  const graph = getOnesGraph();
  const finals: Fact[] = [];
  for (const a of CARRY_DIGITS) {
    for (const b of ONES_FACTORS) {
      if ((a * b) % 10 === targetDigit) finals.push(makeFact(a, '*', b, a * b, targetDigit));
    }
  }
  const plan = makePlan(finals, true);
  const { min, max } = targetDigit % 2 === 1 ? MULTIPLICATION_PIN_ODD_CHAIN_LENGTH : MULTIPLICATION_PIN_CHAIN_LENGTH;
  for (let length = randInt(min, max, rng); length >= 2; length--) {
    const cover = coverTable(`ones|${targetDigit}`, graph, plan, length - 1);
    if (!cover[length - 1].some(Boolean)) continue;
    const facts = walkWithFallbacks(graph, plan, cover, length, rng, usage, ONES_PASSES);
    if (facts) return { targetDigit, steps: toSteps(facts), useLastDigit: true, chainMode: 'onesDigit' };
  }
  throw new Error(`Impossible: no ones-digit chain to ${targetDigit}`);
}

/**
 * Chained multiplication facts: the ONES DIGIT of each result is the left
 * operand of the next step, and the ones digit of the last result is the PIN
 * digit. Example for 7:  4 × 8 = 32 → 2 × 6 = 12 → 2 × 9 = 18 → … → 9 × 3 = 27.
 *
 * Built forwards over a reachability table, so it cannot dead-end; no fact
 * repeats.
 *
 * Parity limits odd targets (1, 3, 5, 7, 9): the last product must be
 * odd × odd, and an even carried digit can never become odd again (even ×
 * anything is even), so EVERY carried digit of an odd-target chain is odd,
 * i.e. one of 3, 7, 9 — or 5, but only for the target 5, since 5 never leads
 * anywhere else. For 1, 3, 7, 9 that leaves 6 non-final facts
 * (3×3, 3×9, 7×7, 7×9, 9×3, 9×7). Odd chains are therefore kept short
 * (MULTIPLICATION_PIN_ODD_CHAIN_LENGTH, 3–4 steps) so they don't keep
 * repeating the same facts; the puzzle-level usage counts spread whatever
 * sharing remains as evenly as possible.
 */
export function generateMultiplicationPinChain(targetDigit: number, rng: Rng = Math.random): PuzzleChain {
  return onesDigitChain(targetDigit, rng, newUsage());
}

export function generateMultiplicationPinPuzzle(pin: string, rng: Rng = Math.random): Puzzle {
  assertPin(pin);
  const chains = buildChains(4, (i, usage) => onesDigitChain(Number(pin[i]), rng, usage));
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

  // Chain 2i encodes coordinate i's row, chain 2i + 1 its column.
  const digits = meta.coordinates.flatMap((coord) => [coord.row, coord.col]);
  const chains = buildChains(digits.length, (i, usage) =>
    generateChainWithUsage(digits[i], difficulty, operations, chainLen, rng, usage),
  );

  return { pin, chains, meta };
}

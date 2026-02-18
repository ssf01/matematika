import type { Operation, Difficulty, MathStep, PuzzleChain, Puzzle } from './types';
import { DIFFICULTY_CONSTRAINTS, CHAIN_LENGTH } from './constants';

export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface InverseResult {
  previousResult: number;
  operandRight: number;
}

function tryInvert(
  op: Operation,
  currentResult: number,
  constraints: { maxValue: number; allowCarry: boolean; twoDigit: boolean },
): InverseResult | null {
  const maxVal = constraints.maxValue;
  const MAX_ATTEMPTS = 50;

  switch (op) {
    case '+': {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const operandRight = randInt(1, Math.min(maxVal, currentResult));
        if (operandRight < 1) continue;
        const previousResult = currentResult - operandRight;
        if (previousResult < 0 || previousResult > maxVal) continue;
        if (!constraints.allowCarry && previousResult + operandRight > 10) continue;
        return { previousResult, operandRight };
      }
      return null;
    }

    case '-': {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const operandRight = randInt(1, maxVal);
        const previousResult = currentResult + operandRight;
        if (previousResult > maxVal) continue;
        if (!constraints.allowCarry && previousResult > 10) continue;
        return { previousResult, operandRight };
      }
      return null;
    }

    case '*': {
      if (currentResult === 0) {
        const operandRight = randInt(2, Math.min(maxVal, 10));
        return { previousResult: 0, operandRight };
      }
      const divisors: number[] = [];
      for (let d = 2; d <= Math.min(currentResult, maxVal, 10); d++) {
        if (currentResult % d === 0) {
          const prev = currentResult / d;
          if (prev >= 1 && prev <= maxVal) divisors.push(d);
        }
      }
      if (divisors.length === 0) return null;
      const operandRight = divisors[randInt(0, divisors.length - 1)];
      return { previousResult: currentResult / operandRight, operandRight };
    }

    case '/': {
      if (currentResult === 0) {
        const operandRight = randInt(2, Math.min(maxVal, 10));
        return { previousResult: 0, operandRight };
      }
      const validDivisors: number[] = [];
      for (let d = 2; d <= 10; d++) {
        if (currentResult * d <= maxVal) validDivisors.push(d);
      }
      if (validDivisors.length === 0) return null;
      const operandRight = validDivisors[randInt(0, validDivisors.length - 1)];
      return { previousResult: currentResult * operandRight, operandRight };
    }

    default:
      return null;
  }
}

/**
 * Generate a chain of independent math facts (not backward-chained).
 * Used when multiplication or division is in the selected operations,
 * since backward chaining doesn't work well with * and / for small targets.
 * The last step's result's ones digit equals the target PIN digit.
 */
function generateIndependentChain(
  targetDigit: number,
  difficulty: Difficulty,
  operations: Operation[],
): PuzzleChain {
  const constraints = DIFFICULTY_CONSTRAINTS[difficulty];
  const chainLength = randInt(CHAIN_LENGTH.min, CHAIN_LENGTH.max);
  const steps: MathStep[] = [];
  const usedKeys = new Set<string>();

  const maxFactor = difficulty === 'easy' ? 10 : difficulty === 'medium' ? 12 : 15;

  for (let i = 0; i < chainLength - 1; i++) {
    const op = operations[randInt(0, operations.length - 1)];
    let step: MathStep;
    let attempts = 0;
    do {
      step = generateRandomFact(op, constraints, maxFactor);
      attempts++;
    } while (usedKeys.has(`${step.left}${step.operator}${step.right}`) && attempts < 30);
    usedKeys.add(`${step.left}${step.operator}${step.right}`);
    steps.push(step);
  }

  // Last step: result's ones digit = targetDigit
  const lastOp = operations.includes('*') ? '*' : operations[randInt(0, operations.length - 1)];
  if (lastOp === '*') {
    const validPairs: [number, number][] = [];
    for (let a = 2; a <= maxFactor; a++) {
      for (let b = 2; b <= maxFactor; b++) {
        if ((a * b) % 10 === targetDigit) validPairs.push([a, b]);
      }
    }
    if (validPairs.length > 0) {
      const [a, b] = validPairs[randInt(0, validPairs.length - 1)];
      steps.push({ left: a, operator: '*', right: b, result: a * b });
    } else {
      // Fallback for digits where no a*b ends in targetDigit (shouldn't happen for 0-9)
      const a = randInt(2, maxFactor);
      const b = randInt(2, maxFactor);
      steps.push({ left: a, operator: '*', right: b, result: a * b });
    }
  } else if (lastOp === '/') {
    if (targetDigit === 0) {
      const divisor = randInt(2, maxFactor);
      steps.push({ left: 0, operator: '/', right: divisor, result: 0 });
    } else {
      const divisor = randInt(2, maxFactor);
      steps.push({ left: targetDigit * divisor, operator: '/', right: divisor, result: targetDigit });
    }
  } else {
    steps.push(generateRandomFact(lastOp, constraints, maxFactor));
  }

  // Mark as useLastDigit when last step is multiplication (ones digit reveals PIN digit)
  const lastStep = steps[steps.length - 1];
  const useLastDigit = lastStep.operator === '*' && lastStep.result > 9;

  return { targetDigit, steps, useLastDigit };
}

function generateRandomFact(
  op: Operation,
  constraints: { maxValue: number; allowCarry: boolean; twoDigit: boolean },
  maxFactor: number,
): MathStep {
  const maxVal = constraints.maxValue;
  switch (op) {
    case '+': {
      const a = randInt(1, maxVal);
      const b = randInt(1, maxVal - a > 0 ? maxVal - a : 1);
      return { left: a, operator: '+', right: b, result: a + b };
    }
    case '-': {
      const a = randInt(2, maxVal);
      const b = randInt(1, a);
      return { left: a, operator: '-', right: b, result: a - b };
    }
    case '*': {
      const a = randInt(2, maxFactor);
      const b = randInt(2, maxFactor);
      return { left: a, operator: '*', right: b, result: a * b };
    }
    case '/': {
      const divisor = randInt(2, maxFactor);
      const quotient = randInt(1, maxFactor);
      return { left: divisor * quotient, operator: '/', right: divisor, result: quotient };
    }
    default:
      return { left: 1, operator: '+', right: 1, result: 2 };
  }
}

export function generateChain(
  targetDigit: number,
  difficulty: Difficulty,
  operations: Operation[],
): PuzzleChain {
  // When multiplication or division is in the operations, use independent facts
  // because backward chain construction doesn't work well with * and / for small targets
  const hasMultDiv = operations.some(op => op === '*' || op === '/');
  if (hasMultDiv) {
    return generateIndependentChain(targetDigit, difficulty, operations);
  }

  const constraints = DIFFICULTY_CONSTRAINTS[difficulty];
  const chainLength = randInt(CHAIN_LENGTH.min, CHAIN_LENGTH.max);
  const MAX_RETRIES = 100;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const backwardSteps: MathStep[] = [];
    const usedKeys = new Set<string>();
    const visitedResults = new Map<number, number>();
    visitedResults.set(targetDigit, 1);
    let currentResult = targetDigit;
    let failed = false;

    for (let stepIdx = 0; stepIdx < chainLength; stepIdx++) {
      const isLastForwardStep = stepIdx === 0;
      const opsToTry = shuffle([...operations]);

      // Hard mode & digit 0: prefer subtraction for the final forward step
      if ((difficulty === 'hard' || targetDigit === 0) && isLastForwardStep && operations.includes('-')) {
        const idx = opsToTry.indexOf('-');
        if (idx > 0) {
          opsToTry.splice(idx, 1);
          opsToTry.unshift('-');
        }
      }

      let stepDone = false;
      for (const op of opsToTry) {
        const inv = tryInvert(op, currentResult, constraints);
        if (inv !== null) {
          const key = `${inv.previousResult}${op}${inv.operandRight}`;
          // Skip if this exact step was already used (prevents repetition)
          if (usedKeys.has(key)) continue;
          // Skip if we've visited this intermediate result too many times (prevents loops)
          const visitCount = visitedResults.get(inv.previousResult) || 0;
          if (visitCount >= 2) continue;

          usedKeys.add(key);
          visitedResults.set(inv.previousResult, visitCount + 1);
          backwardSteps.push({
            left: inv.previousResult,
            operator: op,
            right: inv.operandRight,
            result: currentResult,
          });
          currentResult = inv.previousResult;
          stepDone = true;
          break;
        }
      }

      if (!stepDone) { failed = true; break; }
    }

    if (failed) continue;
    return { targetDigit, steps: backwardSteps.reverse() };
  }

  // Fallback: trivial chain with variety
  const fb: MathStep[] = [];
  const maxVal = constraints.maxValue;
  if (targetDigit === 0) {
    const a = randInt(1, Math.min(maxVal, 10));
    fb.push({ left: a, operator: '-', right: a, result: 0 });
  } else {
    fb.push({ left: 1, operator: '+', right: targetDigit - 1, result: targetDigit });
  }
  while (fb.length < CHAIN_LENGTH.min) {
    const last = fb[fb.length - 1];
    const step = randInt(2, Math.min(maxVal - last.result, 5));
    if (step > 0 && last.result + step <= maxVal) {
      fb.push({ left: last.result, operator: '+', right: step, result: last.result + step });
      if (fb.length < CHAIN_LENGTH.min) {
        fb.push({ left: last.result + step, operator: '-', right: step, result: last.result });
      }
    } else {
      fb.push({ left: last.result, operator: '+', right: 1, result: last.result + 1 });
      if (fb.length < CHAIN_LENGTH.min) {
        fb.push({ left: last.result + 1, operator: '-', right: 1, result: last.result });
      }
    }
  }
  return { targetDigit, steps: fb.slice(0, CHAIN_LENGTH.max) };
}

export function generatePuzzle(pin: string, difficulty: Difficulty, operations: Operation[]): Puzzle {
  const chains = pin.split('').map((d) => generateChain(parseInt(d, 10), difficulty, operations));
  return { pin, chains };
}

export function generateMultiplicationTable(number: number, maxMultiplier: number = 10): MathStep[] {
  const steps: MathStep[] = [];
  for (let m = 1; m <= maxMultiplier; m++) {
    steps.push({ left: number, operator: '*', right: m, result: number * m });
  }
  return shuffle(steps);
}

/**
 * Generate a PIN puzzle using multiplication facts.
 * For each PIN digit, generates a chain of multiplication problems
 * where the child must solve them sequentially. The last answer's
 * ones digit (answer % 10) reveals the PIN digit.
 *
 * Example for PIN digit 7:
 *   3 × 4 = 12, 6 × 2 = 12, 8 × 3 = 24, 9 × 3 = 27 → ones digit = 7
 */
export function generateMultiplicationPinChain(targetDigit: number): PuzzleChain {
  const steps: MathStep[] = [];
  const numSteps = randInt(6, 8);

  // Generate random multiplication facts for most steps
  for (let i = 0; i < numSteps - 1; i++) {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    steps.push({ left: a, operator: '*', right: b, result: a * b });
  }

  // Last step: find a × b where (a × b) % 10 === targetDigit
  const validPairs: [number, number][] = [];
  for (let a = 2; a <= 9; a++) {
    for (let b = 2; b <= 9; b++) {
      if ((a * b) % 10 === targetDigit) {
        validPairs.push([a, b]);
      }
    }
  }

  if (validPairs.length > 0) {
    const [a, b] = validPairs[randInt(0, validPairs.length - 1)];
    steps.push({ left: a, operator: '*', right: b, result: a * b });
  } else {
    // Fallback for digit 0: any number × 10, or use 2×5=10, 4×5=20, etc.
    const multOf10: [number, number][] = [];
    for (let a = 2; a <= 9; a++) {
      for (let b = 2; b <= 9; b++) {
        if ((a * b) % 10 === 0) multOf10.push([a, b]);
      }
    }
    const [a, b] = multOf10[randInt(0, multOf10.length - 1)];
    steps.push({ left: a, operator: '*', right: b, result: a * b });
  }

  return { targetDigit, steps, useLastDigit: true };
}

export function generateMultiplicationPinPuzzle(pin: string): Puzzle {
  const chains = pin.split('').map((d) => generateMultiplicationPinChain(parseInt(d, 10)));
  return { pin, chains };
}

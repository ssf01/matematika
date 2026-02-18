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

export function generateChain(
  targetDigit: number,
  difficulty: Difficulty,
  operations: Operation[],
): PuzzleChain {
  const constraints = DIFFICULTY_CONSTRAINTS[difficulty];
  const chainLength = randInt(CHAIN_LENGTH.min, CHAIN_LENGTH.max);
  const MAX_RETRIES = 100;

  for (let retry = 0; retry < MAX_RETRIES; retry++) {
    const backwardSteps: MathStep[] = [];
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

  // Fallback: trivial chain
  const fb: MathStep[] = [];
  if (targetDigit === 0) {
    const a = randInt(1, Math.min(constraints.maxValue, 10));
    fb.push({ left: a, operator: '-', right: a, result: 0 });
  } else {
    fb.push({ left: 1, operator: '+', right: targetDigit - 1, result: targetDigit });
  }
  while (fb.length < CHAIN_LENGTH.min) {
    const last = fb[fb.length - 1];
    fb.push({ left: last.result, operator: '+', right: 1, result: last.result + 1 });
    if (fb.length < CHAIN_LENGTH.min) {
      fb.push({ left: last.result + 1, operator: '-', right: 1, result: last.result });
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

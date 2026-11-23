import type { MathStep, PuzzleChain } from './types';

export function validateStep(step: MathStep, answer: number): boolean {
  return answer === step.result;
}

export function validateChain(chain: PuzzleChain, answers: number[]): boolean {
  if (answers.length !== chain.steps.length) return false;
  return chain.steps.every((step, i) => answers[i] === step.result);
}

/** The PIN digit a chain encodes: the last result, or its ones digit when useLastDigit is set. */
export function getChainFinalDigit(chain: PuzzleChain): number {
  if (chain.steps.length === 0) return chain.targetDigit;
  const last = chain.steps[chain.steps.length - 1].result;
  return chain.useLastDigit ? last % 10 : last;
}

export function validateMultiplicationAnswer(left: number, right: number, answer: number): boolean {
  return left * right === answer;
}

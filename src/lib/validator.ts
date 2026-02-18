import type { MathStep, PuzzleChain } from './types';

export function validateStep(step: MathStep, answer: number): boolean {
  return answer === step.result;
}

export function validateChain(chain: PuzzleChain, answers: number[]): boolean {
  if (answers.length !== chain.steps.length) return false;
  return chain.steps.every((step, i) => answers[i] === step.result);
}

export function getChainFinalDigit(chain: PuzzleChain): number {
  if (chain.steps.length === 0) return chain.targetDigit;
  return chain.steps[chain.steps.length - 1].result;
}

export function validateMultiplicationAnswer(left: number, right: number, answer: number): boolean {
  return left * right === answer;
}

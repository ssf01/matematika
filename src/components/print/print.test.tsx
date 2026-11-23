/// <reference types="vite/client" />
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ScriptProvider } from '../../i18n/ScriptContext';
import { ThemeProvider } from '../themes/ThemeProvider';
import { PrintableWorksheet } from './PrintableWorksheet';
import { PrintSection, isStepChained } from './PrintSection';
import type { Puzzle, PuzzleChain, Theme } from '../../lib/types';

const CYRILLIC = /[Ѐ-ӿ]/;

// Raw source of every non-test module in print/ and ui/ (resolved by Vite at test time).
const SOURCES: Record<string, Record<string, string>> = {
  print: import.meta.glob(['./**/*.{ts,tsx}', '!./**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }),
  ui: import.meta.glob(['../ui/**/*.{ts,tsx}', '!../ui/**/*.test.{ts,tsx}'], { query: '?raw', import: 'default', eager: true }),
};

describe('no hardcoded Cyrillic in shared UI / print', () => {
  for (const [sub, files] of Object.entries(SOURCES)) {
    it(`src/components/${sub}/** uses t() for all Serbian text`, () => {
      expect(Object.keys(files).length).toBeGreaterThan(2);
      const offenders: string[] = [];
      for (const [file, source] of Object.entries(files)) {
        source.split('\n').forEach((line, i) => {
          if (CYRILLIC.test(line)) offenders.push(`${file}:${i + 1}: ${line.trim()}`);
        });
      }
      expect(offenders).toEqual([]);
    });
  }
});

function wrap(children: ReactNode, theme: Theme = 'agent') {
  return (
    <ScriptProvider>
      <ThemeProvider themeId={theme}>{children}</ThemeProvider>
    </ScriptProvider>
  );
}

const fullChain: PuzzleChain = {
  targetDigit: 3,
  steps: [
    { left: 5, operator: '+', right: 4, result: 9 },
    { left: 9, operator: '-', right: 3, result: 6 },
    { left: 6, operator: '/', right: 2, result: 3 },
  ],
};

describe('PrintSection', () => {
  beforeEach(() => localStorage.clear());

  it('uses −, × and : symbols', () => {
    const chain: PuzzleChain = {
      targetDigit: 2,
      steps: [
        { left: 3, operator: '*', right: 4, result: 12 },
        { left: 12, operator: '-', right: 4, result: 8 },
        { left: 8, operator: '/', right: 4, result: 2 },
      ],
    };
    const { container } = render(wrap(<PrintSection chain={chain} chainIndex={0} showAnswers />));
    const text = container.textContent ?? '';
    expect(text).toContain('×');
    expect(text).toContain('−');
    expect(text).toContain(':');
    expect(text).not.toContain('÷');
    expect(text).not.toMatch(/\d\s*[*/]\s*\d/);
  });

  it('blanks only steps that actually continue the previous result', () => {
    expect(isStepChained(fullChain, 0)).toBe(false);
    expect(isStepChained(fullChain, 1)).toBe(true);
    expect(isStepChained(fullChain, 2)).toBe(true);

    const broken: PuzzleChain = { ...fullChain, steps: [fullChain.steps[0], { left: 7, operator: '-', right: 4, result: 3 }] };
    expect(isStepChained(broken, 1)).toBe(false);
  });

  it('never blanks steps of an independent chain, even if numbers happen to match', () => {
    const independent = { ...fullChain, chainMode: 'independent' } as unknown as PuzzleChain;
    expect(isStepChained(independent, 1)).toBe(false);
    const { container } = render(wrap(<PrintSection chain={independent} chainIndex={0} chainedSteps />));
    // all left operands are printed: 5, 9, 6
    const text = container.textContent ?? '';
    expect(text).toMatch(/5\s*\+\s*4/);
    expect(text).toMatch(/9\s*−\s*3/);
    expect(text).toMatch(/6\s*:\s*2/);
  });

  it('onesDigit chains carry only the ones digit and show the instruction', () => {
    const chain: PuzzleChain = {
      targetDigit: 8,
      chainMode: 'onesDigit',
      useLastDigit: true,
      steps: [
        { left: 3, operator: '*', right: 9, result: 27 },
        { left: 7, operator: '*', right: 4, result: 28 },
      ],
    };
    expect(isStepChained(chain, 1)).toBe(true);
    render(wrap(<PrintSection chain={chain} chainIndex={0} chainedSteps />));
    expect(screen.getByText('Цифру јединице резултата пренеси у следећи ред као први број.')).toBeInTheDocument();
  });
});

const metaPuzzle: Puzzle = {
  pin: '1234',
  chains: Array.from({ length: 8 }, () => fullChain),
  meta: {
    cells: Array.from({ length: 10 }, (_, r) => Array.from({ length: 10 }, (_, c) => (r + c) % 10)),
    coordinates: [
      { row: 3, col: 3, pinDigit: 6 },
      { row: 3, col: 3, pinDigit: 6 },
      { row: 3, col: 3, pinDigit: 6 },
      { row: 3, col: 3, pinDigit: 6 },
    ],
  },
};

describe('PrintableWorksheet', () => {
  beforeEach(() => localStorage.clear());

  it('translates header fields and marks the answer key as parents-only', () => {
    render(wrap(<PrintableWorksheet puzzle={{ pin: '1234', chains: [fullChain] }} />));
    expect(screen.getByText(/Име:/)).toBeInTheDocument();
    expect(screen.getByText(/Датум:/)).toBeInTheDocument();
    expect(screen.getByText('Само за родитеље')).toBeInTheDocument();
  });

  it('renders Latin script and theme-specific grid labels', () => {
    localStorage.setItem('matematika-script', 'latin');
    const { container } = render(wrap(<PrintableWorksheet puzzle={metaPuzzle} />, 'detective'));
    const text = container.textContent ?? '';
    expect(CYRILLIC.test(text)).toBe(false);
    expect(text).toContain('Ime:');
    expect(text).toContain('Ulica↓');
    expect(text).toContain('Kuća→');
    expect(text).toContain('Samo za roditelje');
  });

  it('uses the ones-digit meta instruction when the coordinate is the last digit of a result', () => {
    const mult: PuzzleChain = {
      targetDigit: 4,
      useLastDigit: true,
      steps: [{ left: 3, operator: '*', right: 8, result: 24 }],
    };
    render(wrap(<PrintableWorksheet puzzle={{ ...metaPuzzle, chains: Array.from({ length: 8 }, () => mult) }} />));
    expect(screen.getByText(/цифра јединица/)).toBeInTheDocument();
  });
});

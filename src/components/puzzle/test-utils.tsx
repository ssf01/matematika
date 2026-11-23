import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ScriptProvider } from '../../i18n/ScriptContext';
import { ThemeProvider } from '../themes/ThemeProvider';
import { useGameStore, initialState } from '../../stores/gameStore';
import type { GameState } from '../../stores/gameStore';
import type { Puzzle, PuzzleChain } from '../../lib/types';

export function renderWithProviders(ui: ReactElement) {
  return render(
    <ScriptProvider>
      <ThemeProvider themeId="space">{ui}</ThemeProvider>
    </ScriptProvider>,
  );
}

export function resetStore(patch: Partial<GameState> = {}) {
  sessionStorage.clear();
  useGameStore.setState({ ...initialState, ...patch });
}

/** A fixed chain: 5 + 3 = 8, 8 − 1 = 7, 7 + 5 = 12 (target 2 is irrelevant here). */
export function makeChain(targetDigit = 2): PuzzleChain {
  return {
    targetDigit,
    steps: [
      { left: 5, operator: '+', right: 3, result: 8 },
      { left: 8, operator: '-', right: 1, result: 7 },
      { left: 7, operator: '+', right: 5, result: 12 },
    ],
  };
}

export function makePuzzle(): Puzzle {
  return { pin: '2222', chains: [makeChain(), makeChain(), makeChain(), makeChain()] };
}

export function makeMetaPuzzle(): Puzzle {
  const cells = Array.from({ length: 10 }, () => Array<number>(10).fill(0));
  const coordinates = [
    { row: 1, col: 2, pinDigit: 4 },
    { row: 3, col: 4, pinDigit: 5 },
    { row: 5, col: 6, pinDigit: 6 },
    { row: 7, col: 8, pinDigit: 7 },
  ];
  for (const c of coordinates) cells[c.row][c.col] = c.pinDigit;
  const chains = coordinates.flatMap((c) => [makeChain(c.row), makeChain(c.col)]);
  return { pin: '4567', chains, meta: { cells, coordinates } };
}

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, act, within } from '@testing-library/react';
import { PuzzleBoard } from './PuzzleBoard';
import { useGameStore } from '../../stores/gameStore';
import { renderWithProviders, resetStore, makePuzzle, makeMetaPuzzle } from './test-utils';
import { translations } from '../../i18n/translations';
import type { Puzzle } from '../../lib/types';

function renderBoard(puzzle: Puzzle) {
  return renderWithProviders(<PuzzleBoard puzzle={useGameStore.getState().puzzle ?? puzzle} />);
}

describe('StandardPuzzleFlow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('after a reload mid-chain shows stored answers for solved steps', () => {
    const puzzle = makePuzzle();
    resetStore({ puzzle, theme: 'space', currentStep: 'playing', answers: { '0-0': 8, '0-1': 7 } });
    renderBoard(puzzle);

    const done = screen.getAllByTestId('step-done');
    expect(done).toHaveLength(2);
    expect(done[0]).toHaveTextContent('8');
    expect(done[1]).toHaveTextContent('7');
    expect(screen.getByTestId('step-active')).toHaveTextContent('7');
  });

  it('never renders the operands of locked steps', () => {
    const puzzle = makePuzzle();
    resetStore({ puzzle, theme: 'space', currentStep: 'playing', answers: { '0-0': 8 } });
    renderBoard(puzzle);
    const locked = screen.getAllByTestId('step-locked');
    expect(locked).toHaveLength(1);
    // Locked step is "7 + 5"; neither operand may leak.
    expect(locked[0].textContent).not.toMatch(/\d/);
    expect(locked[0]).toHaveTextContent('?');
  });

  it('uses proper minus sign for display', () => {
    const puzzle = makePuzzle();
    resetStore({ puzzle, theme: 'space', currentStep: 'playing', answers: { '0-0': 8 } });
    renderBoard(puzzle);
    expect(screen.getByTestId('step-active')).toHaveTextContent('8−1=');
  });

  it('solving a chain by typing stores answers and completes it', () => {
    const puzzle = makePuzzle();
    resetStore({ puzzle, theme: 'space', currentStep: 'playing', answers: { '0-0': 8 } });
    renderBoard(puzzle);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '7' } });
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1' } });
    expect(screen.queryByText(translations['puzzle.incorrect'])).toBeNull();
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '12' } });
    expect(useGameStore.getState().completedChains).toEqual([0]);
    expect(useGameStore.getState().answers['0-2']).toBe(12);
  });

  it('works with independent chains (no carried-over left operand)', () => {
    const puzzle: Puzzle = {
      pin: '1111',
      chains: Array.from({ length: 4 }, () => ({
        targetDigit: 1,
        chainMode: 'independent' as never,
        steps: [
          { left: 2, operator: '+', right: 2, result: 4 },
          { left: 9, operator: '-', right: 8, result: 1 },
        ],
      })),
    };
    resetStore({ puzzle, theme: 'space', currentStep: 'playing', answers: { '0-0': 4 } });
    renderBoard(puzzle);
    expect(screen.getByTestId('step-active')).toHaveTextContent('9−8=');
  });
});

describe('MetaPuzzleFlow', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('never labels coordinate chains as PIN digits', () => {
    const puzzle = makeMetaPuzzle();
    resetStore({ puzzle, theme: 'space', currentStep: 'playing', answers: { '0-0': 8 } });
    renderBoard(puzzle);
    expect(screen.queryByText(/Цифра \d/)).toBeNull();
    expect(screen.queryByText(new RegExp(translations['puzzle.pinDigit']))).toBeNull();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toContain(translations['meta.grid.row']);

    // Completed chain shows a coordinate label, not "Цифра".
    act(() => {
      useGameStore.getState().setAnswer(0, 1, 7);
      useGameStore.getState().setAnswer(0, 2, 12);
      useGameStore.getState().markChainCompleted(0);
    });
    expect(screen.queryByText(/Цифра/)).toBeNull();
  });

  it('double-tapping the target cell reveals each digit exactly once', () => {
    const puzzle = makeMetaPuzzle();
    // All coordinate chains solved: each pair starts at coordinate-reveal.
    resetStore({
      puzzle,
      theme: 'space',
      currentStep: 'playing',
      completedChains: [0, 1, 2, 3, 4, 5, 6, 7],
    });
    renderBoard(puzzle);
    const next = () => screen.getByRole('button', { name: translations['story.next'] });
    const flush = () => act(() => vi.advanceTimersByTime(400));

    for (const coord of puzzle.meta!.coordinates) {
      // coordinate-reveal → grid
      fireEvent.click(next());
      flush();
      const grid = screen.getByRole('group');
      const target = within(grid).getAllByRole('button').find((b) =>
        b.getAttribute('aria-label')?.startsWith(`${translations['meta.grid.row']} ${coord.row}, ${translations['meta.grid.col']} ${coord.col}:`),
      )!;
      fireEvent.click(target);
      fireEvent.click(target);
      flush();
      fireEvent.click(target); // stale tap after the transition
      // digit-found → next pair (solve-row auto-advances since chains are done)
      fireEvent.click(next());
      flush();
      flush();
      flush();
    }

    const s = useGameStore.getState();
    expect(s.metaCoordinatesRevealed).toEqual([0, 1, 2, 3]);
    expect(screen.getByText(translations['puzzle.completed'])).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(3000));
    expect(useGameStore.getState().currentStep).toBe('reveal');
  });

  it('grid cells are accessible buttons', () => {
    const puzzle = makeMetaPuzzle();
    resetStore({ puzzle, theme: 'space', currentStep: 'playing', completedChains: [0, 1] });
    renderBoard(puzzle);
    fireEvent.click(screen.getByRole('button', { name: translations['story.next'] }));
    act(() => vi.advanceTimersByTime(400));
    const cells = within(screen.getByRole('group')).getAllByRole('button');
    expect(cells).toHaveLength(100);
    expect(cells[12]).toHaveAttribute('aria-label', expect.stringContaining(' 1, '));
  });
});

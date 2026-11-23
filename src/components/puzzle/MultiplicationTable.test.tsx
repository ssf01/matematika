import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { MultiplicationTable } from './MultiplicationTable';
import { useGameStore } from '../../stores/gameStore';
import { renderWithProviders, resetStore } from './test-utils';
import { translations } from '../../i18n/translations';

describe('MultiplicationTable', () => {
  beforeEach(() => resetStore({ theme: 'space', multiplicationTableNumber: 3, currentStep: 'playing' }));

  it('keeps order and answers across a remount (reload)', () => {
    renderWithProviders(<MultiplicationTable number={3} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(inputs).toHaveLength(10);
    fireEvent.change(inputs[0], { target: { value: '9' } });
    const order = useGameStore.getState().multiplicationTable!.steps.map((s) => s.right);

    cleanup();
    renderWithProviders(<MultiplicationTable number={3} />);
    const again = screen.getAllByRole('textbox') as HTMLInputElement[];
    expect(again[0].value).toBe('9');
    expect(useGameStore.getState().multiplicationTable!.steps.map((s) => s.right)).toEqual(order);
  });

  it('Enter moves to the next box and checks on the last one', () => {
    renderWithProviders(<MultiplicationTable number={3} />);
    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[];
    const steps = useGameStore.getState().multiplicationTable!.steps;
    steps.forEach((s, i) => fireEvent.change(inputs[i], { target: { value: String(s.result) } }));
    fireEvent.keyDown(inputs[0], { key: 'Enter' });
    expect(document.activeElement).toBe(inputs[1]);
    fireEvent.keyDown(inputs[9], { key: 'Enter' });
    expect(useGameStore.getState().multiplicationTable!.checked).toBe(true);
    expect(screen.getByText(translations['multiplicationTable.perfect'])).toBeInTheDocument();
  });

  it('try again clears answers and reshuffles the questions', () => {
    renderWithProviders(<MultiplicationTable number={3} />);
    fireEvent.click(screen.getByRole('button', { name: translations['multiplicationTable.check'] }));
    const before = useGameStore.getState().multiplicationTable!;
    fireEvent.click(screen.getByRole('button', { name: translations['multiplicationTable.tryAgain'] }));
    const after = useGameStore.getState().multiplicationTable!;
    expect(after.checked).toBe(false);
    expect(after.answers).toEqual({});
    expect(after.steps).not.toBe(before.steps);
    expect(after.steps.map((s) => s.right).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });
});

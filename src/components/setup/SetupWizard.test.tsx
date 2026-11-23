import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, createEvent } from '@testing-library/react';
import { SetupWizard } from './SetupWizard';
import { PinInput } from './PinInput';
import { useGameStore } from '../../stores/gameStore';
import { renderWithProviders, resetStore } from '../puzzle/test-utils';
import { translations } from '../../i18n/translations';

const nextLabel = translations['setup.next'];
const startLabel = translations['setup.start'];

function pinBoxes() {
  return screen.getAllByRole('textbox') as HTMLInputElement[];
}

function typePin(pin: string) {
  const boxes = pinBoxes();
  pin.split('').forEach((d, i) => fireEvent.change(boxes[i], { target: { value: d } }));
}

describe('PinInput', () => {
  beforeEach(() => resetStore());

  it('writes the full PIN to the store and clears it when a digit is removed', () => {
    renderWithProviders(<PinInput />);
    typePin('1234');
    expect(useGameStore.getState().pin).toBe('1234');

    const boxes = pinBoxes();
    fireEvent.change(boxes[3], { target: { value: '' } });
    expect(boxes[3].value).toBe('');
    expect(useGameStore.getState().pin).toBe('');
  });

  it('backspace on an empty box clears the previous digit and the stored PIN', () => {
    renderWithProviders(<PinInput />);
    typePin('123');
    const boxes = pinBoxes();
    fireEvent.change(boxes[3], { target: { value: '4' } });
    expect(useGameStore.getState().pin).toBe('1234');
    fireEvent.change(boxes[3], { target: { value: '' } });
    fireEvent.keyDown(boxes[3], { key: 'Backspace' });
    expect(boxes[2].value).toBe('');
    expect(useGameStore.getState().pin).toBe('');
  });

  it('accepts a pasted 4-digit PIN', () => {
    renderWithProviders(<PinInput />);
    const boxes = pinBoxes();
    const paste = createEvent.paste(boxes[0], {
      clipboardData: { getData: () => '98 76' },
    });
    fireEvent(boxes[0], paste);
    expect(useGameStore.getState().pin).toBe('9876');
    expect(boxes.map((b) => b.value)).toEqual(['9', '8', '7', '6']);
  });

  it('labels each box and disables autocomplete', () => {
    renderWithProviders(<PinInput />);
    const boxes = pinBoxes();
    expect(boxes).toHaveLength(4);
    boxes.forEach((b, i) => {
      expect(b).toHaveAttribute('autocomplete', 'off');
      expect(b.getAttribute('aria-label')).toContain(String(i + 1));
    });
  });
});

describe('SetupWizard', () => {
  beforeEach(() => resetStore({ theme: 'space', difficulty: 'easy', setupStep: 3 }));

  it('disables Next again after clearing a PIN digit', () => {
    renderWithProviders(<SetupWizard />);
    const next = screen.getByRole('button', { name: nextLabel });
    expect(next).toBeDisabled();
    typePin('1234');
    expect(next).toBeEnabled();
    fireEvent.change(pinBoxes()[3], { target: { value: '' } });
    expect(next).toBeDisabled();
  });

  it('multiplication-PIN is a selectable mode that generates on Start', () => {
    resetStore({ theme: 'space', difficulty: 'easy', setupStep: 4, pin: '3141' });
    renderWithProviders(<SetupWizard />);
    // Selecting the card does not start the game.
    fireEvent.click(screen.getByText(translations['mode.multiplicationPin']));
    expect(useGameStore.getState().mode).toBe('multiplication-pin');
    expect(useGameStore.getState().currentStep).toBe('setup');
    expect(useGameStore.getState().puzzle).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: startLabel }));
    const s = useGameStore.getState();
    expect(s.currentStep).toBe('handover');
    expect(s.puzzle?.pin).toBe('3141');
    expect(s.puzzle?.chains).toHaveLength(4);
    expect(s.puzzle?.chains.every((c) => c.steps.every((st) => st.operator === '*'))).toBe(true);
  });

  it('print mode goes straight to playing', () => {
    resetStore({ theme: 'space', difficulty: 'easy', setupStep: 4, pin: '1234', mode: 'print' });
    renderWithProviders(<SetupWizard />);
    fireEvent.click(screen.getByRole('button', { name: startLabel }));
    expect(useGameStore.getState().currentStep).toBe('playing');
    expect(useGameStore.getState().puzzle?.chains).toHaveLength(4);
  });
});

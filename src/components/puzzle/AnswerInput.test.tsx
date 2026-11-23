import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { AnswerInput, COOLDOWN_MS, MAX_WRONG_ATTEMPTS, WRONG_FEEDBACK_MS } from './AnswerInput';
import { renderWithProviders } from './test-utils';
import { translations } from '../../i18n/translations';

const INCORRECT = translations['puzzle.incorrect'];

function setup(expected = 12) {
  const onCorrect = vi.fn();
  const utils = renderWithProviders(
    <AnswerInput expected={expected} onCorrect={onCorrect} label="answer" autoFocus />,
  );
  const input = screen.getByLabelText('answer') as HTMLInputElement;
  return { ...utils, input, onCorrect };
}

describe('AnswerInput', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('typing a prefix of the answer and waiting never shows an error', () => {
    const { input, onCorrect } = setup(12);
    fireEvent.change(input, { target: { value: '1' } });
    act(() => vi.advanceTimersByTime(2000));
    expect(screen.queryByText(INCORRECT)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent('');
    expect(input.value).toBe('1');
    expect(onCorrect).not.toHaveBeenCalled();
  });

  it('auto-accepts the moment the value is correct', () => {
    const { input, onCorrect } = setup(12);
    fireEvent.change(input, { target: { value: '1' } });
    fireEvent.change(input, { target: { value: '12' } });
    expect(onCorrect).toHaveBeenCalledTimes(1);
    expect(onCorrect).toHaveBeenCalledWith(12);
  });

  it('strips non-digits and uses a numeric keypad', () => {
    const { input } = setup(12);
    expect(input).toHaveAttribute('inputmode', 'numeric');
    fireEvent.change(input, { target: { value: '4a' } });
    expect(input.value).toBe('4');
  });

  it('rejects a wrong answer only on Enter', () => {
    const { input, onCorrect } = setup(12);
    fireEvent.change(input, { target: { value: '13' } });
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByText(INCORRECT)).toBeNull();

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByText(INCORRECT)).toBeInTheDocument();
    expect(onCorrect).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(WRONG_FEEDBACK_MS));
    expect(screen.queryByText(INCORRECT)).toBeNull();
    expect(input.value).toBe('');
  });

  it('rejects via the ✓ button', () => {
    const { input } = setup(12);
    fireEvent.change(input, { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(INCORRECT)).toBeInTheDocument();
  });

  it(`locks for a cooldown after ${MAX_WRONG_ATTEMPTS} wrong attempts`, () => {
    const { input, onCorrect } = setup(12);
    for (let i = 0; i < MAX_WRONG_ATTEMPTS; i++) {
      fireEvent.change(input, { target: { value: '5' } });
      fireEvent.keyDown(input, { key: 'Enter' });
      if (i < MAX_WRONG_ATTEMPTS - 1) act(() => vi.advanceTimersByTime(WRONG_FEEDBACK_MS));
    }
    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/puzzle\.cooldown|Сачекај/);
    expect(input).toHaveAttribute('readonly');

    // Typing (even the right answer) is ignored during the cooldown.
    fireEvent.change(input, { target: { value: '12' } });
    expect(onCorrect).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(COOLDOWN_MS));
    expect(input).not.toHaveAttribute('readonly');
    expect(status).toHaveTextContent('');
    fireEvent.change(input, { target: { value: '12' } });
    expect(onCorrect).toHaveBeenCalledWith(12);
  });

  it('clears pending timers on unmount', () => {
    const { input, unmount } = setup(12);
    fireEvent.change(input, { target: { value: '5' } });
    const baseline = vi.getTimerCount();
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(vi.getTimerCount()).toBe(baseline + 1);
    unmount();
    expect(vi.getTimerCount()).toBeLessThanOrEqual(baseline);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Card } from './Card';
import { ProgressBar } from './ProgressBar';
import { ResetButton } from './ResetButton';
import { ScriptToggle } from './ScriptToggle';
import { ScriptProvider } from '../../i18n/ScriptContext';
import { useGameStore } from '../../stores/gameStore';

/**
 * Minimal keyboard simulation: jsdom does not implement sequential focus
 * navigation or the native button activation behaviour, so we emulate the two
 * browser rules we depend on: Tab moves to the next tabbable element, and
 * Enter/Space on a <button> fires click.
 */
function tab() {
  const tabbables = Array.from(
    document.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'),
  );
  const idx = tabbables.indexOf(document.activeElement as HTMLElement);
  const next = tabbables[idx + 1] ?? tabbables[0];
  fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab' });
  next.focus();
}
function press(key: 'Enter' | ' ') {
  const el = document.activeElement as HTMLElement;
  const notCancelled = fireEvent.keyDown(el, { key });
  if (notCancelled && el.tagName === 'BUTTON') el.click();
  fireEvent.keyUp(el, { key });
}

describe('Card', () => {
  it('renders a non-interactive div without onClick', () => {
    render(<Card>static</Card>);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('is a keyboard-operable toggle button when clickable', () => {
    const onClick = vi.fn();
    render(
      <>
        <Card onClick={onClick} selected>
          first
        </Card>
        <Card onClick={onClick} selected={false}>
          second
        </Card>
      </>,
    );
    const [first, second] = screen.getAllByRole('button');
    expect(first).toHaveAttribute('type', 'button');
    expect(first).toHaveAttribute('aria-pressed', 'true');
    expect(second).toHaveAttribute('aria-pressed', 'false');
    expect(first.className).toContain('text-left');
    expect(first.className).toContain('w-full');

    tab();
    expect(first).toHaveFocus();
    press('Enter');
    expect(onClick).toHaveBeenCalledTimes(1);

    tab();
    expect(second).toHaveFocus();
    press(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});

describe('ProgressBar', () => {
  it('exposes progress semantics', () => {
    render(<ProgressBar current={2} total={4} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '2');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '4');
    expect(bar).toHaveAccessibleName();
  });
});

describe('ScriptToggle', () => {
  beforeEach(() => localStorage.clear());

  it('has an accessible name and switches script', () => {
    render(
      <ScriptProvider>
        <ScriptToggle />
      </ScriptProvider>,
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveAccessibleName('Промени писмо: Latinica');
    act(() => btn.click());
    expect(btn).toHaveAccessibleName('Promeni pismo: Ćirilica');
    expect(document.documentElement.lang).toBe('sr-Latn');
  });
});

describe('ResetButton', () => {
  beforeEach(() => {
    localStorage.clear();
    useGameStore.setState({ currentStep: 'playing' });
  });

  function setup() {
    render(
      <ScriptProvider>
        <ResetButton />
      </ScriptProvider>,
    );
    return screen.getByRole('button', { name: 'Почни испочетка' });
  }

  it('renders nothing during setup', () => {
    useGameStore.setState({ currentStep: 'setup' });
    render(<ResetButton />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('opens a modal dialog, focuses the safe option, Escape closes and returns focus', async () => {
    const trigger = setup();
    trigger.focus();
    act(() => trigger.click());

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Да ли си сигуран/сигурна?');
    expect(screen.getByRole('button', { name: 'Не' })).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(() => new Promise((r) => requestAnimationFrame(() => r(undefined))));
    expect(trigger).toHaveFocus();
    expect(useGameStore.getState().currentStep).toBe('playing');
  });

  it('traps Tab focus inside the dialog', () => {
    const trigger = setup();
    act(() => trigger.click());
    const yes = screen.getByRole('button', { name: 'Да' });
    const no = screen.getByRole('button', { name: 'Не' });
    expect(no).toHaveFocus();
    fireEvent.keyDown(no, { key: 'Tab' });
    expect(yes).toHaveFocus();
    fireEvent.keyDown(yes, { key: 'Tab', shiftKey: true });
    expect(no).toHaveFocus();
  });

  it('confirming resets the game', () => {
    const reset = vi.fn();
    useGameStore.setState({ reset } as Partial<ReturnType<typeof useGameStore.getState>>);
    const trigger = setup();
    act(() => trigger.click());
    act(() => screen.getByRole('button', { name: 'Да' }).click());
    expect(reset).toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

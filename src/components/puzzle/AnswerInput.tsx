import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChangeEvent, KeyboardEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';

/** Wrong explicit submissions on one step before the input pauses. */
export const MAX_WRONG_ATTEMPTS = 3;
/** How long the input stays locked after too many wrong attempts. */
export const COOLDOWN_MS = 5000;
/** Duration of the "wrong" shake before the input is cleared. */
export const WRONG_FEEDBACK_MS = 800;
const MAX_DIGITS = 4;

type Status = 'idle' | 'wrong' | 'cooldown' | 'correct';

interface AnswerInputProps {
  /** The correct result; typing it is accepted immediately. */
  expected: number;
  /** Called once with the correct value. */
  onCorrect: (value: number) => void;
  /** Accessible name of the input. */
  label: string;
  autoFocus?: boolean;
}

/**
 * Answer box for the active step.
 * - Accepts the moment the typed value equals the expected result.
 * - Rejects only on Enter or the ✓ button (never on a timer), so a child
 *   typing "1" on the way to "12" is never told they're wrong.
 * - After MAX_WRONG_ATTEMPTS rejections the box pauses for COOLDOWN_MS.
 * The input is made read-only rather than disabled while paused so it keeps
 * focus and the on-screen keyboard stays open.
 */
export function AnswerInput({ expected, onCorrect, label, autoFocus }: AnswerInputProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const wrongCount = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach(clearTimeout);
      pending.clear();
    };
  }, []);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const locked = status !== 'idle';

  const accept = (num: number) => {
    setStatus('correct');
    onCorrect(num);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (locked) return;
    const next = e.target.value.replace(/\D/g, '').slice(0, MAX_DIGITS);
    setValue(next);
    if (next !== '' && parseInt(next, 10) === expected) accept(expected);
  };

  const submit = () => {
    if (locked || value === '') return;
    const num = parseInt(value, 10);
    if (num === expected) {
      accept(num);
      return;
    }
    wrongCount.current += 1;
    if (wrongCount.current >= MAX_WRONG_ATTEMPTS) {
      wrongCount.current = 0;
      setValue('');
      setStatus('cooldown');
      later(() => {
        setStatus('idle');
        inputRef.current?.focus({ preventScroll: true });
      }, COOLDOWN_MS);
    } else {
      setStatus('wrong');
      later(() => {
        setValue('');
        setStatus('idle');
        inputRef.current?.focus({ preventScroll: true });
      }, WRONG_FEEDBACK_MS);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  };

  const message =
    status === 'wrong' ? t('puzzle.incorrect') : status === 'cooldown' ? t('puzzle.cooldown') : '';

  return (
    <div className="relative inline-flex items-center gap-2 justify-self-start">
      <div className="relative inline-flex flex-col items-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          enterKeyHint="done"
          aria-label={label}
          aria-invalid={status === 'wrong' || undefined}
          aria-disabled={status === 'cooldown' || undefined}
          readOnly={locked}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={status === 'cooldown' ? '⏳' : '?'}
          className={`num w-20 sm:w-24 h-16 text-3xl sm:text-4xl font-black text-center rounded-2xl border-[3px]
            transition-[border-color,background-color,box-shadow] duration-150 caret-gray-900
            placeholder:text-gray-400 focus:outline-none
            focus:shadow-[0_0_0_5px_color-mix(in_oklab,var(--th-accent)_45%,transparent)]
            ${status === 'wrong'
              ? 'animate-shake border-red-500 bg-red-50 text-red-700'
              : status === 'cooldown'
                ? 'border-amber-400 bg-amber-50 text-amber-900 cursor-wait'
                : 'border-white bg-white text-gray-900'}`}
        />
        <span
          role="status"
          aria-live="polite"
          className={`absolute top-full mt-2 right-0 z-10 text-sm font-bold leading-tight w-max max-w-[min(15rem,70vw)] text-right rounded-lg
            ${message ? 'px-2.5 py-1 shadow-md' : ''}
            ${status === 'cooldown' ? 'bg-amber-300 text-amber-950' : 'bg-red-600 text-white'}`}
        >
          {message}
        </span>
      </div>

      {/* Explicit check button: on tablets the numeric pad may have no Enter key */}
      {value && status === 'idle' && (
        <button
          type="button"
          onClick={submit}
          // Keep focus in the input so the on-screen keyboard stays open.
          onPointerDown={(e) => e.preventDefault()}
          aria-label={t('puzzle.check')}
          className="w-12 h-16 rounded-2xl accent-gradient text-on-accent shadow-md shadow-black/25
            flex items-center justify-center text-2xl font-black flex-shrink-0
            transition-[filter] duration-150 hover:brightness-110 active:scale-90 animate-pop"
        >
          ✓
        </button>
      )}
    </div>
  );
}

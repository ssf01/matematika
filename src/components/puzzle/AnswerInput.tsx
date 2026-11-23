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
    <div className="relative inline-flex items-center gap-1">
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
          className={`w-20 h-14 text-2xl font-bold text-center rounded-lg transition-all duration-200
            bg-white/10 border-2 text-white placeholder:text-white/30
            focus:outline-none focus:ring-2 focus:ring-white/30
            ${status === 'wrong'
              ? 'animate-shake !border-red-500 !bg-red-500/20 !text-red-400 !ring-red-500/30'
              : status === 'cooldown'
                ? 'border-amber-400/50 bg-amber-400/10 cursor-wait'
                : 'border-white/20 focus:border-white/50'}`}
        />
        <span
          role="status"
          aria-live="polite"
          className={`absolute top-full mt-1 text-xs font-semibold whitespace-nowrap z-10
            ${status === 'cooldown' ? 'text-amber-300' : 'text-red-400'}`}
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
          className="w-11 h-11 rounded-lg bg-white/15 hover:bg-white/25 text-white/70
            hover:text-white flex items-center justify-center transition-all duration-200
            active:scale-90 text-lg font-bold flex-shrink-0"
        >
          ✓
        </button>
      )}
    </div>
  );
}

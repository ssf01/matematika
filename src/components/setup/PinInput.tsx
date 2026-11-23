import { useRef, useState, useEffect } from 'react';
import type { ClipboardEvent, KeyboardEvent } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { withNumber } from '../puzzle/format';

const PIN_LENGTH = 4;
const EMPTY = Array<string>(PIN_LENGTH).fill('');

export function PinInput() {
  const { t } = useTranslation();
  const setPin = useGameStore((s) => s.setPin);
  const storedPin = useGameStore((s) => s.pin);
  const [digits, setDigits] = useState<string[]>(
    /^\d{4}$/.test(storedPin) ? storedPin.split('') : EMPTY,
  );
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  // The store only ever holds a complete PIN; anything incomplete is ''.
  const update = (next: string[]) => {
    setDigits(next);
    setPin(next.every((d) => d !== '') ? next.join('') : '');
  };

  const handleChange = (index: number, value: string) => {
    let clean = value.replace(/\D/g, '');
    if (clean.length === 2 && digits[index]) {
      // Typed over an existing digit without selecting it: keep the new one.
      clean = clean[0] === digits[index] ? clean[1] : clean[0];
    }
    if (clean.length > 1) {
      // Typed into a filled box or autofill: spread digits from this box onwards.
      fillFrom(index, clean);
      return;
    }
    const next = [...digits];
    next[index] = clean;
    update(next);
    if (clean && index < PIN_LENGTH - 1) refs.current[index + 1]?.focus();
  };

  const fillFrom = (index: number, value: string) => {
    const next = [...digits];
    let i = index;
    for (const ch of value) {
      if (i >= PIN_LENGTH) break;
      next[i++] = ch;
    }
    update(next);
    refs.current[Math.min(i, PIN_LENGTH - 1)]?.focus();
  };

  const handlePaste = (index: number, e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasted) return;
    e.preventDefault();
    fillFrom(pasted.length >= PIN_LENGTH ? 0 : index, pasted);
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      e.preventDefault();
      const next = [...digits];
      next[index - 1] = '';
      update(next);
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-3 sm:gap-4" role="group" aria-label={t('setup.enterPin')}>
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="off"
          maxLength={PIN_LENGTH}
          aria-label={withNumber(t('a11y.pinDigit'), i + 1)}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          onFocus={(e) => e.target.select()}
          className="w-14 h-18 sm:w-16 sm:h-20 text-4xl text-center font-bold rounded-xl
            bg-white/10 border-2 border-white/20 text-white
            focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30
            transition-all duration-200"
        />
      ))}
    </div>
  );
}

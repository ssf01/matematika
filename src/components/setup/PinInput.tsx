import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

export function PinInput() {
  const setPin = useGameStore((s) => s.setPin);
  const storedPin = useGameStore((s) => s.pin);
  const [digits, setDigits] = useState<string[]>(
    storedPin.length === 4 ? storedPin.split('') : ['', '', '', '']
  );
  const refs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    refs[0].current?.focus();
  }, []);

  useEffect(() => {
    const pin = digits.join('');
    if (pin.length === 4 && digits.every((d) => d !== '')) {
      setPin(pin);
    }
  }, [digits, setPin]);

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < 3) {
      refs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      refs[index - 1].current?.focus();
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
    }
  };

  return (
    <div className="flex justify-center gap-4">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="tel"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="w-16 h-20 text-4xl text-center font-bold rounded-xl
            bg-white/10 border-2 border-white/20 text-white
            focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/30
            transition-all duration-200"
        />
      ))}
    </div>
  );
}

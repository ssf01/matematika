import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../themes/ThemeProvider';
import { CorrectAnswerEffect } from './CorrectAnswerEffect';

interface AnswerInputProps {
  onSubmit: (value: number) => boolean;
  isCorrect: boolean | null;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AnswerInput({ onSubmit, isCorrect, disabled, autoFocus }: AnswerInputProps) {
  const { theme } = useTheme();
  const [value, setValue] = useState('');
  const [shaking, setShaking] = useState(false);
  const [wrongAnswer, setWrongAnswer] = useState(false);
  const [showEffect, setShowEffect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (autoFocus && !disabled) inputRef.current?.focus();
  }, [autoFocus, disabled]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const doSubmit = useCallback((val: string) => {
    if (!val || disabled || shaking) return;
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    const correct = onSubmit(num);
    if (correct) {
      setShowEffect(true);
    } else {
      setShaking(true);
      setWrongAnswer(true);
      setTimeout(() => {
        setShaking(false);
        setWrongAnswer(false);
        setValue('');
        inputRef.current?.focus();
      }, 800);
    }
  }, [disabled, shaking, onSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (shaking) return;
    const newValue = e.target.value.replace(/\D/g, '');
    setValue(newValue);

    // Auto-submit after a delay for tablet users (no Enter key on numeric pad)
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    if (newValue) {
      submitTimeoutRef.current = setTimeout(() => doSubmit(newValue), 1200);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
      doSubmit(value);
    }
  };

  const handleButtonSubmit = () => {
    if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    doSubmit(value);
  };

  if (isCorrect === true) {
    return (
      <span className="relative inline-flex items-center justify-center w-20 h-14 rounded-lg
        bg-green-500/20 border-2 border-green-500 text-green-400 text-2xl font-bold
        animate-glow" style={{ color: '#22c55e' }}>
        {value}
        {showEffect && (
          <CorrectAnswerEffect
            emojis={theme.rewardEmojis}
            onComplete={() => setShowEffect(false)}
          />
        )}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1">
      <div className="relative inline-flex flex-col items-center">
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled || shaking}
          className={`w-20 h-14 text-2xl font-bold text-center rounded-lg transition-all duration-200
            bg-white/10 border-2
            focus:outline-none focus:ring-2 focus:ring-white/30
            ${disabled ? 'opacity-30 cursor-not-allowed border-white/10 text-white' : 'border-white/20 focus:border-white/50 text-white'}
            ${shaking ? 'animate-shake !border-red-500 !bg-red-500/20 !text-red-400 !ring-red-500/30' : ''}`}
          placeholder="?"
        />
        {wrongAnswer && (
          <span className="absolute -bottom-6 text-xs font-semibold text-red-400 animate-pulse whitespace-nowrap">
            Нетачно!
          </span>
        )}
      </div>
      {/* Submit button for tablet users */}
      {value && !disabled && !shaking && (
        <button
          onClick={handleButtonSubmit}
          className="w-10 h-10 rounded-lg bg-white/15 hover:bg-white/25 text-white/70
            hover:text-white flex items-center justify-center transition-all duration-200
            active:scale-90 text-lg font-bold flex-shrink-0"
          type="button"
        >
          ✓
        </button>
      )}
    </div>
  );
}

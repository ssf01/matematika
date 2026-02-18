import React, { useState, useRef, useEffect } from 'react';

interface AnswerInputProps {
  onSubmit: (value: number) => boolean;
  isCorrect: boolean | null;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function AnswerInput({ onSubmit, isCorrect, disabled, autoFocus }: AnswerInputProps) {
  const [value, setValue] = useState('');
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && !disabled) inputRef.current?.focus();
  }, [autoFocus, disabled]);

  const handleSubmit = () => {
    if (!value || disabled) return;
    const num = parseInt(value, 10);
    if (isNaN(num)) return;
    const correct = onSubmit(num);
    if (!correct) {
      setShaking(true);
      setTimeout(() => {
        setShaking(false);
        setValue('');
        inputRef.current?.focus();
      }, 400);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  if (isCorrect === true) {
    return (
      <span className="inline-flex items-center justify-center w-20 h-14 rounded-lg
        bg-green-500/20 border-2 border-green-500 text-green-400 text-2xl font-bold
        animate-glow" style={{ color: '#22c55e' }}>
        {value}
      </span>
    );
  }

  return (
    <input
      ref={inputRef}
      type="tel"
      inputMode="numeric"
      value={value}
      onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
      onKeyDown={handleKeyDown}
      onBlur={handleSubmit}
      disabled={disabled}
      className={`w-20 h-14 text-2xl font-bold text-center rounded-lg transition-all duration-200
        bg-white/10 border-2 text-white
        focus:outline-none focus:ring-2 focus:ring-white/30
        ${disabled ? 'opacity-30 cursor-not-allowed border-white/10' : 'border-white/20 focus:border-white/50'}
        ${shaking ? 'animate-shake border-red-500 bg-red-500/20' : ''}`}
      placeholder="?"
    />
  );
}

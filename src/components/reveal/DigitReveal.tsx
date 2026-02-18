import React from 'react';

interface DigitRevealProps {
  digit: string;
  index: number;
  revealed: boolean;
}

export function DigitReveal({ digit, index, revealed }: DigitRevealProps) {
  return (
    <div
      className={`w-20 h-24 rounded-2xl flex items-center justify-center text-6xl font-bold
        transition-all duration-300 ${
          revealed
            ? 'bg-gradient-to-b from-yellow-400 to-amber-500 text-gray-900 shadow-lg shadow-amber-500/30 animate-digit-reveal'
            : 'bg-white/10 text-white/30'
        }`}
      style={revealed ? { animationDelay: `${index * 0.3}s` } : undefined}
    >
      {revealed ? digit : '?'}
    </div>
  );
}

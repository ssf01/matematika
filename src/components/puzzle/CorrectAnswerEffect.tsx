import React, { useState, useEffect, useMemo } from 'react';

interface CorrectAnswerEffectProps {
  emojis: string[];
  burst?: boolean;
  onComplete?: () => void;
}

function randomPick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function CorrectAnswerEffect({ emojis, burst, onComplete }: CorrectAnswerEffectProps) {
  const [visible, setVisible] = useState(true);

  const items = useMemo(() => {
    if (!burst) {
      return [{ emoji: randomPick(emojis), style: {} }];
    }
    return Array.from({ length: 6 }, () => {
      const angle = Math.random() * 2 * Math.PI;
      const dist = 40 + Math.random() * 60;
      return {
        emoji: randomPick(emojis),
        style: {
          '--burst-x': `${Math.cos(angle) * dist}px`,
          '--burst-y': `${Math.sin(angle) * dist}px`,
        } as React.CSSProperties,
      };
    });
  }, [emojis, burst]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, burst ? 700 : 800);
    return () => clearTimeout(timeout);
  }, [burst, onComplete]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
      {items.map((item, i) => (
        <span
          key={i}
          className={`absolute left-1/2 top-0 -translate-x-1/2 text-2xl ${burst ? 'animate-emoji-burst' : 'animate-emoji-fly'}`}
          style={item.style}
        >
          {item.emoji}
        </span>
      ))}
    </div>
  );
}

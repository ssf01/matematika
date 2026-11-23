import { useMemo } from 'react';

// Theme accents first, then a few fixed party colours.
const COLORS = ['var(--th-accent)', 'var(--th-accent-2)', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#ffffff'];

export function CelebrationOverlay() {
  const pieces = useMemo(() =>
    Array.from({ length: 48 }).map((_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: Math.random() * 100,
      size: Math.random() * 10 + 7,
      delay: Math.random() * 2.5,
      duration: Math.random() * 2 + 2.5,
      rotation: Math.random() * 360,
      round: i % 3 === 0,
    })),
  []);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.round ? p.size : p.size * 0.5}px`,
            backgroundColor: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

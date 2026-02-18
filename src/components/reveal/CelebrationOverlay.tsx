import React, { useMemo } from 'react';

const COLORS = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd', '#01a3a4', '#f368e0', '#ff9f43', '#00d2d3'];

export function CelebrationOverlay() {
  const pieces = useMemo(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      color: COLORS[i % COLORS.length],
      left: Math.random() * 100,
      size: Math.random() * 10 + 6,
      delay: Math.random() * 3,
      duration: Math.random() * 2 + 2,
      rotation: Math.random() * 360,
    })),
  []);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute animate-confetti"
          style={{
            left: `${p.left}%`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: '2px',
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

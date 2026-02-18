import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
  glow?: boolean;
  shine?: boolean;
  shineColor?: string;
}

export function Card({ children, className = '', selected, onClick, glow, shine, shineColor }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white/8 backdrop-blur-sm p-5 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:bg-white/15 active:scale-[0.98]' : ''}
        ${selected ? 'ring-2 ring-white/60 scale-[1.02] bg-white/12' : ''}
        ${glow ? 'animate-glow' : ''}
        ${shine ? 'animate-shine-border' : ''}
        ${className}`}
      style={shine && shineColor ? { '--shine-color': shineColor } as React.CSSProperties : undefined}
    >
      {children}
    </div>
  );
}

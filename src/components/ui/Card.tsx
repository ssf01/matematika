import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  selected?: boolean;
  onClick?: () => void;
  glow?: boolean;
}

export function Card({ children, className = '', selected, onClick, glow }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl bg-white/5 backdrop-blur-sm p-5 transition-all duration-200
        ${onClick ? 'cursor-pointer hover:bg-white/10' : ''}
        ${selected ? 'ring-2 ring-white/60 scale-[1.02] bg-white/10' : ''}
        ${glow ? 'animate-glow' : ''}
        ${className}`}
    >
      {children}
    </div>
  );
}

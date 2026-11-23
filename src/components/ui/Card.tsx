import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Toggle state; exposed as aria-pressed when the card is interactive. */
  selected?: boolean;
  onClick?: () => void;
  glow?: boolean;
  shine?: boolean;
  shineColor?: string;
  /** Accessible name override for interactive cards. */
  ariaLabel?: string;
}

export function Card({ children, className = '', selected, onClick, glow, shine, shineColor, ariaLabel }: CardProps) {
  const classes = `rounded-2xl bg-white/8 backdrop-blur-sm p-5 transition-all duration-200
    ${onClick ? 'cursor-pointer hover:bg-white/15 active:scale-[0.98]' : ''}
    ${selected ? 'ring-2 ring-white/60 scale-[1.02] bg-white/12' : ''}
    ${glow ? 'animate-glow' : ''}
    ${shine ? 'animate-shine-border' : ''}
    ${className}`;
  const style = shine && shineColor ? ({ '--shine-color': shineColor } as CSSProperties) : undefined;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        aria-label={ariaLabel}
        className={`block w-full text-left text-inherit focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/80 ${classes}`}
        style={style}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={classes} style={style}>
      {children}
    </div>
  );
}

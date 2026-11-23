import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Toggle state; exposed as aria-pressed when the card is interactive. */
  selected?: boolean;
  onClick?: () => void;
  /** Accessible name override for interactive cards. */
  ariaLabel?: string;
  /** Sets a local `data-theme`, so the card previews another theme's palette. */
  dataTheme?: string;
}

/** Check badge shown on selected cards (colour + shape, not colour alone). */
function CheckBadge() {
  return (
    <span
      aria-hidden="true"
      className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center
        bg-accent text-on-accent text-base font-black shadow-md ring-3 ring-page animate-pop"
    >
      ✓
    </span>
  );
}

export function Card({ children, className = '', selected, onClick, ariaLabel, dataTheme }: CardProps) {
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={selected}
        aria-label={ariaLabel}
        data-theme={dataTheme}
        className={`relative block w-full text-left text-inherit rounded-2xl p-4 min-h-16
          border-2 transition-[transform,background-color,border-color,box-shadow] duration-150
          cursor-pointer active:scale-[0.98]
          ${selected
            ? 'border-accent bg-accent/15 shadow-[0_0_0_4px_color-mix(in_oklab,var(--th-accent)_22%,transparent)]'
            : 'border-white/15 bg-white/8 hover:bg-white/14 hover:border-white/30'}
          ${className}`}
      >
        {selected && <CheckBadge />}
        {children}
      </button>
    );
  }

  return (
    <div data-theme={dataTheme} className={`relative rounded-3xl p-5 surface ${className}`}>
      {children}
    </div>
  );
}

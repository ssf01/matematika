import React from 'react';

interface ShimmerButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  shimmerColor?: string;
  background?: string;
}

export function ShimmerButton({
  shimmerColor = 'rgba(255,255,255,0.3)',
  background = 'rgba(255,255,255,0.1)',
  className = '',
  children,
  ...props
}: ShimmerButtonProps) {
  return (
    <button
      className={`group relative z-0 flex cursor-pointer items-center justify-center
        overflow-hidden rounded-xl border border-white/15
        px-8 py-4 text-lg font-semibold text-white
        transition-all duration-300 ease-in-out
        hover:scale-[1.02] active:scale-95
        min-h-[44px] min-w-[44px]
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50
        disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{ background } as React.CSSProperties}
      {...props}
    >
      {/* Shimmer effect layer */}
      <div className="absolute inset-0 -z-30 overflow-hidden blur-[2px]" style={{ containerType: 'size' }}>
        <div className="absolute inset-0 h-[100cqh]" style={{ animation: 'shimmer-slide 8s ease-in-out infinite alternate' }}>
          <div
            className="absolute -inset-full"
            style={{
              background: `conic-gradient(from 225deg, transparent 0deg, ${shimmerColor} 90deg, transparent 90deg)`,
              animation: 'spin-around 4s linear infinite',
            }}
          />
        </div>
      </div>
      {/* Inner highlight */}
      <div className="absolute inset-0 rounded-xl shadow-[inset_0_-8px_10px_#ffffff1f] group-hover:shadow-[inset_0_-6px_10px_#ffffff3f] transition-shadow duration-300" />
      {/* Background fill */}
      <div className="absolute inset-[1px] -z-20 rounded-xl" style={{ background }} />
      <span className="relative">{children}</span>
    </button>
  );
}

import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className = '' }: ProgressBarProps) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className={`w-full bg-white/10 rounded-full h-3 overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

import React, { useMemo } from 'react';

interface SparklesProps {
  children: React.ReactNode;
  color?: string;
  count?: number;
}

export function Sparkles({ children, color = '#fff', count = 6 }: SparklesProps) {
  const sparkles = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 10 + 8,
      delay: Math.random() * 2,
      duration: Math.random() * 1 + 0.6,
    })),
  [count]);

  return (
    <span className="relative inline-block">
      {children}
      <span className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
        {sparkles.map((s) => (
          <svg
            key={s.id}
            className="absolute"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animation: `sparkle ${s.duration}s ease-in-out infinite`,
              animationDelay: `${s.delay}s`,
              fill: color,
            }}
            viewBox="0 0 21 21"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 13.3547 5.46075 14.6028 6.37592L16.1712 7.52337C16.7117 7.91863 16.7117 8.72069 16.1712 9.11595L14.6028 10.2634C13.3547 11.1786 12.4006 12.447 11.8618 13.919L11.1746 15.7955C10.9446 16.4241 10.0553 16.4241 9.82531 15.7955L9.1381 13.919C8.59933 12.447 7.64519 11.1786 6.3971 10.2634L4.82869 9.11595C4.28824 8.72069 4.28824 7.91863 4.82869 7.52337L6.3971 6.37592C7.64519 5.46075 8.59933 4.19229 9.1381 2.72026L9.82531 0.843845Z" />
          </svg>
        ))}
      </span>
    </span>
  );
}

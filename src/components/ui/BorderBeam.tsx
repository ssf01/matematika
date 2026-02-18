import React from 'react';

interface BorderBeamProps {
  colorFrom?: string;
  colorTo?: string;
  duration?: string;
  size?: number;
}

export function BorderBeam({
  colorFrom = '#ffaa40',
  colorTo = '#9c40ff',
  duration = '4s',
  size = 60,
}: BorderBeamProps) {
  return (
    <div className="border-beam-container">
      <div
        className="border-beam-dot"
        style={{
          '--beam-from': colorFrom,
          '--beam-to': colorTo,
          width: `${size}px`,
          animationDuration: duration,
        } as React.CSSProperties}
      />
    </div>
  );
}

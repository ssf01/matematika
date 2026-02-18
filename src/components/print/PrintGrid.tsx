import React from 'react';
import type { MetaGrid } from '../../lib/types';

interface PrintGridProps {
  grid: MetaGrid;
}

export function PrintGrid({ grid }: PrintGridProps) {
  return (
    <div className="print-section break-inside-avoid mb-6">
      <table className="border-collapse mx-auto text-center font-mono text-base print:text-[12pt]">
        <thead>
          <tr>
            {/* Top-left corner: axis label */}
            <th className="w-10 h-10 text-[9px] leading-tight text-white/40 print:text-gray-400 border border-white/10 print:border-gray-300 font-normal">
              <span className="block">Red↓</span>
              <span className="block">Kol→</span>
            </th>
            {Array.from({ length: 10 }, (_, c) => (
              <th
                key={c}
                className="w-10 h-10 text-sm font-extrabold text-white/70 print:text-gray-700 border border-white/10 print:border-gray-300"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.cells.map((row, r) => (
            <tr key={r} className={r % 2 === 0 ? 'bg-white/[0.03] print:bg-gray-100' : ''}>
              {/* Row header */}
              <td className="w-10 h-10 text-sm font-extrabold text-white/70 print:text-gray-700 border border-white/10 print:border-gray-300">
                {r}
              </td>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="w-10 h-10 border border-white/10 print:border-gray-300 text-white/80 print:text-gray-800"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

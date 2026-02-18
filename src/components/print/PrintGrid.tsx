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
            <th className="w-8 h-8 text-xs text-white/40 print:text-gray-500"></th>
            {Array.from({ length: 10 }, (_, c) => (
              <th
                key={c}
                className="w-8 h-8 text-xs font-bold text-white/50 print:text-gray-600 border border-white/10 print:border-gray-300"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.cells.map((row, r) => (
            <tr key={r}>
              <td className="w-8 h-8 text-xs font-bold text-white/50 print:text-gray-600 border border-white/10 print:border-gray-300">
                {r}
              </td>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="w-8 h-8 border border-white/10 print:border-gray-300 text-white/80 print:text-gray-800"
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

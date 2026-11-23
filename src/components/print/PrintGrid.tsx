import type { MetaGrid } from '../../lib/types';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { getMetaAxisLabels } from '../themes/themeLabels';

interface PrintGridProps {
  grid: MetaGrid;
}

export function PrintGrid({ grid }: PrintGridProps) {
  const { t } = useTranslation();
  const { themeId } = useTheme();
  const labels = getMetaAxisLabels(themeId);
  const rowLabel = t(labels.row);
  const colLabel = t(labels.col);

  return (
    <div className="print-section break-inside-avoid mb-6">
      <table className="border-collapse mx-auto text-center font-mono text-base print:text-[12pt]">
        <caption className="sr-only">
          {t('meta.grid.title')}: {rowLabel} ↓, {colLabel} →
        </caption>
        <thead>
          <tr>
            {/* Top-left corner: axis labels (theme-specific, same as on-screen MetaGrid) */}
            <th
              scope="col"
              className="min-w-10 h-10 px-0.5 text-[9px] leading-tight text-white/75 print:text-gray-600 border border-white/10 print:border-gray-300 font-normal"
            >
              <span className="block">{rowLabel}↓</span>
              <span className="block">{colLabel}→</span>
            </th>
            {Array.from({ length: 10 }, (_, c) => (
              <th
                key={c}
                scope="col"
                className="w-10 h-10 text-sm font-extrabold text-white/80 print:text-gray-700 border border-white/10 print:border-gray-300"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.cells.map((row, r) => (
            <tr key={r} className={r % 2 === 0 ? 'bg-white/[0.03] print:bg-gray-100' : ''}>
              <th
                scope="row"
                className="w-10 h-10 text-sm font-extrabold text-white/80 print:text-gray-700 border border-white/10 print:border-gray-300"
              >
                {r}
              </th>
              {row.map((cell, c) => (
                <td
                  key={c}
                  className="w-10 h-10 border border-white/10 print:border-gray-300 text-white/85 print:text-gray-800"
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

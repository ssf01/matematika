import React from 'react';
import { PrintHeader } from './PrintHeader';
import { PrintGrid } from './PrintGrid';
import { PrintSection } from './PrintSection';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { Button } from '../ui/Button';
import type { Puzzle } from '../../lib/types';

interface PrintableWorksheetProps {
  puzzle: Puzzle;
}

export function PrintableWorksheet({ puzzle }: PrintableWorksheetProps) {
  const { t } = useTranslation();
  const reset = useGameStore((s) => s.reset);

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="no-print flex gap-4 mb-6">
        <Button variant="ghost" onClick={reset}>
          {t('print.back')}
        </Button>
        <Button variant="primary" onClick={() => window.print()}>
          🖨️ {t('print.print')}
        </Button>
      </div>

      <PrintHeader />

      {puzzle.meta ? (
        <>
          {/* Meta puzzle: grid + paired task sets */}
          <p className="text-white/60 print:text-gray-600 mb-6 text-center">
            {t('print.meta.instructions')}
          </p>

          <PrintGrid grid={puzzle.meta} />

          <div className="space-y-6 mb-8">
            {puzzle.meta.coordinates.map((_, pairIdx) => (
              <div key={pairIdx} className="break-inside-avoid">
                <h3 className="font-bold text-lg mb-3 text-white/80 print:text-gray-800">
                  {t('meta.coordinatePair')} {pairIdx + 1}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-white/50 print:text-gray-500 mb-1">
                      {t('print.meta.row')}
                    </p>
                    <PrintSection chain={puzzle.chains[pairIdx * 2]} chainIndex={pairIdx * 2} hideHeader footerLabel={t('print.meta.row')} chainedSteps />
                  </div>
                  <div>
                    <p className="text-sm text-white/50 print:text-gray-500 mb-1">
                      {t('print.meta.col')}
                    </p>
                    <PrintSection chain={puzzle.chains[pairIdx * 2 + 1]} chainIndex={pairIdx * 2 + 1} hideHeader footerLabel={t('print.meta.col')} chainedSteps />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Answer key */}
          <div className="print-answer-key mt-12 pt-6 border-t-2 border-dashed border-white/20 print:border-gray-400">
            <p className="text-center text-white/40 print:text-gray-400 mb-4">
              ✂️ ─────── {t('print.answerKey')} ───────  ✂️
            </p>
            <div className="space-y-2 text-sm">
              {puzzle.meta.coordinates.map((coord, idx) => (
                <p key={idx} className="text-white/60 print:text-gray-600">
                  {t('meta.coordinatePair')} {idx + 1}: ({coord.row}, {coord.col}) → {t('puzzle.digit')} = <strong>{coord.pinDigit}</strong>
                </p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              {puzzle.chains.map((chain, idx) => (
                <PrintSection key={idx} chain={chain} chainIndex={idx} showAnswers />
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Standard puzzle layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
            {puzzle.chains.map((chain, idx) => (
              <PrintSection key={idx} chain={chain} chainIndex={idx} chainedSteps />
            ))}
          </div>

          <div className="print-answer-key mt-12 pt-6 border-t-2 border-dashed border-white/20 print:border-gray-400">
            <p className="text-center text-white/40 print:text-gray-400 mb-4">
              ✂️ ─────── {t('print.answerKey')} ───────  ✂️
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {puzzle.chains.map((chain, idx) => (
                <PrintSection key={idx} chain={chain} chainIndex={idx} showAnswers />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

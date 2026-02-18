import React from 'react';
import { PrintHeader } from './PrintHeader';
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {puzzle.chains.map((chain, idx) => (
          <PrintSection key={idx} chain={chain} chainIndex={idx} />
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
    </div>
  );
}

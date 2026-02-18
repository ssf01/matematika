import React from 'react';
import { useTheme } from '../themes/ThemeProvider';
import { useTranslation } from '../../i18n/useTranslation';
import type { PuzzleChain } from '../../lib/types';

const OP_SYMBOLS: Record<string, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': '÷',
};

interface PrintSectionProps {
  chain: PuzzleChain;
  chainIndex: number;
  showAnswers?: boolean;
}

export function PrintSection({ chain, chainIndex, showAnswers }: PrintSectionProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <div className="print-section mb-6 break-inside-avoid">
      <h3 className="font-bold text-lg mb-3 text-white/80 print:text-gray-800">
        {t('puzzle.digit')} {chainIndex + 1}
      </h3>
      <div className="space-y-2 font-mono text-xl print:text-[16pt]">
        {chain.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            <span>{step.left}</span>
            <span>{OP_SYMBOLS[step.operator]}</span>
            <span>{step.right}</span>
            <span>=</span>
            {showAnswers ? (
              <span className="font-bold">{step.result}</span>
            ) : (
              <span className="inline-block w-16 border-b-2 border-white/30 print:border-gray-400 text-center">
                &nbsp;
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-white/50 print:text-gray-500">
        → {t('puzzle.digit')} ПИН кода:{' '}
        {showAnswers ? (
          <span className="font-bold text-lg">{chain.targetDigit}</span>
        ) : (
          <span className="inline-block w-8 border-b-2 border-white/30 print:border-gray-400">&nbsp;</span>
        )}
      </div>
    </div>
  );
}

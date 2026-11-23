import { useTranslation } from '../../i18n/useTranslation';
import type { Operation, PuzzleChain } from '../../lib/types';

/** Math symbols used on worksheets (Serbian school notation: ":" for division). */
export const PRINT_OP_SYMBOLS: Record<Operation, string> = {
  '+': '+',
  '-': '−',
  '*': '×',
  '/': ':',
};

interface PrintSectionProps {
  chain: PuzzleChain;
  chainIndex: number;
  showAnswers?: boolean;
  hideHeader?: boolean;
  footerLabel?: string;
  chainedSteps?: boolean;
}

/**
 * Whether step `i` takes its left operand from the previous step's result.
 * Continuity is detected from the actual numbers, so chains generated without
 * carry-over (e.g. chainMode 'independent') never get a blank left operand.
 */
export function isStepChained(chain: PuzzleChain, i: number): boolean {
  if (i === 0) return false;
  // chainMode may gain more variants (e.g. 'independent'); compare as string.
  const mode = chain.chainMode as string | undefined;
  if (mode === 'independent') return false;
  const prevResult = chain.steps[i - 1].result;
  if (mode === 'onesDigit') return prevResult % 10 === chain.steps[i].left;
  return prevResult === chain.steps[i].left;
}

export function PrintSection({ chain, chainIndex, showAnswers, hideHeader, footerLabel, chainedSteps }: PrintSectionProps) {
  const { t } = useTranslation();

  const label = footerLabel ?? t('puzzle.pinDigit');
  const blank = (
    <span className="inline-block w-16 border-b-2 border-gray-500 text-center">
      &nbsp;
    </span>
  );

  const isChained = (i: number) => Boolean(chainedSteps) && isStepChained(chain, i);
  const hasOnesDigitCarry =
    chain.chainMode === 'onesDigit' && chain.steps.some((_, i) => isStepChained(chain, i));

  return (
    <div className="print-section mb-6 break-inside-avoid">
      {!hideHeader && (
        <h3 className="font-bold text-lg mb-3 text-gray-800">
          {t('puzzle.digit')} {chainIndex + 1}
        </h3>
      )}
      {chain.useLastDigit && chain.chainMode !== 'onesDigit' && !showAnswers && (
        <p className="text-xs text-gray-600 italic mb-2">{t('puzzle.multiplicationHint')}</p>
      )}
      {hasOnesDigitCarry && chainedSteps && !showAnswers && (
        <div className="text-xs text-gray-600 italic mb-2">
          <p>{t('print.onesDigitInstruction')}</p>
          <div className="flex items-center gap-1 mt-1 font-mono not-italic text-[10px]" aria-hidden="true">
            <span>3 {PRINT_OP_SYMBOLS['*']} 9 = 2<span className="font-bold underline text-gray-800">7</span></span>
            <span className="mx-1">→</span>
            <span><span className="font-bold underline text-gray-800">7</span> {PRINT_OP_SYMBOLS['*']} 4 = ...</span>
          </div>
        </div>
      )}
      <div className="space-y-2 font-mono text-xl print:text-[16pt]">
        {chain.steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2">
            {isChained(i) && !showAnswers ? blank : <span>{step.left}</span>}
            <span>{PRINT_OP_SYMBOLS[step.operator]}</span>
            <span>{step.right}</span>
            <span>=</span>
            {showAnswers ? (
              <span className="font-bold">{step.result}</span>
            ) : (
              blank
            )}
          </div>
        ))}
      </div>
      <div className="mt-2 text-sm text-gray-600">
        → {label}:{' '}
        {showAnswers ? (
          <span className="font-bold text-lg">{chain.targetDigit}</span>
        ) : (
          <span className="inline-block w-8 border-b-2 border-gray-500">&nbsp;</span>
        )}
      </div>
    </div>
  );
}

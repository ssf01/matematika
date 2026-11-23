import { PrintHeader } from './PrintHeader';
import { PrintGrid } from './PrintGrid';
import { PrintSection } from './PrintSection';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { getMetaAxisLabels } from '../themes/themeLabels';
import { Button } from '../ui/Button';
import type { Puzzle } from '../../lib/types';

interface PrintableWorksheetProps {
  puzzle: Puzzle;
}

/** True when a chain's coordinate/PIN digit is the ones digit of its last result. */
function usesLastDigit(puzzle: Puzzle): boolean {
  return puzzle.chains.some((chain) => {
    const last = chain.steps[chain.steps.length - 1];
    return chain.useLastDigit || (last !== undefined && last.result !== chain.targetDigit);
  });
}

function AnswerKeyHeading() {
  const { t } = useTranslation();
  return (
    <div className="text-center mb-4">
      <p className="text-gray-600">
        <span aria-hidden="true">✂️ ─────── </span>
        {t('print.answerKey')}
        <span aria-hidden="true"> ───────  ✂️</span>
      </p>
      <p className="mt-2 inline-block rounded-full border-2 border-amber-500 bg-amber-100 px-3 py-0.5 text-sm font-bold uppercase tracking-wide text-amber-900 print:border-gray-700 print:bg-transparent print:text-gray-800">
        <span aria-hidden="true">🔒 </span>
        {t('print.parentsOnly')}
      </p>
    </div>
  );
}

export function PrintableWorksheet({ puzzle }: PrintableWorksheetProps) {
  const { t } = useTranslation();
  const { themeId } = useTheme();
  const reset = useGameStore((s) => s.reset);
  const axis = getMetaAxisLabels(themeId);
  const rowLabel = t(axis.row);
  const colLabel = t(axis.col);

  const metaInstructionKey = usesLastDigit(puzzle) ? 'print.meta.instructionsOnesDigit' : 'print.meta.instructions';

  return (
    <div className="max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6 print:p-0 print:max-w-none">
      <div className="no-print flex gap-3 mb-4 sm:mb-6">
        <Button variant="secondary" onClick={reset} className="flex-1 sm:flex-none">
          {t('print.back')}
        </Button>
        <Button variant="primary" onClick={() => window.print()} className="flex-[2] sm:flex-none">
          <span aria-hidden="true">🖨️</span> {t('print.print')}
        </Button>
      </div>

      {/* On screen: a sheet of paper. In print the sheet styling falls away. */}
      <div className="print-paper bg-white text-gray-900 rounded-3xl shadow-2xl shadow-black/40 px-5 py-8 sm:px-10 sm:py-10
        print:rounded-none print:shadow-none print:p-0">

      <PrintHeader instructionKey={puzzle.meta ? metaInstructionKey : undefined} />

      {puzzle.meta ? (
        <>
          <PrintGrid grid={puzzle.meta} />

          <div className="space-y-6 mb-8">
            {puzzle.meta.coordinates.map((_, pairIdx) => (
              <div key={pairIdx} className="break-inside-avoid">
                <h3 className="font-bold text-lg mb-3 text-gray-800">
                  {t('meta.coordinatePair')} {pairIdx + 1}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[rowLabel, colLabel].map((axisLabel, offset) => {
                    const idx = pairIdx * 2 + offset;
                    const chain = puzzle.chains[idx];
                    if (!chain) return null;
                    return (
                      <div key={offset}>
                        <p className="font-bold text-base text-gray-800 mb-2 border-b border-gray-300 pb-1">
                          <span aria-hidden="true">📍</span> {axisLabel}
                        </p>
                        <PrintSection chain={chain} chainIndex={idx} hideHeader footerLabel={axisLabel} chainedSteps />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Answer key */}
          <div className="print-answer-key mt-12 pt-6 border-t-2 border-dashed border-gray-400">
            <AnswerKeyHeading />
            <div className="space-y-2 text-sm">
              {puzzle.meta.coordinates.map((coord, idx) => (
                <p key={idx} className="text-gray-700">
                  {t('meta.coordinatePair')} {idx + 1}: ({rowLabel} {coord.row}, {colLabel} {coord.col}) → {t('puzzle.digit')} = <strong>{coord.pinDigit}</strong>
                </p>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm mt-4">
              {puzzle.chains.map((chain, idx) => (
                <PrintSection key={idx} chain={chain} chainIndex={idx} showAnswers footerLabel={idx % 2 === 0 ? rowLabel : colLabel} />
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

          <div className="print-answer-key mt-12 pt-6 border-t-2 border-dashed border-gray-400">
            <AnswerKeyHeading />
            <div className="grid grid-cols-2 gap-4 text-sm">
              {puzzle.chains.map((chain, idx) => (
                <PrintSection key={idx} chain={chain} chainIndex={idx} showAnswers />
              ))}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGameStore } from '../../stores/gameStore';
import type { MultiplicationTableState } from '../../stores/gameStore';
import { generateMultiplicationTable } from '../../lib/generator';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { opSymbol } from './format';

interface MultiplicationTableProps {
  number: number;
}

function freshTable(number: number): MultiplicationTableState {
  return { number, steps: generateMultiplicationTable(number), answers: {}, checked: false };
}

/**
 * Practice sheet for one multiplication table. Order, answers and the checked
 * state live in the persisted store, so a reload keeps the child's work.
 * "Try again" reshuffles the questions so the order can't be memorised.
 */
export function MultiplicationTable({ number: initialNumber }: MultiplicationTableProps) {
  const { t } = useTranslation();
  const reset = useGameStore((s) => s.reset);
  const stored = useGameStore((s) => s.multiplicationTable);
  const setTable = useGameStore((s) => s.setMultiplicationTable);
  const setTableNumber = useGameStore((s) => s.setMultiplicationTableNumber);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const table = stored && stored.number === initialNumber ? stored : null;

  useEffect(() => {
    if (!table) setTable(freshTable(initialNumber));
  }, [table, initialNumber, setTable]);

  if (!table) return null;

  const { steps, answers, checked } = table;
  const results = steps.map((step, i) => parseInt(answers[i] ?? '', 10) === step.result);
  const correctCount = results.filter(Boolean).length;
  const totalCount = steps.length;

  const update = (patch: Partial<MultiplicationTableState>) => setTable({ ...table, ...patch });

  const handleCheck = () => update({ checked: true });

  const handleRetry = () => {
    setTable(freshTable(table.number));
    inputRefs.current[0]?.focus();
  };

  const handleChangeNumber = (num: number) => {
    setTableNumber(num);
    setTable(freshTable(num));
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const next = inputRefs.current[i + 1];
    if (next) next.focus();
    else handleCheck();
  };

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">{t('multiplicationTable.title')}</h1>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleChangeNumber(num)}
            aria-pressed={table.number === num}
            className={`w-11 h-11 rounded-full font-bold text-lg transition-all duration-200
              ${table.number === num
                ? 'bg-white/30 text-white scale-110 ring-2 ring-white/50'
                : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {num}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {checked && (
          <div className="mb-4">
            <ProgressBar current={correctCount} total={totalCount} />
            <p className="text-center mt-2 text-lg font-semibold">
              {correctCount === totalCount
                ? t('multiplicationTable.perfect')
                : `${t('multiplicationTable.score')}: ${correctCount}/${totalCount}`}
            </p>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            handleCheck();
          }}
        >
          {steps.map((step, i) => (
            <div key={`${step.left}-${step.right}`} className="flex items-center gap-2 text-xl font-mono">
              <span className="min-w-[2ch] text-right">{step.left}</span>
              <span className="text-white/60">{opSymbol(step.operator)}</span>
              <span className="min-w-[2ch]">{step.right}</span>
              <span className="text-white/40">=</span>
              <input
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="off"
                enterKeyHint={i === steps.length - 1 ? 'done' : 'next'}
                aria-label={`${t('a11y.answer')}: ${step.left} ${opSymbol(step.operator)} ${step.right}`}
                value={answers[i] ?? ''}
                onChange={(e) =>
                  update({ answers: { ...answers, [i]: e.target.value.replace(/\D/g, '').slice(0, 3) } })
                }
                onKeyDown={(e) => handleKeyDown(i, e)}
                readOnly={checked}
                className={`w-20 h-12 text-xl font-bold text-center rounded-lg transition-all
                  focus:outline-none focus:ring-2 focus:ring-white/30
                  ${checked
                    ? results[i]
                      ? 'bg-green-500/20 border-2 border-green-500 text-green-400'
                      : 'bg-red-500/20 border-2 border-red-500 text-red-400'
                    : 'bg-white/10 border-2 border-white/20 text-white'}`}
              />
              {checked && !results[i] && (
                <span className="text-white/50 text-sm ml-2">= {step.result}</span>
              )}
            </div>
          ))}
        </form>
      </Card>

      <div className="flex gap-4">
        <Button variant="ghost" onClick={reset} className="flex-1">
          {t('setup.back')}
        </Button>
        {!checked ? (
          <Button variant="primary" onClick={handleCheck} className="flex-1">
            {t('multiplicationTable.check')}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleRetry} className="flex-1">
            {t('multiplicationTable.tryAgain')}
          </Button>
        )}
      </div>
    </div>
  );
}

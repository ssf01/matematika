import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGameStore } from '../../stores/gameStore';
import type { MultiplicationTableState } from '../../stores/gameStore';
import { generateMultiplicationTable } from '../../lib/generator';
import { Button } from '../ui/Button';
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
    <div className="screen-h w-full max-w-lg mx-auto px-4 pt-5 pb-10">
      <h1 className="text-3xl sm:text-4xl font-black text-center mb-1">
        <span aria-hidden="true" className="mr-2">🧮</span>
        {t('multiplicationTable.title')}
      </h1>
      <p className="num text-center text-accent text-2xl font-black mb-4">
        {table.number} {opSymbol('*')} …
      </p>

      <div className="grid grid-cols-5 gap-2 mb-5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleChangeNumber(num)}
            aria-pressed={table.number === num}
            className={`num h-12 rounded-2xl font-black text-xl border-2 transition-colors duration-150
              ${table.number === num
                ? 'accent-gradient text-on-accent border-transparent shadow-md shadow-black/25'
                : 'bg-white/10 text-white border-white/15 hover:border-white/35'}`}
          >
            {num}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {checked && (
          <div className="mb-4 surface rounded-2xl p-4">
            <ProgressBar current={correctCount} total={totalCount} />
            <p className="text-center mt-2 text-xl font-black">
              {correctCount === totalCount
                ? t('multiplicationTable.perfect')
                : `${t('multiplicationTable.score')}: ${correctCount}/${totalCount}`}
            </p>
          </div>
        )}
      </div>

      <div className="surface rounded-3xl p-3 sm:p-5 mb-5">
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleCheck();
          }}
        >
          {steps.map((step, i) => (
            <div
              key={`${step.left}-${step.right}`}
              className="num grid grid-cols-[minmax(2ch,auto)_1ch_minmax(2ch,auto)_1ch_1fr] items-center gap-x-2 sm:gap-x-3
                px-2 py-1 text-3xl font-bold"
            >
              <span className="text-right">{step.left}</span>
              <span className="text-center text-accent">{opSymbol(step.operator)}</span>
              <span>{step.right}</span>
              <span className="text-center text-white/70">=</span>
              <span className="flex items-center gap-3">
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
                  className={`num w-20 h-14 text-3xl font-black text-center rounded-2xl border-[3px] transition-colors
                    focus:outline-none focus:shadow-[0_0_0_5px_color-mix(in_oklab,var(--th-accent)_45%,transparent)]
                    ${checked
                      ? results[i]
                        ? 'bg-success/15 border-success text-success'
                        : 'bg-red-50 border-red-500 text-red-700'
                      : 'bg-white border-white text-gray-900'}`}
                />
                {checked && !results[i] && (
                  <span className="text-white/90 text-lg font-bold">= {step.result}</span>
                )}
              </span>
            </div>
          ))}
        </form>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={reset} className="flex-1">
          {t('setup.back')}
        </Button>
        {!checked ? (
          <Button variant="primary" onClick={handleCheck} className="flex-[2]">
            {t('multiplicationTable.check')}
          </Button>
        ) : (
          <Button variant="primary" onClick={handleRetry} className="flex-[2]">
            {t('multiplicationTable.tryAgain')}
          </Button>
        )}
      </div>
    </div>
  );
}

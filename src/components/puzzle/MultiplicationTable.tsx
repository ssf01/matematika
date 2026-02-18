import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useGameStore } from '../../stores/gameStore';
import { generateMultiplicationTable } from '../../lib/generator';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';

interface MultiplicationTableProps {
  number: number;
}

export function MultiplicationTable({ number: initialNumber }: MultiplicationTableProps) {
  const { t } = useTranslation();
  const reset = useGameStore((s) => s.reset);
  const [selectedNumber, setSelectedNumber] = useState(initialNumber);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState<Record<number, boolean>>({});

  const steps = useMemo(
    () => generateMultiplicationTable(selectedNumber),
    [selectedNumber],
  );

  const correctCount = Object.values(results).filter(Boolean).length;
  const totalCount = steps.length;

  const handleCheck = () => {
    const newResults: Record<number, boolean> = {};
    steps.forEach((step, i) => {
      const userAnswer = parseInt(answers[i] || '', 10);
      newResults[i] = !isNaN(userAnswer) && userAnswer === step.result;
    });
    setResults(newResults);
    setChecked(true);
  };

  const handleRetry = () => {
    setAnswers({});
    setResults({});
    setChecked(false);
  };

  const handleChangeNumber = (num: number) => {
    setSelectedNumber(num);
    setAnswers({});
    setResults({});
    setChecked(false);
  };

  return (
    <div className="min-h-dvh p-4 sm:p-6 max-w-lg mx-auto">
      <h1 className="text-3xl font-bold text-center mb-6">{t('multiplicationTable.title')}</h1>

      <div className="flex flex-wrap justify-center gap-2 mb-6">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => handleChangeNumber(num)}
            className={`w-11 h-11 rounded-full font-bold text-lg transition-all duration-200
              ${selectedNumber === num
                ? 'bg-white/30 text-white scale-110 ring-2 ring-white/50'
                : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
          >
            {num}
          </button>
        ))}
      </div>

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

      <Card className="mb-6">
        <div className="space-y-3">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 text-xl font-mono">
              <span className="min-w-[2ch] text-right">{step.left}</span>
              <span className="text-white/60">×</span>
              <span className="min-w-[2ch]">{step.right}</span>
              <span className="text-white/40">=</span>
              <input
                type="tel"
                inputMode="numeric"
                value={answers[i] || ''}
                onChange={(e) => setAnswers({ ...answers, [i]: e.target.value.replace(/\D/g, '') })}
                disabled={checked}
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
        </div>
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

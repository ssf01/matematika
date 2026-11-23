import { useEffect, useRef, useState } from 'react';
import { useGameStore, MAX_SETUP_STEP } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { ThemePicker } from './ThemePicker';
import { DifficultyPicker } from './DifficultyPicker';
import { OperationsPicker } from './OperationsPicker';
import { PinInput } from './PinInput';
import { ModePicker } from './ModePicker';
import { Button } from '../ui/Button';
import { fillTemplate } from '../puzzle/format';
import { generatePuzzle, generateMultiplicationPinPuzzle, generateMetaPuzzle } from '../../lib/generator';
import type { Difficulty, GameMode, Operation, Puzzle } from '../../lib/types';

const STEP_TITLES = [
  'setup.chooseTheme',
  'setup.chooseDifficulty',
  'setup.chooseOperations',
  'setup.enterPin',
  'setup.chooseMode',
] as const;

const STEP_LABELS = [
  'setup.step.theme',
  'setup.step.difficulty',
  'setup.step.operations',
  'setup.step.pin',
  'setup.step.mode',
] as const;

export function isPrintMode(mode: GameMode): boolean {
  return mode === 'print' || mode === 'meta-print';
}

export function buildPuzzle(
  mode: GameMode,
  pin: string,
  difficulty: Difficulty,
  operations: Operation[],
): Puzzle {
  switch (mode) {
    case 'meta':
    case 'meta-print':
      return generateMetaPuzzle(pin, difficulty, operations);
    case 'multiplication-pin':
      return generateMultiplicationPinPuzzle(pin);
    default:
      return generatePuzzle(pin, difficulty, operations);
  }
}

export function SetupWizard() {
  const { t } = useTranslation();
  const store = useGameStore();
  const [showMultiplicationPicker, setShowMultiplicationPicker] = useState(false);

  const canAdvance = () => {
    switch (store.setupStep) {
      case 0: return store.theme !== null;
      case 1: return store.difficulty !== null;
      case 2: return store.operations.length > 0;
      case 3: return /^\d{4}$/.test(store.pin);
      case 4: return store.mode !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (store.setupStep < MAX_SETUP_STEP) {
      store.nextSetupStep();
      return;
    }
    const puzzle = buildPuzzle(store.mode!, store.pin, store.difficulty!, store.operations);
    store.setPuzzle(puzzle);
    store.setCurrentStep(isPrintMode(store.mode!) ? 'playing' : 'handover');
  };

  const handleMultiplicationNumberPick = (num: number) => {
    // Quick-start skips theme selection, so set a default theme if none chosen
    if (!store.theme) {
      store.setTheme('space');
    }
    store.setMultiplicationTableNumber(num);
    store.setCurrentStep('playing');
  };

  const stepTitleRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  // After "Даље"/"Назад" the Next button is often disabled (nothing selected yet),
  // which would drop keyboard focus to <body>. Move focus to the new step's title
  // and bring it into view. The PIN step focuses its first box itself.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    if (store.setupStep !== 3) stepTitleRef.current?.focus({ preventScroll: true });
  }, [store.setupStep]);

  if (showMultiplicationPicker) {
    return (
      <div className="screen-h flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <span aria-hidden="true" className="inline-flex w-20 h-20 mb-4 rounded-full bg-white/12 items-center justify-center text-5xl">
            🧮
          </span>
          <h1 className="text-3xl font-black mb-2">{t('multiplicationTable.title')}</h1>
          <h2 className="text-xl font-semibold text-white/85 mb-6">{t('multiplicationTable.chooseNumber')}</h2>
          <div className="grid grid-cols-5 gap-3 mb-8">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleMultiplicationNumberPick(num)}
                className="num aspect-square min-h-14 rounded-2xl text-2xl font-black text-white
                  bg-white/10 border-2 border-white/15 hover:border-accent hover:bg-accent/15
                  transition-colors duration-150 active:scale-95"
              >
                {num}
              </button>
            ))}
          </div>
          <Button variant="secondary" onClick={() => setShowMultiplicationPicker(false)} className="w-full">
            {t('setup.back')}
          </Button>
        </div>
      </div>
    );
  }

  const stepComponent = () => {
    switch (store.setupStep) {
      case 0: return <ThemePicker />;
      case 1: return <DifficultyPicker />;
      case 2: return <OperationsPicker />;
      case 3: return <PinInput />;
      case 4: return <ModePicker />;
      default: return null;
    }
  };

  const step = store.setupStep;
  const isLast = step === MAX_SETUP_STEP;

  return (
    <div className="screen-h flex flex-col sm:justify-center sm:py-6">
      <div className="w-full max-w-xl mx-auto px-4 pt-5 sm:pt-8 flex flex-col">
        {/* Hero */}
        <div className="text-center mb-5 sm:mb-7">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
            <span aria-hidden="true" className="mr-2">🔢</span>
            <span className="text-gradient">{t('app.title')}</span>
          </h1>
          <p className="mt-1 text-white/85 text-lg">{t('app.subtitle')}</p>
        </div>

        {/* Step indicator */}
        <ol aria-label={t('setup.steps')} className="grid grid-cols-5 gap-1 mb-6">
          {STEP_LABELS.map((label, idx) => {
            const done = idx < step;
            const active = idx === step;
            return (
              <li
                key={label}
                aria-current={active ? 'step' : undefined}
                className="relative flex flex-col items-center gap-1.5"
              >
                {idx > 0 && (
                  <span
                    aria-hidden="true"
                    className={`absolute top-[18px] right-1/2 w-full h-1 rounded-full
                      ${done || active ? 'bg-accent/70' : 'bg-white/15'}`}
                  />
                )}
                <span
                  aria-hidden="true"
                  className={`num relative w-10 h-10 rounded-full flex items-center justify-center text-base font-black
                    border-2 transition-colors duration-200
                    ${done
                      ? 'bg-accent border-accent text-on-accent'
                      : active
                        ? 'bg-page border-accent text-white shadow-[0_0_0_4px_color-mix(in_oklab,var(--th-accent)_30%,transparent)]'
                        : 'bg-page border-white/25 text-white/75'}`}
                >
                  {done ? '✓' : idx + 1}
                </span>
                <span
                  className={`text-xs sm:text-sm font-semibold text-center leading-tight
                    ${active ? 'text-white' : done ? 'text-white/85' : 'text-white/70'}`}
                >
                  {t(label)}
                </span>
              </li>
            );
          })}
        </ol>

        {/* Step content */}
        <section aria-labelledby="setup-step-title" className="mb-4">
          <p className="text-sm font-bold uppercase tracking-wider text-accent mb-1">
            {fillTemplate(t('setup.stepOf'), { n: step + 1, total: STEP_TITLES.length })}
          </p>
          <h2 id="setup-step-title" ref={stepTitleRef} tabIndex={-1} className="text-2xl sm:text-3xl font-black mb-4 focus:outline-none">
            {t(STEP_TITLES[step])}
          </h2>

          {step === 2 && <p className="-mt-2 mb-4 text-white/80">{t('setup.operationsHint')}</p>}

          {step === 3 && (
            <div className="mb-6 flex gap-3 items-start rounded-2xl border-2 border-dashed border-accent/60 bg-accent/10 p-4">
              <span aria-hidden="true" className="text-2xl leading-none mt-0.5">🔒</span>
              <div>
                <p className="font-black text-accent uppercase tracking-wide text-sm">{t('setup.parentOnly')}</p>
                <p className="text-white/90 leading-snug mt-0.5">{t('setup.pinHint')}</p>
              </div>
            </div>
          )}

          <div className={step === 3 ? 'py-2' : ''}>{stepComponent()}</div>

          {step === 0 && (
            <>
              <div className="flex items-center gap-3 my-5 text-white/70 text-sm font-semibold" aria-hidden="true">
                <span className="h-px flex-1 bg-white/20" />
                {t('setup.or')}
                <span className="h-px flex-1 bg-white/20" />
              </div>
              <button
                type="button"
                onClick={() => setShowMultiplicationPicker(true)}
                className="w-full flex items-center gap-4 rounded-2xl p-4 min-h-16 text-left
                  bg-white/8 border-2 border-white/15 hover:bg-white/14 hover:border-white/30
                  transition-colors duration-150"
              >
                <span aria-hidden="true" className="shrink-0 w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-3xl">
                  🧮
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-lg">{t('setup.multiplicationQuick')}</span>
                  <span className="block text-white/80 text-sm">{t('setup.multiplicationQuickDesc')}</span>
                </span>
                <span aria-hidden="true" className="text-2xl text-white/70">›</span>
              </button>
            </>
          )}
        </section>
      </div>

      {/* Action bar: sticks to the bottom on small screens when content is long. */}
      <div
        className="sticky bottom-0 [@media(max-height:500px)]:static z-30 mt-auto sm:mt-2 bg-page/92 border-t border-white/10 sm:bg-transparent sm:border-0 sm:px-4 sm:pb-4
          shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.6)] sm:shadow-none pb-[env(safe-area-inset-bottom)]"
      >
        <div className="w-full max-w-xl sm:max-w-[34rem] mx-auto px-4 py-3 flex gap-3 sm:p-3 sm:bg-page/92 sm:rounded-3xl sm:border sm:border-white/15 sm:shadow-xl sm:shadow-black/30">
          {step > 0 && (
            <Button variant="secondary" onClick={() => store.prevSetupStep()} className="flex-1">
              {t('setup.back')}
            </Button>
          )}
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!canAdvance()}
            className={step > 0 ? 'flex-[2]' : 'flex-1'}
          >
            {isLast ? t('setup.start') : t('setup.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}

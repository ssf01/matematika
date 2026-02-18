import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { ThemePicker } from './ThemePicker';
import { DifficultyPicker } from './DifficultyPicker';
import { OperationsPicker } from './OperationsPicker';
import { PinInput } from './PinInput';
import { ModePicker } from './ModePicker';
import { Button } from '../ui/Button';
import { ProgressBar } from '../ui/ProgressBar';
import { generatePuzzle } from '../../lib/generator';

const STEP_TITLES = [
  'setup.chooseTheme',
  'setup.chooseDifficulty',
  'setup.chooseOperations',
  'setup.enterPin',
  'setup.chooseMode',
] as const;

export function SetupWizard() {
  const { t } = useTranslation();
  const store = useGameStore();
  const [showMultiplicationPicker, setShowMultiplicationPicker] = useState(false);

  const canAdvance = () => {
    switch (store.setupStep) {
      case 0: return store.theme !== null;
      case 1: return store.difficulty !== null;
      case 2: return store.operations.length > 0;
      case 3: return store.pin.length === 4;
      case 4: return store.mode !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (store.setupStep < 4) {
      store.nextSetupStep();
    } else {
      // Start the game
      const puzzle = generatePuzzle(store.pin, store.difficulty!, store.operations);
      store.setPuzzle(puzzle);
      if (store.mode === 'print') {
        store.setCurrentStep('playing');
      } else {
        store.setCurrentStep('handover');
      }
    }
  };

  const handleMultiplicationTable = () => {
    setShowMultiplicationPicker(true);
  };

  const handleMultiplicationNumberPick = (num: number) => {
    store.setMultiplicationTableNumber(num);
    store.setCurrentStep('playing');
  };

  if (showMultiplicationPicker) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-6">{t('multiplicationTable.chooseNumber')}</h2>
        <div className="grid grid-cols-5 gap-3 mb-8">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => handleMultiplicationNumberPick(num)}
              className="w-14 h-14 rounded-full bg-white/10 hover:bg-white/20
                text-xl font-bold text-white transition-all duration-200
                hover:scale-110 active:scale-95"
            >
              {num}
            </button>
          ))}
        </div>
        <Button variant="ghost" onClick={() => setShowMultiplicationPicker(false)}>
          {t('setup.back')}
        </Button>
      </div>
    );
  }

  const stepComponent = () => {
    switch (store.setupStep) {
      case 0: return <ThemePicker />;
      case 1: return <DifficultyPicker />;
      case 2: return <OperationsPicker />;
      case 3: return <PinInput />;
      case 4: return <ModePicker onMultiplicationTable={handleMultiplicationTable} />;
      default: return null;
    }
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 max-w-lg mx-auto">
      <div className="w-full mb-8 text-center">
        <h1 className="text-4xl font-bold mb-2">{t('app.title')}</h1>
        <p className="text-white/60">{t('app.subtitle')}</p>
      </div>

      <ProgressBar current={store.setupStep + 1} total={5} className="mb-6 w-full" />

      <h2 className="text-xl font-semibold mb-6">{t(STEP_TITLES[store.setupStep])}</h2>

      <div className="w-full mb-8">{stepComponent()}</div>

      <div className="flex gap-4 w-full">
        {store.setupStep > 0 && (
          <Button variant="ghost" onClick={() => store.prevSetupStep()} className="flex-1">
            {t('setup.back')}
          </Button>
        )}
        <Button
          variant="primary"
          onClick={handleNext}
          disabled={!canAdvance()}
          className="flex-1"
        >
          {store.setupStep === 4 ? t('setup.start') : t('setup.next')}
        </Button>
      </div>
    </div>
  );
}

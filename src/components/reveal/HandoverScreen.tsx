import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { Button } from '../ui/Button';

export function HandoverScreen() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const setCurrentStep = useGameStore((s) => s.setCurrentStep);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
      <div className="text-8xl mb-6 animate-float">{theme.emoji}</div>
      <h1 className="text-3xl font-bold mb-4">{t('handover.title')}</h1>
      <p className="text-white/60 text-lg mb-12 max-w-sm">{t('handover.message')}</p>
      <Button
        variant="primary"
        size="lg"
        onClick={() => setCurrentStep('playing')}
        className="text-xl px-12 py-6"
      >
        {t('handover.ready')}
      </Button>
    </div>
  );
}

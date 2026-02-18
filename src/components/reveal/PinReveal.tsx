import React, { useState, useEffect } from 'react';
import { DigitReveal } from './DigitReveal';
import { CelebrationOverlay } from './CelebrationOverlay';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { Button } from '../ui/Button';

export function PinReveal() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const pin = useGameStore((s) => s.pin);
  const reset = useGameStore((s) => s.reset);
  const [revealedCount, setRevealedCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    if (revealedCount < pin.length) {
      const timer = setTimeout(() => setRevealedCount((c) => c + 1), 500);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => setShowCelebration(true), 500);
      return () => clearTimeout(timer);
    }
  }, [revealedCount, pin.length]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6">
      {showCelebration && <CelebrationOverlay />}

      <div className="text-6xl mb-4 animate-float">{theme.emoji}</div>

      <h1 className="text-2xl font-bold mb-2 text-center">
        {t('reveal.title')}
      </h1>

      <p className="text-white/60 mb-8 text-center text-lg">
        {revealedCount >= pin.length ? t('reveal.unlocked') : theme.completionMessage}
      </p>

      <div className="flex gap-4 mb-12">
        {pin.split('').map((digit, i) => (
          <DigitReveal
            key={i}
            digit={digit}
            index={i}
            revealed={i < revealedCount}
          />
        ))}
      </div>

      {showCelebration && (
        <Button variant="primary" size="lg" onClick={reset}>
          {t('reveal.playAgain')}
        </Button>
      )}
    </div>
  );
}

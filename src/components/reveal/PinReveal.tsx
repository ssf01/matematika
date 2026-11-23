import { useState, useEffect } from 'react';
import { DigitReveal } from './DigitReveal';
import { CelebrationOverlay } from './CelebrationOverlay';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { Button } from '../ui/Button';
import { tOr } from '../puzzle/format';

export function PinReveal() {
  const { t } = useTranslation();
  const { theme, themeId } = useTheme();
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

  const unlocked = revealedCount >= pin.length;

  return (
    <div className="screen-h flex flex-col items-center justify-center px-4 py-10 text-center">
      {showCelebration && <CelebrationOverlay />}

      <div className="w-full max-w-xl flex flex-col items-center">
        <span
          aria-hidden="true"
          className="w-28 h-28 mb-5 rounded-full bg-accent/15 ring-4 ring-accent/60 flex items-center justify-center
            text-6xl shadow-[0_0_60px_-6px_var(--th-accent)] animate-float"
        >
          {theme.emoji}
        </span>

        <h1 className="text-4xl sm:text-5xl font-black mb-2 text-gradient">{t('reveal.title')}</h1>
        <p className="text-white text-xl sm:text-2xl font-bold mb-8 flex items-center gap-2">
          <span aria-hidden="true">{unlocked ? '🔓' : '🔒'}</span>
          <span>
            {unlocked ? t('reveal.unlocked') : tOr(t, `reveal.completion.${themeId}`, theme.completionMessage)}
          </span>
        </p>

        <div
          className="surface rounded-[2rem] p-4 sm:p-6 flex gap-2.5 sm:gap-4 mb-10"
          role="status"
          aria-live="polite"
          aria-label={t('reveal.title')}
        >
          {pin.split('').map((digit, i) => (
            <DigitReveal key={i} digit={digit} index={i} revealed={i < revealedCount} />
          ))}
        </div>

        <div className="min-h-16">
          {showCelebration && (
            <Button size="lg" onClick={reset} className="animate-rise-in min-w-64">
              <span aria-hidden="true">🔁</span> {t('reveal.playAgain')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

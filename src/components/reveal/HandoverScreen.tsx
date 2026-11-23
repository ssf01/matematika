import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';
import { Button } from '../ui/Button';

export function HandoverScreen() {
  const { t } = useTranslation();
  const { theme, themeId } = useTheme();
  const setCurrentStep = useGameStore((s) => s.setCurrentStep);

  return (
    <div className="screen-h flex flex-col items-center justify-center px-4 py-10 text-center">
      <div className="surface w-full max-w-md rounded-[2rem] px-6 pt-10 pb-8 flex flex-col items-center">
        <span
          aria-hidden="true"
          className="w-32 h-32 mb-6 rounded-full bg-accent/15 ring-4 ring-accent/60 flex items-center justify-center
            text-7xl shadow-[0_0_60px_-6px_var(--th-accent)] animate-float"
        >
          {theme.emoji}
        </span>

        {/* Parent → child hand-over, drawn with emoji */}
        <div aria-hidden="true" className="flex items-center gap-3 mb-5 text-3xl">
          <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">🧑</span>
          <span className="text-accent text-2xl font-black">→</span>
          <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">📱</span>
          <span className="text-accent text-2xl font-black">→</span>
          <span className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">🧒</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black mb-3">{t('handover.title')}</h1>
        <p className="text-white/90 text-lg mb-2">{t('handover.message')}</p>
        <p className="text-accent font-bold mb-8">{t(`theme.${themeId}`)}</p>

        <Button size="lg" onClick={() => setCurrentStep('playing')} className="w-full">
          {t('handover.ready')}
        </Button>
      </div>
    </div>
  );
}

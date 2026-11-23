import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import { THEME_CONFIGS } from '../../lib/constants';
import type { Theme } from '../../lib/types';
import { Card } from '../ui/Card';

const themeKeys: Theme[] = ['agent', 'space', 'treasure', 'detective'];

export function ThemePicker() {
  const { t } = useTranslation();
  const theme = useGameStore((s) => s.theme);
  const setTheme = useGameStore((s) => s.setTheme);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {themeKeys.map((id) => {
        const cfg = THEME_CONFIGS[id];
        return (
          // Each card previews its own theme palette via a local data-theme.
          <Card
            key={id}
            dataTheme={id}
            selected={theme === id}
            onClick={() => setTheme(id)}
            className="p-0!"
          >
            <div className="flex flex-col items-center text-center gap-2 px-3 pt-5 pb-4 rounded-[14px] h-full
              bg-[linear-gradient(160deg,var(--th-bg-from),var(--th-bg-to))]"
            >
              <span
                aria-hidden="true"
                className="w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-4xl sm:text-5xl
                  bg-white/10 ring-2 ring-accent/60 shadow-[0_0_24px_-4px_var(--th-accent)]"
              >
                {cfg.emoji}
              </span>
              <span className="font-bold text-lg leading-tight text-white">{t(`theme.${id}`)}</span>
              <span aria-hidden="true" className="h-1.5 w-12 rounded-full accent-gradient" />
            </div>
          </Card>
        );
      })}
    </div>
  );
}

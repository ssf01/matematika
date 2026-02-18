import React from 'react';
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
    <div className="grid grid-cols-2 gap-4">
      {themeKeys.map((id) => {
        const cfg = THEME_CONFIGS[id];
        return (
          <Card key={id} selected={theme === id} onClick={() => setTheme(id)}>
            <div className="text-center">
              <div className="text-5xl mb-2">{cfg.emoji}</div>
              <div className="font-semibold text-lg">{t(`theme.${id}`)}</div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { GameMode } from '../../lib/types';
import { Card } from '../ui/Card';

interface ModePickerProps {
  onMultiplicationTable?: () => void;
}

const modes: { id: GameMode; emoji: string; key: string; descKey: string }[] = [
  { id: 'digital', emoji: '📱', key: 'mode.digital', descKey: 'mode.digitalDesc' },
  { id: 'print', emoji: '🖨️', key: 'mode.print', descKey: 'mode.printDesc' },
];

export function ModePicker({ onMultiplicationTable }: ModePickerProps) {
  const { t } = useTranslation();
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);

  return (
    <div className="flex flex-col gap-4">
      {modes.map(({ id, emoji, key, descKey }) => (
        <Card key={id} selected={mode === id} onClick={() => setMode(id)}>
          <div className="flex items-center gap-4">
            <div className="text-4xl">{emoji}</div>
            <div>
              <div className="font-semibold text-lg">{t(key)}</div>
              <div className="text-white/60 text-sm">{t(descKey)}</div>
            </div>
          </div>
        </Card>
      ))}
      <Card onClick={onMultiplicationTable}>
        <div className="flex items-center gap-4">
          <div className="text-4xl">✖️</div>
          <div>
            <div className="font-semibold text-lg">{t('mode.multiplicationTable')}</div>
            <div className="text-white/60 text-sm">{t('mode.multiplicationTableDesc')}</div>
          </div>
        </div>
      </Card>
    </div>
  );
}

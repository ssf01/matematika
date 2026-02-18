import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Difficulty } from '../../lib/types';
import { Card } from '../ui/Card';

const difficulties: { id: Difficulty; stars: string }[] = [
  { id: 'easy', stars: '⭐' },
  { id: 'medium', stars: '⭐⭐' },
  { id: 'hard', stars: '⭐⭐⭐' },
];

export function DifficultyPicker() {
  const { t } = useTranslation();
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  return (
    <div className="flex flex-col gap-4">
      {difficulties.map(({ id, stars }) => (
        <Card key={id} selected={difficulty === id} onClick={() => setDifficulty(id)}>
          <div className="flex items-center gap-4">
            <div className="text-3xl">{stars}</div>
            <div>
              <div className="font-semibold text-lg">{t(`difficulty.${id}`)}</div>
              <div className="text-white/60 text-sm">{t(`difficulty.${id}Desc`)}</div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

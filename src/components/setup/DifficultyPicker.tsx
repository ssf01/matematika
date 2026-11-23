import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Difficulty } from '../../lib/types';
import { Card } from '../ui/Card';

const difficulties: { id: Difficulty; stars: number }[] = [
  { id: 'easy', stars: 1 },
  { id: 'medium', stars: 2 },
  { id: 'hard', stars: 3 },
];

export function DifficultyPicker() {
  const { t } = useTranslation();
  const difficulty = useGameStore((s) => s.difficulty);
  const setDifficulty = useGameStore((s) => s.setDifficulty);

  return (
    <div className="flex flex-col gap-3">
      {difficulties.map(({ id, stars }) => (
        <Card key={id} selected={difficulty === id} onClick={() => setDifficulty(id)}>
          <div className="flex items-center gap-4">
            <span
              aria-hidden="true"
              className="shrink-0 w-20 h-14 rounded-2xl bg-white/10 flex items-center justify-center gap-0.5 text-xl"
            >
              {Array.from({ length: 3 }, (_, i) => (
                <span key={i} className={i < stars ? '' : 'opacity-25 grayscale'}>
                  ⭐
                </span>
              ))}
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-xl">{t(`difficulty.${id}`)}</span>
              <span className="block text-white/80 text-base leading-snug">{t(`difficulty.${id}Desc`)}</span>
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

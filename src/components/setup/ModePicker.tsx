import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { GameMode } from '../../lib/types';
import { Card } from '../ui/Card';

const modes: { id: GameMode; emoji: string; key: string; descKey: string }[] = [
  { id: 'digital', emoji: '📱', key: 'mode.digital', descKey: 'mode.digitalDesc' },
  { id: 'print', emoji: '🖨️', key: 'mode.print', descKey: 'mode.printDesc' },
  { id: 'meta', emoji: '🗺️', key: 'mode.meta', descKey: 'mode.metaDesc' },
  { id: 'meta-print', emoji: '🗺️🖨️', key: 'mode.metaPrint', descKey: 'mode.metaPrintDesc' },
  {
    id: 'multiplication-pin',
    emoji: '✖️🔢',
    key: 'mode.multiplicationPin',
    descKey: 'mode.multiplicationPinDesc',
  },
];

export function ModePicker() {
  const { t } = useTranslation();
  const mode = useGameStore((s) => s.mode);
  const setMode = useGameStore((s) => s.setMode);

  return (
    <div className="flex flex-col gap-3">
      {modes.map(({ id, emoji, key, descKey }) => (
        <div key={id} data-mode={id}>
          <Card selected={mode === id} onClick={() => setMode(id)}>
            <div className="flex items-center gap-4">
              <span
                aria-hidden="true"
                className={`shrink-0 w-16 h-14 rounded-2xl bg-white/10 flex items-center justify-center whitespace-nowrap
                  ${[...emoji].length > 2 ? 'text-xl tracking-tighter' : 'text-3xl'}`}
              >
                {emoji}
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-xl">{t(key)}</span>
                <span className="block text-white/80 text-base leading-snug">{t(descKey)}</span>
              </span>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

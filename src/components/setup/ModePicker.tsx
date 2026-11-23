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
    <div className="flex flex-col gap-4">
      {modes.map(({ id, emoji, key, descKey }) => (
        <div key={id} data-mode={id}>
          <Card selected={mode === id} onClick={() => setMode(id)}>
            <div className="flex items-center gap-4">
              <div className="text-3xl w-16 shrink-0 text-center whitespace-nowrap" aria-hidden="true">{emoji}</div>
              <div>
                <div className="font-semibold text-lg">{t(key)}</div>
                <div className="text-white/60 text-sm">{t(descKey)}</div>
              </div>
            </div>
          </Card>
        </div>
      ))}
    </div>
  );
}

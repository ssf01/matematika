import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Operation } from '../../lib/types';
import { Card } from '../ui/Card';

const ops: { id: Operation; symbol: string; key: string }[] = [
  { id: '+', symbol: '+', key: 'operation.add' },
  { id: '-', symbol: '−', key: 'operation.subtract' },
  { id: '*', symbol: '×', key: 'operation.multiply' },
  { id: '/', symbol: ':', key: 'operation.divide' },
];

export function OperationsPicker() {
  const { t } = useTranslation();
  const operations = useGameStore((s) => s.operations);
  const toggleOperation = useGameStore((s) => s.toggleOperation);

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {ops.map(({ id, symbol, key }) => {
        const selected = operations.includes(id);
        return (
          <Card key={id} selected={selected} onClick={() => toggleOperation(id)}>
            <div className="flex flex-col items-center gap-2 py-1">
              <span
                aria-hidden="true"
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-5xl font-black leading-none
                  transition-colors duration-150
                  ${selected ? 'accent-gradient text-on-accent' : 'bg-white/10 text-white'}`}
              >
                {symbol}
              </span>
              <span className="font-bold text-lg">{t(key)}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

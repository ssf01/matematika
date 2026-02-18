import React from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';
import type { Operation } from '../../lib/types';
import { Card } from '../ui/Card';

const ops: { id: Operation; symbol: string; key: string }[] = [
  { id: '+', symbol: '+', key: 'operation.add' },
  { id: '-', symbol: '−', key: 'operation.subtract' },
  { id: '*', symbol: '×', key: 'operation.multiply' },
  { id: '/', symbol: '÷', key: 'operation.divide' },
];

export function OperationsPicker() {
  const { t } = useTranslation();
  const operations = useGameStore((s) => s.operations);
  const toggleOperation = useGameStore((s) => s.toggleOperation);

  return (
    <div className="grid grid-cols-2 gap-4">
      {ops.map(({ id, symbol, key }) => (
        <Card key={id} selected={operations.includes(id)} onClick={() => toggleOperation(id)}>
          <div className="text-center">
            <div className="text-4xl font-bold mb-1">{symbol}</div>
            <div className="text-sm text-white/70">{t(key)}</div>
          </div>
        </Card>
      ))}
    </div>
  );
}

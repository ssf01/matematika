import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';
import { useTheme } from '../themes/ThemeProvider';

export function PrintHeader() {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="print-header text-center mb-8 pb-4 border-b-2 border-gray-700">
      <h1 className="text-3xl font-bold mb-2">
        {theme.emoji} {t('print.title')}
      </h1>
      <p className="text-white/60 print:text-gray-600 mb-4">{t('print.instructions')}</p>
      <div className="text-left text-white/40 print:text-gray-500">
        <span>{'Име: '}</span>
        <span className="inline-block w-48 border-b border-white/30 print:border-gray-400">&nbsp;</span>
        <span className="ml-8">{'Датум: '}</span>
        <span className="inline-block w-32 border-b border-white/30 print:border-gray-400">&nbsp;</span>
      </div>
    </div>
  );
}

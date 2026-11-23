import { useTranslation } from '../../i18n/useTranslation';
import type { TranslationKeyLike } from '../../i18n/translations';
import { useTheme } from '../themes/ThemeProvider';

interface PrintHeaderProps {
  instructionKey?: TranslationKeyLike;
}

export function PrintHeader({ instructionKey }: PrintHeaderProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();

  return (
    <div className="print-header text-center mb-8 pb-4 border-b-2 border-gray-700">
      <h1 className="text-3xl font-bold mb-2">
        <span aria-hidden="true">{theme.emoji}</span> {t('print.title')}
      </h1>
      <p className="text-white/80 print:text-gray-700 mb-4">{t(instructionKey ?? 'print.instructions')}</p>
      <div className="text-left text-white/75 print:text-gray-700">
        <span>{t('print.name')} </span>
        <span className="inline-block w-48 border-b border-white/40 print:border-gray-500">&nbsp;</span>
        <span className="ml-8">{t('print.date')} </span>
        <span className="inline-block w-32 border-b border-white/40 print:border-gray-500">&nbsp;</span>
      </div>
    </div>
  );
}

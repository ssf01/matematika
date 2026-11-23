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
      <p className="text-gray-700 mb-4">{t(instructionKey ?? 'print.instructions')}</p>
      <div className="flex flex-wrap gap-x-8 gap-y-3 text-left text-gray-700">
        <span>
          <span>{t('print.name')} </span>
          <span className="inline-block w-48 border-b border-gray-500">&nbsp;</span>
        </span>
        <span>
          <span>{t('print.date')} </span>
          <span className="inline-block w-32 border-b border-gray-500">&nbsp;</span>
        </span>
      </div>
    </div>
  );
}

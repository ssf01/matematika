import { useTranslation } from '../../i18n/useTranslation';
import { SCRIPT_LANG } from '../../i18n/ScriptContext';
import { lookup } from '../../i18n/translations';

export function ScriptToggle() {
  const { script, setScript, t } = useTranslation();
  const target = script === 'cyrillic' ? 'latin' : 'cyrillic';

  return (
    <button
      type="button"
      onClick={() => setScript(target)}
      aria-label={t('a11y.switchScript', { target: t(`script.${target}`) })}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-sm font-medium min-h-[44px] min-w-[44px]
        bg-white/10 hover:bg-white/20 text-white/90 hover:text-white
        backdrop-blur-sm border border-white/10 transition-all duration-200 no-print
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
    >
      {/* The label is written in the script it switches to, so it bypasses transliteration. */}
      <span lang={SCRIPT_LANG[target]}>{lookup(`script.${target}Short`)}</span>
    </button>
  );
}

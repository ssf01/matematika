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
      className="no-print h-12 min-w-12 px-3 rounded-full text-sm font-bold tracking-wide
        bg-white/12 hover:bg-white/22 text-white border border-white/20 transition-colors duration-150"
    >
      {/* The label is written in the script it switches to, so it bypasses transliteration. */}
      <span lang={SCRIPT_LANG[target]}>{lookup(`script.${target}Short`)}</span>
    </button>
  );
}

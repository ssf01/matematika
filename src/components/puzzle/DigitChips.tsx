import { useTranslation } from '../../i18n/useTranslation';

interface DigitChipsProps {
  /** One entry per PIN digit: the digit once found, otherwise null. */
  digits: (number | null)[];
  /** Index of the digit currently being worked on (highlighted), if any. */
  activeIndex?: number | null;
}

/**
 * Compact PIN progress shown in the top bar: found digits pop in, the digit
 * being worked on pulses, the rest show "?".
 */
export function DigitChips({ digits, activeIndex = null }: DigitChipsProps) {
  const { t } = useTranslation();
  return (
    <ol aria-label={t('reveal.title')} className="flex items-center gap-1.5 sm:gap-2">
      {digits.map((digit, idx) => {
        const found = digit !== null;
        const active = !found && idx === activeIndex;
        return (
          <li
            key={idx}
            aria-current={active ? 'step' : undefined}
            className={`num relative w-10 h-12 sm:w-11 rounded-xl flex items-center justify-center
              text-2xl font-black border-2 transition-colors duration-200
              ${found
                ? 'accent-gradient text-on-accent border-transparent shadow-md shadow-black/30'
                : active
                  ? 'bg-white/10 border-accent text-white animate-pulse-ring'
                  : 'bg-white/8 border-white/20 text-white/70'}`}
          >
            <span aria-hidden="true" key={found ? 'found' : 'hidden'} className={found ? 'animate-pop' : ''}>
              {found ? digit : '?'}
            </span>
            <span className="sr-only">
              {found
                ? t('a11y.digitFound', { n: idx + 1, digit: digit ?? '' })
                : t('a11y.digitHidden', { n: idx + 1 })}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

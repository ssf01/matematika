import { useTranslation } from '../../i18n/useTranslation';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
  /** Accessible name; defaults to the translated "progress" label. */
  label?: string;
}

export function ProgressBar({ current, total, className = '', label }: ProgressBarProps) {
  const { t } = useTranslation();
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label ?? t('a11y.progress')}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-valuetext={`${current} / ${total}`}
      className={`w-full bg-white/10 rounded-full h-3 overflow-hidden ${className}`}
    >
      <div
        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

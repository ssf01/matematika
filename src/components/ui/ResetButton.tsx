import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ResetButton() {
  const currentStep = useGameStore((s) => s.currentStep);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();

  const close = useCallback(() => {
    setOpen(false);
    // Return focus to the trigger once the dialog unmounts.
    requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    if (!open) return;
    // Safe default: focus "No" so an accidental Enter does not wipe progress.
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, close]);

  if (currentStep === 'setup') return null;

  const handleConfirm = () => {
    setOpen(false);
    useGameStore.getState().reset();
  };

  // Keep Tab / Shift+Tab inside the dialog.
  const trapFocus = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || !dialogRef.current.contains(active))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (active === last || !dialogRef.current.contains(active))) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        title={t('reset.tooltip')}
        aria-label={t('a11y.reset')}
        aria-haspopup="dialog"
        className="no-print w-12 h-12 rounded-full flex items-center justify-center
          bg-white/12 hover:bg-white/22 text-white border border-white/20 transition-colors duration-150"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5.5 9v11h13V9" />
          <path d="M10 20v-5.5h4V20" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keydown implements the modal focus trap */}
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={trapFocus}
            className="bg-page border border-white/20 rounded-3xl p-7 max-w-sm w-full
              shadow-2xl text-center animate-rise-in"
          >
            <div aria-hidden="true" className="mx-auto mb-4 w-14 h-14 rounded-full bg-white/12 flex items-center justify-center text-3xl">
              🏠
            </div>
            <p id={titleId} className="text-white text-xl font-bold mb-6">
              {t('reset.confirm')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 px-6 rounded-2xl font-bold text-lg min-h-13
                  bg-red-500/25 hover:bg-red-500/35 text-red-100 border border-red-400/50
                  transition-colors duration-150 active:scale-95"
              >
                {t('reset.yes')}
              </button>
              <button
                ref={cancelRef}
                type="button"
                onClick={close}
                className="flex-1 px-6 rounded-2xl font-bold text-lg min-h-13
                  accent-gradient text-on-accent shadow-lg shadow-black/25
                  transition-[filter] duration-150 hover:brightness-110 active:scale-95"
              >
                {t('reset.no')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

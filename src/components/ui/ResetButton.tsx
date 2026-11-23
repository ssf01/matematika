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
        className="fixed top-4 left-4 z-50 w-11 h-11 rounded-full flex items-center justify-center
          bg-white/10 hover:bg-white/20 text-white/90 hover:text-white
          backdrop-blur-sm border border-white/10 transition-all duration-200 no-print
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80
          text-lg"
      >
        <span aria-hidden="true">&#x2302;</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
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
            className="bg-gray-900/95 border border-white/15 rounded-2xl p-8 mx-4 max-w-sm w-full
              shadow-2xl text-center"
          >
            <p id={titleId} className="text-white text-lg font-medium mb-6">
              {t('reset.confirm')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl font-semibold text-base min-h-[44px]
                  bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80
                  transition-all duration-200 active:scale-95 min-w-[80px]"
              >
                {t('reset.yes')}
              </button>
              <button
                ref={cancelRef}
                type="button"
                onClick={close}
                className="px-6 py-2.5 rounded-xl font-semibold text-base min-h-[44px]
                  bg-white/20 hover:bg-white/30 text-white border border-white/20
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80
                  transition-all duration-200 active:scale-95 min-w-[80px]"
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

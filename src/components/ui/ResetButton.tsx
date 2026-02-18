import React, { useState } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useTranslation } from '../../i18n/useTranslation';

export function ResetButton() {
  const currentStep = useGameStore((s) => s.currentStep);
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  if (currentStep === 'setup') return null;

  const handleConfirm = () => {
    setShowModal(false);
    useGameStore.getState().reset();
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        title={t('reset.tooltip')}
        className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center
          bg-white/10 hover:bg-white/20 text-white/60 hover:text-white
          backdrop-blur-sm border border-white/10 transition-all duration-200 no-print
          text-lg"
      >
        &#x2302;
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-gray-900/95 border border-white/15 rounded-2xl p-8 mx-4 max-w-sm w-full
              shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-white text-lg font-medium mb-6">
              {t('reset.confirm')}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleConfirm}
                className="px-6 py-2.5 rounded-xl font-semibold text-base
                  bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30
                  transition-all duration-200 active:scale-95 min-w-[80px]"
              >
                {t('reset.yes')}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-base
                  bg-white/20 hover:bg-white/30 text-white border border-white/20
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

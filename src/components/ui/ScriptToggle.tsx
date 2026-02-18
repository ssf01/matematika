import React from 'react';
import { useTranslation } from '../../i18n/useTranslation';

export function ScriptToggle() {
  const { script, setScript } = useTranslation();

  return (
    <button
      onClick={() => setScript(script === 'cyrillic' ? 'latin' : 'cyrillic')}
      className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-sm font-medium
        bg-white/10 hover:bg-white/20 text-white/80 hover:text-white
        backdrop-blur-sm border border-white/10 transition-all duration-200 no-print"
    >
      {script === 'cyrillic' ? 'LAT' : 'ЋИР'}
    </button>
  );
}

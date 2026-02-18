import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { Script } from '../lib/types';
import { translations } from './translations';
import { transliterate } from './transliterate';

const STORAGE_KEY = 'matematika-script';

export interface ScriptContextValue {
  script: Script;
  setScript: (script: Script) => void;
  t: (key: string) => string;
}

export const ScriptContext = createContext<ScriptContextValue>({
  script: 'cyrillic',
  setScript: () => {},
  t: (key: string) => key,
});

function readStoredScript(): Script {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'latin' || stored === 'cyrillic') return stored;
  } catch {}
  return 'cyrillic';
}

export function ScriptProvider({ children }: { children: React.ReactNode }) {
  const [script, setScriptState] = useState<Script>(readStoredScript);

  const setScript = useCallback((next: Script) => {
    setScriptState(next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && (e.newValue === 'cyrillic' || e.newValue === 'latin')) {
        setScriptState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const t = useCallback(
    (key: string): string => {
      const value = translations[key];
      if (value === undefined) return key;
      return script === 'latin' ? transliterate(value) : value;
    },
    [script],
  );

  return (
    <ScriptContext.Provider value={{ script, setScript, t }}>
      {children}
    </ScriptContext.Provider>
  );
}

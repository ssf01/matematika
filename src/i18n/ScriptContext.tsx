import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Script } from '../lib/types';
import { interpolate, lookup } from './translations';
import type { TranslationKeyLike, TranslationParams } from './translations';
import { transliterate } from './transliterate';

const STORAGE_KEY = 'matematika-script';

/** BCP 47 language tags for each script. */
export const SCRIPT_LANG: Record<Script, string> = {
  cyrillic: 'sr-Cyrl',
  latin: 'sr-Latn',
};

export type TranslateFn = (key: TranslationKeyLike, params?: TranslationParams) => string;

export interface ScriptContextValue {
  script: Script;
  setScript: (script: Script) => void;
  t: TranslateFn;
}

/** Translate outside React (or as the context default). */
export function translate(script: Script, key: TranslationKeyLike, params?: TranslationParams): string {
  const value = interpolate(lookup(key), params);
  return script === 'latin' ? transliterate(value) : value;
}

export const ScriptContext = createContext<ScriptContextValue>({
  script: 'cyrillic',
  setScript: () => {},
  t: (key, params) => translate('cyrillic', key, params),
});

function readStoredScript(): Script {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'latin' || stored === 'cyrillic') return stored;
  } catch {}
  return 'cyrillic';
}

export function ScriptProvider({ children }: { children: ReactNode }) {
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

  // Keep <html lang> in sync so screen readers and hyphenation use the right script.
  useEffect(() => {
    document.documentElement.lang = SCRIPT_LANG[script];
  }, [script]);

  const t = useCallback<TranslateFn>(
    (key, params) => translate(script, key, params),
    [script],
  );

  const value = useMemo(() => ({ script, setScript, t }), [script, setScript, t]);

  return <ScriptContext.Provider value={value}>{children}</ScriptContext.Provider>;
}

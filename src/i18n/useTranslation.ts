import { useContext } from 'react';
import { ScriptContext } from './ScriptContext';

export function useTranslation() {
  const { t, script, setScript } = useContext(ScriptContext);
  return { t, script, setScript, isLatin: script === 'latin' } as const;
}

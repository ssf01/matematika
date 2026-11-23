import { describe, it, expect } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { translations, interpolate, lookup } from './translations';
import { ScriptProvider, translate } from './ScriptContext';
import { useTranslation } from './useTranslation';

const THEMES = ['agent', 'space', 'treasure', 'detective'] as const;
const keys = Object.keys(translations);

describe('translations dictionary', () => {
  it('every story.<theme>.* key exists for all four themes', () => {
    const suffixes = new Set<string>();
    for (const key of keys) {
      const m = key.match(/^story\.(agent|space|treasure|detective)\.(.+)$/);
      if (m) suffixes.add(m[2]);
    }
    expect(suffixes.size).toBeGreaterThan(0);
    const missing: string[] = [];
    for (const suffix of suffixes) {
      for (const theme of THEMES) {
        if (!(`story.${theme}.${suffix}` in translations)) missing.push(`story.${theme}.${suffix}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('has a completion message for every theme', () => {
    for (const theme of THEMES) {
      expect(lookup(`reveal.completion.${theme}`)).not.toBe(`reveal.completion.${theme}`);
    }
  });

  it('has no empty values', () => {
    for (const [key, value] of Object.entries(translations)) {
      expect(value, key).not.toBe('');
    }
  });

  it('fixes the "открој" typo', () => {
    expect(Object.values(translations).some((v) => v.includes('открој'))).toBe(false);
  });

  it('meta placeholders are consistent across themes', () => {
    for (const theme of THEMES) {
      expect(lookup(`story.${theme}.meta.checkGrid`)).toMatch(/\{row\}.*\{col\}/);
      expect(lookup(`story.${theme}.meta.digitFound`)).toContain('{digit}');
    }
  });
});

describe('interpolate / translate', () => {
  it('replaces every occurrence of a placeholder', () => {
    expect(interpolate('{a} и {a} и {b}', { a: 1, b: 'x' })).toBe('1 и 1 и x');
  });

  it('leaves unknown placeholders intact', () => {
    expect(interpolate('{a} {missing}', { a: 2 })).toBe('2 {missing}');
  });

  it('returns the key for unknown keys instead of crashing', () => {
    expect(translate('cyrillic', 'no.such.key')).toBe('no.such.key');
    expect(translate('latin', 'no.such.key')).toBe('no.such.key');
  });

  it('interpolates then transliterates in Latin mode', () => {
    expect(translate('cyrillic', 'a11y.pinDigit', { n: 3 })).toBe('Цифра 3 ПИН кода');
    expect(translate('latin', 'a11y.pinDigit', { n: 3 })).toBe('Cifra 3 PIN koda');
  });
});

describe('ScriptProvider', () => {
  function Probe() {
    const { t, setScript } = useTranslation();
    return (
      <button type="button" onClick={() => setScript('latin')}>
        {t('print.name')}
      </button>
    );
  }

  it('sets <html lang> to match the active script', () => {
    localStorage.clear();
    render(
      <ScriptProvider>
        <Probe />
      </ScriptProvider>,
    );
    expect(document.documentElement.lang).toBe('sr-Cyrl');
    expect(screen.getByRole('button')).toHaveTextContent('Име:');
    act(() => screen.getByRole('button').click());
    expect(document.documentElement.lang).toBe('sr-Latn');
    expect(screen.getByRole('button')).toHaveTextContent('Ime:');
  });
});

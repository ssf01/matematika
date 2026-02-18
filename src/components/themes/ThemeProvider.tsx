import React, { createContext, useContext } from 'react';
import type { Theme, ThemeConfig } from '../../lib/types';
import { THEME_CONFIGS } from '../../lib/constants';

interface ThemeContextValue {
  theme: ThemeConfig;
  themeId: Theme;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ themeId, children }: { themeId: Theme; children: React.ReactNode }) {
  const theme = THEME_CONFIGS[themeId];
  return (
    <ThemeContext.Provider value={{ theme, themeId }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

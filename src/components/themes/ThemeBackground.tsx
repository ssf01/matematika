import type { ReactNode } from 'react';
import type { Theme } from '../../lib/types';

export type ShellTheme = Theme | 'default';

/**
 * Viewport-fixed decorative background. All drawing is CSS (see `.theme-bg` in
 * global.css), keyed off the nearest `[data-theme]` ancestor.
 */
export function ThemeBackground() {
  return <div className="theme-bg no-print" aria-hidden="true" />;
}

/**
 * Root of every screen: sets the theme tokens (`data-theme`) and paints the
 * page colour + background. The solid page colour lives on this element (and on
 * <html> via :has), so long, scrolling pages never run out of background.
 */
export function ThemeShell({ themeId, children }: { themeId: ShellTheme; children: ReactNode }) {
  return (
    <div className="theme-root" data-theme={themeId}>
      <ThemeBackground />
      {children}
    </div>
  );
}

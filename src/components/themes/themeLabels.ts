import type { TranslationKey, TranslationKeyLike } from '../../i18n/translations';

export interface MetaAxisLabels {
  row: TranslationKey;
  col: TranslationKey;
}

/** Per-theme names for the secret-map axes (same mapping the on-screen MetaGrid uses). */
export const META_AXIS_LABELS: Record<string, MetaAxisLabels> = {
  agent: { row: 'meta.grid.floor', col: 'meta.grid.room' },
  space: { row: 'meta.grid.row', col: 'meta.grid.col' },
  treasure: { row: 'meta.grid.row', col: 'meta.grid.col' },
  detective: { row: 'meta.grid.street', col: 'meta.grid.house' },
};

const FALLBACK: MetaAxisLabels = { row: 'print.gridRow', col: 'print.gridCol' };

export function getMetaAxisLabels(themeId: string | null | undefined): MetaAxisLabels {
  return (themeId && META_AXIS_LABELS[themeId]) || FALLBACK;
}

/** Translation key holding the theme's completion message. */
export function completionMessageKey(themeId: string): TranslationKeyLike {
  return `reveal.completion.${themeId}`;
}

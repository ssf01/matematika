import type { ThemeConfig, Difficulty, Operation } from './types';

// ---------------------------------------------------------------------------
// Difficulty / chain-length configuration (math engine)
// ---------------------------------------------------------------------------

/** Steps per chain in the standard 4-chain PIN puzzle (≤ 36 steps in total). */
export const CHAIN_LENGTH = { min: 6, max: 9 };

/** Smallest / largest factor of any × or ÷ fact (never ×1, never ×0). */
export const MIN_FACTOR = 2;
export const MAX_FACTOR = 10;

export interface DifficultyConstraint {
  /** Max for every value (left, right, result) of a + or − step. */
  maxValue: number;
  /** Legacy flag: easy keeps every +/− value ≤ 10, so no carrying past ten. */
  allowCarry: boolean;
  /** Hard: every + / − step has a two-digit right operand (≥ minRight). */
  twoDigit: boolean;
  /** Smallest right operand of a + or − step. */
  minRight: number;
  /**
   * Multiplication tables in play. A × / ÷ fact is valid when both factors
   * are in MIN_FACTOR..MAX_FACTOR and at least one of them is in this list
   * (so every dividend is ≤ max(tables) × 10).
   */
  tables: number[];
}

/**
 * Pedagogy (approved):
 * - easy:   +/− values ≤ 10; tables 2, 3, 5, 10. The 3 table is included so
 *           that pure-× chains can encode the odd digits 1, 7, 9 (3×7=21,
 *           3×9=27, 3×3=9); with only 2/5/10 every product ends in 0,2,4,5,6,8.
 * - medium: +/− values ≤ 20; tables 2–5 and 10.
 * - hard:   two-digit +/− (right operand ≥ 10, values ≤ 99); tables 2–10.
 */
export const DIFFICULTY_CONSTRAINTS: Record<Difficulty, DifficultyConstraint> = {
  easy: { maxValue: 10, allowCarry: false, twoDigit: false, minRight: 1, tables: [2, 3, 5, 10] },
  medium: { maxValue: 20, allowCarry: true, twoDigit: false, minRight: 1, tables: [2, 3, 4, 5, 10] },
  hard: { maxValue: 99, allowCarry: true, twoDigit: true, minRight: 10, tables: [2, 3, 4, 5, 6, 7, 8, 9, 10] },
};

/**
 * Steps per chain in adventure (meta) mode, which has 8 chains.
 * Caps the total workload at ≈ 72 steps on hard (8 × avg 9), independent of
 * how many operations are selected.
 */
export const META_CHAIN_LENGTH_BY_DIFFICULTY: Record<Difficulty, { min: number; max: number }> = {
  easy: { min: 5, max: 7 },
  medium: { min: 7, max: 9 },
  hard: { min: 8, max: 10 },
};

/** Steps per chain in multiplication-PIN (ones-digit) mode. */
export const MULTIPLICATION_PIN_CHAIN_LENGTH = { min: 6, max: 8 };

export const ALL_OPERATIONS: Operation[] = ['+', '-', '*', '/'];

export const THEME_CONFIGS: Record<string, ThemeConfig> = {
  agent: {
    id: 'agent',
    name: 'Тајни Агент',
    emoji: '🕵️',
    primaryColor: 'var(--color-agent-primary)',
    secondaryColor: 'var(--color-agent-secondary)',
    accentColor: 'var(--color-agent-accent)',
    glowColor: 'var(--color-agent-glow)',
    sectionLabel: 'Шифра',
    completionMessage: 'Мисија завршена! Сеф је откључан!',
    bgPattern: 'radial-gradient(circle at 20% 50%, rgba(233,69,96,0.15) 0%, transparent 50%)',
    rewardEmojis: ['🔓', '💥', '🔑', '🕶️'],
  },
  space: {
    id: 'space',
    name: 'Свемирска Авантура',
    emoji: '🚀',
    primaryColor: 'var(--color-space-primary)',
    secondaryColor: 'var(--color-space-secondary)',
    accentColor: 'var(--color-space-accent)',
    glowColor: 'var(--color-space-glow)',
    sectionLabel: 'Координата',
    completionMessage: 'Лансирање успешно! Ракета полеће!',
    bgPattern: 'radial-gradient(circle at 80% 20%, rgba(123,47,247,0.15) 0%, transparent 50%)',
    rewardEmojis: ['🚀', '⭐', '💫', '🌟'],
  },
  treasure: {
    id: 'treasure',
    name: 'Лов на Благо',
    emoji: '🗺️',
    primaryColor: 'var(--color-treasure-primary)',
    secondaryColor: 'var(--color-treasure-secondary)',
    accentColor: 'var(--color-treasure-accent)',
    glowColor: 'var(--color-treasure-glow)',
    sectionLabel: 'Траг',
    completionMessage: 'Благо је пронађено! Ковчег је отворен!',
    bgPattern: 'radial-gradient(circle at 50% 80%, rgba(255,193,7,0.15) 0%, transparent 50%)',
    rewardEmojis: ['💰', '✨', '💎', '🪙'],
  },
  detective: {
    id: 'detective',
    name: 'Детектив',
    emoji: '🔍',
    primaryColor: 'var(--color-detective-primary)',
    secondaryColor: 'var(--color-detective-secondary)',
    accentColor: 'var(--color-detective-accent)',
    glowColor: 'var(--color-detective-glow)',
    sectionLabel: 'Доказ',
    completionMessage: 'Случај решен! Мистерија је откривена!',
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(76,175,80,0.15) 0%, transparent 50%)',
    rewardEmojis: ['🔍', '🔎', '🐾', '🗝️'],
  },
};

export const SETUP_STEPS = [
  'theme',
  'difficulty',
  'operations',
  'pin',
  'mode',
] as const;

export const MULTIPLICATION_TABLE_RANGE = { min: 1, max: 10 };

/** Longest meta chain range (hard). Kept for backwards compatibility. */
export const META_CHAIN_LENGTH = META_CHAIN_LENGTH_BY_DIFFICULTY.hard;
export const META_GRID_SIZE = 10;

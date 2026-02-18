import type { ThemeConfig, Difficulty, Operation } from './types';

export const CHAIN_LENGTH = { min: 3, max: 5 };

export const DIFFICULTY_CONSTRAINTS: Record<Difficulty, { maxValue: number; allowCarry: boolean; twoDigit: boolean }> = {
  easy: { maxValue: 10, allowCarry: false, twoDigit: false },
  medium: { maxValue: 18, allowCarry: true, twoDigit: false },
  hard: { maxValue: 99, allowCarry: true, twoDigit: true },
};

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
    bgPattern: 'radial-gradient(circle at 20% 50%, rgba(233,69,96,0.1) 0%, transparent 50%)',
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
    bgPattern: 'radial-gradient(circle at 30% 30%, rgba(76,175,80,0.1) 0%, transparent 50%)',
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

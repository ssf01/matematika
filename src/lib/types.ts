export type Script = 'cyrillic' | 'latin';

export type Theme = 'agent' | 'space' | 'treasure' | 'detective';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Operation = '+' | '-' | '*' | '/';

export type GameMode = 'digital' | 'print' | 'meta' | 'meta-print';

export interface MathStep {
  left: number;
  operator: Operation;
  right: number;
  result: number;
}

export interface PuzzleChain {
  targetDigit: number;
  steps: MathStep[];
  useLastDigit?: boolean; // true when the ones digit of the last result = target (multiplication mode)
}

export interface MetaCoordinate {
  row: number;
  col: number;
  pinDigit: number;
}

export interface MetaGrid {
  cells: number[][];
  coordinates: MetaCoordinate[];
}

export interface Puzzle {
  pin: string;
  chains: PuzzleChain[];
  meta?: MetaGrid;
}

export interface ThemeConfig {
  id: Theme;
  name: string;
  emoji: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  glowColor: string;
  sectionLabel: string;
  completionMessage: string;
  bgPattern: string;
}

export interface GameState {
  pin: string;
  theme: Theme | null;
  difficulty: Difficulty | null;
  operations: Operation[];
  mode: GameMode | null;
  puzzle: Puzzle | null;
  currentStep: 'setup' | 'handover' | 'playing' | 'reveal';
  setupStep: number;
  answers: Record<string, number | null>;
  completedChains: number[];
}

export interface MultiplicationTableConfig {
  number: number;
  maxMultiplier: number;
}

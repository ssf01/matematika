export type Script = 'cyrillic' | 'latin';

export type Theme = 'agent' | 'space' | 'treasure' | 'detective';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type Operation = '+' | '-' | '*' | '/';

export type GameMode = 'digital' | 'print' | 'meta' | 'meta-print';

export type ChainMode = 'full' | 'onesDigit' | 'independent';

export interface MathStep {
  left: number;
  operator: Operation;
  right: number;
  result: number;
}

export interface PuzzleChain {
  targetDigit: number;
  steps: MathStep[];
  /** true when the target is the ONES DIGIT of the last result (e.g. 4 + 6 = 10 → 0). */
  useLastDigit?: boolean;
  /**
   * How consecutive steps relate:
   * - 'full' (default): each step's left operand is the previous result.
   * - 'onesDigit': each step's left operand is the previous result's ones digit.
   * - 'independent': steps are unrelated facts; only the last one encodes the digit.
   */
  chainMode?: ChainMode;
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
  rewardEmojis: string[];
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

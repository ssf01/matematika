import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, Difficulty, Operation, GameMode, Puzzle, MathStep } from '../lib/types';

export type GameStep = 'setup' | 'handover' | 'playing' | 'reveal';

export interface MultiplicationTableState {
  number: number;
  steps: MathStep[];
  answers: Record<number, string>;
  checked: boolean;
}

/** The single source of truth for persisted game state. */
export interface GameState {
  pin: string;
  theme: Theme | null;
  difficulty: Difficulty | null;
  operations: Operation[];
  mode: GameMode | null;
  puzzle: Puzzle | null;
  currentStep: GameStep;
  setupStep: number;
  /** Correct answers keyed by `${chainIdx}-${stepIdx}`. */
  answers: Record<string, number | null>;
  completedChains: number[];
  multiplicationTableNumber: number | null;
  multiplicationTable: MultiplicationTableState | null;
  /** Indexes into puzzle.meta.coordinates, in the order they were found. */
  metaCoordinatesRevealed: number[];
}

export interface GameActions {
  setTheme: (theme: Theme) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  toggleOperation: (op: Operation) => void;
  setPin: (pin: string) => void;
  setMode: (mode: GameMode) => void;
  setPuzzle: (puzzle: Puzzle) => void;
  setCurrentStep: (step: GameStep) => void;
  nextSetupStep: () => void;
  prevSetupStep: () => void;
  setAnswer: (chainIdx: number, stepIdx: number, answer: number | null) => void;
  markChainCompleted: (chainIdx: number) => void;
  setMultiplicationTableNumber: (num: number | null) => void;
  setMultiplicationTable: (table: MultiplicationTableState | null) => void;
  /** Idempotent: revealing the same coordinate twice has no effect. */
  revealMetaCoordinate: (idx: number) => void;
  reset: () => void;
}

export const MAX_SETUP_STEP = 4;
export const STORE_VERSION = 1;
export const STORE_NAME = 'matematika-game';

export const initialState: GameState = {
  pin: '',
  theme: null,
  difficulty: null,
  operations: ['+', '-'],
  mode: null,
  puzzle: null,
  currentStep: 'setup',
  setupStep: 0,
  answers: {},
  completedChains: [],
  multiplicationTableNumber: null,
  multiplicationTable: null,
  metaCoordinatesRevealed: [],
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      setDifficulty: (difficulty) => set({ difficulty }),
      toggleOperation: (op) => {
        const current = get().operations;
        if (current.includes(op)) {
          if (current.length > 1) set({ operations: current.filter((o) => o !== op) });
        } else {
          set({ operations: [...current, op] });
        }
      },
      setPin: (pin) => set({ pin }),
      setMode: (mode) => set({ mode }),
      setPuzzle: (puzzle) =>
        set({ puzzle, answers: {}, completedChains: [], metaCoordinatesRevealed: [] }),
      setCurrentStep: (step) => set({ currentStep: step }),
      nextSetupStep: () => set((s) => ({ setupStep: Math.min(s.setupStep + 1, MAX_SETUP_STEP) })),
      prevSetupStep: () => set((s) => ({ setupStep: Math.max(s.setupStep - 1, 0) })),
      setAnswer: (chainIdx, stepIdx, answer) =>
        set((s) => ({ answers: { ...s.answers, [`${chainIdx}-${stepIdx}`]: answer } })),
      markChainCompleted: (chainIdx) =>
        set((s) =>
          s.completedChains.includes(chainIdx)
            ? s
            : { completedChains: [...s.completedChains, chainIdx] },
        ),
      setMultiplicationTableNumber: (num) => set({ multiplicationTableNumber: num }),
      setMultiplicationTable: (table) => set({ multiplicationTable: table }),
      revealMetaCoordinate: (idx) =>
        set((s) =>
          s.metaCoordinatesRevealed.includes(idx)
            ? s
            : { metaCoordinatesRevealed: [...s.metaCoordinatesRevealed, idx] },
        ),
      reset: () => set({ ...initialState }),
    }),
    {
      name: STORE_NAME,
      version: STORE_VERSION,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s): GameState => ({
        pin: s.pin,
        theme: s.theme,
        difficulty: s.difficulty,
        operations: s.operations,
        mode: s.mode,
        puzzle: s.puzzle,
        currentStep: s.currentStep,
        setupStep: s.setupStep,
        answers: s.answers,
        completedChains: s.completedChains,
        multiplicationTableNumber: s.multiplicationTableNumber,
        multiplicationTable: s.multiplicationTable,
        metaCoordinatesRevealed: s.metaCoordinatesRevealed,
      }),
      // Any state saved under a different schema version is discarded.
      migrate: () => ({ ...initialState }),
    },
  ),
);

/** Digits found so far in meta mode, in PIN order of discovery. */
export function selectMetaDigitsFound(s: Pick<GameState, 'puzzle' | 'metaCoordinatesRevealed'>): number[] {
  const coords = s.puzzle?.meta?.coordinates ?? [];
  return s.metaCoordinatesRevealed
    .filter((i) => i >= 0 && i < coords.length)
    .map((i) => coords[i].pinDigit);
}

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Theme, Difficulty, Operation, GameMode, Puzzle } from '../lib/types';

interface GameState {
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
  multiplicationTableNumber: number | null;
  multiplicationAnswers: Record<number, number | null>;
  multiplicationCompleted: boolean;
  metaCoordinatesRevealed: number[];
  metaDigitsFound: number[];
}

interface GameActions {
  setTheme: (theme: Theme) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  setOperations: (operations: Operation[]) => void;
  toggleOperation: (op: Operation) => void;
  setPin: (pin: string) => void;
  setMode: (mode: GameMode) => void;
  setPuzzle: (puzzle: Puzzle) => void;
  setCurrentStep: (step: GameState['currentStep']) => void;
  nextSetupStep: () => void;
  prevSetupStep: () => void;
  setAnswer: (chainIdx: number, stepIdx: number, answer: number | null) => void;
  markChainCompleted: (chainIdx: number) => void;
  setMultiplicationTableNumber: (num: number | null) => void;
  setMultiplicationAnswer: (index: number, answer: number | null) => void;
  setMultiplicationCompleted: (completed: boolean) => void;
  markMetaCoordinateRevealed: (idx: number) => void;
  addMetaDigitFound: (digit: number) => void;
  isAllChainsCompleted: () => boolean;
  reset: () => void;
}

const initialState: GameState = {
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
  multiplicationAnswers: {},
  multiplicationCompleted: false,
  metaCoordinatesRevealed: [],
  metaDigitsFound: [],
};

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setTheme: (theme) => set({ theme }),
      setDifficulty: (difficulty) => set({ difficulty }),
      setOperations: (operations) => set({ operations }),
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
      setPuzzle: (puzzle) => set({ puzzle }),
      setCurrentStep: (step) => set({ currentStep: step }),
      nextSetupStep: () => set((s) => ({ setupStep: Math.min(s.setupStep + 1, 4) })),
      prevSetupStep: () => set((s) => ({ setupStep: Math.max(s.setupStep - 1, 0) })),
      setAnswer: (chainIdx, stepIdx, answer) =>
        set((s) => ({ answers: { ...s.answers, [`${chainIdx}-${stepIdx}`]: answer } })),
      markChainCompleted: (chainIdx) =>
        set((s) => ({
          completedChains: s.completedChains.includes(chainIdx)
            ? s.completedChains
            : [...s.completedChains, chainIdx],
        })),
      setMultiplicationTableNumber: (num) => set({ multiplicationTableNumber: num }),
      setMultiplicationAnswer: (index, answer) =>
        set((s) => ({ multiplicationAnswers: { ...s.multiplicationAnswers, [index]: answer } })),
      setMultiplicationCompleted: (completed) => set({ multiplicationCompleted: completed }),
      markMetaCoordinateRevealed: (idx) =>
        set((s) => ({
          metaCoordinatesRevealed: s.metaCoordinatesRevealed.includes(idx)
            ? s.metaCoordinatesRevealed
            : [...s.metaCoordinatesRevealed, idx],
        })),
      addMetaDigitFound: (digit) =>
        set((s) => ({ metaDigitsFound: [...s.metaDigitsFound, digit] })),
      isAllChainsCompleted: () => get().completedChains.length >= get().pin.length,
      reset: () => set(initialState),
    }),
    {
      name: 'matematika-game',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);

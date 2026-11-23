import { describe, it, expect, beforeEach } from 'vitest';
import {
  useGameStore,
  initialState,
  STORE_NAME,
  STORE_VERSION,
  selectMetaDigitsFound,
} from './gameStore';
import type { Puzzle } from '../lib/types';

const puzzle: Puzzle = {
  pin: '4567',
  chains: [],
  meta: {
    cells: [],
    coordinates: [
      { row: 1, col: 2, pinDigit: 4 },
      { row: 3, col: 4, pinDigit: 5 },
      { row: 5, col: 6, pinDigit: 6 },
      { row: 7, col: 8, pinDigit: 7 },
    ],
  },
};

describe('gameStore', () => {
  beforeEach(() => {
    sessionStorage.clear();
    useGameStore.setState({ ...initialState });
  });

  it('reset restores the initial state', () => {
    const s = useGameStore.getState();
    s.setPin('1234');
    s.setTheme('agent');
    s.setAnswer(0, 0, 5);
    s.markChainCompleted(0);
    s.setCurrentStep('playing');
    s.reset();
    const after = useGameStore.getState();
    for (const key of Object.keys(initialState) as (keyof typeof initialState)[]) {
      expect(after[key]).toEqual(initialState[key]);
    }
  });

  it('does not expose removed legacy fields/actions', () => {
    const s = useGameStore.getState() as unknown as Record<string, unknown>;
    for (const key of [
      'multiplicationAnswers',
      'multiplicationCompleted',
      'setOperations',
      'isAllChainsCompleted',
      'metaDigitsFound',
    ]) {
      expect(s[key]).toBeUndefined();
    }
  });

  it('persists to sessionStorage with version 1 and no functions', () => {
    useGameStore.getState().setPin('9876');
    const raw = JSON.parse(sessionStorage.getItem(STORE_NAME)!);
    expect(raw.version).toBe(STORE_VERSION);
    expect(STORE_VERSION).toBe(1);
    expect(raw.state.pin).toBe('9876');
    expect(Object.values(raw.state).some((v) => typeof v === 'function')).toBe(false);
  });

  it('rehydrates state saved with the current version', async () => {
    sessionStorage.setItem(
      STORE_NAME,
      JSON.stringify({ state: { ...initialState, pin: '1111', setupStep: 3 }, version: STORE_VERSION }),
    );
    await useGameStore.persist.rehydrate();
    expect(useGameStore.getState().pin).toBe('1111');
    expect(useGameStore.getState().setupStep).toBe(3);
  });

  it('resets state saved under a different version', async () => {
    sessionStorage.setItem(
      STORE_NAME,
      JSON.stringify({
        state: { pin: '1111', currentStep: 'playing', multiplicationAnswers: { 1: 2 } },
        version: 0,
      }),
    );
    await useGameStore.persist.rehydrate();
    const s = useGameStore.getState();
    expect(s.pin).toBe('');
    expect(s.currentStep).toBe('setup');
    expect((s as unknown as Record<string, unknown>).multiplicationAnswers).toBeUndefined();
  });

  it('revealMetaCoordinate is idempotent', () => {
    const s = useGameStore.getState();
    s.setPuzzle(puzzle);
    s.revealMetaCoordinate(0);
    s.revealMetaCoordinate(0);
    s.revealMetaCoordinate(1);
    expect(useGameStore.getState().metaCoordinatesRevealed).toEqual([0, 1]);
    expect(selectMetaDigitsFound(useGameStore.getState())).toEqual([4, 5]);
  });

  it('markChainCompleted is idempotent', () => {
    const s = useGameStore.getState();
    s.markChainCompleted(2);
    s.markChainCompleted(2);
    expect(useGameStore.getState().completedChains).toEqual([2]);
  });

  it('setPuzzle clears previous progress', () => {
    const s = useGameStore.getState();
    s.setAnswer(0, 0, 3);
    s.markChainCompleted(0);
    s.revealMetaCoordinate(0);
    s.setPuzzle(puzzle);
    const after = useGameStore.getState();
    expect(after.answers).toEqual({});
    expect(after.completedChains).toEqual([]);
    expect(after.metaCoordinatesRevealed).toEqual([]);
  });

  it('keeps at least one operation selected', () => {
    const s = useGameStore.getState();
    s.toggleOperation('+');
    s.toggleOperation('-');
    expect(useGameStore.getState().operations).toEqual(['-']);
  });

  it('clamps setup step', () => {
    const s = useGameStore.getState();
    s.prevSetupStep();
    expect(useGameStore.getState().setupStep).toBe(0);
    for (let i = 0; i < 10; i++) s.nextSetupStep();
    expect(useGameStore.getState().setupStep).toBe(4);
  });
});

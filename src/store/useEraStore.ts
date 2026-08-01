import { create } from 'zustand';
import { DEFAULT_ERA, ERA_IDS } from '../data/eras';
import type { EraId } from '../types/era';

export const TRANSITION_DURATION = 2.4; // seconds for a full era transition

export interface EraState {
  /** Era currently shown (the "from" era during a transition). */
  currentEra: EraId;
  /** Era being transitioned toward (equals currentEra when settled). */
  targetEra: EraId;
  /** 0..1 progress of the current transition toward targetEra. */
  progress: number;
  /** True while a transition is in flight. */
  isTransitioning: boolean;
  /** True when the user has requested reduced motion. */
  reducedMotion: boolean;
  /** Seconds elapsed since the transition started (for audio pacing). */
  elapsed: number;
  setEra: (era: EraId) => void;
  tick: (deltaSeconds: number) => void;
  completeTransition: () => void;
  setReducedMotion: (reduced: boolean) => void;
}

export const useEraStore = create<EraState>((set, get) => ({
  currentEra: DEFAULT_ERA,
  targetEra: DEFAULT_ERA,
  progress: 1,
  isTransitioning: false,
  reducedMotion: false,
  elapsed: 0,

  setEra: (era) => {
    const state = get();
    if (era === state.targetEra) {
      return;
    }
    if (state.reducedMotion) {
      // Snap deterministically to the requested era.
      set({
        currentEra: era,
        targetEra: era,
        progress: 1,
        isTransitioning: false,
        elapsed: 0,
      });
      return;
    }
    // Re-base from/to on interruption: if a transition is in flight the era
    // we were heading toward becomes the new "from"; otherwise the settled
    // era does. Progress restarts toward the newly selected era, which
    // guarantees rapid repeated input converges to the last selected era and
    // the final state is exactly the target era.
    const from = state.isTransitioning ? state.targetEra : state.currentEra;
    set({
      currentEra: from,
      targetEra: era,
      progress: 0,
      isTransitioning: true,
      elapsed: 0,
    });
  },

  tick: (deltaSeconds) => {
    const state = get();
    if (!state.isTransitioning) {
      return;
    }
    // The store is a deterministic state machine; the transition hook clamps
    // real-world frame deltas before calling tick, so tests can pass exact
    // durations.
    const dt = Math.max(deltaSeconds, 0);
    const next = Math.min(state.progress + dt / TRANSITION_DURATION, 1);
    if (next >= 1 - 1e-9) {
      // Deterministic final state: exactly the target era.
      set({
        currentEra: state.targetEra,
        targetEra: state.targetEra,
        progress: 1,
        isTransitioning: false,
        elapsed: state.elapsed + dt,
      });
      return;
    }
    set({
      progress: next,
      elapsed: state.elapsed + dt,
    });
  },

  completeTransition: () => {
    const state = get();
    set({
      currentEra: state.targetEra,
      targetEra: state.targetEra,
      progress: 1,
      isTransitioning: false,
    });
  },

  setReducedMotion: (reduced) => {
    const state = get();
    if (reduced) {
      // Snap to the current target immediately.
      set({
        currentEra: state.targetEra,
        targetEra: state.targetEra,
        progress: 1,
        isTransitioning: false,
        reducedMotion: true,
      });
      return;
    }
    set({ reducedMotion: false });
  },
}));

export { ERA_IDS };
export type { EraId };

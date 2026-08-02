import { create } from 'zustand';
import { DEFAULT_ERA, ERA_IDS } from '../data/eras';
import { createInitialTransition, snapToEra } from '../three/transition';
import type { EraId, TransitionState } from '../types';

export type CameraPresetKey = 'overview' | 'counter' | 'table';

export type CameraAnimationState = 'idle' | 'animating' | 'done';

interface CafeStore {
  era: EraId;
  /** Desired era — used while a cross-fade is in flight. */
  targetEra: EraId;
  transition: TransitionState;
  reducedMotion: boolean;
  audioEnabled: boolean;
  audioStarted: boolean;
  cameraPreset: CameraPresetKey | null;
  cameraAnimState: CameraAnimationState;
  presetNonce: number;
  paused: boolean;
  fps: number;
  setEra: (era: EraId) => void;
  completeTransition: () => void;
  setReducedMotion: (v: boolean) => void;
  toggleAudio: () => void;
  setAudioStarted: () => void;
  requestCameraPreset: (preset: CameraPresetKey) => void;
  setCameraAnimState: (s: CameraAnimationState) => void;
  resetCamera: () => void;
  setPaused: (p: boolean) => void;
  setFps: (f: number) => void;
}

const initialTransition = createInitialTransition(DEFAULT_ERA);

export const useStore = create<CafeStore>((set) => ({
  era: DEFAULT_ERA,
  targetEra: DEFAULT_ERA,
  transition: initialTransition,
  reducedMotion:
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  audioEnabled: false,
  audioStarted: false,
  cameraPreset: null,
  cameraAnimState: 'idle',
  presetNonce: 0,
  paused: false,
  fps: 60,

  setEra: (era) =>
    set((state) => {
      if (era === state.targetEra) return state;
      if (state.reducedMotion) {
        return {
          ...state,
          era,
          targetEra: era,
          transition: snapToEra(era),
        };
      }
      return {
        ...state,
        era,
        targetEra: era,
        transition: {
          progress: 0,
          fromEra: state.era,
          toEra: era,
          weight: 0,
          phase: 'fading',
          settled: false,
        },
      };
    }),

  completeTransition: () =>
    set((state) => {
      if (state.transition.settled) return state;
      return {
        ...state,
        era: state.targetEra,
        transition: snapToEra(state.targetEra),
      };
    }),

  setReducedMotion: (v) =>
    set((state) => {
      if (v === state.reducedMotion) return state;
      return {
        ...state,
        reducedMotion: v,
        ...(v
          ? { transition: snapToEra(state.targetEra), era: state.targetEra }
          : {}),
      };
    }),

  toggleAudio: () => set((state) => ({ ...state, audioEnabled: !state.audioEnabled })),

  setAudioStarted: () => set((state) => ({ ...state, audioStarted: true })),

  requestCameraPreset: (preset) =>
    set((state) => ({
      ...state,
      cameraPreset: preset,
      cameraAnimState: 'animating',
      presetNonce: state.presetNonce + 1,
    })),

  setCameraAnimState: (s) => set((state) => ({ ...state, cameraAnimState: s })),

  resetCamera: () =>
    set((state) => ({
      ...state,
      cameraPreset: 'overview',
      cameraAnimState: 'animating',
      presetNonce: state.presetNonce + 1,
    })),

  setPaused: (p) => set((state) => ({ ...state, paused: p })),

  setFps: (f) => set((state) => ({ ...state, fps: f })),
}));

/** Index of an era id in the canonical era order. */
export function eraIndex(era: EraId): number {
  return ERA_IDS.indexOf(era);
}

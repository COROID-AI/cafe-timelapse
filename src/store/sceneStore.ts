import { create } from 'zustand';
import { DEFAULT_ERA_ID, getEraById, getEraByYear } from '../data/eras';

export type CameraMode = 'orbit' | 'walk';

export interface SceneState {
  /** Active era id, e.g. '1945'. */
  activeEraId: string;
  /** Previous era id — used to drive cross-fade direction. */
  prevEraId: string | null;
  /** Incremented each era change so components can detect transitions. */
  transitionTick: number;
  /** Whether the intro overlay has been dismissed (user gesture → audio unlock). */
  entered: boolean;
  /** Master audio enabled. */
  audioEnabled: boolean;
  /** Music channel volume [0..1]. */
  musicVolume: number;
  /** SFX channel volume [0..1]. */
  sfxVolume: number;
  /** Camera interaction mode. */
  cameraMode: CameraMode;

  setEra: (eraId: string) => void;
  setYear: (year: number) => void;
  toggleAudio: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  setMusicVolume: (v: number) => void;
  setSfxVolume: (v: number) => void;
  setCameraMode: (mode: CameraMode) => void;
  toggleCameraMode: () => void;
  enter: () => void;
}

export const useSceneStore = create<SceneState>((set, get) => ({
  activeEraId: DEFAULT_ERA_ID,
  prevEraId: null,
  transitionTick: 0,
  entered: false,
  audioEnabled: true,
  musicVolume: 0.5,
  sfxVolume: 0.6,
  cameraMode: 'orbit',

  setEra: (eraId) =>
    set((state) => {
      // Guard: only transition if the id actually exists and is different.
      const era = getEraById(eraId);
      if (!era || era.id === state.activeEraId) return {};
      return {
        activeEraId: era.id,
        prevEraId: state.activeEraId,
        transitionTick: state.transitionTick + 1,
      };
    }),

  setYear: (year) => {
    const era = getEraByYear(year);
    if (era) {
      get().setEra(era.id);
    }
  },

  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),

  setAudioEnabled: (enabled) => set({ audioEnabled: enabled }),

  setMusicVolume: (v) => set({ musicVolume: Math.max(0, Math.min(1, v)) }),

  setSfxVolume: (v) => set({ sfxVolume: Math.max(0, Math.min(1, v)) }),

  setCameraMode: (mode) => set({ cameraMode: mode }),

  toggleCameraMode: () =>
    set((s) => ({ cameraMode: s.cameraMode === 'orbit' ? 'walk' : 'orbit' })),

  enter: () => set({ entered: true }),
}));

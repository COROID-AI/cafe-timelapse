import { create } from "zustand";
import { ERA_YEARS, type EraConfig, getEraConfig } from "../eras/eraConfig";

interface EraState {
  eraIndex: number;
  audioEnabled: boolean;
  viewPreset: "default" | "closeup" | "wide";
  playMode: boolean;
  setEra: (index: number) => void;
  nextEra: () => void;
  prevEra: () => void;
  toggleAudio: () => void;
  togglePlay: () => void;
  setViewPreset: (preset: EraState["viewPreset"]) => void;
  /** Read-only snapshot of the currently-selected era config. */
  getEra: () => EraConfig;
}

export const useEraStore = create<EraState>((set, get) => ({
  eraIndex: 0,
  audioEnabled: false,
  viewPreset: "default",
  playMode: false,
  setEra: (index) => {
    const clamped = Math.max(0, Math.min(ERA_YEARS.length - 1, index));
    set({ eraIndex: clamped });
  },
  nextEra: () => {
    const i = get().eraIndex;
    set({ eraIndex: (i + 1) % ERA_YEARS.length });
  },
  prevEra: () => {
    const i = get().eraIndex;
    set({ eraIndex: (i - 1 + ERA_YEARS.length) % ERA_YEARS.length });
  },
  toggleAudio: () => set((s) => ({ audioEnabled: !s.audioEnabled })),
  togglePlay: () => set((s) => ({ playMode: !s.playMode })),
  setViewPreset: (preset) => set({ viewPreset: preset }),
  getEra: () => {
    const { eraIndex } = get();
    const year = ERA_YEARS[eraIndex];
    return getEraConfig(year);
  },
}));
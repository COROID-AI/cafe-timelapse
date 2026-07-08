import { create } from 'zustand';
import { Period, PERIODS } from '@/components/PeriodConfig';

interface TimePeriodState {
  currentPeriod: Period;
  transitionProgress: number;
  isTransitioning: boolean;
  setCurrentPeriod: (period: Period) => void;
  setTransitionProgress: (progress: number) => void;
  startTransition: () => void;
  completeTransition: () => void;
}

export const useTimePeriodStore = create<TimePeriodState>((set) => ({
  currentPeriod: 1945,
  transitionProgress: 0,
  isTransitioning: false,
  setCurrentPeriod: (period) => {
    set({ currentPeriod: period, isTransitioning: true, transitionProgress: 0 });
  },
  setTransitionProgress: (progress) => {
    set({ transitionProgress: progress });
  },
  startTransition: () => {
    set({ isTransitioning: true });
  },
  completeTransition: () => {
    set({ isTransitioning: false });
  },
}));

export function useCurrentPeriod(): Period {
  return useTimePeriodStore((state) => state.currentPeriod);
}

export function useTransitionProgress(): number {
  return useTimePeriodStore((state) => state.transitionProgress);
}

export function useIsTransitioning(): boolean {
  return useTimePeriodStore((state) => state.isTransitioning);
}
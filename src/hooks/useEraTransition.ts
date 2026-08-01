import { useEffect, useMemo } from 'react';
import { useEraStore } from '../store/useEraStore';
import { ERAS } from '../data/eras';
import type { EraConfig, EraId, EraSnapshot } from '../types/era';

/**
 * Pure derivation of the blended state for a transition: the "from" era
 * config, the "to" era config, and the 0..1 progress value. Kept pure so it
 * is unit-testable without a DOM (progress is always 1 when settled).
 */
export function buildEraSnapshot(currentEra: EraId, targetEra: EraId, progress: number): EraSnapshot {
  return {
    id: targetEra,
    progress,
    from: ERAS[currentEra],
    to: ERAS[targetEra],
  };
}

/**
 * Drive the era transition from the store. Returns a snapshot of the current
 * blended state.
 */
export function useEraTransition(): EraSnapshot {
  const currentEra = useEraStore((s) => s.currentEra);
  const targetEra = useEraStore((s) => s.targetEra);
  const progress = useEraStore((s) => s.progress);
  const isTransitioning = useEraStore((s) => s.isTransitioning);

  // Advance the transition on every animation frame while in flight.
  useEffect(() => {
    if (!isTransitioning) {
      return;
    }
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      useEraStore.getState().tick(dt);
      if (useEraStore.getState().isTransitioning) {
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isTransitioning]);

  return useMemo(() => buildEraSnapshot(currentEra, targetEra, progress), [currentEra, targetEra, progress]);
}

export type { EraConfig };

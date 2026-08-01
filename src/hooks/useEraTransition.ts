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
 * Single-owner transition driver.
 *
 * useEraTransition() is consumed by several simultaneously mounted
 * components (SceneContents, SceneRoot, EraInfo, ...). The rAF loop that
 * advances store.tick() is therefore a module-level singleton guarded by a
 * consumer ref-count: exactly one loop runs per animation frame no matter how
 * many hook consumers are mounted, so a transition lasts TRANSITION_DURATION
 * instead of speeding up as consumers are added.
 */
let tickerCount = 0;
let tickerRaf = 0;
let tickerLast = 0;

function startTicker() {
  tickerCount += 1;
  if (tickerCount > 1) {
    // A loop is already owned by another consumer.
    return;
  }
  tickerLast = performance.now();
  const step = (now: number) => {
    const dt = (now - tickerLast) / 1000;
    tickerLast = now;
    const state = useEraStore.getState();
    state.tick(dt);
    if (state.isTransitioning) {
      tickerRaf = requestAnimationFrame(step);
    } else {
      // The transition settled: stop scheduling. Consumer effect cleanups
      // will decrement tickerCount on the re-render.
      tickerRaf = 0;
    }
  };
  tickerRaf = requestAnimationFrame(step);
}

function stopTicker() {
  tickerCount = Math.max(0, tickerCount - 1);
  if (tickerCount === 0 && tickerRaf !== 0) {
    cancelAnimationFrame(tickerRaf);
    tickerRaf = 0;
  }
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

  // Register this consumer with the shared driver while a transition is in
  // flight. All consumers share one rAF loop (see startTicker/stopTicker).
  useEffect(() => {
    if (!isTransitioning) {
      return;
    }
    startTicker();
    return () => stopTicker();
  }, [isTransitioning]);

  return useMemo(() => buildEraSnapshot(currentEra, targetEra, progress), [currentEra, targetEra, progress]);
}

export type { EraConfig };

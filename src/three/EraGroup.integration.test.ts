import { beforeEach, describe, expect, it } from 'vitest';
import { useEraStore, TRANSITION_DURATION } from '../store/useEraStore';

/**
 * Integration-level transition logic: mounting boundedness is verified at
 * the React level in the browser (EraGroup mounts at most two groups).
 * Here we verify the store contract that drives it: only current+target
 * change during a transition, and repeated transitions keep the store
 * small and deterministic.
 */
describe('era transition resource boundedness', () => {
  beforeEach(() => {
    useEraStore.setState({
      currentEra: '2025',
      targetEra: '2025',
      progress: 1,
      isTransitioning: false,
      reducedMotion: false,
      elapsed: 0,
    });
  });

  it('rapid repeated transitions converge with bounded state', () => {
    const ids = ['1945', '1965', '1985', '2005', '2025', '2055'] as const;
    // Simulate a drag across all eras rapidly.
    for (const id of ids) {
      useEraStore.getState().setEra(id);
      useEraStore.getState().tick(0.05);
    }
    useEraStore.getState().tick(TRANSITION_DURATION * 2);
    const s = useEraStore.getState();
    expect(s.currentEra).toBe('2055');
    expect(s.targetEra).toBe('2055');
    expect(s.progress).toBe(1);
    expect(s.isTransitioning).toBe(false);
    // Exactly two configs are ever referenced at once: from+to.
    const distinct = new Set([s.currentEra, s.targetEra]);
    expect(distinct.size).toBe(1);
  });

  it('the outgoing era is never mounted after settling (store side)', () => {
    useEraStore.getState().setEra('1965');
    useEraStore.getState().tick(TRANSITION_DURATION * 2);
    const s = useEraStore.getState();
    expect(s.currentEra).toBe('1965');
    expect(s.isTransitioning).toBe(false);
  });
});

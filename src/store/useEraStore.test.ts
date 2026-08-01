import { beforeEach, describe, expect, it } from 'vitest';
import { useEraStore, TRANSITION_DURATION } from './useEraStore';

describe('useEraStore transition logic', () => {
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

  it('starts a transition toward the requested era', () => {
    useEraStore.getState().setEra('1965');
    const s = useEraStore.getState();
    expect(s.targetEra).toBe('1965');
    expect(s.isTransitioning).toBe(true);
    expect(s.progress).toBe(0);
  });

  it('re-bases from/to on interruption and converges to the last selected era', () => {
    useEraStore.getState().setEra('1985');
    // Interrupt halfway.
    useEraStore.getState().tick(TRANSITION_DURATION / 2);
    expect(useEraStore.getState().progress).toBeCloseTo(0.5, 1);
    useEraStore.getState().setEra('2055');
    const s = useEraStore.getState();
    // The interrupted target becomes the new "from".
    expect(s.currentEra).toBe('1985');
    expect(s.targetEra).toBe('2055');
    expect(s.progress).toBe(0);
    // Advance to completion; final state is exactly 2055.
    useEraStore.getState().tick(TRANSITION_DURATION * 2);
    const done = useEraStore.getState();
    expect(done.currentEra).toBe('2055');
    expect(done.targetEra).toBe('2055');
    expect(done.progress).toBe(1);
    expect(done.isTransitioning).toBe(false);
  });

  it('progress is monotonic within a single transition', () => {
    useEraStore.getState().setEra('2005');
    let prev = 0;
    for (let i = 1; i <= 10; i++) {
      useEraStore.getState().tick(TRANSITION_DURATION / 10);
      const p = useEraStore.getState().progress;
      expect(p).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = p;
    }
    expect(prev).toBe(1);
  });

  it('deterministic endpoint equals targetEra after completion', () => {
    useEraStore.getState().setEra('1945');
    useEraStore.getState().tick(TRANSITION_DURATION * 1.5);
    const s = useEraStore.getState();
    expect(s.currentEra).toBe('1945');
    expect(s.targetEra).toBe('1945');
    expect(s.progress).toBe(1);
  });

  it('rapid repeated setEra calls converge to the last selected era', () => {
    useEraStore.getState().setEra('1965');
    useEraStore.getState().setEra('1985');
    useEraStore.getState().setEra('2005');
    useEraStore.getState().tick(TRANSITION_DURATION * 2);
    const s = useEraStore.getState();
    expect(s.currentEra).toBe('2005');
    expect(s.targetEra).toBe('2005');
    expect(s.progress).toBe(1);
    expect(s.isTransitioning).toBe(false);
  });

  it('ignores setting the same era', () => {
    useEraStore.getState().setEra('2025');
    const s = useEraStore.getState();
    expect(s.isTransitioning).toBe(false);
    expect(s.progress).toBe(1);
  });

  it('reduced motion snaps to the target immediately', () => {
    useEraStore.getState().setReducedMotion(true);
    useEraStore.getState().setEra('2055');
    const s = useEraStore.getState();
    expect(s.currentEra).toBe('2055');
    expect(s.targetEra).toBe('2055');
    expect(s.progress).toBe(1);
    expect(s.isTransitioning).toBe(false);
  });
});

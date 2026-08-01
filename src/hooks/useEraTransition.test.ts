import { describe, expect, it } from 'vitest';
import { buildEraSnapshot } from './useEraTransition';
import { ERAS } from '../data/eras';

describe('useEraTransition snapshot derivation (pure)', () => {
  it('builds from/to/progress for a transition', () => {
    const snap = buildEraSnapshot('2025', '1985', 0.4);
    expect(snap.id).toBe('1985');
    expect(snap.progress).toBe(0.4);
    expect(snap.from).toBe(ERAS['2025']);
    expect(snap.to).toBe(ERAS['1985']);
  });

  it('settled state has progress 1 and from === to', () => {
    const snap = buildEraSnapshot('2025', '2025', 1);
    expect(snap.progress).toBe(1);
    expect(snap.from).toBe(snap.to);
    expect(snap.id).toBe('2025');
  });

  it('snapshot always references a real era config for every era', () => {
    for (const id of ['1945', '1965', '1985', '2005', '2025', '2055'] as const) {
      const snap = buildEraSnapshot(id, id, 1);
      expect(snap.from.id).toBe(id);
      expect(snap.to.id).toBe(id);
    }
  });
});

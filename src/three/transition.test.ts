import { describe, expect, it } from 'vitest';
import {
  TRANSITION_DURATION,
  createInitialTransition,
  stepTransition,
  computeFadeWeight,
  computeOutFadeWeight,
  continuousBlend,
  easeInOutCubic,
  smoothstep,
  snapToEra,
  lerpPalettes,
} from '../three/transition';
import { ERAS, ERA_MAP, ERA_IDS, DEFAULT_ERA } from '../data/eras';

describe('transition math', () => {
  it('easeInOutCubic is monotonic and bounded', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 5);
    expect(easeInOutCubic(-1)).toBe(0);
    expect(easeInOutCubic(2)).toBe(1);
  });

  it('smoothstep is bounded', () => {
    expect(smoothstep(0)).toBe(0);
    expect(smoothstep(1)).toBe(1);
    expect(smoothstep(0.5)).toBeCloseTo(0.5, 5);
  });

  it('creates an initial idle transition', () => {
    const t = createInitialTransition('e2025');
    expect(t.phase).toBe('idle');
    expect(t.settled).toBe(true);
    expect(t.weight).toBe(1);
    expect(t.toEra).toBe('e2025');
  });

  it('steps a fading transition forward', () => {
    const start = createInitialTransition('e1945');
    const fading = { ...start, phase: 'fading' as const, progress: 0, fromEra: 'e1945' as const, toEra: 'e1965' as const, weight: 0, settled: false };
    const next = stepTransition(fading, TRANSITION_DURATION / 2);
    expect(next.progress).toBeCloseTo(0.5, 5);
    expect(next.weight).toBeGreaterThan(0);
    expect(next.phase).toBe('fading');
    expect(next.settled).toBe(false);
  });

  it('settles at progress 1', () => {
    const fading = { ...createInitialTransition('e1945'), phase: 'fading' as const, progress: 0.9, fromEra: 'e1945' as const, toEra: 'e1985' as const, weight: 0, settled: false };
    const next = stepTransition(fading, 0.2);
    expect(next.progress).toBe(1);
    expect(next.phase).toBe('idle');
    expect(next.settled).toBe(true);
    expect(next.weight).toBe(1);
  });

  it('idle transitions are unchanged', () => {
    const idle = createInitialTransition('e2025');
    const next = stepTransition(idle, 0.5);
    expect(next).toEqual(idle);
  });

  it('fade weights follow the staged profile', () => {
    expect(computeFadeWeight(0)).toBe(0);
    expect(computeFadeWeight(0.2)).toBe(0);
    expect(computeFadeWeight(0.5)).toBeGreaterThan(0);
    expect(computeFadeWeight(0.5)).toBeLessThan(1);
    expect(computeFadeWeight(1)).toBe(1);
    expect(computeOutFadeWeight(0)).toBe(1);
    expect(computeOutFadeWeight(0.5)).toBe(0);
    expect(computeOutFadeWeight(1)).toBe(0);
  });

  it('continuousBlend eases toward 1', () => {
    expect(continuousBlend(0)).toBe(0);
    expect(continuousBlend(1)).toBe(1);
    expect(continuousBlend(0.5)).toBeCloseTo(0.5, 5);
  });

  it('snapToEra produces a settled target transition', () => {
    const t = snapToEra('e2055');
    expect(t.toEra).toBe('e2055');
    expect(t.settled).toBe(true);
    expect(t.phase).toBe('idle');
  });

  it('lerpPalettes interpolates colors and numbers', () => {
    const a = {
      wall: '#000000', ceiling: '#000000', floor: '#000000', trim: '#000000',
      ambient: '#000000', key: '#000000', point: '#000000', fog: '#000000',
      bloom: 0, fogDensity: 0, keyIntensity: 0, ambientIntensity: 0, pointIntensity: 0,
    };
    const b = {
      wall: '#ffffff', ceiling: '#ffffff', floor: '#ffffff', trim: '#ffffff',
      ambient: '#ffffff', key: '#ffffff', point: '#ffffff', fog: '#ffffff',
      bloom: 2, fogDensity: 0.1, keyIntensity: 2, ambientIntensity: 2, pointIntensity: 20,
    };
    const mid = lerpPalettes(a, b, 0.5);
    expect(mid.wall).toBe('rgb(128, 128, 128)');
    expect(mid.bloom).toBeCloseTo(1, 5);
    expect(mid.pointIntensity).toBeCloseTo(10, 5);
  });
});

describe('era data integrity', () => {
  it('defines exactly the six required periods', () => {
    expect(ERA_IDS).toEqual(['e1945', 'e1965', 'e1985', 'e2005', 'e2025', 'e2055']);
    expect(ERAS).toHaveLength(6);
  });

  it('every era maps and has the required fields', () => {
    for (const era of ERAS) {
      expect(ERA_MAP[era.id]).toBe(era);
      expect(era.label).toMatch(/^\d{4}$/);
      expect(era.menu.items.length).toBeGreaterThanOrEqual(4);
      expect(era.posters).toHaveLength(3);
      expect(era.presets.overview).toBeTruthy();
      expect(era.palette.bloom).toBeGreaterThanOrEqual(0);
      expect(era.music.tempo).toBeGreaterThan(0);
      expect(era.furniture.chairStyle.length).toBeGreaterThan(3);
    }
  });

  it('default era is valid', () => {
    expect(ERA_MAP[DEFAULT_ERA]).toBeDefined();
  });

  it('all poster slots are unique per era', () => {
    for (const era of ERAS) {
      const slots = era.posters.map((p) => p.slot);
      expect(new Set(slots).size).toBe(3);
    }
  });
});

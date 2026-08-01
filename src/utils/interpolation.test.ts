import { describe, expect, it } from 'vitest';
import { clamp, clampDelta, easeOutCubic, lerp, lerpColor, lerpVector, remap } from './interpolation';

describe('interpolation utilities', () => {
  it('lerp interpolates and clamps at 0 and 1', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, -1)).toBe(0); // clamps below 0
    expect(lerp(0, 10, 2)).toBe(10); // clamps above 1
  });

  it('clamp bounds values', () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
    expect(clamp(0.5, 0.2, 0.8)).toBe(0.5);
  });

  it('lerpColor interpolates rgb components', () => {
    const result = lerpColor({ r: 0, g: 0, b: 0 }, { r: 1, g: 0.5, b: 0.25 }, 0.5);
    expect(result.r).toBeCloseTo(0.5);
    expect(result.g).toBeCloseTo(0.25);
    expect(result.b).toBeCloseTo(0.125);
  });

  it('lerpVector interpolates xyz', () => {
    const result = lerpVector({ x: 0, y: 0, z: 0 }, { x: 2, y: 4, z: 6 }, 0.5);
    expect(result.x).toBeCloseTo(1);
    expect(result.y).toBeCloseTo(2);
    expect(result.z).toBeCloseTo(3);
  });

  it('easeOutCubic is monotonic and bounded', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = easeOutCubic(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev - 1e-9);
      prev = v;
    }
  });

  it('clampDelta caps large deltas', () => {
    expect(clampDelta(0.016)).toBeCloseTo(0.016);
    expect(clampDelta(0.5)).toBe(0.1);
    expect(clampDelta(-1)).toBe(0);
  });

  it('remap maps ranges', () => {
    expect(remap(0, 0, 100, 0, 1)).toBe(0);
    expect(remap(50, 0, 100, 0, 1)).toBe(0.5);
    expect(remap(100, 0, 100, 0, 1)).toBe(1);
    expect(remap(200, 0, 100, 0, 1)).toBe(1); // out of range clamps
  });
});

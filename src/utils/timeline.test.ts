import { describe, expect, it } from "vitest";
import {
  ERA_YEARS,
  PLAY_ADVANCE_MS,
  TRANSITION_DURATION_MS,
  clamp,
  clamp01,
  dominantEra,
  easeInOutCubic,
  easeOutCubic,
  eraCount,
  lerp,
} from "./timeline";

describe("transition timing contract (AC5)", () => {
  it("transforms run roughly 1.2–1.5 seconds", () => {
    expect(TRANSITION_DURATION_MS).toBeGreaterThanOrEqual(1200);
    expect(TRANSITION_DURATION_MS).toBeLessThanOrEqual(1500);
  });

  it("autoplay advances slower than a single transition", () => {
    expect(PLAY_ADVANCE_MS).toBeGreaterThan(TRANSITION_DURATION_MS);
  });
});

describe("easing + interpolation", () => {
  it("clamp01 pins to the unit interval", () => {
    expect(clamp01(-0.4)).toBe(0);
    expect(clamp01(0.3)).toBe(0.3);
    expect(clamp01(1.7)).toBe(1);
  });

  it("clamp honours custom bounds", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-5, -2, 3)).toBe(-2);
  });

  it("easeInOutCubic is slow-fast-slow with clean endpoints", () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 6);
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25);
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75);
  });

  it("easeOutCubic starts fast and settles", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.25)).toBeGreaterThan(0.25);
  });

  it("lerp is exact at both ends", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
    expect(lerp(10, 20, 0.5)).toBeCloseTo(15, 10);
  });
});

describe("discrete-era resolution", () => {
  it("flips the visible variant at the midpoint", () => {
    expect(dominantEra(1, 2, 0)).toBe(1);
    expect(dominantEra(1, 2, 0.49)).toBe(1);
    expect(dominantEra(1, 2, 0.5)).toBe(2);
    expect(dominantEra(1, 2, 1)).toBe(2);
  });
});

describe("era roster helpers", () => {
  it("mirrors the six canonical years", () => {
    expect(eraCount()).toBe(6);
    expect([...ERA_YEARS]).toEqual([1945, 1965, 1985, 2005, 2025, 2055]);
  });
});

import type { EraYear } from "../state/types";

/**
 * Pure timeline/transition helpers. Kept free of DOM/three.js deps
 * so unit tests can exercise the timing contract directly.
 */

/** Era transformation duration. AC5 requires roughly 1.2–1.5s. */
export const TRANSITION_DURATION_MS = 1350;

/** Auto-play advance cadence for the timeline Play button (AC5). */
export const PLAY_ADVANCE_MS = 2200;

export const ERA_YEARS: readonly EraYear[] = [1945, 1965, 1985, 2005, 2025, 2055];

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

export function easeInOutCubic(t: number): number {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

export function easeOutCubic(t: number): number {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Resolves which discrete era variant is "in charge" at a given blend
 * factor. Used to flip visibility of swapped props at the midpoint of
 * the transition so neither variant pops while the other is dominant.
 */
export function dominantEra(fromIndex: number, toIndex: number, t: number): number {
  return t < 0.5 ? fromIndex : toIndex;
}

export function eraCount(): number {
  return ERA_YEARS.length;
}

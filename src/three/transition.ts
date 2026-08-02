import type { TransitionPhase, TransitionState } from '../types';

export const TRANSITION_DURATION = 1.6;

/** Ease-in-out cubic. Pure, deterministic, unit tested. */
export function easeInOutCubic(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

/** Smoothstep (used for fade weights). */
export function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

/**
 * Produce the next transition state from a clock delta.
 *
 * The cross-fade has three phases:
 * - 0.0 .. 0.35  : fade the outgoing era out (discrete props hide, continuous
 *                  colors begin to blend).
 * - 0.35 .. 0.65 : hold while the incoming era props fade in.
 * - 0.65 .. 1.0  : finish the blend, settle on the incoming era.
 */
export function stepTransition(
  prev: TransitionState,
  dt: number,
  duration: number = TRANSITION_DURATION,
): TransitionState {
  if (prev.phase === 'idle') {
    return prev;
  }
  const next = Math.min(1, prev.progress + dt / duration);
  const weight = computeFadeWeight(next);
  const settled = next >= 1;
  const phase: TransitionPhase = settled ? 'idle' : 'fading';
  return {
    progress: next,
    fromEra: prev.fromEra,
    toEra: prev.toEra,
    weight,
    phase,
    settled,
  };
}

/** Discrete-prop fade weight for the era currently being revealed. */
export function computeFadeWeight(progress: number): number {
  if (progress <= 0) return 0;
  if (progress < 0.35) return 0;
  if (progress < 0.65) return smoothstep((progress - 0.35) / 0.3);
  return 1;
}

/** Outgoing era opacity = 1 - incoming fade weight (kept simple & smooth). */
export function computeOutFadeWeight(progress: number): number {
  if (progress <= 0) return 1;
  if (progress < 0.35) return 1 - smoothstep(progress / 0.35);
  return 0;
}

/** Create a fresh idle transition for a starting era. */
export function createInitialTransition(era: string): TransitionState {
  return {
    progress: 1,
    fromEra: era as TransitionState['fromEra'],
    toEra: era as TransitionState['toEra'],
    weight: 1,
    phase: 'idle',
    settled: true,
  };
}

/** Continuous-property interpolation factor toward the incoming era. */
export function continuousBlend(progress: number): number {
  return easeInOutCubic(Math.min(1, progress));
}

/**
 * Snap to the target era when the user prefers reduced motion:
 * the transition is skipped but the final state is reached.
 */
export function snapToEra(era: string): TransitionState {
  return {
    progress: 1,
    fromEra: era as TransitionState['fromEra'],
    toEra: era as TransitionState['toEra'],
    weight: 1,
    phase: 'idle',
    settled: true,
  };
}

export interface InterpolatedColors {
  wall: string;
  ceiling: string;
  floor: string;
  trim: string;
  ambient: string;
  key: string;
  point: string;
  fog: string;
  bloom: number;
  fogDensity: number;
  keyIntensity: number;
  ambientIntensity: number;
  pointIntensity: number;
}

/** Linear interpolation of two era palettes. Pure and deterministic. */
export function lerpPalettes(
  from: import('../types').EraPalette,
  to: import('../types').EraPalette,
  t: number,
): InterpolatedColors {
  const c = (a: string, b: string, f: number) => {
    const pa = parseHex(a);
    const pb = parseHex(b);
    const r = Math.round(pa[0] + (pb[0] - pa[0]) * f);
    const g = Math.round(pa[1] + (pb[1] - pa[1]) * f);
    const bl = Math.round(pa[2] + (pb[2] - pa[2]) * f);
    return `rgb(${r}, ${g}, ${bl})`;
  };
  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const lerpN = (a: number, b: number, f: number) => a + (b - a) * clamp01(f);
  return {
    wall: c(from.wall, to.wall, t),
    ceiling: c(from.ceiling, to.ceiling, t),
    floor: c(from.floor, to.floor, t),
    trim: c(from.trim, to.trim, t),
    ambient: c(from.ambient, to.ambient, t),
    key: c(from.key, to.key, t),
    point: c(from.point, to.point, t),
    fog: c(from.fog, to.fog, t),
    bloom: lerpN(from.bloom, to.bloom, t),
    fogDensity: lerpN(from.fogDensity, to.fogDensity, t),
    keyIntensity: lerpN(from.keyIntensity, to.keyIntensity, t),
    ambientIntensity: lerpN(from.ambientIntensity, to.ambientIntensity, t),
    pointIntensity: lerpN(from.pointIntensity, to.pointIntensity, t),
  };
}

function parseHex(hex: string): [number, number, number] {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h
      .split('')
      .map((ch) => ch + ch)
      .join('');
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

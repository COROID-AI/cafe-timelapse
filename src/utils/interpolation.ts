import type { Color3 } from '../types/era';

/** Clamp a number into [min, max]. */
export function clamp(value: number, min = 0, max = 1): number {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation between a and b by t, clamped to [0,1]. */
export function lerp(a: number, b: number, t: number): number {
  const k = clamp(t);
  return a + (b - a) * k;
}

/** Interpolate a {r,g,b} color tuple by t in [0,1]. */
export function lerpColor(a: Color3, b: Color3, t: number): Color3 {
  const k = clamp(t);
  return {
    r: lerp(a.r, b.r, k),
    g: lerp(a.g, b.g, k),
    b: lerp(a.b, b.b, k),
  };
}

/** Interpolate a THREE.Vector3-compatible {x,y,z} by t in [0,1]. */
export function lerpVector(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  t: number,
): { x: number; y: number; z: number } {
  const k = clamp(t);
  return {
    x: lerp(a.x, b.x, k),
    y: lerp(a.y, b.y, k),
    z: lerp(a.z, b.z, k),
  };
}

/**
 * Apply an easing function to t in [0,1]. Ease-out-cubic gives a gentle
 * deceleration at the end of a transition.
 */
export function easeOutCubic(t: number): number {
  const k = clamp(t);
  return 1 - Math.pow(1 - k, 3);
}

/** Clamp a delta (in seconds) so a single frame can never overshoot badly. */
export function clampDelta(delta: number, max = 0.1): number {
  return clamp(delta, 0, max);
}

/** Map a value from one range into another. */
export function remap(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  const t = (value - inMin) / (inMax - inMin || 1);
  return lerp(outMin, outMax, clamp(t));
}

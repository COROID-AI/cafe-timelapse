import type * as THREE from 'three';
import type { EraAnimator } from '../types';

/**
 * Small animation plumbing for the counter-technology group.
 *
 * Era composers attach idle-animation closures to their variant group; the
 * rig collects them once and drives them from a single per-frame update.
 * Animators must only touch transforms and emissive intensities — opacity is
 * owned exclusively by the crossfade machinery in `CounterTechBuilder.ts`.
 */

/** Attaches an idle animator to a variant's root group. */
export function addAnimator(group: THREE.Group, animator: EraAnimator): void {
  const animators = (group.userData.animators as EraAnimator[] | undefined) ?? [];
  animators.push(animator);
  group.userData.animators = animators;
}

/**
 * Period helper: maps elapsed time onto a cyclic phase in [0, 1).
 * `offset` shifts the phase so different details don't pop in sync.
 */
export function cycle(elapsedSeconds: number, periodSeconds: number, offset = 0): number {
  return ((elapsedSeconds + offset) / periodSeconds) % 1;
}

/** Smooth 0→1→0 pulse over one cycle (cosine eased). */
export function pulse(phase: number): number {
  return 0.5 - 0.5 * Math.cos(phase * Math.PI * 2);
}

/** Smoothstep easing between 0 and 1. */
export function smoothstep(t: number): number {
  const clamped = Math.min(Math.max(t, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
}

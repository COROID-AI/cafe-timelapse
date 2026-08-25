/**
 * Idle animation rig for stylised patrons.
 *
 * Three subtle loops only — head turns, sip motion, phone-glance — exactly
 * what the brief asks for and nothing that could read uncanny. Every animator
 * is STATELESS: it writes absolute joint rotations from `(time, phase)` so a
 * paused clock freezes the pose exactly where it is. All amplitudes are small
 * enough that any frozen mid-pose frame stays inside the seated envelope — no
 * limb can clip through chairs, tables or neighbours while an era transition
 * holds everyone still.
 */

import * as THREE from 'three';
import type { PatronIdleKind } from './types';

/** Joint handles collected by the figure builder. */
export interface FigureJoints {
  /** Neck pivot carrying head + hair + worn head accessories. */
  headPivot: THREE.Group;
  armRPivot: THREE.Group;
  elbowRPivot: THREE.Group;
  armLPivot: THREE.Group;
  elbowLPivot: THREE.Group;
}

/* ----- authored base pose ------------------------------------------------- */

/** Shoulder pitch at rest (slightly forward). */
export const REST_ARM_X = -0.25;
/** Elbow bend at rest (hands hovering above the lap / table edge). */
export const REST_ELBOW_X = -0.95;
/** Both-hands hold (broadsheet, e-reader): higher elbows, deeper bend. */
export const HOLD_ARM_X = -0.52;
export const HOLD_ELBOW_X = -1.62;

/** Counter-clockwise compensation so right-hand items sit upright at rest. */
export const ITEM_UPRIGHT_X = -(REST_ARM_X + REST_ELBOW_X);

/**
 * Writes the authored static pose. Called once at build time; animators
 * re-write the same baselines every tick afterwards.
 */
export function applyStaticPose(joints: FigureJoints, hold: 'rest' | 'bothHands'): void {
  if (hold === 'bothHands') {
    joints.armRPivot.rotation.x = HOLD_ARM_X;
    joints.elbowRPivot.rotation.x = HOLD_ELBOW_X;
    joints.armLPivot.rotation.x = HOLD_ARM_X;
    joints.elbowLPivot.rotation.x = HOLD_ELBOW_X;
  } else {
    joints.armRPivot.rotation.x = REST_ARM_X;
    joints.elbowRPivot.rotation.x = REST_ELBOW_X;
    joints.armLPivot.rotation.x = REST_ARM_X;
    joints.elbowLPivot.rotation.x = REST_ELBOW_X;
  }
  joints.headPivot.rotation.set(0, 0, 0);
}

/** Smooth 0→1→0 pulse window over `period` seconds, phase-shifted. */
function pulse(time: number, period: number, phase: number): number {
  const p = ((((time + phase) % period) + period) % period) / period;
  // Rise 6–18% of the cycle, plateau to 36%, fall by 50%, rest the remainder.
  return (
    THREE.MathUtils.smoothstep(p, 0.06, 0.18) *
    (1 - THREE.MathUtils.smoothstep(p, 0.36, 0.5))
  );
}

/** Sine eased into the same soft ramp as {@link pulse} for arm blends. */
function ease(x: number): number {
  return x * x * (3 - 2 * x);
}

/**
 * Applies one frame of the idle loop. Safe to call every update; when the
 * caller stops advancing `time` the written transforms simply stop changing.
 */
export function applyIdle(
  joints: FigureJoints,
  kind: PatronIdleKind,
  time: number,
  phaseSeed: number,
): void {
  // Deterministic per-figure phase spread (golden-angle-ish).
  const phase = phaseSeed * 2.39996;
  switch (kind) {
    case 'headTurn': {
      joints.headPivot.rotation.y = 0.26 * Math.sin(time * 0.85 + phase);
      joints.headPivot.rotation.z = 0.05 * Math.sin(time * 0.53 + phase * 1.7);
      joints.headPivot.rotation.x = 0;
      break;
    }
    case 'sip': {
      const lift = ease(pulse(time, 7.0, phase));
      joints.elbowRPivot.rotation.x = REST_ELBOW_X - 1.15 * lift; // hand → face
      joints.armRPivot.rotation.x = REST_ARM_X - 0.08 * lift;
      joints.headPivot.rotation.set(-0.16 * lift, 0, 0);
      break;
    }
    case 'phoneGlance': {
      const lift = ease(pulse(time, 8.5, phase));
      joints.elbowRPivot.rotation.x = REST_ELBOW_X - 0.95 * lift; // phone up
      joints.armRPivot.rotation.x = REST_ARM_X - 0.12 * lift;
      joints.headPivot.rotation.set(-0.42 * lift, 0.06 * lift, 0);
      break;
    }
  }
}

import type * as THREE from 'three';

/**
 * Payload contracts for the counter technology prop group.
 *
 * Structurally mirrors `CounterDevice` / `CounterTechConfig` from
 * `src/cafe/eras/types.ts` so data written by the era-content tasks flows
 * straight into this prop group without importing the (year-narrower) era
 * module graph. Every field is optional; absent data simply falls back to the
 * built-in period presets (the current era stubs carry empty sections).
 */

/** One piece of till / payment hardware described by an era config. */
export interface CounterDeviceSpec {
  id?: string;
  label?: string;
  description?: string;
  /** e.g. "brass manual till", "electronic POS", "contactless card reader". */
  kind?: string;
  /** e.g. ["cash"], ["card", "contactless"], ["phone wallet"]. */
  supportsPayment?: string[];
  /** e.g. "counter", "customer side", "wall mount". */
  placement?: string;
}

/**
 * Shape of the `counterTech` section produced by the era-content tasks.
 *
 * The builder composes a fully procedural, period-correct checkout line-up
 * for every supported year even when this payload is empty; when era data IS
 * present it enriches the scene by stamping the catalogue into the variant's
 * `userData` for tooltips / debug overlays.
 */
export interface CounterTechSpec {
  till?: CounterDeviceSpec | null;
  /** Card terminals, tip jars, loyalty tablets… */
  additionalDevices?: CounterDeviceSpec[];
  /** e.g. "handwritten pad", "dot-matrix roll", "email receipt". */
  receiptMethod?: string;
  queueFlowNote?: string;
}

/** Context handed to one era-variant composer. */
export interface EraVariantContext {
  /** Resolved counter-tech payload for the era being composed. */
  readonly spec?: CounterTechSpec;
}

/**
 * Per-frame idle animation closure attached to a variant group.
 *
 * Animators move transforms and emissive intensities ONLY — never opacity,
 * which belongs exclusively to the crossfade machinery.
 */
export type EraAnimator = (elapsedSeconds: number, deltaSeconds: number) => void;

/**
 * Composes the complete procedural checkout line-up for one era. Returns a
 * group whose origin sits ON the service-counter top (see `SERVICE_COUNTER`
 * in `./layout`): +x runs along the counter, −z faces the customer side,
 * +z faces the barista / back-bar side.
 */
export type EraVariantBuilder = (context: EraVariantContext) => THREE.Group;

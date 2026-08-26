import type * as THREE from 'three';

/**
 * Typed contracts for the Signage & Lighting prop group.
 *
 * The payload shapes intentionally mirror the `signageLighting` category of
 * `src/cafe/eras/types.ts` ({@link SignageElementSpec} ↔ `SignageElement`,
 * {@link LightFixtureSpec} ↔ `LightFixture`) the same way the machines group
 * mirrors its brewing-equipment category: era-content tasks fill the shared
 * era configs while this module owns rendering + the built-in period presets.
 */

/** Timeline stops rendered by this group (2055 belongs to a later task). */
export const SIGNAGE_ERA_YEARS = [1945, 1965, 1985, 2005, 2025] as const;

/** One of the five supported signage & lighting eras. */
export type SignageEraYear = (typeof SIGNAGE_ERA_YEARS)[number];

/** A sign: painted fascia, neon tube, lightbox, dimensional letters… */
export interface SignageElementSpec {
  /** Stable id so cross-category references stay possible. */
  id?: string;
  /** Short human-readable label (debug overlay, close-up captions). */
  label?: string;
  /** Longer free-form description used when modelling/rendering the detail. */
  description?: string;
  /** "hand-painted wood", "neon tube", "backlit plastic"… */
  type?: string;
  /** Big text readable on the sign face. */
  text?: string;
  /** Rough anchor point, e.g. "window", "north wall", "fascia". */
  placement?: string;
  /** Whether the sign animates (neon flicker, LED pulse…). */
  animated?: boolean;
}

/** One light fixture contributing to the era look. */
export interface LightFixtureSpec {
  id?: string;
  label?: string;
  description?: string;
  /** "filament bulb", "fluorescent tube", "halogen spot", "LED strip"… */
  type?: string;
  colorTemperatureK?: number;
  /** Relative brightness 0..1 hint (presets map it onto physical units). */
  intensity?: number;
  /** Hex/named colour, e.g. "#ffb066". */
  color?: string;
  placement?: string;
}

/**
 * The `signageLighting` payload routed through `EraConfig.signage`.
 *
 * Every field is optional: absent keys simply fall back to this module's
 * built-in period preset for the active year.
 */
export interface SignageLightingSpec {
  signage?: SignageElementSpec[];
  fixtures?: LightFixtureSpec[];
  /** Overall light mood, e.g. "warm smoky glow". */
  overallMood?: string;
  /** Daylight note, e.g. "blackout conditions after dusk". */
  daylightNote?: string;
}

/**
 * Per-frame animator installed by an era variant.
 *
 * Receives continuous elapsed seconds and MUST be allocation-free (reuse
 * colours/vectors) because it runs every rendered frame. Light writes must
 * compose with the crossfade by multiplying `light.userData.fadeFactor`
 * (maintained by the rig) into the authored base intensity.
 */
export type SignageAnimator = (elapsedSeconds: number) => void;

/** Context handed to an era variant builder. */
export interface EraVariantContext {
  /** Era payload extracted from the routed config, when present. */
  spec?: SignageLightingSpec;
}

/** Builds one era's signage + fixture object graph (origin-centred). */
export type EraVariantBuilder = (context: EraVariantContext) => THREE.Group;

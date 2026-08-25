import type * as THREE from 'three';

/**
 * Payload contract for a single piece of tableware.
 *
 * Structurally mirrors `TablewarePiece` from `src/cafe/eras/types.ts` so data
 * written by the era-content tasks flows straight into this prop group
 * without importing the year-narrower era module graph. Every field is
 * optional; absent data simply falls back to the built-in period presets.
 */
export interface TablewarePieceSpec {
  id?: string;
  label?: string;
  description?: string;
  /** e.g. "bone china", "enamel", "melamine", "paper", "thick glass". */
  material?: string;
  pattern?: string;
  /** e.g. "chipped wartime reuse", "pristine". */
  condition?: string;
}

/**
 * Shape of the `tableware` section produced by the era-content tasks.
 *
 * The builder dresses every dining table with a fully procedural,
 * period-correct tabletop line-up for all five supported years even when this
 * payload is empty (the current era stubs); when era data IS present it
 * enriches the scene: piece counts hint at duplicated props and the catalogue
 * is stamped into `group.userData` for tooltips / debug overlays.
 */
export interface TablewareSpec {
  pieces?: TablewarePieceSpec[];
  /** "waitress table service", "self-serve cafeteria trays"… */
  servingStyle?: string;
  /** Cloth vs paper napkins, holders, dispensers. */
  napkinNote?: string;
}

/** Context handed to one era-variant composer. */
export interface EraVariantContext {
  /** Resolved tableware payload for the era being composed. */
  readonly spec?: TablewareSpec;
}

/**
 * Composes the complete tabletop dressing for one era.
 *
 * Returns a group whose children are one cluster per dining-table anchor (see
 * `./layout`). Each cluster's origin sits ON the tabletop surface, +y up, so
 * items rest on the furniture without clipping.
 */
export type EraVariantBuilder = (context: EraVariantContext) => THREE.Group;

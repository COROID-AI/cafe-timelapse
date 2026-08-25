import type * as THREE from 'three';

/**
 * Payload contract for a single brewing appliance.
 *
 * Structurally mirrors `BrewingAppliance` from `src/cafe/eras/types.ts` so the
 * data written by the era-content tasks flows straight into this prop group
 * without importing the (year-narrower) era module graph. Every field is
 * optional; absent data simply falls back to the built-in period presets.
 */
export interface BrewingApplianceSpec {
  id?: string;
  label?: string;
  description?: string;
  /** e.g. "lever espresso machine", "percolator", "moka pot". */
  kind?: string;
  /** Real-world flavour text, e.g. "Faema E61". */
  brandModel?: string;
  /** "gas" | "electric" | "induction" … */
  powerSource?: string;
  /** "counter" | "back bar" | "under-counter fridge" … */
  placement?: string;
}

/**
 * Shape of the `brewingEquipment` section produced by the era-content tasks.
 *
 * The builder renders a fully procedural, period-correct machine line-up for
 * every supported year even when this payload is empty (the current era
 * stubs); when era data IS present it enriches the scene: appliance counts
 * hint at duplicated props and the catalogue is stamped into `group.userData`
 * for tooltips / debug overlays.
 */
export interface BrewingEquipmentSpec {
  espressoMachines?: BrewingApplianceSpec[];
  otherBrewers?: BrewingApplianceSpec[];
  grinder?: BrewingApplianceSpec | null;
  preparationNotes?: string;
}

/** Context handed to one era-variant composer. */
export interface EraVariantContext {
  /** Resolved brewing-equipment payload for the era being composed. */
  readonly spec?: BrewingEquipmentSpec;
}

/**
 * Composes the complete procedural back-bar line-up for one era. Returns a
 * group whose origin sits ON the back-bar worktop (see `BACK_BAR` in
 * `./layout`): +x runs along the bar, −z faces the barista / customer side,
 * +z faces the backsplash wall.
 */
export type EraVariantBuilder = (context: EraVariantContext) => THREE.Group;

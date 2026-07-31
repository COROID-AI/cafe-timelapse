import type { EraYear } from '../data/eras';

/**
 * A category of scene fragment that an era can register.
 *
 * Categories mirror the EraData contract so each era can independently
 * describe how it renders architecture, machines, patrons, and so on.
 * Scene fragments are built by future phases; the registry contract is
 * established now so every era registers a fragment per category.
 */
export type FragmentCategory =
  | 'architecture'
  | 'furnitureDecor'
  | 'coffeeMachines'
  | 'menuBoard'
  | 'musicSource'
  | 'posters'
  | 'tableware'
  | 'signageLighting'
  | 'counterTechnology'
  | 'patrons';

/**
 * A registered scene fragment for one era. The `build` function receives the
 * target Three.js group and the era year so fragments can be constructed
 * imperatively. The `label` and `tags` fields are data available to the QA
 * gate and future tooling without executing the build.
 */
export interface EraFragment {
  /** Category this fragment contributes to (required by the QA gate). */
  category: FragmentCategory;
  /** Human-readable description of the fragment. */
  label: string;
  /** Optional keywords describing the fragment contents. */
  tags?: string[];
  /**
   * Builds the fragment's meshes into `target`.
   * Phase 1 registers fragments with `build` stubbed out; later phases
   * implement real geometry here.
   */
  build: (target: import('three').Group, era: EraYear) => void;
}

/** A complete registration for one era: one fragment per category. */
export interface EraRegistration {
  era: EraYear;
  fragments: EraFragment[];
}

const registry = new Map<EraYear, EraRegistration>();

/**
 * Register the scene fragments for one era. The QA gate (`npm run check:eras`)
 * asserts that every registered era supplies all required categories.
 */
export function registerEra(registration: EraRegistration): void {
  const existing = registry.get(registration.era);
  if (existing) {
    throw new Error(
      `Era ${registration.era} is already registered (${existing.fragments.length} fragments).`,
    );
  }
  registry.set(registration.era, registration);
}

/** Return the registration for an era, or undefined when not registered. */
export function getEraRegistration(era: EraYear): EraRegistration | undefined {
  return registry.get(era);
}

/** All registered era registrations. */
export function getAllEraRegistrations(): EraRegistration[] {
  return [...registry.values()];
}

/** All era years that have a registration. */
export function getRegisteredEraYears(): EraYear[] {
  return [...registry.keys()];
}

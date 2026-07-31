import type { EraRegistration, FragmentCategory } from './AssetRegistry';

export const REQUIRED_FRAGMENT_CATEGORIES: readonly FragmentCategory[] = [
  'architecture',
  'furnitureDecor',
  'coffeeMachines',
  'menuBoard',
  'musicSource',
  'posters',
  'tableware',
  'signageLighting',
  'counterTechnology',
  'patrons',
];

/** Validate that one registration supplies every required fragment category. */
export function validateRegistration(registration: EraRegistration): string[] {
  const errors: string[] = [];
  const categories = new Set(registration.fragments.map((f) => f.category));

  for (const required of REQUIRED_FRAGMENT_CATEGORIES) {
    if (!categories.has(required)) {
      errors.push(`Era ${registration.era} is missing fragment category "${required}".`);
    }
  }

  const duplicates = registration.fragments
    .map((f) => f.category)
    .filter((category, index, all) => all.indexOf(category) !== index);
  if (duplicates.length > 0) {
    errors.push(
      `Era ${registration.era} registers duplicate fragment categories: ${[...new Set(duplicates)].join(', ')}.`,
    );
  }

  return errors;
}

/** A lookup of era years to the categories they registered. */
export type CategoryCoverage = Record<number, FragmentCategory[]>;

/** Summarise which categories each registered era supplies. */
export function summarizeCoverage(registrations: EraRegistration[]): CategoryCoverage {
  const coverage: CategoryCoverage = {};
  for (const registration of registrations) {
    coverage[registration.era] = registration.fragments.map((f) => f.category);
  }
  return coverage;
}

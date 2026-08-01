/**
 * Public surface of the AssetRegistry.
 *
 * Importing this module does not register any eras. Use `registerAllEras`
 * (async, app entry) or import the per-era modules directly (QA gate) to
 * populate the registry.
 */
export {
  registerEra,
  getEraRegistration,
  getAllEraRegistrations,
  getRegisteredEraYears,
} from './AssetRegistry';
export type {
  EraFragment,
  EraRegistration,
  FragmentCategory,
} from './AssetRegistry';
export { registerAllEras } from './loadEras';
export { validateRegistration, summarizeCoverage } from './coverage';
export type { CategoryCoverage } from './coverage';

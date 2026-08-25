/**
 * Coffee Machines & Brewing Equipment prop group.
 *
 * Public API for the `machines` detail category of the Café Time Period
 * Timelapse. See ./README.md for the full integration guide.
 */

export {
  CROSSFADE_DURATION_MS,
  MACHINES_PROP_GROUP,
  MACHINES_PROP_GROUP_KEY,
  SUPPORTED_ERA_YEARS,
  BrewingEquipmentBuilder,
  disposeBrewingEquipment,
  extractBrewingEquipment,
  registerBrewingEquipment,
  resolveSupportedYear,
  updateBrewingEquipment,
} from './brewingEquipmentBuilder';
export type { SupportedEraYear } from './brewingEquipmentBuilder';

export { BACK_BAR, ERA_LAYER_EPSILON } from './layout';

export { configuredCount, summarizeSpec } from './eraMeta';
export type { ApplianceSummary } from './eraMeta';

export type {
  BrewingApplianceSpec,
  BrewingEquipmentSpec,
  EraVariantBuilder,
  EraVariantContext,
} from './types';

export { buildEra1945Machines } from './variants/era1945';
export { buildEra1965Machines } from './variants/era1965';
export { buildEra1985Machines } from './variants/era1985';
export { buildEra2005Machines } from './variants/era2005';
export { buildEra2025Machines } from './variants/era2025';

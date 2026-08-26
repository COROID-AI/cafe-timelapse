/**
 * Tableware & Table Settings prop group.
 *
 * Public API for the `tableware` detail category of the Café Time Period
 * Timelapse. See ./README.md for the full integration guide.
 *
 * ```ts
 * import { registerTablewarePropGroup } from './cafe/props/tableware';
 * registerTablewarePropGroup(cafeScene); // registers under the 'tableware' key
 * cafeScene.applyEra(1985);
 * ```
 */

export {
  DEFAULT_ACTIVE_YEAR,
  POP_IN_DURATION_MS,
  POP_MAX_STAGGER_MS,
  POP_START_SCALE,
  POP_STAGGER_MS,
  TABLEWARE_PROP_GROUP,
  TABLEWARE_PROP_GROUP_KEY,
  TablewareRig,
  TablewareBuilder,
  disposeTableware,
  registerTablewarePropGroup,
  updateTableware,
} from './TablewareBuilder';

export { SUPPORTED_ERA_YEARS } from './meta';
export type { SupportedTablewareYear } from './meta';
export {
  configuredPieceCount,
  extractTableware,
  resolveSupportedTablewareYear,
  stampPresetMetadata,
  summarizeSpec,
} from './meta';
export type { PieceSummary, PresetMetadata } from './meta';

export {
  CLOTH_PAD_HEIGHT,
  DINING_TABLE_ANCHORS,
  SURFACE_LIFT,
  TABLE_COUNT,
  TABLE_MAX_REACH,
  TABLE_TOP_Y,
  tableSurfaceY,
} from './layout';

export { collectPopItems, createTableCluster, tagItem } from './dressing';

export type {
  EraVariantBuilder,
  EraVariantContext,
  TablewarePieceSpec,
  TablewareSpec,
} from './types';

export { buildEra1945Tableware } from './variants/era1945';
export { buildEra1965Tableware } from './variants/era1965';
export { buildEra1985Tableware } from './variants/era1985';
export { buildEra2005Tableware } from './variants/era2005';
export { buildEra2025Tableware } from './variants/era2025';

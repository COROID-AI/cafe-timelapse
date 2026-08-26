/**
 * Signage & Lighting prop group.
 *
 * Public API for the `signage` detail category of the Café Time Period
 * Timelapse. See ./README.md for the full integration guide — including how
 * the per-era ambient moods below coordinate with `EraTransitionController`'s
 * lerp targets.
 */

export {
  CROSSFADE_DURATION_MS,
  SIGNAGE_PROP_GROUP,
  SIGNAGE_PROP_GROUP_KEY,
  SUPPORTED_SIGNAGE_YEARS,
  SignageLightingBuilder,
  disposeSignageLighting,
  extractSignageLighting,
  registerSignageLighting,
  resolveSupportedYear,
  updateSignageLighting,
} from './SignageLightingBuilder';
export type { SupportedSignageYear } from './SignageLightingBuilder';

export { EAST_WINDOWS, SOUTH_WINDOWS, WALL, WINDOW_SIGN, FASCIA_SIGN, COUNTER_LIP, DOORWAY, CEILING_Y, ERA_LAYER_EPSILON } from './layout';

export { SIGNAGE_ERA_MOODS, hasDefinedMoodFields, resolveSignageMood, signageEraMood } from './moods';

export { SIGNAGE_ERA_YEARS } from './types';
export type {
  EraVariantBuilder,
  EraVariantContext,
  LightFixtureSpec,
  SignageAnimator,
  SignageElementSpec,
  SignageEraYear,
  SignageLightingSpec,
} from './types';

export { buildEra1945Signage } from './variants/era1945';
export { buildEra1965Signage } from './variants/era1965';
export { buildEra1985Signage } from './variants/era1985';
export { buildEra2005Signage } from './variants/era2005';
export { buildEra2025Signage } from './variants/era2025';

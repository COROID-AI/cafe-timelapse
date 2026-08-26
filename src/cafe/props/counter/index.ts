/**
 * Counter Technology prop group — manual till → contactless tap.
 *
 * Public API for the `counterTech` detail category of the Café Time Period
 * Timelapse. Registers under the `'counterTech'` key (mirroring the
 * {@link EraConfig.counterTech} section name).
 *
 * @example
 * ```ts
 * import { registerCounterTech } from './cafe/props/counter';
 * registerCounterTech(cafeScene, { autoDrive: false });
 * ```
 */

export {
  COUNTER_PROP_GROUP,
  COUNTER_PROP_GROUP_KEY,
  CROSSFADE_DURATION_MS,
  CounterTechBuilder,
  CounterTechRig,
  SUPPORTED_ERA_YEARS,
  disposeCounterTech,
  extractCounterTech,
  registerCounterTech,
  resolveSupportedYear,
  updateCounterTech,
} from './CounterTechBuilder';
export type { CounterRigOptions, SupportedEraYear } from './CounterTechBuilder';

export { MAX_DEVICE_HEIGHT_ABOVE_TOP, SERVICE_COUNTER } from './layout';

export { applySpecMetadata, summarizeSpec } from './eraMeta';
export type { DeviceSummary } from './eraMeta';

export type {
  CounterDeviceSpec,
  CounterTechSpec,
  EraAnimator,
  EraVariantBuilder,
  EraVariantContext,
} from './types';

export { buildEra1945Counter } from './variants/era1945';
export { buildEra1965Counter } from './variants/era1965';
export { buildEra1985Counter } from './variants/era1985';
export { buildEra2005Counter } from './variants/era2005';
export { buildEra2025Counter } from './variants/era2025';
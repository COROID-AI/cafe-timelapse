/**
 * Public surface of the `patrons` prop group.
 *
 * Usage (app shell / scene wiring):
 *
 * ```ts
 * import { registerPatronsPropGroup } from './cafe/props/patrons';
 * const patrons = registerPatronsPropGroup(cafeScene);
 * cafeScene.applyEra(1965);
 * ```
 *
 * The builder self-ticks its idle loops via requestAnimationFrame; headless
 * consumers (tests) can drive `builder.update(dt)` manually instead.
 */

import type { CafeScene } from '../../CafeScene';
import { PatronsBuilder } from './PatronsBuilder';

export { PatronsBuilder } from './PatronsBuilder';
export type { PatronIdleKind, HairStyleId, GadgetDeviceId } from './types';

/** Registry key — matches the `patrons` section of {@link EraConfig} 1:1. */
export const PATRONS_PROP_GROUP_KEY = 'patrons' as const;

/**
 * Builds the patrons group and registers it under the `'patrons'` key.
 * Returns the builder so callers can drive/inspect the idle loop directly
 * (e.g. `update`, `dispose`).
 */
export function registerPatronsPropGroup(host: CafeScene): PatronsBuilder {
  const builder = new PatronsBuilder();
  host.registerPropGroup(
    PATRONS_PROP_GROUP_KEY,
    () => builder.getGroup(),
    (config, context) => builder.applyEra(config, context),
  );
  return builder;
}
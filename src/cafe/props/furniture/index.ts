/**
 * Public surface of the `furniture` prop group.
 *
 * Usage (app shell / scene wiring):
 *
 * ```ts
 * import { registerFurniturePropGroup } from './cafe/props/furniture';
 * const furniture = registerFurniturePropGroup(cafeScene);
 * cafeScene.applyEra(1965);
 * ```
 *
 * The builder self-ticks its crossfade via requestAnimationFrame; headless
 * consumers (tests) can drive `builder.update(dt)` manually instead.
 */

import type { CafeScene } from '../../CafeScene';
import { FurnitureBuilder } from './FurnitureBuilder';

export { FurnitureBuilder } from './FurnitureBuilder';
export { resolveFurnitureEra } from './slice';
export type { ResolvedFurnitureEra } from './slice';
export { FURNITURE_SPECS, TABLE_ANCHORS, nearestFurnitureEra } from './specs';
export * from './types';

/** Registry key — matches the `furniture` section of {@link EraConfig} 1:1. */
export const FURNITURE_PROP_GROUP_KEY = 'furniture' as const;

/**
 * Builds the furniture group and registers it under the `'furniture'` key.
 * Returns the builder so callers can drive/inspect the crossfade directly
 * (e.g. `setTransitionSeconds`, `update`, `dispose`).
 */
export function registerFurniturePropGroup(host: CafeScene): FurnitureBuilder {
  const builder = new FurnitureBuilder();
  host.registerPropGroup(
    FURNITURE_PROP_GROUP_KEY,
    () => builder.getGroup(),
    (config, context) => builder.applyEra(config, context),
  );
  return builder;
}

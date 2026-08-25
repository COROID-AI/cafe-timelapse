/**
 * Public surface of the `posters` prop group.
 *
 * Usage (app shell / scene wiring):
 *
 * ```ts
 * import { registerPostersPropGroup } from './cafe/props/posters';
 * const posters = registerPostersPropGroup(cafeScene);
 * cafeScene.applyEra(1985);
 * ```
 *
 * The builder self-ticks its crossfade via requestAnimationFrame; headless
 * consumers (tests) can drive `builder.update(dt)` manually instead.
 */

import type { CafeScene } from '../../CafeScene';
import { PosterWallBuilder } from './PosterWallBuilder';

export { PosterWallBuilder } from './PosterWallBuilder';
export {
  POSTER_ERA_CONTENT,
} from './eraContent';
export { resolvePostersEra, postersSignature } from './resolvePosters';
export type { ResolvedPostersEra } from './resolvePosters';
export { WALL_SLOTS, assignSlots, getWallSlot } from './wallLayout';
export type { WallSlot, PosterWallName } from './wallLayout';
export { createPosterTexture } from './posterTextures';
export type { PaintedPoster } from './posterTextures';
export { placePosters, buildPosterEraSet } from './assemble';
export type { PosterSetBuild } from './assemble';
export * from './types';

/** Registry key — matches the `posters` section of {@link EraConfig} 1:1. */
export const POSTERS_PROP_GROUP_KEY = 'posters' as const;

/**
 * Builds the poster-wall group and registers it under the `'posters'` key.
 * Returns the builder so callers can drive/inspect the transition directly
 * (e.g. `setTransitionSeconds`, `update`, `dispose`).
 */
export function registerPostersPropGroup(host: CafeScene): PosterWallBuilder {
  const builder = new PosterWallBuilder();
  host.registerPropGroup(
    POSTERS_PROP_GROUP_KEY,
    () => builder.getGroup(),
    (config, context) => builder.applyEra(config, context),
  );
  return builder;
}

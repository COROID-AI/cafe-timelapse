/**
 * Public surface of the `menu` prop group.
 *
 * Usage (app shell / scene wiring):
 *
 * ```ts
 * import { registerMenuPropGroup } from './cafe/props/menu';
 * const menu = registerMenuPropGroup(cafeScene); // registers under 'menu'
 * cafeScene.applyEra(1965);                      // crossfades the board
 * ```
 *
 * The builder self-ticks its crossfade and the 2025 LCD specials animation
 * via requestAnimationFrame; headless consumers (tests) can drive
 * `builder.update(dt)` manually instead.
 */

import type { CafeScene } from '../../CafeScene';
import { MenuBoardBuilder, registerMenuPropGroup } from './MenuBoardBuilder';

export {
  MenuBoardBuilder,
  CROSSFADE_SECONDS,
  TICKER_SPEED,
  MENU_PROP_GROUP_KEY,
  MENU_PROP_GROUP,
  MenuBoardBuilderBuild,
  updateMenuBoard,
  registerMenuPropGroup,
  disposeMenuPropGroup,
  extractMenuBoard,
} from './MenuBoardBuilder';

export {
  MENU_ERA_YEARS,
  getMenuPreset,
  resolveNearestMenuEra,
  resolveRenderedRows,
} from './presets';
export type { MenuEraYear, PresetMenuRow } from './presets';

export { composeEraVariant } from './boards';
export type { EraVariantExtras } from './boards';

export type { MenuBoardPayload, MenuRowItem, MenuPriceRow, RenderedMenuRow } from './types';

/**
 * Convenience overload kept for symmetry with `registerFurniturePropGroup`:
 * builds + registers the group and returns the builder instance.
 */
export function registerMenu(host: CafeScene): MenuBoardBuilder {
  return registerMenuPropGroup(host);
}

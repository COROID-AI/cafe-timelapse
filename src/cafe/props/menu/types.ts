/**
 * Typed contracts for the `menu` prop group.
 *
 * The routed {@link EraConfig} `menu` section is deliberately loose
 * (`Record<string, unknown>` in the shell contract). These types describe the
 * payload this group reads out of it — shaped after `MenuBoardConfig` in
 * `src/cafe/eras/types.ts` so era-content tasks can drop their data straight
 * in. Every field is optional: absent payloads fall back to the built-in
 * period presets in `presets.ts`.
 */

/** One item rendered on the era's menu board. */
export interface MenuRowItem {
  /** Stable id linking the item to its price row. */
  id?: string;
  /** Human-readable item name, e.g. "Espresso". */
  label?: string;
  /** Optional category ("coffee", "tea", "food"…) — metadata only. */
  category?: string;
}

/** One price row, kept period-correct (old currency renderings welcome). */
export interface MenuPriceRow {
  /** References the matching {@link MenuRowItem.id}. */
  itemId?: string;
  /** Numeric amount in the era's smallest common unit (metadata only). */
  amount?: number;
  /** Period-correct rendering, e.g. "2d", "1/6", "48p", "£2.10". */
  display?: string;
}

/**
 * The menu-board slice this group understands. Matches the carrier field
 * name `menuBoard` used by the era configs in `src/cafe/eras/`.
 */
export interface MenuBoardPayload {
  /** e.g. "hand-chalked slate", "backlit plastic letters", "LCD panels". */
  boardStyle?: string;
  items?: MenuRowItem[];
  prices?: MenuPriceRow[];
  /** Era flavour line, e.g. "no oranges — still rationed". */
  specialsNote?: string;
}

/** One fully resolved row handed to the canvas painters and `userData`. */
export interface RenderedMenuRow {
  label: string;
  price: string;
}

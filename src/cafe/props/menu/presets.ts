/**
 * Built-in period menus — research-informed, deliberately concise.
 *
 * These presets guarantee every era always shows a plausible board (the era
 * stubs currently route empty `menu` sections). When real `menuBoard` data
 * lands in an era config, its items/prices overlay these rows (see
 * `resolveRenderedRows`), but the period styling below stays authoritative.
 *
 * Price notes:
 * - 1945/1965 UK: pre-decimal £sd. d = old penny (12 per shilling),
 *   1/6 = one shilling & sixpence, 2/- = two shillings.
 * - 1985 UK: decimal pence, early-80s café prices.
 * - 2005/2025: chain-café latte-era pricing.
 */

export const MENU_ERA_YEARS = [1945, 1965, 1985, 2005, 2025] as const;

export type MenuEraYear = (typeof MENU_ERA_YEARS)[number];

/** One preset row: item label plus its period-correct price rendering. */
export interface PresetMenuRow {
  id: string;
  label: string;
  price: string;
}

export interface MenuEraPreset {
  year: MenuEraYear;
  /** Debug/tooltip title stamped into `userData`. */
  title: string;
  /** Board material description from the era content contract. */
  boardStyle: string;
  /** Header line painted across the top of the board. */
  header: string;
  rows: PresetMenuRow[];
  specialsNote?: string;

  /* ---- visual direction for the canvas painters + mesh kit ---------- */
  size: { width: number; height: number };
  palette: {
    /** Board surface / paper / screen base. */
    face: string;
    /** Frame, housing or bezel. */
    trim: string;
    /** Item text. */
    ink: string;
    /** Price text (often a contrasting colour). */
    accent: string;
    /** Header band or brand colour. */
    band: string;
  };
  /** Period-appropriate web-safe font stacks. */
  fonts: { header: string; body: string };
  /** Emissive glow strength of the face (0 = dead matte). */
  glow: number;
}

const PRESETS: Record<MenuEraYear, MenuEraPreset> = {
  1945: {
    year: 1945,
    title: '1945 · hand-chalked slate',
    boardStyle: 'hand-chalked slate',
    header: 'HOT DRINKS & BUNS',
    rows: [
      { id: 'coffee', label: 'Coffee', price: '2d' },
      { id: 'tea', label: 'Tea', price: '1½d' },
      { id: 'bun', label: 'Bun', price: '3d' },
      { id: 'scone', label: 'Scone', price: '2d' },
      { id: 'cake', label: 'Cake Slice', price: '4d' },
    ],
    specialsNote: 'No oranges — still rationed',
    size: { width: 0.78, height: 0.62 },
    palette: {
      face: '#2c3136',
      trim: '#6e5638',
      ink: '#e8e4da',
      accent: '#f2e9b7',
      band: '#23272b',
    },
    fonts: {
      header: "italic bold 44px 'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive",
      body: "italic 40px 'Brush Script MT', 'Segoe Script', 'Comic Sans MS', cursive",
    },
    glow: 0,
  },
  1965: {
    year: 1965,
    title: '1965 · painted diner board',
    boardStyle: 'painted wooden board',
    header: 'KORNER KAFÉ  MENU',
    rows: [
      { id: 'espresso', label: 'Espresso', price: '1/6' },
      { id: 'milkshake', label: 'Milkshake', price: '2/-' },
      { id: 'tea', label: 'Tea', price: '9d' },
      { id: 'ham-roll', label: 'Ham Roll', price: '1/3' },
      { id: 'cola', label: 'Iced Cola', price: '10d' },
      { id: 'egg-chips', label: 'Egg & Chips', price: '3/6' },
    ],
    specialsNote: 'Formica fresh · jukebox inside',
    size: { width: 1.42, height: 0.88 },
    palette: {
      face: '#f3e9d2',
      trim: '#8a5a36',
      ink: '#33383f',
      accent: '#c73e2e',
      band: '#1f8a80',
    },
    fonts: {
      header: "bold 46px Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
      body: "bold 38px 'Trebuchet MS', Verdana, sans-serif",
    },
    glow: 0,
  },
  1985: {
    year: 1985,
    title: '1985 · backlit plastic-letter menu',
    boardStyle: 'backlit plastic letters',
    header: 'SNACK BAR MENU',
    rows: [
      { id: 'coffee', label: 'COFFEE', price: '25p' },
      { id: 'tea', label: 'TEA', price: '20p' },
      { id: 'cappuccino', label: 'CAPPUCCINO', price: '48p' },
      { id: 'hot-choc', label: 'HOT CHOCOLATE', price: '42p' },
      { id: 'bacon-bap', label: 'BACON BAP', price: '68p' },
      { id: 'jacket', label: 'JACKET POTATO', price: '£1.15' },
    ],
    specialsNote: 'Microwave hot in 2 mins!',
    size: { width: 1.78, height: 0.95 },
    palette: {
      face: '#101114',
      trim: '#b9bec4',
      ink: '#f4f4f0',
      accent: '#ffb347',
      band: '#17181c',
    },
    fonts: {
      header: "bold 46px 'Arial Black', Arial, Helvetica, sans-serif",
      body: "bold 34px Arial, Helvetica, sans-serif",
    },
    glow: 0.55,
  },
  2005: {
    year: 2005,
    title: '2005 · printed A-frame + wall menu',
    boardStyle: 'printed wall menu with modern branding',
    header: 'THE CORNER CAFÉ',
    rows: [
      { id: 'americano', label: 'Americano', price: '£1.60' },
      { id: 'latte', label: 'Caffè Latte', price: '£2.10' },
      { id: 'flat-white', label: 'Flat White', price: '£1.95' },
      { id: 'mocha', label: 'Caffè Mocha', price: '£2.30' },
      { id: 'panini', label: 'Toasted Panini', price: '£3.25' },
      { id: 'muffin', label: 'Blueberry Muffin', price: '£1.75' },
    ],
    specialsNote: "Today: Soup & Baguette £4.50",
    size: { width: 1.66, height: 0.94 },
    palette: {
      face: '#f5f1e6',
      trim: '#3d2b1f',
      ink: '#3a3630',
      accent: '#55684d',
      band: '#3d2b1f',
    },
    fonts: {
      header: "600 44px Verdana, Geneva, sans-serif",
      body: "32px Verdana, Geneva, sans-serif",
    },
    glow: 0.12,
  },
  2025: {
    year: 2025,
    title: '2025 · digital LCD menu',
    boardStyle: 'digital LCD screen',
    header: 'CORNER CAFÉ  ☕',
    rows: [
      { id: 'oat-flat-white', label: 'Oat Flat White', price: '£3.80' },
      { id: 'filter', label: 'Filter V60', price: '£3.40' },
      { id: 'matcha', label: 'Matcha Latte', price: '£4.50' },
      { id: 'cold-brew', label: 'Cold Brew', price: '£3.90' },
      { id: 'avo-toast', label: 'Avocado Toast', price: '£7.50' },
      { id: 'croissant', label: 'Almond Croissant', price: '£3.60' },
    ],
    specialsNote: 'Scan to order · collect at counter',
    size: { width: 2.0, height: 1.04 },
    palette: {
      face: '#0d1117',
      trim: '#101216',
      ink: '#f2f5f4',
      accent: '#58e0c0',
      band: '#131a1e',
    },
    fonts: {
      header: "600 52px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      body: "400 36px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
    },
    glow: 1.05,
  },
};

/** Chronology-safe accessor (year is compile-time constrained anyway). */
export function getMenuPreset(year: MenuEraYear): MenuEraPreset {
  return PRESETS[year];
}

/**
 * Maps any shell timeline year onto a rendered era variant. Years outside the
 * five supported stops (i.e. 2055, owned by another task) snap to the nearest
 * available era so the menu never vanishes mid-timeline.
 */
export function resolveNearestMenuEra<T extends number>(year: T): MenuEraYear {
  let best: MenuEraYear = 2025;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of MENU_ERA_YEARS) {
    const delta = Math.abs(candidate - year);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best;
}

/* ------------------------------------------------------------------------- */
/* Slice → rendered rows                                                      */
/* ------------------------------------------------------------------------- */

import type { MenuBoardPayload, RenderedMenuRow } from './types';

/**
 * Overlays a routed {@link MenuBoardPayload} onto a preset.
 *
 * - No payload (current era stubs) → preset rows verbatim.
 * - Payload items replace labels; payload prices are matched by `itemId`
 *   first, then by position; unmatched rows keep their preset rendering so
 *   partial era data can never blank the board.
 * - `specialsNote` and `boardStyle` pass straight through when present.
 */
export function resolveRenderedRows(
  preset: MenuEraPreset,
  payload: MenuBoardPayload | undefined,
): RenderedMenuRow[] {
  const source = preset.rows;
  if (!payload || (!payload.items?.length && !payload.prices?.length)) {
    return source.map((row) => ({ label: row.label, price: row.price }));
  }

  const priceByIdOrIndex = (index: number, itemId: string | undefined): string => {
    if (payload.prices?.length) {
      const byId =
        itemId !== undefined
          ? payload.prices.find((p) => p.itemId === itemId)
          : undefined;
      const match = byId ?? payload.prices[index];
      if (match?.display) return match.display;
    }
    return source[index]?.price ?? '';
  };

  if (payload.items?.length) {
    return payload.items.map((item, index) => ({
      label: item.label ?? source[index]?.label ?? '',
      price: priceByIdOrIndex(index, item.id ?? source[index]?.id),
    }));
  }

  // Prices only: re-render the preset labels with routed displays.
  return source.map((row, index) => ({
    label: row.label,
    price: priceByIdOrIndex(index, row.id),
  }));
}

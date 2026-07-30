/**
 * EraPalette.ts — era palette tokens for the six canonical years.
 *
 * Each era's visual identity is encoded as a single {@link EraPalette} object: a
 * curated set of colour tokens (primary, secondary, accent, wall, floor, wood,
 * metal, neon, chalkboard, ceramic, …) plus a derived light tint that mirrors
 * the era's colour temperature from {@link src/data/EraData.js}'s
 * LightingCategory.
 *
 * The palette is the *single key* the shared {@link MaterialFactory} and
 * {@link TextureFactory} are parameterised by, so every era task composes its
 * props against the same visual language. Designers of era content never pick
 * ad-hoc hex values — they ask the factories for `wood`, `metal`, `neon`, …
 * using the era's palette, guaranteeing cross-era consistency.
 *
 * All colours are hex numbers (e.g. `0x3a5a40`) so they drop straight into
 * Three.js materials without conversion.
 */
import { ERA_YEARS, type EraYear } from '../data/EraData.js';

/**
 * A complete, design-tokenised colour identity for one era.
 *
 * Tokens are intentionally specific to the asset categories the factories must
 * produce (wood grain, tile, wallpaper, neon, chalkboard, poster, ceramic) so
 * that {@link TextureFactory} and {@link MaterialFactory} can derive every
 * procedural surface from a palette without further input.
 */
export interface EraPalette {
  /** The era year this palette describes. */
  readonly year: EraYear;
  /** Human-readable era label (mirrors EraData.label). */
  readonly label: string;

  /** Primary signature hue (brand / dominant furniture tone). */
  readonly primary: number;
  /** Secondary supporting hue. */
  readonly secondary: number;
  /** Accent pop colour (neon / poster highlight). */
  readonly accent: number;

  /** Wall surface base colour. */
  readonly wall: number;
  /** Floor surface base colour. */
  readonly floor: number;
  /** Ceiling surface base colour. */
  readonly ceiling: number;
  /** Trim / moulding colour. */
  readonly trim: number;

  /** Wood tone for furniture, frames, paneling. */
  readonly wood: number;
  /** Secondary darker wood grain colour for veining. */
  readonly woodGrain: number;
  /** Metal tone for fixtures, machines, cutlery. */
  readonly metal: number;

  /** Neon / emissive glow colour. */
  readonly neon: number;
  /** Chalkboard slate base colour. */
  readonly chalkboard: number;
  /** Chalk / handwritten text colour on the chalkboard. */
  readonly chalk: number;

  /** Ceramic / cup / tableware colour. */
  readonly ceramic: number;
  /** Poster paper / lithograph substrate colour. */
  readonly paper: number;

  /**
   * A small ordered set of poster / advertisement swatches drawn from the
   * era's pop-culture palette, used by the poster texture generator.
   */
  readonly accentSwatches: readonly number[];

  /**
   * Light-source emissive tint derived from the era's colour temperature
   * (mirrors LightingCategory.colorTemperature, e.g. 2200K warm → amber).
   */
  readonly lightTint: number;

  /** Overall mood/saturation multiplier (0–1) for material roughness tuning. */
  readonly warmth: number;
}

// ---------------------------------------------------------------------------
// The six era palettes.
//
// Colours are curated from each era's EraData direction (architecture, posters,
// tableware, lighting, signage) so the palette is a faithful distillation of
// the brief rather than arbitrary choices. Hex values target the period's
// material reality:
//   1945 — cream plaster, forest-green trim, brass, wartime-lithograph reds
//   1965 — mahogany, chrome, diner red, hot-pink/electric-blue neon
//   1985 — rust-red brick, terracotta, dark oak, synthpop magenta/cyan/purple
//   2005 — reclaimed oak, polished concrete, blackened steel, edison amber
//   2025 — limewash white, warm stone, bronze, sage/terracotta biophilic
//   2055 — smart glass, pearl-graphite, iridescent graphene, bioluminescent
// ---------------------------------------------------------------------------

const PALETTE_1945: EraPalette = {
  year: 1945,
  label: 'Postwar Café',
  primary: 0x3a5a40,
  secondary: 0xb5883a,
  accent: 0xb23a2e,
  wall: 0xe8dcc0,
  floor: 0x9a958c,
  ceiling: 0xc8b896,
  trim: 0x33502f,
  wood: 0x8a5a2b,
  woodGrain: 0x5e3a18,
  metal: 0xb5883a,
  neon: 0xffa94d,
  chalkboard: 0x26342b,
  chalk: 0xf0ead8,
  ceramic: 0xf2e8d5,
  paper: 0xe8d9b8,
  accentSwatches: [0xb23a2e, 0x3a5a40, 0xb5883a, 0x6b4a2a],
  lightTint: 0xffa050,
  warmth: 0.9,
};

const PALETTE_1965: EraPalette = {
  year: 1965,
  label: 'Swinging Sixties Diner',
  primary: 0xd33b2e,
  secondary: 0x2f8f8f,
  accent: 0xe0a93b,
  wall: 0x4a2418,
  floor: 0x1a1a1a,
  ceiling: 0xcfc6b8,
  trim: 0xc8ccd0,
  wood: 0x4a2418,
  woodGrain: 0x2a140c,
  metal: 0xc8ccd0,
  neon: 0xff2d95,
  chalkboard: 0x2a1a1a,
  chalk: 0xf5f0e6,
  ceramic: 0xf0ece0,
  paper: 0xf5f2ea,
  accentSwatches: [0xff2d95, 0x2f8f8f, 0xe0a93b, 0xd33b2e],
  lightTint: 0xfff0d6,
  warmth: 0.65,
};

const PALETTE_1985: EraPalette = {
  year: 1985,
  label: 'Eighties Coffee Bar',
  primary: 0xc5308a,
  secondary: 0x36a0b0,
  accent: 0x7a3fb0,
  wall: 0x8a3b2a,
  floor: 0xb5643a,
  ceiling: 0xb8b0a4,
  trim: 0x4a2e1a,
  wood: 0x4a2e1a,
  woodGrain: 0x2c1a0e,
  metal: 0xb8bcc0,
  neon: 0xff3b8a,
  chalkboard: 0x1f2422,
  chalk: 0xf2f0e8,
  ceramic: 0xf4f2ec,
  paper: 0xf8f6f0,
  accentSwatches: [0xc5308a, 0x36a0b0, 0x7a3fb0, 0xe0a93b],
  lightTint: 0xfff0e0,
  warmth: 0.7,
};

const PALETTE_2005: EraPalette = {
  year: 2005,
  label: 'Third-Wave Coffeehouse',
  primary: 0x3a3a3a,
  secondary: 0x2a2f2a,
  accent: 0xe8a64a,
  wall: 0x9a6a3a,
  floor: 0x8a8682,
  ceiling: 0x4a4540,
  trim: 0x3a3a3a,
  wood: 0x9a6a3a,
  woodGrain: 0x6a4422,
  metal: 0x3a3a3a,
  neon: 0xffa94d,
  chalkboard: 0x1c1c1c,
  chalk: 0xf2ead8,
  ceramic: 0xd8c8b0,
  paper: 0xe6d8bc,
  accentSwatches: [0xe8a64a, 0x6a8a5a, 0x9a6a3a, 0x3a3a3a],
  lightTint: 0xffb070,
  warmth: 0.85,
};

const PALETTE_2025: EraPalette = {
  year: 2025,
  label: 'Contemporary Specialty Café',
  primary: 0x7a9080,
  secondary: 0xbcae9a,
  accent: 0xc06a4a,
  wall: 0xf0ece4,
  floor: 0xbcae9a,
  ceiling: 0xe0dcd4,
  trim: 0x8a6a3a,
  wood: 0xb08850,
  woodGrain: 0x8a6034,
  metal: 0x8a6a3a,
  neon: 0x6affb8,
  chalkboard: 0x1a1e22,
  chalk: 0xf6f4f0,
  ceramic: 0xe8e2d8,
  paper: 0xf4f2ec,
  accentSwatches: [0x7a9080, 0xc06a4a, 0x8a6a3a, 0x6affb8],
  lightTint: 0xfff4e6,
  warmth: 0.55,
};

const PALETTE_2055: EraPalette = {
  year: 2055,
  label: 'Future Smart Café',
  primary: 0x3bd0d0,
  secondary: 0x8a6aff,
  accent: 0x5affc0,
  wall: 0x2a3340,
  floor: 0x4a4e56,
  ceiling: 0x6a7080,
  trim: 0x9aa0c0,
  wood: 0x6a7080,
  woodGrain: 0x4a5060,
  metal: 0x9aa0c0,
  neon: 0x5affd0,
  chalkboard: 0x101418,
  chalk: 0x8afff0,
  ceramic: 0xd0d4dc,
  paper: 0x141820,
  accentSwatches: [0x5affc0, 0x8a6aff, 0x3bd0d0, 0xff5ab0],
  lightTint: 0xb08bff,
  warmth: 0.3,
};

/**
 * The complete, ordered map of era palettes, keyed by year. This is the
 * canonical palette registry consumed by every era-build task.
 */
export const ERA_PALETTES: Readonly<Record<EraYear, EraPalette>> = {
  1945: PALETTE_1945,
  1965: PALETTE_1965,
  1985: PALETTE_1985,
  2005: PALETTE_2005,
  2025: PALETTE_2025,
  2055: PALETTE_2055,
};

/** Ordered list of all six era palettes (chronological). */
export const ERA_PALETTE_LIST: readonly EraPalette[] = ERA_YEARS.map(
  (y) => ERA_PALETTES[y],
);

/**
 * Look up the {@link EraPalette} for a year. Throws on an unknown year so a
 * mistyped era fails loudly rather than silently rendering with defaults.
 */
export function getEraPalette(year: EraYear): EraPalette {
  const palette = ERA_PALETTES[year];
  if (!palette) throw new Error(`EraPalette: no palette for year ${year}.`);
  return palette;
}

// ---------------------------------------------------------------------------
// Small colour helpers shared by the factories.
// ---------------------------------------------------------------------------

/** Linearly interpolate two hex colours, returning the hex result. */
export function lerpColor(a: number, b: number, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar + (br - ar) * clamped);
  const g = Math.round(ag + (bg - ag) * clamped);
  const bl = Math.round(ab + (bb - ab) * clamped);
  return (r << 16) | (g << 8) | bl;
}

/** Darken a hex colour by a 0–1 amount (0 = unchanged, 1 = black). */
export function darken(color: number, amount: number): number {
  return lerpColor(color, 0x000000, amount);
}

/** Lighten a hex colour by a 0–1 amount (0 = unchanged, 1 = white). */
export function lighten(color: number, amount: number): number {
  return lerpColor(color, 0xffffff, amount);
}

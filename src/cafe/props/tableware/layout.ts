import { FURNITURE_SPECS, TABLE_ANCHORS } from '../furniture/specs';

/**
 * Shared placement constants for the tableware prop group.
 *
 * The dining tables themselves are owned by the furniture prop group; this
 * module derives every anchor from the furniture specs so both groups stay in
 * lockstep. Evidence (see `src/cafe/props/furniture/pieces.ts`): EVERY table
 * kind tops out at y = 0.74, and the 1945 `clothRound` tables add a draped
 * cloth pad 0.018 m thick. Furniture also jitters each table centre by up to
 * ±0.04 m per axis and tilts wartime tables slightly, which is why props are
 * kept inside a conservative reach below instead of hugging the table edge.
 */

/** Dining-table anchors, imported verbatim from the furniture specs. */
export const DINING_TABLE_ANCHORS = TABLE_ANCHORS;

/** Number of dressed dining tables (one tableware cluster per anchor). */
export const TABLE_COUNT = DINING_TABLE_ANCHORS.length;

/** World-space height of every furniture tabletop (metres). */
export const TABLE_TOP_Y = 0.74;

/** Thickness of the herringbone cloth pad on `clothRound` tables. */
export const CLOTH_PAD_HEIGHT = 0.018;

/**
 * Micro lift applied to every cluster so props stay clear of surface tilt
 * (wartime tables lean by up to ~0.014 rad → ≈4 mm at full reach).
 */
export const SURFACE_LIFT = 0.006;

/**
 * Per-era micro-offset (variant index × value) keeping coincident tabletop
 * stacks out of the same depth-buffer sliver while a pop-in plays.
 */
export const ERA_LAYER_EPSILON = 0.0007;

/**
 * Maximum horizontal distance of any tableware vertex from its table centre.
 *
 * Budget: smallest square diner top half-width 0.39 − furniture jitter 0.04 ≈
 * 0.35; round tops allow more. 0.33 keeps every prop safely on every table.
 */
export const TABLE_MAX_REACH = 0.33;

/** Which dining tables wear a cloth pad, per furniture era. */
const CLOTH_TABLES: ReadonlyMap<number, ReadonlySet<number>> = (() => {
  const map = new Map<number, ReadonlySet<number>>();
  for (const [yearKey, spec] of Object.entries(FURNITURE_SPECS)) {
    const cloth = new Set<number>();
    spec.tables.forEach((kind, index) => {
      if (kind === 'clothRound') cloth.add(index);
    });
    map.set(Number(yearKey), cloth);
  }
  return map;
})();

/**
 * World-space Y of the dressed surface for one dining table in one era —
 * tabletop height plus the cloth pad when that table wears one.
 */
export function tableSurfaceY(year: number, tableIndex: number): number {
  return TABLE_TOP_Y + (CLOTH_TABLES.get(year)?.has(tableIndex) ? CLOTH_PAD_HEIGHT : 0);
}

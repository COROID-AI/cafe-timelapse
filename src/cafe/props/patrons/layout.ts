/**
 * Shared placement constants + seat resolution for the `patrons` group.
 *
 * Dining seats mirror the furniture task's layout exactly (`TABLE_ANCHORS`,
 * per-era `chairs.anglesByTable`, and the per-style standoff distances used
 * by `furniture/assemble.ts`) so every figure lands precisely on a chair of
 * its own era, facing its table. The 1985 boombox patron perches on a
 * patrons-owned counter stool tucked against the machines back-bar line,
 * in floor space no table anchor or chair claims.
 */

import { FURNITURE_SPECS, TABLE_ANCHORS } from '../furniture/specs';
import type { PatronEraYear, PatronSeatRef } from './types';

/**
 * Standoff distance from table centre per chair family — mirrors the private
 * `SEAT_DISTANCE` map in `src/cafe/props/furniture/assemble.ts`.
 */
const SEAT_DISTANCE: Record<string, number> = {
  mismatchedWood: 0.52,
  chromeVinyl: 0.62,
  tubularPastel: 0.58,
  woodSteelCombo: 0.64,
  ergoShell: 0.56,
};

/** Seat height for dining chairs (chair seats sit at ~0.445–0.47 m). */
export const DINING_SEAT_Y = 0.46;

/** Seat height of the chrome counter stool (vinyl pad top). */
export const STOOL_SEAT_Y = 0.6825;

/** World-space tabletop height (furniture tops sit at ~0.72–0.758 m). */
export const TABLE_TOP_Y = 0.745;

/** Counter-stool perch for the 1985 boombox patron (faces the back-bar, −z). */
export const COUNTER_STOOL_SPOT = { x: 1.5, z: 1.62 } as const;

/** Second stool, just east of the perch, carrying the boombox. */
export const BOOMBOX_STOOL_SPOT = { x: 2.08, z: 1.62 } as const;

/** Resolved transform for one seat. */
export interface SeatPlacement {
  x: number;
  z: number;
  /** Yaw so the figure's local +z faces the table/back-bar. */
  yaw: number;
  seatY: number;
  /** Standoff used, for tabletop gadget placement (0 at the counter). */
  standOff: number;
  /** Table index when seated at a dining table, else null. */
  tableIndex: number | null;
}

/** Resolves where (and how high) a patron sits for the given era. */
export function resolveSeatPlacement(
  era: PatronEraYear,
  ref: PatronSeatRef,
): SeatPlacement {
  if (ref.kind === 'counterStool') {
    return {
      x: COUNTER_STOOL_SPOT.x,
      z: COUNTER_STOOL_SPOT.z,
      yaw: Math.PI, // Face the back-bar run (−z).
      seatY: STOOL_SEAT_Y,
      standOff: 0,
      tableIndex: null,
    };
  }

  const spec = FURNITURE_SPECS[era];
  const anchor = TABLE_ANCHORS[ref.table];
  const standOff = SEAT_DISTANCE[spec.chairs.style] ?? 0.56;
  const angles = spec.chairs.anglesByTable[ref.table];
  const angleDeg = angles[ref.chair % angles.length];
  const angle = (angleDeg * Math.PI) / 180;
  const px = anchor.x + Math.sin(angle) * standOff;
  const pz = anchor.z + Math.cos(angle) * standOff;

  return {
    x: px,
    z: pz,
    yaw: Math.atan2(anchor.x - px, anchor.z - pz),
    seatY: DINING_SEAT_Y,
    standOff,
    tableIndex: ref.table,
  };
}

/** Tabletop drop-point for a mounted gadget, in world space. */
export function resolveTableGadgetSpot(place: SeatPlacement): {
  x: number;
  z: number;
  yaw: number;
} {
  if (place.tableIndex === null) {
    return { x: place.x, z: place.z, yaw: place.yaw };
  }
  const anchor = TABLE_ANCHORS[place.tableIndex];
  const dx = place.x - anchor.x;
  const dz = place.z - anchor.z;
  const len = Math.hypot(dx, dz) || 1;
  const inset = place.standOff * 0.45;
  const x = anchor.x + (dx / len) * inset;
  const z = anchor.z + (dz / len) * inset;
  return { x, z, yaw: Math.atan2(place.x - x, place.z - z) };
}

/** Maps any shell timeline year (incl. 2055) onto the nearest rendered era. */
export function nearestPatronEra(year: number): PatronEraYear {
  let best: PatronEraYear = 2025;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of [1945, 1965, 1985, 2005, 2025] as const) {
    const delta = Math.abs(candidate - year);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best;
}

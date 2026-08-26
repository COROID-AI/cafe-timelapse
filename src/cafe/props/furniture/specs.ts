/**
 * Per-era furniture baselines plus the shared table layout.
 *
 * Layout anchors stay aligned across eras on purpose: the crossfade reads
 * best when each era's set occupies roughly the same footprint, with only
 * silhouette, material and décor changing underneath.
 */

import type { EraYear } from '../../types';
import type { FurnitureEraSpec, FurnitureEraYear } from './types';

/** Shared dining-table anchors, in metres (room is 12 × 10 m). */
export const TABLE_ANCHORS: ReadonlyArray<{ x: number; z: number }> = [
  { x: -3.9, z: -3.55 }, // 0 · south-west window
  { x: 0.0, z: -3.75 }, // 1 · centre-south window
  { x: 3.85, z: -3.4 }, // 2 · south-east window
  { x: -3.7, z: 0.6 }, // 3 · west mid
  { x: 3.7, z: 1.0 }, // 4 · east mid
  { x: 0.3, z: 1.7 }, // 5 · room centre
];

/** Maps any shell timeline year onto the closest dressed furniture era. */
export function nearestFurnitureEra(year: EraYear): FurnitureEraYear {
  let best: FurnitureEraYear = 1945;
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

/* ------------------------------------------------------------------------- */
/* Era specs                                                                  */
/* ------------------------------------------------------------------------- */

export const FURNITURE_SPECS: Record<FurnitureEraYear, FurnitureEraSpec> = {
  1945: {
    year: 1945,
    name: 'Wartime austerity',
    palette: ['#8a6a45', '#6b4a2f', '#b9b09a', '#4a4436'],
    tables: ['clothRound', 'roundWood', 'roundWood', 'clothRound', 'roundWood', 'roundWood'],
    chairs: {
      style: 'mismatchedWood',
      anglesByTable: [
        [212, 332],
        [188, 352],
        [218, 328],
        [138, 222, 318],
        [38, 158, 262],
        [28, 148, 272],
      ],
    },
    decor: ['doilies', 'blackoutCurtains', 'ragRug', 'doorMat'],
    flooring: 'worn strip boards with patchy rag rugs',
  },
  1965: {
    year: 1965,
    name: 'Formica diner',
    palette: ['#b3392f', '#2fa8a0', '#e8b23a', '#3a3f4a'],
    tables: [
      'formicaDiner',
      'formicaDiner',
      'formicaDiner',
      'formicaDiner',
      'formicaDiner',
      'formicaDiner',
    ],
    chairs: {
      style: 'chromeVinyl',
      anglesByTable: [
        [90, 270],
        [90, 270],
        [90, 270],
        [0, 180],
        [0, 180],
        [45, 225],
      ],
    },
    decor: ['checkerLino', 'jukeboxCorner', 'recordCrates'],
    flooring: 'red-and-cream checkerboard lino',
  },
  1985: {
    year: 1985,
    name: 'Pastel laminate & tubular steel',
    palette: ['#bfe3cf', '#f2cfd4', '#f6d8bd', '#8f9aa6'],
    tables: [
      'pastelLaminate',
      'pastelLaminate',
      'pastelLaminate',
      'pastelLaminate',
      'pastelLaminate',
      'pastelLaminate',
    ],
    chairs: {
      style: 'tubularPastel',
      anglesByTable: [
        [212, 332, 118],
        [188, 352, 82],
        [218, 328, 142],
        [138, 222, 318],
        [38, 158, 262],
        [28, 148, 272],
      ],
    },
    decor: ['ferns', 'neonAccents', 'pastelRug', 'ceramicVases'],
    flooring: 'pale lino with mint area rug',
  },
  2005: {
    year: 2005,
    name: 'Dark wood & brushed steel',
    palette: ['#4a4642', '#7d6a55', '#3a3f45', '#9c7b52'],
    tables: ['comboDark', 'comboDark', 'comboDark', 'comboDark', 'comboDark', 'comboDark'],
    chairs: {
      style: 'woodSteelCombo',
      anglesByTable: [
        [212, 332],
        [90, 270],
        [90, 270],
        [0, 180],
        [45, 225, 315],
        [90, 270],
      ],
    },
    decor: ['loungeSofa', 'wallFrames', 'graphiteRug'],
    flooring: 'dark-stained boards with graphite lounge rug',
  },
  2025: {
    year: 2025,
    name: 'Minimalist light oak',
    palette: ['#9db08b', '#d8b98a', '#efeae2', '#26262a'],
    tables: ['lightOak', 'lightOak', 'lightOak', 'lightOak', 'lightOak', 'lightOak'],
    chairs: {
      style: 'ergoShell',
      anglesByTable: [
        [212, 332],
        [188, 352, 82],
        [218, 328],
        [0, 180],
        [45, 225],
        [60, 180, 300],
      ],
    },
    decor: ['hangingPlants', 'chargingSpots', 'weaveRug', 'succulentPots'],
    flooring: 'light oak boards with natural-weave rug',
  },
} as const;

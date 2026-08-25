/**
 * Normalises the `furniture` section of the shell {@link EraConfig} into the
 * payload the builder consumes.
 *
 * Recognised slice keys (all optional):
 * - `colorPalette: string[]` — overrides the era's default accent palette
 *   (hex strings or CSS colour names).
 * - `flooring: string` — description of the floor covering; labels matching
 *   bare-board wording hide the era's rugs.
 * - `decor: { label }[]` — décor dressing list; the literal label "none"
 *   hides all décor pieces.
 * - `furniture: { label }[]` — piece list; labels are surfaced for tooling.
 *
 * Everything absent falls back to the built-in per-era spec, so stub configs
 * (`{}`) still produce complete, distinct sets.
 */

import { Color } from 'three';
import type { EraConfig } from '../../types';
import { FURNITURE_SPECS, nearestFurnitureEra } from './specs';
import type { FurnitureEraSpec, FurnitureEraYear } from './types';

export interface ResolvedFurnitureEra {
  /** Year exactly as requested on the timeline (may be undressed, e.g. 2055). */
  requestedYear: number;
  /** Closest dressed furniture year actually rendered. */
  year: FurnitureEraYear;
  spec: FurnitureEraSpec;
  /** Accent colours driving upholstery/laminates/rugs/neon. */
  palette: Color[];
  flooring: string;
  decorLabels: string[];
  pieceLabels: string[];
  /** True when `colorPalette` came from the era config rather than the spec. */
  paletteFromSlice: boolean;
}

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string') out.push(entry);
    else if (entry !== null && typeof entry === 'object' && typeof (entry as { label?: unknown }).label === 'string') {
      out.push((entry as { label: string }).label);
    }
  }
  return out;
}

function parsePalette(value: unknown): Color[] {
  if (!Array.isArray(value)) return [];
  const colors: Color[] = [];
  for (const entry of value) {
    if (typeof entry !== 'string' && typeof entry !== 'number') continue;
    try {
      colors.push(new Color(entry as string | number));
    } catch {
      // Ignore unparseable swatches; remaining entries still apply.
    }
  }
  return colors;
}

/** Resolves one era config into the concrete furniture payload. */
export function resolveFurnitureEra(config: EraConfig): ResolvedFurnitureEra {
  const requestedYear = config.year;
  const year = nearestFurnitureEra(requestedYear);
  const spec = FURNITURE_SPECS[year];
  const slice = (config.furniture ?? {}) as Record<string, unknown>;

  const slicePalette = parsePalette(slice.colorPalette);
  const palette = slicePalette.length > 0 ? slicePalette : spec.palette.map((hex) => new Color(hex));
  const flooring =
    typeof slice.flooring === 'string' && slice.flooring.trim().length > 0
      ? slice.flooring
      : spec.flooring;

  return {
    requestedYear,
    year,
    spec,
    palette,
    flooring,
    decorLabels: stringArray(slice.decor),
    pieceLabels: stringArray(slice.furniture),
    paletteFromSlice: slicePalette.length > 0,
  };
}

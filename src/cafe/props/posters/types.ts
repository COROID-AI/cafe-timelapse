/**
 * Typed contracts for the `posters` prop group.
 *
 * Geometry/layout baselines are keyed by era year, but the *content* (which
 * posters hang where, their titles and palettes) is driven by the `posters`
 * section of the shell {@link EraConfig} whenever that slice carries data.
 * Missing keys fall back to the built-in per-era catalogue in `eraContent.ts`,
 * so stub configs (`{}`) still produce complete, distinct wall art.
 */

import type { EraYear } from '../../types';

/** Years for which the poster builder dresses the walls. */
export type PosterEraYear = Extract<EraYear, 1945 | 1965 | 1985 | 2005 | 2025>;

/** Runtime list of {@link PosterEraYear} values. */
export const POSTER_ERA_YEARS: readonly PosterEraYear[] = [
  1945,
  1965,
  1985,
  2005,
  2025,
];

/** Maps any timeline year (including undressed ones such as 2055) to the closest dressed era. */
export function nearestPosterEra(year: number): PosterEraYear {
  if (year <= 1955) return 1945;
  if (year <= 1975) return 1965;
  if (year <= 1995) return 1985;
  if (year <= 2015) return 2005;
  return 2025;
}

/**
 * Canvas painter selection. Each style renders a period-plausible piece of
 * wall art from the spec's title/palette — all artwork is generated
 * procedurally, never sourced from real copyrighted images.
 */
export type PosterStyle =
  /* 1945 — wartime public information */
  | 'propagandaNotice'
  | 'rationingNotice'
  /* 1965 — pop culture */
  | 'popArtConcert'
  | 'bMoviePoster'
  | 'travelPoster'
  | 'shopAdvert'
  /* 1985 — neon & instant photos */
  | 'neonBandPoster'
  | 'arcadeAd'
  | 'filmAd'
  | 'polaroidPhoto'
  /* 2005 — glossy retail */
  | 'glossyOneSheet'
  | 'wifiSticker'
  | 'loyaltyCard'
  /* 2025 — minimal & connected */
  | 'minimalPrint'
  | 'qrEventPoster'
  | 'sustainabilityCert'
  /* Universal fallback for slice-provided entries */
  | 'framedNotice';

/**
 * One poster / advertisement / framed print.
 *
 * Palette convention: `[background, ink, accent, accent2?]` — hex strings or
 * CSS colour names. `size` is physical metres `[width, height]`.
 */
export interface PosterSpec {
  /** Stable id, mirrored onto the scene-graph node (`poster-${id}`). */
  id: string;
  style: PosterStyle;
  /** Big readable headline rendered onto the canvas texture. */
  title: string;
  subtitle?: string;
  /** Small supporting lines (dates, prices, disclaimers…). */
  lines?: string[];
  palette: string[];
  size: [number, number];
  /**
   * Preferred wall. Omit to let the layout assign the best free slot.
   * `'west-till'` targets the counter-side wall segment near the doorway.
   */
  wall?: 'north' | 'south' | 'east' | 'west' | 'west-till';
  /** Deterministic base tilt in degrees (hand-pinned look; 2005/2025 stay straight). */
  tiltDeg?: number;
}

/** Built-in per-era wall-art catalogue entry. */
export interface PosterEraContent {
  year: PosterEraYear;
  name: string;
  papers: PosterSpec[];
}

/** One spec bound to its concrete wall slot. */
export interface PosterPlacement {
  spec: PosterSpec;
  slotId: string;
}

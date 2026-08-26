/**
 * Normalises the `posters` section of the shell {@link EraConfig} into the
 * payload {@link PosterWallBuilder} consumes.
 *
 * Recognised slice keys (all optional):
 * - `posters: WallPoster[]` — era-content entries shaped like
 *   `src/cafe/eras/types.ts#WallPoster` (`label`/`headline`, `kind`, `brand`,
 *   `palette`, `placement`). When present, these REPLACE the built-in
 *   catalogue for that year so per-era content tasks can curate the walls.
 * - `wallFinish?: string` — wording like "faded paper" / "gloss paint" only
 *   annotates the resolved content; rendering stays canvas-generated.
 *
 * Everything absent falls back to the built-in per-era catalogue, so stub
 * configs (`{}`) still produce complete, distinct, thematically correct sets.
 */

import type { EraConfig } from '../../types';
import { POSTER_ERA_CONTENT } from './eraContent';
import { nearestPosterEra } from './types';
import type { PosterEraContent, PosterEraYear, PosterSpec, PosterStyle } from './types';

export interface ResolvedPostersEra {
  /** Timeline year exactly as requested (may be undressed, e.g. 2055). */
  requestedYear: number;
  /** Closest dressed poster era actually rendered. */
  year: PosterEraYear;
  /** Effective wall-art catalogue for the year. */
  content: PosterEraContent;
  /** True when the catalogue was synthesized from the era config slice. */
  fromSlice: boolean;
}

/** Maps free-text `kind` wording onto a canvas painter. */
function styleFromKind(kind: unknown): PosterStyle {
  const text = typeof kind === 'string' ? kind.toLowerCase() : '';
  if (/ration/.test(text)) return 'rationingNotice';
  if (/propaganda|public information|notice|safety|war/.test(text)) return 'propagandaNotice';
  if (/concert|gig|band|music|tour/.test(text)) return 'popArtConcert';
  if (/movie|film|cinema/.test(text)) return 'bMoviePoster';
  if (/travel|airline|railway|tourism/.test(text)) return 'travelPoster';
  if (/arcade|game/.test(text)) return 'arcadeAd';
  if (/polaroid|photo|snapshot/.test(text)) return 'polaroidPhoto';
  if (/sticker|wifi|wi-fi/.test(text)) return 'wifiSticker';
  if (/loyalty|stamp card|punch/.test(text)) return 'loyaltyCard';
  if (/certificate|award/.test(text)) return 'sustainabilityCert';
  if (/qr|event/.test(text)) return 'qrEventPoster';
  if (/art print|minimal/.test(text)) return 'minimalPrint';
  return 'framedNotice';
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'poster'
  );
}

const SLICE_SIZES: Array<[number, number]> = [
  [1.0, 1.35],
  [0.9, 1.2],
  [0.78, 1.05],
  [0.68, 0.92],
];

/** Builds specs from `WallPoster`-shaped slice entries. */
function specsFromSliceEntries(entries: unknown[]): PosterSpec[] {
  const specs: PosterSpec[] = [];
  entries.forEach((entry, i) => {
    if (entry === null || typeof entry !== 'object') return;
    const record = entry as Record<string, unknown>;

    const title =
      firstString(record.headline) ??
      firstString(record.label) ??
      firstString(record.brand) ??
      firstString(record.description);
    if (!title) return;
    const description = firstString(record.description);

    const palette = parsePalette(record.palette);
    const [width, height] = SLICE_SIZES[i % SLICE_SIZES.length];
    const id = `${slugify(firstString(record.id) ?? title)}-${i}`;

    specs.push({
      id,
      style: styleFromKind(record.kind),
      title,
      subtitle: firstString(record.brand) !== title ? firstString(record.brand) : undefined,
      lines: description && description !== title ? [description] : undefined,
      palette: palette.length > 0 ? palette : defaultPalette(styleFromKind(record.kind)),
      size: [width, height],
      wall: wallFromPlacement(record.placement),
      tiltDeg: /polaroid|photo|notice/i.test(String(record.kind ?? '')) ? ((i % 3) - 1) * 1.2 : undefined,
    });
  });
  return specs;
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

function parsePalette(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value) {
    if (typeof entry === 'string' && entry.trim().length > 0) out.push(entry.trim());
  }
  return out;
}

/** Era-flavoured default palettes for slice entries that carry none. */
function defaultPalette(style: PosterStyle): string[] {
  switch (style) {
    case 'propagandaNotice':
    case 'rationingNotice':
      return ['#e8ddc2', '#33291d', '#7a2f22', '#3f5a3a'];
    case 'popArtConcert':
      return ['#ffd23f', '#e73f6b', '#20b8c9', '#2b2140'];
    case 'neonBandPoster':
    case 'arcadeAd':
      return ['#0d0221', '#ff2ec4', '#00f0ff', '#faff00'];
    case 'glossyOneSheet':
      return ['#0b0d16', '#e5c76b', '#3d5a80', '#f5f5f5'];
    case 'minimalPrint':
      return ['#f4f1ea', '#c96f4a', '#7d8c6f', '#2f2b26'];
    default:
      return ['#f6f2e7', '#2e2a24', '#8a4a26', '#44506b'];
  }
}

function wallFromPlacement(placement: unknown): PosterSpec['wall'] | undefined {
  if (typeof placement !== 'string') return undefined;
  const text = placement.toLowerCase();
  if (/till|counter|register/.test(text)) return 'west-till';
  if (/north|kitchen|back/.test(text)) return 'north';
  if (/south|street|front|window/.test(text)) return 'south';
  if (/east|side street/.test(text)) return 'east';
  if (/west|door|entrance|photo/.test(text)) return 'west';
  return undefined;
}

/**
 * Resolves one era config into the concrete posters payload.
 * Slice-provided catalogues win; otherwise the built-in catalogue for the
 * nearest dressed era applies.
 */
export function resolvePostersEra(config: EraConfig): ResolvedPostersEra {
  const requestedYear = config.year;
  const year = nearestPosterEra(requestedYear);
  const slice = (config.posters ?? {}) as Record<string, unknown>;

  const rawPosters = slice.posters;
  const entries = Array.isArray(rawPosters) ? rawPosters : [];
  const sliced = specsFromSliceEntries(entries);

  if (sliced.length > 0) {
    return {
      requestedYear,
      year,
      fromSlice: true,
      content: { year, name: `${year} (from era config)`, papers: sliced },
    };
  }

  return {
    requestedYear,
    year,
    fromSlice: false,
    content: POSTER_ERA_CONTENT[year],
  };
}

/** Stable signature used to detect slice-driven catalogue changes. */
export function postersSignature(content: PosterEraContent): string {
  return content.papers.map((paper) => `${paper.id}|${paper.title}|${paper.style}`).join(';;');
}

import type * as THREE from 'three';
import type { SupportedTablewareYear } from './years';
import { SUPPORTED_ERA_YEARS } from './years';
import type { TablewarePieceSpec, TablewareSpec } from './types';

/**
 * Metadata plumbing shared by the era composers and the rig.
 *
 * Presets stamp their own catalogue; the rig later merges whatever the
 * `tableware` section of the routed era config contributed, so debug overlays
 * can always tell authored period data from built-in presets.
 */

export { SUPPORTED_ERA_YEARS };
export type { SupportedTablewareYear };

const SPEC_KEYS = ['pieces', 'servingStyle', 'napkinNote'] as const;

function isTablewareSpec(value: unknown): value is TablewareSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return SPEC_KEYS.some((key) => record[key] !== undefined);
}

/**
 * Reads the era's `tableware` payload out of the routed era-config section.
 *
 * Two layouts are accepted so the group survives either integration shape: a
 * carrier object (`{ tableware: {...} }`, matching the field name used by
 * `src/cafe/eras/types.ts`) or the spec keys directly on the section. Returns
 * `undefined` when neither is present (current era stubs), which makes every
 * composer fall back to its built-in period preset.
 */
export function extractTableware(section: unknown): TablewareSpec | undefined {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  const record = section as Record<string, unknown>;
  const carrier = record.tableware ?? record.tableSettings;
  if (isTablewareSpec(carrier)) return carrier;
  if (isTablewareSpec(record)) return record;
  return undefined;
}

/**
 * Maps any shell timeline year onto a rendered era variant. Years outside the
 * five supported stops (i.e. 2055, owned by another task) snap to the nearest
 * available era so the tabletops never disappear mid-timeline.
 */
export function resolveSupportedTablewareYear(year: number): SupportedTablewareYear {
  let best: SupportedTablewareYear = 2025;
  let bestDelta = Number.POSITIVE_INFINITY;
  for (const candidate of SUPPORTED_ERA_YEARS) {
    const delta = Math.abs(candidate - year);
    if (delta < bestDelta) {
      best = candidate;
      bestDelta = delta;
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * Catalogue summaries                                                 *
 * ------------------------------------------------------------------ */

export interface PieceSummary {
  label?: string;
  material?: string;
  pattern?: string;
  condition?: string;
}

function summarizePiece(piece: TablewarePieceSpec): PieceSummary {
  return {
    label: piece.label,
    material: piece.material,
    pattern: piece.pattern,
    condition: piece.condition,
  };
}

/** Flattens a tableware payload into a tooltip-friendly list. */
export function summarizeSpec(spec: TablewareSpec | undefined): PieceSummary[] {
  if (!spec?.pieces) return [];
  return spec.pieces.map(summarizePiece);
}

export interface PresetMetadata {
  year: number;
  title: string;
  pieceLabels: string[];
}

/** Stamps the built-in preset catalogue onto a variant group. */
export function stampPresetMetadata(group: THREE.Group, metadata: PresetMetadata): void {
  group.userData.eraYear = metadata.year;
  group.userData.eraTitle = metadata.title;
  group.userData.presetPieces = [...metadata.pieceLabels];
}

/**
 * Merges the era-config payload into a variant group's userData. Called on
 * every era application so late-arriving content stays in sync.
 */
export function applySpecMetadata(
  group: THREE.Group,
  spec: TablewareSpec | undefined,
): void {
  group.userData.configuredPieces = summarizeSpec(spec);
  group.userData.servingStyle = spec?.servingStyle ?? null;
  group.userData.napkinNote = spec?.napkinNote ?? null;
  group.userData.tablewareSectionPresent = spec !== undefined;
}

/**
 * Derives a duplicated-prop count from configured pieces whose label /
 * description / material mention any of `keywords`. Falls back to the preset
 * default when the era config carries no matching entry (the common case
 * while era stubs are empty).
 */
export function configuredPieceCount(
  spec: TablewareSpec | undefined,
  keywords: string[],
  fallback: number,
  max: number,
): number {
  const pieces = spec?.pieces;
  if (!pieces || pieces.length === 0) return fallback;
  const matched = pieces.filter((piece) => {
    const haystack =
      `${piece.label ?? ''} ${piece.description ?? ''} ${piece.material ?? ''}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  }).length;
  if (matched <= 0) return fallback;
  return Math.min(Math.max(matched, 1), max);
}

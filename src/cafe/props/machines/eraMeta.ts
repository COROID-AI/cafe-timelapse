import type * as THREE from 'three';
import type { BrewingApplianceSpec, BrewingEquipmentSpec } from './types';

/**
 * Metadata plumbing shared by the era composers and the rig.
 *
 * Presets stamp their own catalogue; the rig later merges whatever the
 * `brewingEquipment` section of the routed era config contributed, so debug
 * overlays can always tell authored period data from built-in presets.
 */

export interface ApplianceSummary {
  label?: string;
  kind?: string;
  brandModel?: string;
  powerSource?: string;
  placement?: string;
}

function summarizeAppliance(appliance: BrewingApplianceSpec): ApplianceSummary {
  return {
    label: appliance.label,
    kind: appliance.kind,
    brandModel: appliance.brandModel,
    powerSource: appliance.powerSource,
    placement: appliance.placement,
  };
}

/** Flattens a brewing-equipment payload into a tooltip-friendly list. */
export function summarizeSpec(spec: BrewingEquipmentSpec | undefined): ApplianceSummary[] {
  if (!spec) return [];
  const summaries = [
    ...(spec.espressoMachines ?? []),
    ...(spec.otherBrewers ?? []),
  ].map(summarizeAppliance);
  if (spec.grinder) {
    summaries.push({
      ...summarizeAppliance(spec.grinder),
      kind: spec.grinder.kind ?? 'grinder',
    });
  }
  return summaries;
}

export interface PresetMetadata {
  year: number;
  title: string;
  applianceLabels: string[];
}

/** Stamps the built-in preset catalogue onto a variant group. */
export function stampPresetMetadata(group: THREE.Group, metadata: PresetMetadata): void {
  group.userData.eraYear = metadata.year;
  group.userData.eraTitle = metadata.title;
  group.userData.presetAppliances = [...metadata.applianceLabels];
}

/**
 * Merges the era-config payload into a variant group's userData. Called on
 * every era application so late-arriving content stays in sync.
 */
export function applySpecMetadata(
  group: THREE.Group,
  spec: BrewingEquipmentSpec | undefined,
): void {
  group.userData.configuredAppliances = summarizeSpec(spec);
  group.userData.preparationNotes = spec?.preparationNotes ?? null;
  group.userData.brewingEquipmentSectionPresent = spec !== undefined;
}

/**
 * Derives a duplicated-prop count from configured appliances whose kind/label
 * mention any of `keywords`. Falls back to the preset default when the era
 * config carries no matching entry (the common case while era stubs are empty).
 */
export function configuredCount(
  spec: BrewingEquipmentSpec | undefined,
  keywords: string[],
  fallback: number,
  max: number,
): number {
  if (!spec) return fallback;
  const pool = [...(spec.espressoMachines ?? []), ...(spec.otherBrewers ?? [])];
  const matched = pool.filter((appliance) => {
    const haystack = `${appliance.kind ?? ''} ${appliance.label ?? ''} ${appliance.description ?? ''}`.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  }).length;
  if (matched <= 0) return fallback;
  return Math.min(Math.max(matched, 1), max);
}

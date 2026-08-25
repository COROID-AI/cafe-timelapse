import type * as THREE from 'three';
import type { CounterDeviceSpec, CounterTechSpec } from './types';

/**
 * Metadata plumbing shared by the era composers and the rig.
 *
 * Presets stamp their own catalogue; the rig later merges whatever the
 * `counterTech` section of the routed era config contributed, so debug
 * overlays can always tell authored period data from built-in presets.
 */

export interface DeviceSummary {
  label?: string;
  kind?: string;
  supportsPayment?: string[];
  placement?: string;
}

function summarizeDevice(device: CounterDeviceSpec): DeviceSummary {
  return {
    label: device.label,
    kind: device.kind,
    supportsPayment: device.supportsPayment,
    placement: device.placement,
  };
}

/** Flattens a counter-tech payload into a tooltip-friendly list. */
export function summarizeSpec(spec: CounterTechSpec | undefined): DeviceSummary[] {
  if (!spec) return [];
  const summaries: DeviceSummary[] = [];
  if (spec.till) summaries.push(summarizeDevice(spec.till));
  for (const device of spec.additionalDevices ?? []) summaries.push(summarizeDevice(device));
  return summaries;
}

export interface PresetMetadata {
  year: number;
  title: string;
  deviceLabels: string[];
  receiptMethod: string;
}

/** Stamps the built-in preset catalogue onto a variant group. */
export function stampPresetMetadata(group: THREE.Group, metadata: PresetMetadata): void {
  group.userData.eraYear = metadata.year;
  group.userData.eraTitle = metadata.title;
  group.userData.presetDevices = [...metadata.deviceLabels];
  group.userData.presetReceiptMethod = metadata.receiptMethod;
}

/**
 * Merges the era-config payload into a variant group's userData. Called on
 * every era application so late-arriving content stays in sync.
 */
export function applySpecMetadata(
  group: THREE.Group,
  spec: CounterTechSpec | undefined,
): void {
  group.userData.configuredDevices = summarizeSpec(spec);
  group.userData.receiptMethod = spec?.receiptMethod ?? null;
  group.userData.queueFlowNote = spec?.queueFlowNote ?? null;
  group.userData.counterTechSectionPresent = spec !== undefined;
}

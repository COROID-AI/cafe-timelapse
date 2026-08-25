import * as THREE from 'three';
import type { CafeScene } from '../../CafeScene';
import type { EraConfig, EraYear, PropBuildContext, PropGroupUpdater } from '../../types';
import { ERA_LAYER_EPSILON } from './layout';
import { applySpecMetadata } from './eraMeta';
import { disposeObjectTree } from './kit/geometries';
import type { BrewingEquipmentSpec, EraVariantBuilder } from './types';
import { buildEra1945Machines } from './variants/era1945';
import { buildEra1965Machines } from './variants/era1965';
import { buildEra1985Machines } from './variants/era1985';
import { buildEra2005Machines } from './variants/era2005';
import { buildEra2025Machines } from './variants/era2025';

/**
 * Prop-group key for the coffee machines & brewing equipment category.
 *
 * Matches the `machines` section name of the routed {@link EraConfig} 1:1, as
 * required by `CafeScene.registerPropGroup`.
 */
export const MACHINES_PROP_GROUP_KEY = 'machines' as const;

/** Era years this group renders procedural equipment for (2055 not in scope). */
export const SUPPORTED_ERA_YEARS = [1945, 1965, 1985, 2005, 2025] as const;

export type SupportedEraYear = (typeof SUPPORTED_ERA_YEARS)[number];

/** Duration of one era-to-era opacity crossfade, in milliseconds. */
export const CROSSFADE_DURATION_MS = 700;

/** Shown before any era has been applied. */
const DEFAULT_ACTIVE_YEAR: SupportedEraYear = 1945;

const VARIANT_BUILDERS: Record<SupportedEraYear, EraVariantBuilder> = {
  1945: buildEra1945Machines,
  1965: buildEra1965Machines,
  1985: buildEra1985Machines,
  2005: buildEra2005Machines,
  2025: buildEra2025Machines,
};

/* ------------------------------------------------------------------------- */
/* brewingEquipment payload extraction                                       */
/* ------------------------------------------------------------------------- */

const EQUIPMENT_KEYS = [
  'espressoMachines',
  'otherBrewers',
  'grinder',
  'preparationNotes',
] as const;

function isBrewingEquipmentSpec(value: unknown): value is BrewingEquipmentSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return EQUIPMENT_KEYS.some((key) => record[key] !== undefined);
}

/**
 * Reads the era's `brewingEquipment` payload out of the routed
 * {@link EraConfig} `machines` section.
 *
 * Two layouts are accepted so the group survives either integration shape:
 * a carrier object (`{ brewingEquipment: {...} }`, matching the field name
 * used by `src/cafe/eras/types.ts`) or the equipment keys directly on the
 * section. Returns `undefined` when neither is present (current era stubs),
 * which makes every composer fall back to its built-in period preset.
 */
export function extractBrewingEquipment(section: unknown): BrewingEquipmentSpec | undefined {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  const record = section as Record<string, unknown>;
  const carrier = record.brewingEquipment ?? record.equipment;
  if (isBrewingEquipmentSpec(carrier)) return carrier;
  if (isBrewingEquipmentSpec(record)) return record;
  return undefined;
}

/**
 * Maps any shell timeline year onto a rendered era variant. Years outside the
 * five supported stops (i.e. 2055, owned by another task) snap to the nearest
 * available era so the machines never disappear mid-timeline.
 */
export function resolveSupportedYear(year: EraYear): SupportedEraYear {
  let best: SupportedEraYear = 2025;
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

/* ------------------------------------------------------------------------- */
/* Crossfade machinery                                                       */
/* ------------------------------------------------------------------------- */

interface FadeEntry {
  material: THREE.MeshStandardMaterial;
  baseOpacity: number;
  baseTransparent: boolean;
}

interface EraVariant {
  year: SupportedEraYear;
  group: THREE.Group;
  /** Per-material opacity baselines captured once, before any fading. */
  fades: FadeEntry[];
}

interface ActiveFade {
  from: EraVariant;
  to: EraVariant;
  startedAt: number;
}

function pushFadeEntry(entries: FadeEntry[], seen: Set<THREE.MeshStandardMaterial>, material: THREE.Material): void {
  if (!(material instanceof THREE.MeshStandardMaterial)) return;
  if (seen.has(material)) return;
  seen.add(material);
  entries.push({
    material,
    baseOpacity: material.opacity,
    baseTransparent: material.transparent,
  });
}

function collectFadeEntries(group: THREE.Group): FadeEntry[] {
  const entries: FadeEntry[] = [];
  const seen = new Set<THREE.MeshStandardMaterial>();
  group.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) pushFadeEntry(entries, seen, material);
  });
  return entries;
}

function applyOpacity(entries: FadeEntry[], factor: number): void {
  for (const entry of entries) {
    // Transparency toggling is render-state only in three.js — no shader
    // recompile — so flipping it per frame is cheap.
    entry.material.transparent = true;
    entry.material.opacity = entry.baseOpacity * factor;
  }
}

function restoreEntries(entries: FadeEntry[]): void {
  for (const entry of entries) {
    entry.material.opacity = entry.baseOpacity;
    entry.material.transparent = entry.baseTransparent;
  }
}

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

/* ------------------------------------------------------------------------- */
/* Rig                                                                       */
/* ------------------------------------------------------------------------- */

/**
 * Owns the five procedural era variants and animates crossfades between any
 * pair of them.
 *
 * Crossfade strategy: both variants stay mounted at the same back-bar spot;
 * the outgoing group eases to opacity 0 while the incoming group eases in,
 * then the outgoing group is hidden entirely. Interrupting transitions simply
 * finalises the previous fade first, so slider spam produces clean chained
 * results instead of blended soup.
 */
class MachinesRig {
  readonly root = new THREE.Group();

  private readonly variants = new Map<SupportedEraYear, EraVariant>();
  private active: EraVariant;
  private fade: ActiveFade | null = null;
  private rafId: number | null = null;

  constructor(initialYear: SupportedEraYear, initialSpec?: BrewingEquipmentSpec) {
    this.root.name = 'brewing-equipment';
    this.root.userData.propGroup = MACHINES_PROP_GROUP_KEY;
    this.root.userData.strategy = 'crossfade';
    this.root.userData.supportedYears = [...SUPPORTED_ERA_YEARS];

    let index = 0;
    for (const year of SUPPORTED_ERA_YEARS) {
      const built = VARIANT_BUILDERS[year]({ spec: year === initialYear ? initialSpec : undefined });
      // Micro-offset per variant so coincident back-bar surfaces never
      // z-fight while two eras blend.
      built.position.x += index * ERA_LAYER_EPSILON;
      built.position.y += index * ERA_LAYER_EPSILON;
      built.visible = year === initialYear;
      this.root.add(built);
      this.variants.set(year, { year, group: built, fades: collectFadeEntries(built) });
      index += 1;
    }

    const initial = this.variants.get(initialYear);
    if (!initial) throw new Error(`Machines rig missing variant for ${initialYear}.`);
    this.active = initial;
    applySpecMetadata(initial.group, initialSpec);
    this.applyShadowFlags();
  }

  /** Era currently shown (or fading in). */
  get activeYear(): SupportedEraYear {
    return this.active.year;
  }

  /**
   * Clears forced shadow casting on translucent/emissive surfaces.
   * `CafeScene.registerPropGroup` switches shadows ON for every mesh after
   * the builder returns, so glass panes, screens, LEDs and gas flames opt
   * back out here (idempotent).
   */
  applyShadowFlags(): void {
    this.root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.userData.glowSurface === true || mesh.userData.noCastShadow === true) {
        mesh.castShadow = false;
      }
    });
  }

  /** Applies one era config: metadata refresh plus crossfade when needed. */
  applyEra(config: EraConfig): void {
    const spec = extractBrewingEquipment(config.machines);
    const target = this.variants.get(resolveSupportedYear(config.year));
    if (!target) return;

    applySpecMetadata(target.group, spec);
    this.root.userData.activeYear = target.year;
    this.root.userData.activeTitle = target.group.userData.eraTitle ?? null;

    if (target === this.active && !this.fade) return;
    this.startCrossfade(target);
  }

  dispose(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.finishFade();
    for (const variant of this.variants.values()) disposeObjectTree(variant.group);
    this.variants.clear();
  }

  private startCrossfade(target: EraVariant): void {
    // Finalise any in-flight transition so arbitrary era pairs chain cleanly.
    this.finishFade();
    const from = this.active;
    if (from === target) return;

    from.group.visible = true;
    target.group.visible = true;
    this.fade = { from, to: target, startedAt: nowMs() };
    this.active = target;
    this.ensureAnimating();
  }

  private ensureAnimating(): void {
    if (this.rafId !== null || !this.fade) return;
    if (typeof requestAnimationFrame !== 'function') {
      // Non-browser environment: settle instantly instead of freezing.
      this.finishFade();
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (): void => {
    this.rafId = null;
    const fade = this.fade;
    if (!fade) return;
    const progress = Math.min(Math.max((nowMs() - fade.startedAt) / CROSSFADE_DURATION_MS, 0), 1);
    if (progress >= 1) {
      this.finishFade();
      return;
    }
    this.setProgress(fade, progress);
    this.rafId = requestAnimationFrame(this.tick);
  };

  private setProgress(fade: ActiveFade, progress: number): void {
    const eased = progress * progress * (3 - 2 * progress); // smoothstep
    applyOpacity(fade.from.fades, 1 - eased);
    applyOpacity(fade.to.fades, eased);
  }

  private finishFade(): void {
    const fade = this.fade;
    if (!fade) return;
    this.setProgress(fade, 1);
    fade.from.group.visible = false;
    restoreEntries(fade.from.fades);
    restoreEntries(fade.to.fades);
    this.fade = null;
  }
}

/* ------------------------------------------------------------------------- */
/* Registration surface                                                      */
/* ------------------------------------------------------------------------- */

const rigs = new WeakMap<object, MachinesRig>();

function requireRig(host: object): MachinesRig {
  const rig = rigs.get(host);
  if (!rig) {
    throw new Error(
      'No brewing-equipment rig for this host — build it first via BrewingEquipmentBuilder / registerBrewingEquipment().',
    );
  }
  return rig;
}

function scheduleShadowFix(rig: MachinesRig): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => rig.applyShadowFlags());
  }
  // Environments without microtasks still converge: every applyEra call
  // re-runs applyShadowFlags idempotently.
}

/**
 * PropGroupBuilder for the `machines` detail category.
 *
 * Builds ALL five era line-ups up front (they share the same back-bar slot)
 * and pre-selects the host's current era when one was applied before
 * registration, otherwise 1945.
 */
export const BrewingEquipmentBuilder = (context: PropBuildContext): THREE.Group => {
  const current = context.host.currentEra;
  const initialYear = current ? resolveSupportedYear(current.year) : DEFAULT_ACTIVE_YEAR;
  const initialSpec = current ? extractBrewingEquipment(current.machines) : undefined;
  const rig = new MachinesRig(initialYear, initialSpec);
  rigs.set(context.host, rig);
  scheduleShadowFix(rig);
  return rig.root;
};

/** PropGroupUpdater for the `machines` detail category. */
export const updateBrewingEquipment: PropGroupUpdater = (config, context) => {
  requireRig(context.host).applyEra(config);
};

/**
 * Convenience wiring: registers the brewing-equipment group under the
 * `machines` key on a CafeScene. Returns the host for chaining.
 */
export function registerBrewingEquipment(host: CafeScene): CafeScene {
  host.registerPropGroup(MACHINES_PROP_GROUP_KEY, BrewingEquipmentBuilder, updateBrewingEquipment);
  return host;
}

/**
 * Tears the rig down (cancels animations, disposes geometry/materials) and
 * unregisters the group. Returns false when nothing was registered.
 */
export function disposeBrewingEquipment(host: CafeScene): boolean {
  const rig = rigs.get(host);
  if (!rig) return false;
  rigs.delete(host);
  rig.dispose();
  host.unregisterPropGroup(MACHINES_PROP_GROUP_KEY);
  return true;
}

/** Declarative descriptor for registry-style integrations. */
export const MACHINES_PROP_GROUP = {
  key: MACHINES_PROP_GROUP_KEY,
  build: BrewingEquipmentBuilder,
  update: updateBrewingEquipment,
} as const;

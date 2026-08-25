import * as THREE from 'three';
import type { CafeScene } from '../../CafeScene';
import type { EraConfig, PropBuildContext, PropGroupUpdater } from '../../types';
import { applySpecMetadata } from './eraMeta';
import { ERA_LAYER_EPSILON } from './layout';
import { disposeObjectTree } from './kit/geometries';
import type { CounterTechSpec, EraAnimator, EraVariantBuilder } from './types';
import { buildEra1945Counter } from './variants/era1945';
import { buildEra1965Counter } from './variants/era1965';
import { buildEra1985Counter } from './variants/era1985';
import { buildEra2005Counter } from './variants/era2005';
import { buildEra2025Counter } from './variants/era2025';

/**
 * Counter technology prop group — manual till → contactless.
 *
 * Public API for the `counterTech` detail category of the Café Time Period
 * Timelapse. The rig pre-builds all five procedural era checkouts at the
 * service-counter slot and crossfades between any pair of them; small idle
 * details (crank turn, drawer pop, total flag pop-up, VFD flicker, LED
 * blinks, tablet swivel, tap-reader glow) keep the active era alive between
 * swaps.
 */

/** Prop-group key for the counter technology category. */
export const COUNTER_PROP_GROUP_KEY = 'counterTech' as const;

/** Era years this group renders procedural checkout tech for (2055 not in scope). */
export const SUPPORTED_ERA_YEARS = [1945, 1965, 1985, 2005, 2025] as const;

export type SupportedEraYear = (typeof SUPPORTED_ERA_YEARS)[number];

/** Duration of one era-to-era opacity crossfade, in milliseconds. */
export const CROSSFADE_DURATION_MS = 700;

/** Shown before any era has been applied. */
const DEFAULT_ACTIVE_YEAR: SupportedEraYear = 1945;

const VARIANT_BUILDERS: Record<SupportedEraYear, EraVariantBuilder> = {
  1945: buildEra1945Counter,
  1965: buildEra1965Counter,
  1985: buildEra1985Counter,
  2005: buildEra2005Counter,
  2025: buildEra2025Counter,
};

/* ------------------------------------------------------------------------- */
/* counterTech payload extraction                                            */
/* ------------------------------------------------------------------------- */

const SPEC_KEYS = ['till', 'additionalDevices', 'receiptMethod', 'queueFlowNote'] as const;

function isCounterTechSpec(value: unknown): value is CounterTechSpec {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return SPEC_KEYS.some((key) => record[key] !== undefined);
}

/**
 * Reads the era's `counterTech` payload out of the routed {@link EraConfig}
 * `counterTech` section.
 *
 * Two layouts are accepted so the group survives either integration shape:
 * a carrier object (`{ counterTech: {...} }`, matching the field name used
 * by `src/cafe/eras/types.ts`) or the device keys directly on the section.
 * Returns `undefined` when neither is present (current era stubs), which
 * makes every composer fall back to its built-in period preset.
 */
export function extractCounterTech(section: unknown): CounterTechSpec | undefined {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  const record = section as Record<string, unknown>;
  const carrier = record.counterTech ?? record.tech;
  if (isCounterTechSpec(carrier)) return carrier;
  if (isCounterTechSpec(record)) return record;
  return undefined;
}

/**
 * Maps any timeline year onto a rendered era variant. Years outside the five
 * supported stops (e.g. 2055, owned by another task, or anything further out)
 * snap to the nearest available era so the checkout tech never disappears
 * mid-timeline.
 */
export function resolveSupportedYear(year: number): SupportedEraYear {
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
  animators: EraAnimator[];
}

interface ActiveFade {
  from: EraVariant;
  to: EraVariant;
  progressMs: number;
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

function collectAnimators(group: THREE.Group): EraAnimator[] {
  const attached = group.userData.animators as EraAnimator[] | undefined;
  return attached ? [...attached] : [];
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

export interface CounterRigOptions {
  /**
   * Drive crossfades AND idle animations from an internal
   * requestAnimationFrame loop. Defaults to true; pass false in deterministic
   * environments (tests) and step the rig via {@link CounterTechRig.update}
   * with a fixed delta instead.
   */
  autoDrive?: boolean;
}

/**
 * Owns the five procedural era variants and animates crossfades between any
 * pair of them.
 *
 * Crossfade strategy: both variants stay mounted at the same service-counter
 * spot; the outgoing group eases to opacity 0 while the incoming group eases
 * in, then the outgoing group is hidden entirely. Interrupting transitions
 * simply finalise the previous fade first, so slider spam produces clean
 * chained results instead of blended soup.
 */
export class CounterTechRig {
  readonly root = new THREE.Group();

  private readonly variants = new Map<SupportedEraYear, EraVariant>();
  private readonly autoDrive: boolean;
  private readonly idleClock: { elapsed: number };
  private active: EraVariant;
  private fade: ActiveFade | null = null;
  private rafId: number | null = null;
  private lastTickMs = 0;

  constructor(
    initialYear: SupportedEraYear,
    initialSpec?: CounterTechSpec,
    options?: CounterRigOptions,
  ) {
    this.autoDrive = options?.autoDrive ?? true;
    this.idleClock = { elapsed: 0 };

    this.root.name = 'counter-tech';
    this.root.userData.propGroup = COUNTER_PROP_GROUP_KEY;
    this.root.userData.strategy = 'crossfade';
    this.root.userData.supportedYears = [...SUPPORTED_ERA_YEARS];

    let index = 0;
    for (const year of SUPPORTED_ERA_YEARS) {
      const built = VARIANT_BUILDERS[year]({ spec: year === initialYear ? initialSpec : undefined });
      // Micro-offset per variant so coincident counter surfaces never
      // z-fight while two eras blend.
      built.position.x += index * ERA_LAYER_EPSILON;
      built.position.y += index * ERA_LAYER_EPSILON;
      built.visible = year === initialYear;
      this.root.add(built);
      this.variants.set(year, {
        year,
        group: built,
        fades: collectFadeEntries(built),
        animators: collectAnimators(built),
      });
      index += 1;
    }

    const initial = this.variants.get(initialYear);
    if (!initial) throw new Error(`Counter rig missing variant for ${initialYear}.`);
    this.active = initial;
    applySpecMetadata(initial.group, initialSpec);
    this.root.userData.activeYear = initial.year;
    this.root.userData.activeTitle = initial.group.userData.eraTitle ?? null;
    this.applyShadowFlags();

    // Start the perpetual driver so idle details live even between swaps.
    if (this.autoDrive) this.ensureRafScheduled();
  }

  /** Era currently shown (or fading in). */
  get activeYear(): SupportedEraYear {
    return this.active.year;
  }

  /**
   * Clears forced shadow casting on translucent/emissive surfaces.
   * `CafeScene.registerPropGroup` switches shadows ON for every mesh after
   * the builder returns, so screens, LEDs and glow rings opt back out here
   * (idempotent).
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
    const spec = extractCounterTech(config.counterTech);
    const target = this.variants.get(resolveSupportedYear(config.year));
    if (!target) return;

    applySpecMetadata(target.group, spec);
    this.root.userData.activeYear = target.year;
    this.root.userData.activeTitle = target.group.userData.eraTitle ?? null;

    if (target === this.active && !this.fade) return;
    this.startCrossfade(target);
  }

  /**
   * Advances one frame: crossfade progress plus the idle animations of every
   * currently visible variant. Safe to call manually with a fixed delta in
   * tests; the internal rAF loop calls it with real deltas when auto-driving.
   */
  update(deltaSeconds: number): void {
    const dt = Math.min(Math.max(deltaSeconds, 0), 0.25);
    this.idleClock.elapsed += dt;

    // Animate whichever variants can be seen right now.
    const visible = this.fade ? [this.fade.from, this.fade.to] : [this.active];
    for (const variant of visible) {
      for (const animator of variant.animators) {
        animator(this.idleClock.elapsed, dt);
      }
    }

    const fade = this.fade;
    if (fade) {
      fade.progressMs += dt * 1000;
      if (fade.progressMs >= CROSSFADE_DURATION_MS) {
        this.finishFade();
        return;
      }
      const easedT = fade.progressMs / CROSSFADE_DURATION_MS;
      const eased = easedT * easedT * (3 - 2 * easedT); // smoothstep
      applyOpacity(fade.from.fades, 1 - eased);
      applyOpacity(fade.to.fades, eased);
    }
  }

  dispose(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.fade = null;
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
    this.fade = { from, to: target, progressMs: 0 };
    this.active = target;
    if (this.autoDrive) this.lastTickMs = nowMs();
  }

  private ensureRafScheduled(): void {
    if (this.rafId !== null) return;
    if (typeof requestAnimationFrame !== 'function') {
      // Non-browser environment without rAF: nothing self-drives; callers
      // (tests) advance the rig deterministically via update().
      return;
    }
    this.rafId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (): void => {
    this.rafId = null;
    const now = nowMs();
    const deltaSeconds = Math.min(Math.max((now - this.lastTickMs) / 1000, 0), 0.25);
    this.lastTickMs = now;
    this.update(deltaSeconds);
    // Keep ticking forever while driving: the idle animations run even
    // between era changes (that is their point).
    this.ensureRafScheduled();
  };

  private finishFade(): void {
    const fade = this.fade;
    if (!fade) return;
    applyOpacity(fade.to.fades, 1);
    fade.from.group.visible = false;
    restoreEntries(fade.from.fades);
    restoreEntries(fade.to.fades);
    this.fade = null;
  }
}

/* ------------------------------------------------------------------------- */
/* Registration surface                                                      */
/* ------------------------------------------------------------------------- */

const rigs = new WeakMap<object, CounterTechRig>();
const pendingOptions = new WeakMap<object, CounterRigOptions>();

function requireRig(host: object): CounterTechRig {
  const rig = rigs.get(host);
  if (!rig) {
    throw new Error(
      'No counter-tech rig for this host — build it first via CounterTechBuilder / registerCounterTech().',
    );
  }
  return rig;
}

function scheduleShadowFix(rig: CounterTechRig): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => rig.applyShadowFlags());
  }
  // Environments without microtasks still converge: every applyEra call
  // re-runs applyShadowFlags idempotently.
}

/**
 * PropGroupBuilder for the `counterTech` detail category.
 *
 * Builds ALL five era checkouts up front (they share the same service-counter
 * slot) and pre-selects the host's current era when one was applied before
 * registration, otherwise 1945.
 */
export const CounterTechBuilder = (context: PropBuildContext): THREE.Group => {
  const current = context.host.currentEra;
  const initialYear = current ? resolveSupportedYear(current.year) : DEFAULT_ACTIVE_YEAR;
  const initialSpec = current ? extractCounterTech(current.counterTech) : undefined;
  const options = pendingOptions.get(context.host);
  pendingOptions.delete(context.host);
  const rig = new CounterTechRig(initialYear, initialSpec, options);
  rigs.set(context.host, rig);
  scheduleShadowFix(rig);
  return rig.root;
};

/** PropGroupUpdater for the `counterTech` detail category. */
export const updateCounterTech: PropGroupUpdater = (config, context) => {
  requireRig(context.host).applyEra(config);
};

/**
 * Convenience wiring: registers the counter-tech group under the
 * `counterTech` key on a CafeScene and returns the live rig so callers (e.g.
 * tests or debug tooling) can inspect or step it directly.
 */
export function registerCounterTech(host: CafeScene, options?: CounterRigOptions): CounterTechRig {
  if (options) pendingOptions.set(host, options);
  host.registerPropGroup(COUNTER_PROP_GROUP_KEY, CounterTechBuilder, updateCounterTech);
  return requireRig(host);
}

/**
 * Tears the rig down (cancels animations, disposes geometry/materials) and
 * unregisters the group. Returns false when nothing was registered.
 */
export function disposeCounterTech(host: CafeScene): boolean {
  const rig = rigs.get(host);
  if (!rig) return false;
  rigs.delete(host);
  rig.dispose();
  host.unregisterPropGroup(COUNTER_PROP_GROUP_KEY);
  return true;
}

/** Declarative descriptor for registry-style integrations. */
export const COUNTER_PROP_GROUP = {
  key: COUNTER_PROP_GROUP_KEY,
  build: CounterTechBuilder,
  update: updateCounterTech,
} as const;

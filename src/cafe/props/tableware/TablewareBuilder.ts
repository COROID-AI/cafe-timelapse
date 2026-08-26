import * as THREE from 'three';
import type { CafeScene } from '../../CafeScene';
import type { EraConfig, PropBuildContext, PropGroupUpdater } from '../../types';
import { ERA_LAYER_EPSILON } from './layout';
import {
  SUPPORTED_ERA_YEARS,
  applySpecMetadata,
  extractTableware,
  resolveSupportedTablewareYear,
} from './meta';
import type { SupportedTablewareYear } from './meta';
import { disposeObjectTree } from './kit/geometries';
import type { EraVariantBuilder, TablewareSpec } from './types';
import { buildEra1945Tableware } from './variants/era1945';
import { buildEra1965Tableware } from './variants/era1965';
import { buildEra1985Tableware } from './variants/era1985';
import { buildEra2005Tableware } from './variants/era2005';
import { buildEra2025Tableware } from './variants/era2025';

/**
 * Prop-group key for the tabletop tableware category.
 *
 * Matches the `tableware` section name of the routed era config 1:1, as
 * required by `CafeScene.registerPropGroup`.
 */
export const TABLEWARE_PROP_GROUP_KEY = 'tableware' as const;

/** Shown before any era has been applied. */
export const DEFAULT_ACTIVE_YEAR: SupportedTablewareYear = 1945;

/* ------------------------------------------------------------------------- */
/* Pop-in tuning (the "delight" layer over the instant swap)                  */
/* ------------------------------------------------------------------------- */

/** Duration of one item's scale pop, in milliseconds. */
export const POP_IN_DURATION_MS = 240;
/** Stagger between successive items, in milliseconds. */
export const POP_STAGGER_MS = 16;
/** Upper bound on the total stagger so big swaps never feel slow. */
export const POP_MAX_STAGGER_MS = 380;
/** Scale an item pops in from (subtle: half size, slight overshoot landing). */
export const POP_START_SCALE = 0.5;

const MAX_FRAME_SECONDS = 0.1;

const VARIANT_BUILDERS: Record<SupportedTablewareYear, EraVariantBuilder> = {
  1945: buildEra1945Tableware,
  1965: buildEra1965Tableware,
  1985: buildEra1985Tableware,
  2005: buildEra2005Tableware,
  2025: buildEra2025Tableware,
};

/* ------------------------------------------------------------------------- */
/* Instant-swap rig                                                           */
/* ------------------------------------------------------------------------- */

interface PopEntry {
  object: THREE.Object3D;
  /** Authored scale captured once, before any popping. */
  baseScale: THREE.Vector3;
  delayMs: number;
}

interface PopSession {
  entries: PopEntry[];
  elapsedMs: number;
}

interface EraVariant {
  year: SupportedTablewareYear;
  group: THREE.Group;
  popEntries: PopEntry[] | null;
}

/** Back-out easing: fast rise with one small overshoot, then settle. */
function easeOutBack(t: number): number {
  const c1 = 0.9; // gentler than the canonical 1.70158 — "subtle" pop.
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function nowMs(): number {
  return typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
}

function popSessionEnd(session: PopSession): number {
  let maxDelay = 0;
  for (const entry of session.entries) {
    if (entry.delayMs > maxDelay) maxDelay = entry.delayMs;
  }
  return maxDelay + POP_IN_DURATION_MS;
}

/**
 * Owns the five procedural tabletop variants and animates instant swaps
 * between any pair of them.
 *
 * Swap strategy: the outgoing era's tabletops hide and the incoming era's
 * appear in the SAME frame (small props would read crossfade opacity as
 * flicker — matching the shell's `instantSwap` strategy for this group), then
 * each incoming item plays a short staggered scale pop-in for delight. Items
 * pivot around their own contact point on the table, so they grow in place
 * instead of sliding across the surface.
 *
 * Interrupting transitions simply finalise the previous pop first, so slider
 * spam produces clean chained results.
 */
export class TablewareRig {
  readonly root = new THREE.Group();

  private readonly variants = new Map<SupportedTablewareYear, EraVariant>();
  private active: EraVariant;
  private session: PopSession | null = null;
  private rafId: number | null = null;
  private lastTickMs = 0;

  constructor(initialYear: SupportedTablewareYear, initialSpec?: TablewareSpec) {
    this.root.name = 'tableware';
    this.root.userData.propGroup = TABLEWARE_PROP_GROUP_KEY;
    this.root.userData.strategy = 'instantSwap';
    this.root.userData.supportedYears = [...SUPPORTED_ERA_YEARS];

    let index = 0;
    for (const year of SUPPORTED_ERA_YEARS) {
      const built = VARIANT_BUILDERS[year]({
        spec: year === initialYear ? initialSpec : undefined,
      });
      // Micro-offset per variant so coincident tabletop stacks never share a
      // depth-buffer sliver while a pop-in is playing.
      built.position.x += index * ERA_LAYER_EPSILON;
      built.position.y += index * ERA_LAYER_EPSILON;
      built.visible = year === initialYear;
      this.root.add(built);
      this.variants.set(year, { year, group: built, popEntries: null });
      index += 1;
    }

    const initial = this.variants.get(initialYear);
    if (!initial) throw new Error(`Tableware rig missing variant for ${initialYear}.`);
    this.active = initial;
    applySpecMetadata(initial.group, initialSpec);
    this.refreshActiveMetadata(initial);
    scheduleShadowFix(this);
  }

  /** Era currently shown (or popping in). */
  get activeYear(): SupportedTablewareYear {
    return this.active.year;
  }

  /** True while a staggered pop-in session is playing. */
  isPopping(): boolean {
    return this.session !== null;
  }

  /**
   * Clears forced shadow casting on translucent glass surfaces.
   * `CafeScene.registerPropGroup` switches shadows ON for every mesh after
   * the builder returns, so sugar pourers, carafes, syrup bottles and tip
   * jars opt back out here (idempotent).
   */
  applyShadowFlags(): void {
    this.root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.userData.noCastShadow === true) mesh.castShadow = false;
    });
  }

  /** Applies one era config: metadata refresh plus instant swap when needed. */
  applyEra(config: EraConfig): void {
    const spec = extractTableware(config.tableware);
    const target = this.variants.get(resolveSupportedTablewareYear(config.year));
    if (!target) return;

    applySpecMetadata(target.group, spec);
    this.refreshActiveMetadata(target);

    if (target === this.active && !this.session) return;
    this.swapTo(target);
  }

  /**
   * Advances the pop-in animation by `deltaSeconds`. Headless consumers
   * (tests, offline renders) drive this directly; the browser self-ticks via
   * requestAnimationFrame. Returns true while a session is playing.
   */
  update(deltaSeconds: number): boolean {
    const session = this.session;
    if (!session) return false;
    let deltaMs = deltaSeconds * 1000;
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) deltaMs = 0;
    else deltaMs = Math.min(deltaMs, MAX_FRAME_SECONDS * 1000);
    session.elapsedMs += deltaMs;
    this.applyPop(session);
    if (session.elapsedMs >= popSessionEnd(session)) this.finishPop();
    return true;
  }

  /** Completes any in-flight pop immediately (dispose, tests). */
  flushAnimations(): void {
    const session = this.session;
    if (!session) return;
    session.elapsedMs = popSessionEnd(session);
    this.applyPop(session);
    this.finishPop();
  }

  dispose(): void {
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
    this.session = null;
    for (const variant of this.variants.values()) disposeObjectTree(variant.group);
    this.variants.clear();
  }

  private refreshActiveMetadata(target: EraVariant = this.active): void {
    this.root.userData.activeYear = target.year;
    this.root.userData.activeTitle = target.group.userData.eraTitle ?? null;
  }

  private swapTo(target: EraVariant): void {
    // Finalise any in-flight transition so arbitrary era pairs chain cleanly.
    this.finishPop();
    const from = this.active;
    if (from === target) return;

    from.group.visible = false;
    target.group.visible = true;
    this.active = target;
    this.startPop(target);
  }

  private popEntriesFor(variant: EraVariant): PopEntry[] {
    if (!variant.popEntries) {
      const entries: PopEntry[] = [];
      let index = 0;
      // Traverse order is stable document order → deterministic stagger.
      variant.group.traverse((node) => {
        if (node.userData.popItem !== true) return;
        entries.push({
          object: node,
          baseScale: node.scale.clone(),
          delayMs: Math.min(index * POP_STAGGER_MS, POP_MAX_STAGGER_MS),
        });
        index += 1;
      });
      variant.popEntries = entries;
    }
    return variant.popEntries;
  }

  private startPop(variant: EraVariant): void {
    const entries = this.popEntriesFor(variant);
    for (const entry of entries) {
      entry.object.visible = false;
      entry.object.scale.copy(entry.baseScale).multiplyScalar(POP_START_SCALE);
    }
    this.session = { entries, elapsedMs: 0 };
    this.ensureAnimating();
  }

  private applyPop(session: PopSession): void {
    for (const entry of session.entries) {
      const t = (session.elapsedMs - entry.delayMs) / POP_IN_DURATION_MS;
      if (t <= 0) {
        entry.object.visible = false;
        continue;
      }
      entry.object.visible = true;
      if (t >= 1) {
        entry.object.scale.copy(entry.baseScale);
        continue;
      }
      const eased = easeOutBack(t);
      const scale = POP_START_SCALE + (1 - POP_START_SCALE) * eased;
      entry.object.scale.copy(entry.baseScale).multiplyScalar(scale);
    }
  }

  private finishPop(): void {
    const session = this.session;
    if (!session) return;
    for (const entry of session.entries) {
      entry.object.visible = true;
      entry.object.scale.copy(entry.baseScale);
    }
    this.session = null;
    if (this.rafId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafId);
    }
    this.rafId = null;
  }

  private ensureAnimating(): void {
    if (this.rafId !== null || !this.session) return;
    if (typeof requestAnimationFrame !== 'function') {
      // Non-browser environment: headless consumers drive update() manually.
      return;
    }
    this.lastTickMs = nowMs();
    this.rafId = requestAnimationFrame(this.tick);
  }

  private readonly tick = (now: number): void => {
    this.rafId = null;
    if (!this.session) return;
    const deltaSeconds = (now - this.lastTickMs) / 1000;
    this.lastTickMs = now;
    this.update(deltaSeconds);
    if (this.session) this.rafId = requestAnimationFrame(this.tick);
  };
}

/* ------------------------------------------------------------------------- */
/* Registration surface                                                       */
/* ------------------------------------------------------------------------- */

const rigs = new WeakMap<object, TablewareRig>();

function requireRig(host: object): TablewareRig {
  const rig = rigs.get(host);
  if (!rig) {
    throw new Error(
      'No tableware rig for this host — build it first via TablewareBuilder / registerTablewarePropGroup().',
    );
  }
  return rig;
}

function scheduleShadowFix(rig: TablewareRig): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => rig.applyShadowFlags());
  }
  // Environments without microtasks still converge: every applyEra call can
  // re-run applyShadowFlags idempotently.
}

/**
 * PropGroupBuilder for the `tableware` detail category.
 *
 * Builds ALL five era tabletop sets up front (they share the same dining-table
 * anchors) and pre-selects the host's current era when one was applied before
 * registration, otherwise 1945.
 */
export const TablewareBuilder = (context: PropBuildContext): THREE.Group => {
  const current = context.host.currentEra;
  const initialYear = current
    ? resolveSupportedTablewareYear(current.year)
    : DEFAULT_ACTIVE_YEAR;
  const initialSpec = current ? extractTableware(current.tableware) : undefined;
  const rig = new TablewareRig(initialYear, initialSpec);
  rigs.set(context.host, rig);
  scheduleShadowFix(rig);
  return rig.root;
};

/** PropGroupUpdater for the `tableware` detail category. */
export const updateTableware: PropGroupUpdater = (config, context) => {
  requireRig(context.host).applyEra(config);
};

/**
 * Convenience wiring: registers the tableware group under the `'tableware'`
 * key on a CafeScene and returns the rig so callers can drive or inspect it
 * directly (`update`, `flushAnimations`, `activeYear`, `isPopping`, `dispose`).
 */
export function registerTablewarePropGroup(host: CafeScene): TablewareRig {
  const current = host.currentEra;
  const initialYear = current
    ? resolveSupportedTablewareYear(current.year)
    : DEFAULT_ACTIVE_YEAR;
  const initialSpec = current ? extractTableware(current.tableware) : undefined;
  const rig = new TablewareRig(initialYear, initialSpec);
  rigs.set(host, rig);
  // The builder closure reuses THIS rig — registering via `TablewareBuilder`
  // would construct (and leak) a second one.
  host.registerPropGroup(
    TABLEWARE_PROP_GROUP_KEY,
    () => rig.root,
    updateTableware,
  );
  scheduleShadowFix(rig);
  return rig;
}

/**
 * Tears the rig down (cancels animations, disposes geometry/materials) and
 * unregisters the group. Returns false when nothing was registered.
 */
export function disposeTableware(host: CafeScene): boolean {
  const rig = rigs.get(host);
  if (!rig) return false;
  rigs.delete(host);
  rig.dispose();
  host.unregisterPropGroup(TABLEWARE_PROP_GROUP_KEY);
  return true;
}

/** Declarative descriptor for registry-style integrations. */
export const TABLEWARE_PROP_GROUP = {
  key: TABLEWARE_PROP_GROUP_KEY,
  build: TablewareBuilder,
  update: updateTableware,
} as const;

/**
 * MenuBoardBuilder — the `menu` prop group.
 *
 * Pre-builds one complete board variant per era (1945/1965/1985/2005/2025),
 * all mounted above/behind the customer counter, and swaps between them with
 * an opacity crossfade so any pair of eras — adjacent or not, even mid-flight
 * — blends cleanly:
 *
 * - every era carries its own fresh materials (`transparent` enabled from
 *   birth), so fading never recompiles shaders or leaks between eras;
 * - each era's fade value eases linearly toward 1 (active) or 0 (rest);
 *   visibility flips off at ~0 so hidden boards cost nothing to render;
 * - retargeting mid-fade is inherently safe because fades only ever move
 *   toward their targets.
 *
 * Board content comes from the `menu` section of the routed shell
 * {@link EraConfig}: the group accepts either a `{ menuBoard: {...} }`
 * carrier (matching `src/cafe/eras/types.ts`) or the menu keys directly on
 * the section. Missing payloads fall back to built-in period presets.
 *
 * The 2025 LCD variant self-animates (rotating specials ticker + soft screen
 * glow pulse) via the same rAF loop that drives crossfades; headless
 * consumers (tests) can drive everything manually through {@link update}.
 */

import * as THREE from 'three';
import type { CafeScene } from '../../CafeScene';
import type { EraConfig, PropBuildContext, PropGroupUpdater, PropUpdateContext } from '../../types';
import { ERA_LAYER_EPSILON } from './layout';
import {
  MENU_ERA_YEARS,
  getMenuPreset,
  resolveNearestMenuEra,
  resolveRenderedRows,
} from './presets';
import type { MenuEraYear, PresetMenuRow } from './presets';
import type { MenuBoardPayload } from './types';
import { composeEraVariant } from './boards';
import type { EraVariantExtras } from './boards';

/** Duration of one era-to-era opacity crossfade, in seconds. */
export const CROSSFADE_SECONDS = 0.85;

/** LCD specials ticker scroll speed, in texture-offset units per second. */
export const TICKER_SPEED = 0.03;
/** Ticker texture holds two copies of the copy block → seamless period. */
const TICKER_PERIOD = 0.5;

/** Shown before any era has been applied. */
const DEFAULT_ACTIVE_YEAR: MenuEraYear = 1945;

/* ------------------------------------------------------------------------- */
/* Payload extraction                                                        */
/* ------------------------------------------------------------------------- */

const PAYLOAD_KEYS = ['boardStyle', 'items', 'prices', 'specialsNote'] as const;

function isMenuBoardPayload(value: unknown): value is MenuBoardPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return PAYLOAD_KEYS.some((key) => record[key] !== undefined);
}

/**
 * Reads the era's `menuBoard` payload out of the routed {@link EraConfig}
 * `menu` section. Two layouts are accepted so the group survives either
 * integration shape: a carrier object (`{ menuBoard: {...} }`, matching the
 * field name used by `src/cafe/eras/`) or the menu keys directly on the
 * section. Returns `undefined` when neither is present (current era stubs),
 * which makes every era fall back to its built-in preset.
 */
export function extractMenuBoard(section: unknown): MenuBoardPayload | undefined {
  if (!section || typeof section !== 'object' || Array.isArray(section)) return undefined;
  const record = section as Record<string, unknown>;
  const carrier = record.menuBoard ?? record.board;
  if (isMenuBoardPayload(carrier)) return carrier;
  if (isMenuBoardPayload(record)) return record;
  return undefined;
}

/* ------------------------------------------------------------------------- */
/* Rig                                                                       */
/* ------------------------------------------------------------------------- */

interface EraVariant {
  year: MenuEraYear;
  group: THREE.Group;
  /** Per-material opacity baselines captured once, before any fading. */
  materials: THREE.MeshStandardMaterial[];
  extras: EraVariantExtras;
}

interface FadeState {
  fade: number;
  target: number;
}

export class MenuBoardBuilder {
  private root: THREE.Group | null = null;
  private readonly variants = new Map<MenuEraYear, EraVariant>();
  private readonly fades = new Map<MenuEraYear, FadeState>();
  private active: MenuEraYear = DEFAULT_ACTIVE_YEAR;
  private transitionSeconds = CROSSFADE_SECONDS;
  private rafHandle = 0;
  private lastFrameTime = -1;
  private disposed = false;
  /** Ambient animation clock for the 2025 LCD (seconds since first tick). */
  private animTime = 0;

  /** Lazily builds and returns the persistent group for the registry. */
  getGroup(): THREE.Group {
    if (!this.root) {
      this.root = new THREE.Group();
      this.root.name = 'menu-root';
      this.root.userData.propGroup = 'menu';
      this.root.userData.strategy = 'crossfade';
      this.root.userData.supportedYears = [...MENU_ERA_YEARS];
      this.root.userData.activeYear = this.active;

      let index = 0;
      for (const year of MENU_ERA_YEARS) {
        const { group, extras } = composeEraVariant(year);
        // Micro-offset per variant so coincident hanging surfaces never
        // z-fight while two eras blend.
        group.position.x += index * ERA_LAYER_EPSILON;
        group.position.z += index * ERA_LAYER_EPSILON;
        group.visible = year === this.active;
        this.root.add(group);
        this.variants.set(year, { year, group, materials: collectMaterials(group), extras });
        this.fades.set(year, { fade: year === this.active ? 1 : 0, target: year === this.active ? 1 : 0 });
        index += 1;
      }
    }
    return this.root;
  }

  /** Era currently shown (or fading in). */
  get activeYear(): MenuEraYear {
    return this.active;
  }

  /**
   * Applies one era config: refreshes slice-driven content on the target
   * variant, then retargets the crossfade.
   */
  applyEra(config: EraConfig, context?: PropUpdateContext): void {
    if (this.disposed || !config) return;
    void context;
    this.getGroup();

    const year = resolveNearestMenuEra(config.year);
    const target = this.variants.get(year);
    if (!target) return;

    // Slice enrichment: overlay routed items/prices onto the preset rows.
    const preset = getMenuPreset(year);
    const payload = extractMenuBoard(config.menu);
    const rows = resolveRenderedRows(preset, payload);
    target.group.userData.renderedRows = rows;
    target.group.userData.boardStyle = payload?.boardStyle ?? preset.boardStyle;
    target.group.userData.specialsNote = payload?.specialsNote ?? preset.specialsNote ?? null;
    target.group.userData.sliceApplied = payload !== undefined;

    this.root!.userData.activeYear = year;
    this.root!.userData.activeTitle = target.group.userData.eraTitle ?? null;

    // Cold start (first application) snaps instead of animating.
    const cold =
      context?.previousYear === null ||
      context?.previousYear === undefined ||
      !MENU_ERA_YEARS.some((candidate) => (this.fades.get(candidate)?.fade ?? 0) > 0);

    this.active = year;
    for (const [candidateYear, state] of this.fades) {
      state.target = candidateYear === year ? 1 : 0;
      if (cold) state.fade = state.target;
      this.applyVisual(candidateYear);
    }

    this.ensureTicking();
  }

  /** True while the 2025 LCD ambient animation has anything to animate. */
  private isAmbientAnimating(): boolean {
    const lcd = this.variants.get(2025);
    return !!lcd && !this.disposed && (this.fades.get(2025)?.fade ?? 0) > 0.002;
  }

  /**
   * Advances crossfades and the LCD ambient animation by `deltaSeconds`.
   * Returns true while anything is still moving. Safe to call manually
   * (headless/tests) or via the internal rAF loop in the browser.
   */
  update(deltaSeconds: number): boolean {
    if (this.disposed || deltaSeconds <= 0) return false;
    let moving = false;

    const step = deltaSeconds / Math.max(this.transitionSeconds, 0.001);
    for (const [year, state] of this.fades) {
      if (state.fade === state.target) continue;
      if (state.fade < state.target) state.fade = Math.min(state.fade + step, state.target);
      else state.fade = Math.max(state.fade - step, state.target);
      moving = moving || state.fade !== state.target;
      this.applyVisual(year);
    }

    // The LCD specials ticker keeps the rig "moving" whenever 2025 is on
    // screen, which is what keeps the shared rAF loop alive in the browser.
    const ambientWasActive = this.isAmbientAnimating();
    this.updateAmbient(deltaSeconds);
    return moving || ambientWasActive;
  }

  /** Crossfade duration in seconds (clamped to a sane range). */
  setTransitionSeconds(seconds: number): this {
    this.transitionSeconds = THREE.MathUtils.clamp(seconds, 0.05, 5);
    return this;
  }

  /** True while any era fade is still in flight. */
  isTransitioning(): boolean {
    for (const state of this.fades.values()) {
      if (state.fade !== state.target) return true;
    }
    return false;
  }

  /** Clears forced shadow casting on emissive screens (idempotent). */
  applyShadowFlags(): void {
    if (!this.root) return;
    this.root.traverse((node) => {
      const mesh = node as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (mesh.userData.glowSurface === true || mesh.userData.noCastShadow === true) {
        mesh.castShadow = false;
      }
    });
    // Named glow surfaces (LCD face, backlit letter panel) opt out too.
    for (const variant of this.variants.values()) {
      const names = variant.group.userData.glowSurfaceNames as string[] | undefined;
      if (!names) continue;
      for (const name of names) {
        const mesh = variant.group.getObjectByName(name) as THREE.Mesh | undefined;
        if (mesh?.isMesh) mesh.castShadow = false;
      }
    }
  }

  /** Removes the group and releases all geometries/materials/textures. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopTicking();

    for (const variant of this.variants.values()) {
      disposeObjectTree(variant.group);
      variant.group.removeFromParent();
    }
    this.variants.clear();
    this.fades.clear();
    if (this.root) {
      this.root.removeFromParent();
      this.root = null;
    }
  }

  /* ----- internals ----------------------------------------------------- */

  private applyVisual(year: MenuEraYear): void {
    const variant = this.variants.get(year);
    const state = this.fades.get(year);
    if (!variant || !state) return;
    variant.group.visible = state.fade > 0.001;
    for (const material of variant.materials) material.opacity = state.fade;

    // Screens dim their own glow while fading so a half-faded LCD doesn't
    // punch through the outgoing chalkboard at full emissive strength.
    if (materialHasEmissiveMap(variant)) {
      const presetGlow = getMenuPreset(year).glow;
      setEmissiveIntensity(variant, presetGlow * state.fade);
    }
  }

  private updateAmbient(deltaSeconds: number): void {
    const lcd = this.variants.get(2025);
    if (!lcd || (this.fades.get(2025)?.fade ?? 0) <= 0.002) return;
    this.animTime += deltaSeconds;

    const ticker = lcd.extras.specialsTicker;
    if (ticker) {
      ticker.offset.x = ((this.animTime * TICKER_SPEED) % TICKER_PERIOD + TICKER_PERIOD) % TICKER_PERIOD;
    }
    const presetGlow = getMenuPreset(2025).glow;
    const pulse = 0.94 + 0.06 * Math.sin((this.animTime * Math.PI * 2) / 4);
    setEmissiveIntensity(lcd, presetGlow * pulse * (this.fades.get(2025)?.fade ?? 1));
  }

  private ensureTicking(): void {
    if (
      this.disposed ||
      this.rafHandle !== 0 ||
      typeof requestAnimationFrame !== 'function'
    ) {
      return;
    }
    this.lastFrameTime = -1;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  private stopTicking(): void {
    if (this.rafHandle !== 0 && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.rafHandle);
    }
    this.rafHandle = 0;
  }

  private readonly tick = (time: number): void => {
    this.rafHandle = 0;
    if (this.disposed) return;
    if (this.lastFrameTime < 0) this.lastFrameTime = time;
    const delta = Math.min((time - this.lastFrameTime) / 1000, 0.05);
    this.lastFrameTime = time;
    if (this.update(delta)) this.ensureTicking();
  };
}

/* ------------------------------------------------------------------------- */
/* Small helpers                                                             */
/* ------------------------------------------------------------------------- */

function collectMaterials(group: THREE.Group): THREE.MeshStandardMaterial[] {
  const materials: THREE.MeshStandardMaterial[] = [];
  const seen = new Set<THREE.MeshStandardMaterial>();
  group.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      if (!(material instanceof THREE.MeshStandardMaterial)) continue;
      if (seen.has(material)) continue;
      seen.add(material);
      materials.push(material);
    }
  });
  return materials;
}

function materialHasEmissiveMap(variant: EraVariant): boolean {
  return variant.materials.some(
    (material) => material.emissiveMap !== null && material.emissiveIntensity > 0,
  );
}

function setEmissiveIntensity(variant: EraVariant, intensity: number): void {
  for (const material of variant.materials) {
    if (material.emissiveMap) material.emissiveIntensity = intensity;
  }
}

/** Disposes every geometry/material/texture beneath `root`. */
function disposeObjectTree(root: THREE.Object3D): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();

  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.geometry) geometries.add(mesh.geometry);
    const list = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of list) {
      if (!material) continue;
      materials.add(material);
      const standard = material as THREE.MeshStandardMaterial;
      for (const texture of [standard.map, standard.emissiveMap]) {
        if (texture) textures.add(texture);
      }
    }
  });

  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}

/* ------------------------------------------------------------------------- */
/* Registration surface                                                      */
/* ------------------------------------------------------------------------- */

const rigs = new WeakMap<object, MenuBoardBuilder>();

function requireRig(host: object): MenuBoardBuilder {
  const rig = rigs.get(host);
  if (!rig) {
    throw new Error(
      'No menu-board rig for this host — build it first via MenuBoardBuilder / registerMenuPropGroup().',
    );
  }
  return rig;
}

function scheduleShadowFix(rig: MenuBoardBuilder): void {
  if (typeof queueMicrotask === 'function') {
    queueMicrotask(() => rig.applyShadowFlags());
  }
  // Environments without microtasks still converge: every applyEra call
  // re-runs applyShadowFlags idempotently.
}

/** Preset rows type re-export keeps the public barrel honest. */
export type { PresetMenuRow };

/**
 * PropGroupBuilder for the `menu` detail category.
 *
 * Builds ALL five era boards up front (they share the counter mount slot)
 * and pre-selects the host's current era when one was applied before
 * registration, otherwise 1945.
 */
export const MenuBoardBuilderBuild = (context: PropBuildContext): THREE.Group => {
  const rig = buildRig(context.host);
  scheduleShadowFix(rig);
  return rig.getGroup();
};

function buildRig(host: CafeScene): MenuBoardBuilder {
  const existing = rigs.get(host);
  if (existing) return existing;
  const rig = new MenuBoardBuilder();
  const current = host.currentEra;
  rigs.set(host, rig);
  if (current) rig.applyEra(current, { host, previousYear: null });
  return rig;
}

/** PropGroupUpdater for the `menu` detail category. */
export const updateMenuBoard: PropGroupUpdater = (config, context) => {
  requireRig(context.host).applyEra(config, context);
};

/**
 * Convenience wiring: builds the menu-board rig, registers it under the
 * `'menu'` key on a CafeScene, and returns the builder so callers can drive
 * or inspect it directly (`setTransitionSeconds`, `update`, `dispose`).
 */
export function registerMenuPropGroup(host: CafeScene): MenuBoardBuilder {
  const rig = buildRig(host);
  host.registerPropGroup('menu', () => rig.getGroup(), (config, context) => rig.applyEra(config, context));
  scheduleShadowFix(rig);
  return rig;
}

/**
 * Tears the rig down (cancels animations, disposes geometry/materials) and
 * unregisters the group. Returns false when nothing was registered.
 */
export function disposeMenuPropGroup(host: CafeScene): boolean {
  const rig = rigs.get(host);
  if (!rig) return false;
  rigs.delete(host);
  rig.dispose();
  host.unregisterPropGroup('menu');
  return true;
}

/** Registry key — matches the `menu` section of {@link EraConfig} 1:1. */
export const MENU_PROP_GROUP_KEY = 'menu' as const;

/** Declarative descriptor for registry-style integrations. */
export const MENU_PROP_GROUP = {
  key: MENU_PROP_GROUP_KEY,
  build: MenuBoardBuilderBuild,
  update: updateMenuBoard,
} as const;

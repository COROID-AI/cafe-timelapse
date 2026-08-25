/**
 * FurnitureBuilder — the `furniture` prop group.
 *
 * Pre-builds one complete object graph per era (1945/1965/1985/2005/2025) and
 * swaps between them with an opacity crossfade, so any pair of eras —
 * adjacent or not, even mid-transition — blends cleanly:
 *
 * - every era set carries its own materials (transparent-enabled from the
 *   start), so fading never recompiles shaders or leaks between sets;
 * - each set has a fade value eased linearly toward 1 (active) or 0 (rest);
 *   visibility flips off at ~0 so hidden sets cost nothing to render;
 * - retargeting mid-fade is inherently safe because fades only ever move
 *   toward their targets.
 *
 * The look of the active set is driven by the `furniture` section of the
 * shell {@link EraConfig}: accent palette recolors upholstery/laminates/rugs,
 * the flooring description can hide rugs ("bare boards"), and decor labels
 * can hide décor ("none"). Missing keys fall back to built-in era defaults.
 */

import * as THREE from 'three';
import type { EraConfig, PropUpdateContext } from '../../types';
import { FURNITURE_ERA_YEARS } from './types';
import type { FurnitureEraYear } from './types';
import { resolveFurnitureEra } from './slice';
import { buildEraSet } from './assemble';
import type { EraSetBuild } from './assemble';

interface EraSetEntry {
  build: EraSetBuild;
  materials: readonly THREE.MeshStandardMaterial[];
  fade: number;
  target: number;
  lastApplied: number;
}

/** Flooring wording that means "no rugs on show". */
const BARE_FLOOR_PATTERN = /(^|\s)(bare|no rugs?|no rug|none)\b/i;

export class FurnitureBuilder {
  private root: THREE.Group | null = null;
  private readonly entries = new Map<FurnitureEraYear, EraSetEntry>();
  private transitionSeconds = 0.9;
  private rafHandle = 0;
  private lastFrameTime = -1;
  private disposed = false;

  /** Lazily builds and returns the persistent group for the registry. */
  getGroup(): THREE.Group {
    if (!this.root) {
      this.root = new THREE.Group();
      this.root.name = 'furniture-root';
      for (const year of FURNITURE_ERA_YEARS) {
        const build = buildEraSet(resolveFurnitureEra(makeBareConfig(year)));
        this.entries.set(year, {
          build,
          materials: build.kit.materials,
          fade: 0,
          target: 0,
          lastApplied: -1,
        });
        this.root.add(build.root);
      }
    }
    return this.root;
  }

  /** Applies one era config: retargets the crossfade and refreshes slice-driven looks. */
  applyEra(config: EraConfig, context: PropUpdateContext): void {
    if (this.disposed || !config) return;
    void context;
    this.getGroup();

    const resolved = resolveFurnitureEra(config);
    const active = this.entries.get(resolved.year);
    if (!active) return;

    // Palette-driven accents (upholstery, laminates, pillows, neon, rugs).
    const palette = resolved.palette;
    if (palette.length > 0 && resolved.paletteFromSlice) {
      active.build.root.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const slot = mesh.userData.accentSlot;
        if (typeof slot === 'number') {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.color.copy(palette[slot % palette.length]);
        }
      });
    }

    // Flooring wording can hide rugs (e.g. "bare boards").
    const hideRugs = BARE_FLOOR_PATTERN.test(resolved.flooring);
    for (const rug of active.build.rugs) rug.visible = !hideRugs;

    // Décor labels: literal "none" clears the dressing.
    const hideDecor = resolved.decorLabels.includes('none');
    active.build.decorRoot.visible = !hideDecor;

    // Cold start (first application) snaps instead of animating.
    const cold =
      context.previousYear === null ||
      !FURNITURE_ERA_YEARS.some((year) => (this.entries.get(year)?.fade ?? 0) > 0);
    for (const [year, entry] of this.entries) {
      entry.target = year === resolved.year ? 1 : 0;
      if (cold) entry.fade = entry.target;
      this.applyVisual(entry);
    }

    this.ensureTicking();
  }

  /**
   * Advances the crossfade by `deltaSeconds`. Returns true while any era is
   * still moving. Safe to call manually (headless/tests) or via the internal
   * rAF loop in the browser.
   */
  update(deltaSeconds: number): boolean {
    if (this.disposed || deltaSeconds <= 0) return false;
    let moving = false;
    for (const entry of this.entries.values()) {
      if (entry.fade === entry.target) continue;
      const step = deltaSeconds / Math.max(this.transitionSeconds, 0.001);
      if (entry.fade < entry.target) entry.fade = Math.min(entry.fade + step, entry.target);
      else entry.fade = Math.max(entry.fade - step, entry.target);
      moving = moving || entry.fade !== entry.target;
      this.applyVisual(entry);
    }
    return moving;
  }

  /** Crossfade duration in seconds (clamped to a sane range). */
  setTransitionSeconds(seconds: number): this {
    this.transitionSeconds = THREE.MathUtils.clamp(seconds, 0.05, 5);
    return this;
  }

  /** True while any era fade is still in flight. */
  isTransitioning(): boolean {
    for (const entry of this.entries.values()) {
      if (entry.fade !== entry.target) return true;
    }
    return false;
  }

  /** Removes the group and releases all geometries/materials. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopTicking();
    for (const entry of this.entries.values()) {
      entry.build.root.removeFromParent();
      entry.build.geo.dispose();
      entry.build.kit.dispose();
    }
    this.entries.clear();
    if (this.root) {
      this.root.removeFromParent();
      this.root = null;
    }
  }

  /* ----- internals ----------------------------------------------------- */

  private applyVisual(entry: EraSetEntry): void {
    if (entry.lastApplied === entry.fade) return;
    entry.build.root.visible = entry.fade > 0.001;
    for (const material of entry.materials) material.opacity = entry.fade;
    entry.lastApplied = entry.fade;
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

/* ----- module helpers --------------------------------------------------- */

/** Minimal config carrying only the year — used to prebuild default sets. */
function makeBareConfig(year: FurnitureEraYear): EraConfig {
  return {
    year,
    label: String(year),
    furniture: {},
    machines: {},
    menu: {},
    posters: {},
    tableware: {},
    signage: {},
    counterTech: {},
    patrons: {},
  };
}

/**
 * PosterWallBuilder — the `posters` prop group.
 *
 * Pre-builds one complete wall-art object graph per era (1945/1965/1985/2005/
 * 2025) and swaps between them so the walls instantly date the room:
 *
 * - **Crossfade** — each era set carries its own transparent-enabled materials
 *   (authored at opacity 1); the active set's fade eases toward 1 while every
 *   other set eases to 0. Visibility flips off at ~0 so hidden eras cost
 *   nothing to render. Because baselines are never authored below 1, the
 *   scene-wide `EraTransitionController` (default strategy `crossfade` for
 *   this group) can safely capture/restore material states around its own
 *   morph without fighting this builder.
 * - **Paper-curl scale-pop** — a set's scale follows its fade through a
 *   back-eased curve (`0.94 → overshoot ≈ 1.005 → 1`), and each poster pivots
 *   through a tiny alternating curl (`sin(fade·π)`, ±~3°) while in flight, so
 *   the wall seems to ripple alive before settling perfectly flat.
 *
 * Retargeting mid-fade is inherently safe: fade only ever moves toward its
 * target, and both scale and curl are pure functions of fade.
 *
 * Content resolution: the `posters` section of the shell {@link EraConfig}
 * wins whenever it carries `WallPoster[]` entries; otherwise the built-in
 * per-era catalogue applies (so stub configs still dress the walls). A
 * catalogue change triggers an in-place rebuild of just that era's set.
 */

import * as THREE from 'three';
import type { EraConfig, PropUpdateContext } from '../../types';
import { POSTER_ERA_YEARS } from './types';
import type { PosterEraContent, PosterEraYear } from './types';
import { POSTER_ERA_CONTENT } from './eraContent';
import { postersSignature, resolvePostersEra } from './resolvePosters';
import { buildPosterEraSet } from './assemble';
import type { PosterSetBuild } from './assemble';

interface EraEntry {
  year: PosterEraYear;
  build: PosterSetBuild;
  /** Signature of the catalogue the current build was made from. */
  signature: string;
  /** Current visual fade 0..1 (also drives scale & curl). */
  fade: number;
  /** Target fade: 1 active, 0 resting. */
  target: number;
  lastAppliedOpacity: number;
}

/** Scale at fade 0; rises through a slight overshoot to exactly 1 at fade 1. */
const POP_FLOOR = 0.94;
/** Backforce of the pop easing (standard easeInOutBack constant). */
const POP_OVERSHOOT = 1.70158;
/** Peak alternating poster curl while a swap is in flight (radians). */
const CURL_MAX = 0.06;

/** Ease-out-back: springs slightly past 1 before settling exactly on 1. */
function easeOutBack(t: number): number {
  const c3 = POP_OVERSHOOT + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + POP_OVERSHOOT * u * u;
}

export class PosterWallBuilder {
  private root: THREE.Group | null = null;
  private readonly entries = new Map<PosterEraYear, EraEntry>();
  private transitionSeconds = 0.9;
  private rafHandle = 0;
  private lastFrameTime = -1;
  private disposed = false;

  /** Lazily builds and returns the persistent group for the registry. */
  getGroup(): THREE.Group {
    if (!this.root) {
      this.root = new THREE.Group();
      this.root.name = 'posters-root';
      for (const year of POSTER_ERA_YEARS) {
        const content = POSTER_ERA_CONTENT[year];
        const build = buildPosterEraSet(content);
        build.root.visible = false;
        this.root.add(build.root);
        this.entries.set(year, {
          year,
          build,
          signature: postersSignature(content),
          fade: 0,
          target: 0,
          lastAppliedOpacity: -1, // force first opacity write
        });
      }
    }
    return this.root;
  }

  /** Applies one era config: retargets the crossfade and refreshes content. */
  applyEra(config: EraConfig, context: PropUpdateContext): void {
    if (this.disposed || !config) return;
    this.getGroup();

    const resolved = resolvePostersEra(config);
    const active = this.ensureEntry(resolved.year, resolved.content);
    if (!active) return;

    // Cold start (first application) snaps instead of animating.
    let anythingVisible = false;
    for (const entry of this.entries.values()) {
      if (entry.fade > 0) {
        anythingVisible = true;
        break;
      }
    }
    const cold = context.previousYear === null || !anythingVisible;

    for (const [year, entry] of this.entries) {
      entry.target = year === resolved.year ? 1 : 0;
      if (cold) entry.fade = entry.target;
      this.applyVisual(entry);
      if (cold) this.settleCurls(entry);
    }

    this.ensureTicking();
  }

  /**
   * Advances the crossfade by `deltaSeconds`. Returns true while any era is
   * still moving. Safe to call manually (headless/tests) or via the internal
   * rAF loop in the browser.
   */
  update(deltaSeconds: number): boolean {
    if (this.disposed || !(deltaSeconds > 0)) return false;
    const step = deltaSeconds / Math.max(this.transitionSeconds, 0.001);
    let moving = false;

    for (const entry of this.entries.values()) {
      if (entry.fade === entry.target) continue;

      if (entry.fade < entry.target) entry.fade = Math.min(entry.fade + step, entry.target);
      else entry.fade = Math.max(entry.fade - step, entry.target);

      moving = moving || entry.fade !== entry.target;
      this.applyVisual(entry);

      // Paper-curl ripple: alternating tilt peaking mid-swap, flat at rest.
      const phase = Math.sin(Math.min(entry.fade, 1) * Math.PI);
      entry.build.posterGroups.forEach((pivot, i) => {
        const baseTilt = (pivot.userData.baseTiltZ as number) ?? 0;
        pivot.rotation.z = baseTilt + phase * CURL_MAX * (i % 2 === 0 ? 1 : -1);
      });
      if (entry.fade === entry.target) this.settleCurls(entry);
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

  /** Current fade of an era set (0 hidden, 1 fully shown). Debug/testing aid. */
  getFade(year: PosterEraYear): number {
    return this.entries.get(year)?.fade ?? 0;
  }

  /** Removes the group and releases all geometries/materials/textures. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopTicking();
    for (const entry of this.entries.values()) {
      entry.build.root.removeFromParent();
      entry.build.dispose();
    }
    this.entries.clear();
    if (this.root) {
      this.root.removeFromParent();
      this.root = null;
    }
  }

  /* ----- internals ------------------------------------------------------- */

  /**
   * Returns the entry for `year`, rebuilding its object graph in place when
   * the effective catalogue changed (slice-driven curation). Transition state
   * survives the swap.
   */
  private ensureEntry(year: PosterEraYear, content: PosterEraContent): EraEntry | null {
    const signature = postersSignature(content);
    const existing = this.entries.get(year);
    if (!existing) return null;
    if (existing.signature === signature) return existing;

    const { fade, target } = existing;
    existing.build.root.removeFromParent();
    existing.build.dispose();

    const build = buildPosterEraSet(content);
    this.root?.add(build.root);
    existing.build = build;
    existing.signature = signature;
    existing.fade = fade;
    existing.target = target;
    existing.lastAppliedOpacity = -1;
    this.applyVisual(existing);
    this.settleCurls(existing);
    return existing;
  }

  /** Writes visibility/scale/opacity for one entry (idempotent, cheap). */
  private applyVisual(entry: EraEntry): void {
    const { build, fade } = entry;
    const shown = fade > 0.001;
    // Scale-pop: pure function of fade — continuous under mid-flight retargets.
    const pop = POP_FLOOR + (1 - POP_FLOOR) * easeOutBack(Math.min(Math.max(fade, 0), 1));
    build.root.visible = shown;
    build.root.scale.setScalar(pop);
    // Opacity carries the crossfade only while the set is on screen; resting
    // sets snap back to their authored baseline (1) and rely on visibility.
    // This keeps the scene-wide transition controller's sticky per-material
    // baselines uniform, so its morph-end restores can never strand a faded
    // set at the wrong opacity.
    const opacity = shown ? fade : 1;
    if (entry.lastAppliedOpacity !== opacity) {
      for (const material of build.materials) material.opacity = opacity;
      entry.lastAppliedOpacity = opacity;
    }
  }

  /** Restores every poster pivot to its exact authored tilt. */
  private settleCurls(entry: EraEntry): void {
    for (const pivot of entry.build.posterGroups) {
      pivot.rotation.z = (pivot.userData.baseTiltZ as number) ?? 0;
    }
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

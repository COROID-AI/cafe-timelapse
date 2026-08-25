/**
 * PatronBuilder — the `patrons` prop group.
 *
 * Pre-builds one complete stylised cast per era (1945/1965/1985/2005/2025)
 * and swaps between them with an opacity crossfade, exactly like the sibling
 * furniture/posters groups — any pair of eras blends cleanly, even when the
 * swap is driven straight through `CafeScene.applyEra` without the animated
 * controller.
 *
 * ## Idle animations
 *
 * Every figure runs one subtle loop — head turn, sip, or phone glance —
 * driven by a shared idle clock. The clock FREEZES (poses hold exactly where
 * they are; amplitudes are bounded so frozen poses stay inside the seated
 * envelope) whenever any of these holds:
 *
 * 1. `setIdlePaused(true)` — manual override for explicit shell wiring;
 * 2. an internal era crossfade is still blending (patrons hold still while
 *    the room remakes itself around them);
 * 3. an `EraTransitionController` morph owns this group — detected by
 *    watching sentinel objects the controller flips while engaged
 *    (`mesh.castShadow = false`, `material.depthWrite = false`) and restores
 *    when the morph ends. This module never writes those flags itself, so a
 *    flipped sentinel is unambiguous external-transition evidence.
 */

import * as THREE from 'three';
import type { EraConfig, PropUpdateContext } from '../../types';
import { PATRON_ERA_YEARS } from './types';
import type { PatronEraYear } from './types';
import { buildPatronCast } from './cast';
import type { CastBuild } from './cast';
import { nearestPatronEra } from './layout';
import { extractPatronsPayload } from './payload';
import type { PatronsPayload } from './payload';
import { applyIdle } from './animations';

interface CastEntry {
  build: CastBuild;
  materials: readonly THREE.MeshStandardMaterial[];
  fade: number;
  target: number;
  lastApplied: number;
}

/** Largest single idle-clock step (long tab stalls don't fast-forward poses). */
const MAX_IDLE_DT = 0.1;
/** Visibility flip threshold, matching the sibling prop builders. */
const FADE_VISIBILITY = 0.001;

export class PatronsBuilder {
  private root: THREE.Group | null = null;
  private readonly entries = new Map<PatronEraYear, CastEntry>();
  private transitionSeconds = 0.9;
  private activeYear: PatronEraYear | null = null;
  private idleTime = 0;
  private manualIdlePaused = false;
  private disposed = false;
  private rafHandle = 0;
  private lastFrameTime = -1;

  /**
   * Objects watched for external morph engagement. Captured once per group
   * build; this module never mutates their `castShadow`/`depthWrite`, so any
   * deviation means someone else (the transition controller's fade pass) owns
   * the visuals right now.
   */
  private readonly sentinelMeshes: THREE.Mesh[] = [];
  private readonly sentinelMaterials: THREE.MeshStandardMaterial[] = [];

  /** Lazily builds and returns the persistent group for the registry. */
  getGroup(): THREE.Group {
    if (!this.root) {
      this.root = new THREE.Group();
      this.root.name = 'patrons-root';
      for (const year of PATRON_ERA_YEARS) {
        const build = buildPatronCast(year);

        // Mirror CafeScene.registerPropGroup's shadow participation up front
        // so the engagement sentinel reads a stable authored baseline even
        // for direct construction (tests) before registration completes.
        build.root.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (!mesh.isMesh) return;
          mesh.castShadow = true;
        });

        this.entries.set(year, {
          build,
          materials: build.materials,
          fade: 0,
          target: 0,
          lastApplied: -1,
        });
        this.captureSentinels(build);
        this.root.add(build.root);
      }
    }
    return this.root;
  }

  /** Applies one era config: retargets the crossfade and refreshes payload-driven looks. */
  applyEra(config: EraConfig, context?: PropUpdateContext): void {
    if (this.disposed || !config) return;
    void context;
    this.getGroup();

    const resolved = nearestPatronEra(config.year);
    const active = this.entries.get(resolved);
    if (!active) return;

    this.applyPayload(active, extractPatronsPayload(config.patrons));

    // Cold start (first application) snaps instead of animating.
    let warm = context ? context.previousYear !== null : false;
    for (const entry of this.entries.values()) {
      if (entry.fade > 0) warm = true;
    }

    for (const [year, entry] of this.entries) {
      entry.target = year === resolved ? 1 : 0;
      if (!warm) entry.fade = entry.target;
      this.applyVisual(entry);
    }

    this.activeYear = resolved;
    this.ensureTicking();
  }

  /**
   * Advances the crossfade and the idle loops by `deltaSeconds`. Returns true
   * while any era fade is still moving. Safe to call manually (headless /
   * tests) or via the internal rAF loop in the browser.
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

    if (this.isIdleAnimationActive()) {
      this.idleTime += Math.min(deltaSeconds, MAX_IDLE_DT);
      for (const entry of this.entries.values()) {
        entry.build.slots.forEach((slot, index) => {
          if (!slot.root.visible) return;
          applyIdle(slot.figure.joints, slot.spec.idle, this.idleTime, index);
        });
      }
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

  /** Manual pause override for the idle loops (shell wiring / tests). */
  setIdlePaused(paused: boolean): this {
    this.manualIdlePaused = paused;
    return this;
  }

  isManuallyPaused(): boolean {
    return this.manualIdlePaused;
  }

  /**
   * Whether the idle loops currently advance. False while paused manually,
   * while an era crossfade blends, or while an external era-transition morph
   * owns this group.
   */
  isIdleAnimationActive(): boolean {
    if (this.disposed || this.manualIdlePaused) return false;
    if (this.isTransitioning()) return false;
    return !this.isExternalMorphEngaged();
  }

  /** Era most recently applied via {@link applyEra}, if any. */
  get currentYear(): PatronEraYear | null {
    return this.activeYear;
  }

  /** Removes the group and releases all geometries/materials. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.stopTicking();
    for (const entry of this.entries.values()) {
      entry.build.root.removeFromParent();
      for (const slot of entry.build.slots) slot.figure.kit.dispose();
    }
    this.entries.clear();
    this.sentinelMeshes.length = 0;
    this.sentinelMaterials.length = 0;
    if (this.root) {
      this.root.removeFromParent();
      this.root = null;
    }
  }

  /* ----- internals --------------------------------------------------------- */

  /** Applies opacity + visibility for one era entry (no-ops when unchanged). */
  private applyVisual(entry: CastEntry): void {
    if (entry.lastApplied === entry.fade) return;
    entry.build.root.visible = entry.fade > FADE_VISIBILITY;
    for (const material of entry.materials) material.opacity = entry.fade;
    entry.lastApplied = entry.fade;
  }

  /** Payload-driven looks: headcount visibility + debug metadata stamps. */
  private applyPayload(entry: CastEntry, payload: PatronsPayload | undefined): void {
    const hint = payload?.headcountHint;
    const count =
      hint === undefined
        ? entry.build.slots.length
        : THREE.MathUtils.clamp(Math.round(hint), 1, entry.build.slots.length);
    entry.build.slots.forEach((slot, index) => {
      slot.root.visible = index < count;
    });

    entry.build.root.userData.payloadApplied = payload !== undefined;
    entry.build.root.userData.activityNotes = payload?.activityNotes ?? [];
  }

  /** Grabs durable witnesses of this group's authored visual state. */
  private captureSentinels(build: CastBuild): void {
    if (this.sentinelMeshes.length > 0) return;
    const torso = build.slots[0]?.figure.root.getObjectByName('torso');
    if (torso instanceof THREE.Mesh) {
      this.sentinelMeshes.push(torso);
      const material = torso.material;
      if (material instanceof THREE.MeshStandardMaterial) {
        this.sentinelMaterials.push(material);
      }
    }
  }

  /**
   * True while an external system (the EraTransitionController's fade pass)
   * owns this group's visuals. Its engageFade flips `castShadow`/`depthWrite`
   * off across the whole registered group for the duration of a morph and
   * restores them afterwards; since this builder only ever writes `true`,
   * any `false` is unambiguous morph evidence.
   */
  private isExternalMorphEngaged(): boolean {
    for (const mesh of this.sentinelMeshes) {
      if (mesh.castShadow === false) return true;
    }
    for (const material of this.sentinelMaterials) {
      if (material.depthWrite === false) return true;
    }
    return false;
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
    const delta = Math.min((time - this.lastFrameTime) / 1000, MAX_IDLE_DT);
    this.lastFrameTime = time;
    if (this.update(delta)) this.ensureTicking();
    else if (this.isIdleAnimationActive()) this.ensureTicking(); // keep idling
  };
}

/** Re-exported for shell wiring convenience. */
export type { PatronEraYear };

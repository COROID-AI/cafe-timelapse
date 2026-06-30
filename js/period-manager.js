/**
 * PeriodManager — registry and transition controller for time periods.
 *
 * Each period registers via `registerPeriod(year, setupFn, teardownFn)`.
 * `transitionTo(year)` performs a polished crossfade transition:
 *   - The outgoing period group fades OUT (opacity lerp → 0)
 *   - The incoming period group fades IN (opacity lerp → 1)
 *   - Audio crossfades in parallel via AudioManager.playMusicForPeriod()
 * Both fades run over ~1.5s and are synchronized through a promise/async flow.
 */

import * as THREE from "three";
import { TRANSITION_CONFIG } from "./config.js";

export class PeriodManager {
  /**
   * @param {THREE.Scene} scene       — the shared Three.js scene.
   * @param {object}      options     — optional config:
   *   { audioManager, onTransitionStart, onTransitionEnd }
   */
  constructor(scene, options = {}) {
    this.scene = scene;
    this.hooks = options;
    /** @type {import('./audio-manager.js').AudioManager|null} */
    this.audioManager = options.audioManager || null;

    /** Map<year, { setup, teardown, group }> */
    this.periods = new Map();

    /** Currently active year (null until first transition). */
    this.currentYear = null;

    /** The THREE.Group holding the current period's content. */
    this.currentGroup = null;

    /** Whether a transition is in progress. */
    this.isTransitioning = false;

    /** Cached original material opacity/transparent state for fade restore. */
    this._materialCache = new WeakMap();
  }

  /**
   * Register a time period with its setup and teardown functions.
   *
   * @param {number}   year       — e.g. 1945, 1965, ...
   * @param {function} setupFn    — (scene, group) => void  Adds period content.
   * @param {function} teardownFn — (scene, group) => void  Removes / disposes content.
   */
  registerPeriod(year, setupFn, teardownFn) {
    if (typeof setupFn !== "function" || typeof teardownFn !== "function") {
      throw new Error(`Period ${year}: setupFn and teardownFn must be functions.`);
    }
    this.periods.set(year, { setup: setupFn, teardown: teardownFn, group: null });
  }

  /**
   * Immediately activate a period without a fade transition (initial load).
   * @param {number} year
   */
  activateImmediately(year) {
    const period = this.periods.get(year);
    if (!period) {
      console.warn(`Period ${year} is not registered. Skipping activation.`);
      return;
    }

    // Tear down existing period if any.
    if (this.currentGroup && this.currentYear !== null) {
      const oldPeriod = this.periods.get(this.currentYear);
      if (oldPeriod) {
        oldPeriod.teardown(this.scene, this.currentGroup);
        this.scene.remove(this.currentGroup);
      }
    }

    // Set up new period.
    const group = new THREE.Group();
    group.name = `period-${year}`;
    period.setup(this.scene, group);
    period.group = group;
    this.scene.add(group);

    this.currentYear = year;
    this.currentGroup = group;

    // Start audio for the initial period (no crossfade on first load).
    if (this.audioManager) {
      this.audioManager.playMusicForPeriod(year).catch(() => {});
    }
  }

  /**
   * Transition to a target year with a synchronized visual + audio crossfade.
   *
   * Flow (all driven by async/await + promises):
   *   1. Invoke audioManager.playMusicForPeriod(toYear) — starts audio crossfade.
   *   2. Build the incoming group (off-screen at opacity 0).
   *   3. Lerp the outgoing group opacity 1 → 0 AND incoming 0 → 1 in parallel.
   *   4. Tear down + dispose the outgoing group once it is fully faded.
   *
   * @param {number} year
   * @returns {Promise<void>}
   */
  async transitionTo(year) {
    // No-op if same period or not registered.
    if (year === this.currentYear) return;
    const period = this.periods.get(year);
    if (!period) {
      console.warn(`Period ${year} is not registered. Cannot transition.`);
      return;
    }
    // Queue if a transition is already running.
    if (this.isTransitioning) {
      await this._waitForIdle();
      // Re-check after waiting — the queued target may have changed.
      if (year === this.currentYear) return;
    }

    this.isTransitioning = true;
    if (this.hooks.onTransitionStart) {
      this.hooks.onTransitionStart(this.currentYear, year);
    }

    const outgoingGroup = this.currentGroup;
    const outgoingYear = this.currentYear;

    // ── 1. Kick off the audio crossfade (runs in parallel with visuals). ──
    const audioPromise = this.audioManager
      ? this.audioManager.playMusicForPeriod(year)
      : Promise.resolve();

    // ── 2. Build the incoming group and start it fully transparent. ──
    const incomingGroup = new THREE.Group();
    incomingGroup.name = `period-${year}`;
    period.setup(this.scene, incomingGroup);
    period.group = incomingGroup;
    this._setGroupOpacity(incomingGroup, 0);
    this.scene.add(incomingGroup);

    // ── 3. Parallel opacity lerp: outgoing 1→0, incoming 0→1. ──
    const totalDuration =
      TRANSITION_CONFIG.fadeOutDuration + TRANSITION_CONFIG.fadeInDuration;
    await this._crossfadeGroups(outgoingGroup, incomingGroup, totalDuration);

    // ── 4. Tear down + dispose the outgoing group. ──
    if (outgoingGroup && outgoingYear !== null) {
      const oldPeriod = this.periods.get(outgoingYear);
      if (oldPeriod) {
        oldPeriod.teardown(this.scene, outgoingGroup);
      }
      this.scene.remove(outgoingGroup);
    }

    // Ensure the incoming group is fully opaque (restore material flags).
    this._setGroupOpacity(incomingGroup, 1);

    this.currentYear = year;
    this.currentGroup = incomingGroup;

    // Await the audio crossfade so the promise flow stays synchronized.
    await audioPromise;

    this.isTransitioning = false;
    if (this.hooks.onTransitionEnd) {
      this.hooks.onTransitionEnd(year);
    }
  }

  /**
   * Crossfade two groups by lerping their opacity over `duration` ms.
   * Both groups are animated simultaneously for a smooth blend.
   *
   * @param {THREE.Group} outgoing
   * @param {THREE.Group} incoming
   * @param {number} duration — milliseconds
   * @returns {Promise<void>}
   */
  _crossfadeGroups(outgoing, incoming, duration) {
    return new Promise((resolve) => {
      const start = performance.now();

      const step = (now) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        // Ease-in-out for a more polished feel.
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

        if (outgoing) this._setGroupOpacity(outgoing, 1 - eased);
        this._setGroupOpacity(incoming, eased);

        if (t < 1) {
          requestAnimationFrame(step);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  /**
   * Set the opacity of every mesh material in a group (and its children).
   * Caches the original transparent/opacity state so it can be restored.
   *
   * @param {THREE.Group} group
   * @param {number} opacity — target opacity (0..1)
   */
  _setGroupOpacity(group, opacity) {
    if (!group) return;
    group.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat) => {
        // Cache original state once.
        if (!this._materialCache.has(mat)) {
          this._materialCache.set(mat, {
            opacity: mat.opacity,
            transparent: mat.transparent,
          });
        }
        mat.transparent = opacity < 1 || mat.transparent;
        mat.opacity = opacity;
        mat.needsUpdate = true;
      });
    });
  }

  /**
   * Restore a group's materials to their cached (pre-fade) state.
   * @param {THREE.Group} group
   */
  _restoreGroupOpacity(group) {
    if (!group) return;
    group.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((mat) => {
        const cached = this._materialCache.get(mat);
        if (cached) {
          mat.opacity = cached.opacity;
          mat.transparent = cached.transparent;
          mat.needsUpdate = true;
        }
      });
    });
  }

  /**
   * Returns a Promise that resolves once `isTransitioning` becomes false.
   */
  _waitForIdle() {
    return new Promise((resolve) => {
      const check = () => {
        if (!this.isTransitioning) resolve();
        else setTimeout(check, 50);
      };
      check();
    });
  }

  /**
   * Called every frame by SceneManager. Kept for backwards compatibility —
   * the opacity-lerp transition no longer needs a camera-facing overlay.
   */
  updateOverlay(_camera) {
    /* no-op: transitions now use per-group opacity lerp */
  }
}

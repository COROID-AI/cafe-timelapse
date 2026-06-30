/**
 * PeriodManager — registry and transition controller for time periods.
 *
 * Each period registers via `registerPeriod(year, setupFn, teardownFn)`.
 * `transitionTo(year)` performs a fade-out → swap → fade-in transition
 * between the current period and the target.
 */

import * as THREE from "three";
import { TRANSITION_CONFIG } from "./config.js";

export class PeriodManager {
  /**
   * @param {THREE.Scene} scene  — the shared Three.js scene.
   * @param {object}      hooks  — optional callbacks: { onTransitionStart, onTransitionEnd }
   */
  constructor(scene, hooks = {}) {
    this.scene = scene;
    this.hooks = hooks;

    /** Map<year, { setup, teardown, group }> */
    this.periods = new Map();

    /** Currently active year (null until first transition). */
    this.currentYear = null;

    /** The THREE.Group holding the current period's content. */
    this.currentGroup = null;

    /** Whether a transition is in progress. */
    this.isTransitioning = false;

    /** Fade overlay mesh used for crossfade transitions. */
    this._fadeOverlay = this._createFadeOverlay();
    this.scene.add(this._fadeOverlay);
  }

  /**
   * Create a full-screen black plane positioned just in front of the camera
   * for fade transitions. Starts fully transparent.
   */
  _createFadeOverlay() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    const overlay = new THREE.Mesh(geo, mat);
    overlay.name = "fade-overlay";
    overlay.renderOrder = 9999;
    overlay.frustumCulled = false;
    return overlay;
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
   * Immediately activate a period without a fade transition (used for initial load).
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
  }

  /**
   * Transition to a target year with a fade-out → swap → fade-in sequence.
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
    }

    this.isTransitioning = true;
    if (this.hooks.onTransitionStart) {
      this.hooks.onTransitionStart(this.currentYear, year);
    }

    // Phase 1: Fade out.
    await this._fade(0, 1, TRANSITION_CONFIG.fadeOutDuration);

    // Phase 2: Swap content.
    this._swapPeriods(year);

    // Phase 3: Fade in.
    await this._fade(1, 0, TRANSITION_CONFIG.fadeInDuration);

    this.isTransitioning = false;
    if (this.hooks.onTransitionEnd) {
      this.hooks.onTransitionEnd(year);
    }
  }

  /**
   * Tear down the old period group and set up the new one.
   */
  _swapPeriods(year) {
    // Remove old.
    if (this.currentGroup && this.currentYear !== null) {
      const oldPeriod = this.periods.get(this.currentYear);
      if (oldPeriod) {
        oldPeriod.teardown(this.scene, this.currentGroup);
        this.scene.remove(this.currentGroup);
      }
    }

    // Add new.
    const period = this.periods.get(year);
    const group = new THREE.Group();
    group.name = `period-${year}`;
    period.setup(this.scene, group);
    period.group = group;
    this.scene.add(group);

    this.currentYear = year;
    this.currentGroup = group;
  }

  /**
   * Animate the fade overlay opacity from `from` to `to` over `duration` ms.
   * @returns {Promise<void>}
   */
  _fade(from, to, duration) {
    return new Promise((resolve) => {
      const start = performance.now();
      const mat = this._fadeOverlay.material;

      const step = (now) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        mat.opacity = from + (to - from) * t;

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
   * Called every frame by SceneManager to keep the fade overlay in front
   * of the camera.
   * @param {THREE.Camera} camera
   */
  updateOverlay(camera) {
    // Position overlay directly in front of the camera.
    const dist = 0.5;
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    this._fadeOverlay.position.copy(camera.position).add(dir.multiplyScalar(dist));
    this._fadeOverlay.quaternion.copy(camera.quaternion);
  }
}

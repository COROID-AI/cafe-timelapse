/**
 * PeriodManager — orchestrates era content lifecycle and cross-fade transitions.
 *
 * Subscribes to the timeline slider's `change` event, builds the 3D content
 * for the selected era from its PeriodPackage descriptor, and swaps it in with
 * a smooth 1.5-second cross-fade.  Outgoing era content is fully disposed
 * (geometries + materials + textures) after the fade to prevent GPU memory
 * growth across repeated era switches.
 *
 * @module managers/PeriodManager
 */

import { PERIOD_YEARS, validatePeriodPackage } from '@/contracts/PeriodPackage.js';
import period1945 from '@/eras/1945.js';
import period1965 from '@/eras/1965.js';
import period1985 from '@/eras/1985.js';
import period2005 from '@/eras/2005.js';
import period2025 from '@/eras/2025.js';

/** Cross-fade duration in milliseconds (acceptance criterion: 1.5s). */
const CROSSFADE_DURATION = 1500;

/** Easing function (ease-in-out cubic). */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Map of year → PeriodPackage descriptor.
 *
 * @type {Record<number, Object>}
 */
const ERA_PACKAGES = {
  1945: period1945,
  1965: period1965,
  1985: period1985,
  2005: period2005,
  2025: period2025,
};

/**
 * PeriodManager orchestrates era content mounting, cross-fade transitions, and
 * GPU resource disposal.
 */
export class PeriodManager {
  /**
   * @param {Object} options
   * @param {EventTarget} options.timeline - The TimelineSlider instance.
   * @param {Object} options.sceneApi - The `window.CafeScene` API object.
   * @param {number} [options.initialYear] - Year to mount on construction.
   * @param {number} [options.duration] - Cross-fade duration override (ms).
   */
  constructor({ timeline, sceneApi, initialYear, duration } = {}) {
    if (!timeline || !sceneApi) {
      throw new Error('PeriodManager requires timeline and sceneApi options');
    }

    this.timeline = timeline;
    this.sceneApi = sceneApi;
    this.duration = duration ?? CROSSFADE_DURATION;

    /** @type {number|null} Currently active year. */
    this.activeYear = null;

    /** @type {THREE.Object3D|null} Currently mounted era group. */
    this._activeGroup = null;

    /** @type {boolean} Whether a transition is in progress. */
    this._transitioning = false;

    // Validate all packages at construction time (catches missing fields early).
    this._validateAllPackages();

    // Subscribe to timeline changes.
    this._onChange = this._onChange.bind(this);
    this.timeline.addEventListener('change', this._onChange);

    // Mount the initial era.
    const startYear = initialYear ?? timeline.getYear?.() ?? PERIOD_YEARS[0];
    this._mountImmediate(startYear);
  }

  /**
   * Validates all era packages against the PeriodPackage schema.  Logs
   * warnings for missing fields but does not throw (graceful degradation).
   * @private
   */
  _validateAllPackages() {
    for (const year of PERIOD_YEARS) {
      const pkg = ERA_PACKAGES[year];
      if (!pkg) {
        console.warn(`[PeriodManager] No package found for year ${year}`);
        continue;
      }
      const result = validatePeriodPackage(pkg);
      if (!result.valid) {
        if (result.missing.length > 0) {
          console.warn(`[PeriodManager] Package ${year} missing fields: ${result.missing.join(', ')}`);
        }
        if (result.errors.length > 0) {
          console.warn(`[PeriodManager] Package ${year} validation errors: ${result.errors.join('; ')}`);
        }
      }
    }
  }

  /**
   * Handles timeline `change` events.  Ignores re-selection of the current
   * year and debounces rapid switches during an active transition.
   *
   * @private
   * @param {CustomEvent} event
   */
  _onChange(event) {
    const { year } = event.detail;
    if (year === this.activeYear) return;
    // If a transition is in progress, we still accept the new target — the
    // cross-fade logic handles mid-transition swaps gracefully.
    this.transitionTo(year);
  }

  /**
   * Mounts an era immediately (no cross-fade).  Used for initial load.
   *
   * @private
   * @param {number} year
   */
  _mountImmediate(year) {
    const pkg = ERA_PACKAGES[year];
    if (!pkg) {
      console.warn(`[PeriodManager] Unknown year ${year}, skipping`);
      return;
    }
    const group = pkg.build();
    this.sceneApi.mountEra(group);
    this.sceneApi.setActiveEra(group);
    this.sceneApi.setEraOpacity(1);
    this._activeGroup = group;
    this.activeYear = year;
  }

  /**
   * Transitions to a new era with a 1.5-second cross-fade.
   *
   * Builds the incoming era group, fades the outgoing group from 1→0 while
   * fading the incoming group from 0→1, then disposes the outgoing group.
   *
   * @param {number} year - The target year.
   * @returns {Promise<void>} Resolves when the transition completes.
   */
  transitionTo(year) {
    const pkg = ERA_PACKAGES[year];
    if (!pkg) {
      console.warn(`[PeriodManager] Unknown year ${year}, skipping`);
      return Promise.resolve();
    }

    // If already transitioning, cancel the previous animation frame and
    // dispose the orphaned incoming group so GPU memory doesn't accumulate.
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
      if (this._pendingIncoming) {
        this.sceneApi.disposeEraChild(this._pendingIncoming);
        this._pendingIncoming = null;
      }
      if (this._pendingResolve) {
        this._pendingResolve();
        this._pendingResolve = null;
      }
    }

    const outgoing = this._activeGroup;
    const incoming = pkg.build();

    // Add the incoming group to the scene, starting fully transparent.
    this.sceneApi.mountEraChild(incoming);
    this._setGroupOpacity(incoming, 0);

    this._transitioning = true;
    this._pendingYear = year;
    this._pendingIncoming = incoming;

    return new Promise((resolve) => {
      this._pendingResolve = resolve;
      const startTime = performance.now();
      const duration = this.duration;

      const animate = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(t);

        // Cross-fade: incoming 0→1, outgoing 1→0.
        this._setGroupOpacity(incoming, eased);
        this._setGroupOpacity(outgoing, 1 - eased);

        if (t < 1) {
          this._rafId = requestAnimationFrame(animate);
        } else {
          // Transition complete: dispose outgoing, activate incoming.
          this._rafId = null;
          if (outgoing) {
            this.sceneApi.disposeEraChild(outgoing);
          }
          this.sceneApi.setActiveEra(incoming);
          this._setGroupOpacity(incoming, 1);
          this._activeGroup = incoming;
          this.activeYear = year;
          this._transitioning = false;
          this._pendingIncoming = null;
          this._pendingResolve = null;
          resolve();
        }
      };

      this._rafId = requestAnimationFrame(animate);
    });
  }

  /**
   * Sets the opacity of every mesh inside a specific group subtree.
   *
   * @private
   * @param {THREE.Object3D|null} group
   * @param {number} opacity
   */
  _setGroupOpacity(group, opacity) {
    if (!group) return;
    const o = Math.max(0, Math.min(1, opacity));
    group.traverse((node) => {
      if (!node.isMesh) return;
      const mat = node.material;
      const apply = (m) => {
        if (!m) return;
        m.transparent = o < 1 || m.transparent;
        m.opacity = o;
        m.depthWrite = o >= 1;
      };
      if (Array.isArray(mat)) mat.forEach(apply);
      else apply(mat);
    });
  }

  /**
   * Returns the PeriodPackage descriptor for a given year.
   *
   * @param {number} year
   * @returns {Object|null}
   */
  getPackage(year) {
    return ERA_PACKAGES[year] ?? null;
  }

  /**
   * Returns all era package descriptors keyed by year.
   * @returns {Record<number, Object>}
   */
  getAllPackages() {
    return { ...ERA_PACKAGES };
  }

  /**
   * Returns whether a cross-fade transition is currently in progress.
   * @returns {boolean}
   */
  isTransitioning() {
    return this._transitioning;
  }

  /**
   * Tears down the manager: cancels any active transition, disposes the
   * current era content, and removes the timeline event listener.
   *
   * @returns {void}
   */
  dispose() {
    if (this._rafId != null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    this.timeline.removeEventListener('change', this._onChange);
    if (this._activeGroup) {
      this.sceneApi.disposeEraChild(this._activeGroup);
      this._activeGroup = null;
    }
    this.activeYear = null;
    this._transitioning = false;
  }
}

export default PeriodManager;

/**
 * @file js/period-manager.js
 * @description
 * PeriodManager — orchestrates era transitions for the café timelapse.
 *
 * Responsibilities:
 *   1. Dynamically load the correct era module via import() (code-splitting
 *      heavy textures/audio per era).
 *   2. Validate the returned PeriodPackage against the contract.
 *   3. Run a deterministic, visually-smooth transform:
 *        a. Fade out the current era (opacity / lighting dim).
 *        b. Swap meshes and textures.
 *        c. Crossfade audio (old music fades out, new music fades in).
 *        d. Fade in the new era.
 *   4. Expose lifecycle events: onYearChange, onTransformProgress,
 *      onTransformComplete, onTransformError.
 *
 * The manager is engine-agnostic: it accepts an `adapter` object that implements
 * the rendering and audio operations. In production this is a Three.js adapter;
 * in tests a no-op or mock adapter is used.
 *
 * Audio-bus integration: the default singleton instance bridges its `yearChange`
 * lifecycle event to the AudioManager (feature/coroid-c1c7f1-build-audio-bus-sfx),
 * so production code (js/main.js) only has to call `periodManager.setYear()`.
 * Test instances created via `new PeriodManager({...})` start with a clean,
 * un-bridged listener set so audio wiring does not leak into unit tests.
 */

import { validatePeriodPackage } from '../src/contracts/PeriodPackage.js';
import audioManager from './audio-manager.js';

/**
 * Map of supported years to their dynamic import factory functions.
 * Using dynamic import() ensures each era's heavy assets are code-split.
 * @type {Record<number, () => Promise<{ createPeriodPackage: () => PeriodPackage }>>}
 */
const ERA_LOADERS = Object.freeze({
  1945: () => import('./period1945.js'),
  1965: () => import('./period1965.js'),
  1985: () => import('./period1985.js'),
  2005: () => import('./period2005.js'),
  2025: () => import('./period2025.js'),
});

/**
 * The set of supported era years.
 * @type {readonly number[]}
 */
export const SUPPORTED_YEARS = Object.freeze(Object.keys(ERA_LOADERS).map(Number));

/**
 * Default transform duration in milliseconds.
 * @type {number}
 */
const DEFAULT_TRANSFORM_DURATION = 1200;

/**
 * The era the manager reports before any transform has run.
 * @type {number}
 */
const DEFAULT_INITIAL_YEAR = 1945;

/**
 * A no-op rendering/audio adapter. In production, inject a Three.js adapter.
 * @typedef {Object} PeriodManagerAdapter
 * @property {(pkg: PeriodPackage) => Promise<void>} applyMeshes       — swap meshes/textures
 * @property {(pkg: PeriodPackage) => Promise<void>} applyLighting      — apply lighting config
 * @property {(pkg: PeriodPackage) => Promise<void>} applySignage      — apply signage
 * @property {(pkg: PeriodPackage) => Promise<void>} applyDecor        — apply decor
 * @property {(opacity: number) => void} setFadeOpacity                — set global fade overlay 0–1
 * @property {(pkg: PeriodPackage) => Promise<void>} startMusic          — start/crossfade music
 * @property {(pkg: PeriodPackage) => Promise<void>} startSfx            — start ambient SFX
 * @property {() => Promise<void>} stopAudio                            — stop all audio
 */

/**
 * Default no-op adapter (does nothing). Override with a real adapter in production.
 * @type {PeriodManagerAdapter}
 */
const NOOP_ADAPTER = Object.freeze({
  async applyMeshes() {},
  async applyLighting() {},
  async applySignage() {},
  async applyDecor() {},
  setFadeOpacity() {},
  async startMusic() {},
  async startSfx() {},
  async stopAudio() {},
});

/**
 * PeriodManager orchestrates era transitions for the café scene.
 */
export class PeriodManager {
  /**
   * @param {Object} [options]
   * @param {PeriodManagerAdapter} [options.adapter] — rendering/audio adapter
   * @param {number} [options.transformDuration] — transform duration in ms
   * @param {number} [options.initialYear] — year reported before any transform (default 1945)
   */
  constructor({ adapter = NOOP_ADAPTER, transformDuration = DEFAULT_TRANSFORM_DURATION, initialYear = DEFAULT_INITIAL_YEAR } = {}) {
    /** @type {PeriodManagerAdapter} */
    this._adapter = adapter;
    /** @type {number} */
    this._transformDuration = transformDuration;
    /** @type {number} */
    this._initialYear = initialYear;
    /** @type {number|null} */
    this._currentYear = null;
    /** @type {PeriodPackage|null} */
    this._currentPackage = null;
    /** @type {boolean} */
    this._transforming = false;
    /** @type {Map<string, Set<Function>>} */
    this._listeners = new Map();
  }

  /**
   * The currently active year, or null if no era has been loaded yet.
   * @returns {number|null}
   */
  get currentYear() {
    return this._currentYear;
  }

  /**
   * Replace the adapter at runtime. Used by main.js to inject the Three.js
   * SceneRenderer adapter after it initialises.
   * @param {PeriodManagerAdapter} adapter
   */
  setAdapter(adapter) {
    this._adapter = adapter;
  }

  /**
   * The currently active PeriodPackage, or null.
   * @returns {PeriodPackage|null}
   */
  get currentPackage() {
    return this._currentPackage;
  }

  /**
   * Whether a transform is currently in progress.
   * @returns {boolean}
   */
  get isTransforming() {
    return this._transforming;
  }

  /**
   * Get the current year. Before any transform has run, returns the initial
   * year (1945 by default) so callers like the AudioManager can play music for
   * the default era on startup.
   * @returns {number}
   */
  getYear() {
    return this._currentYear ?? this._initialYear;
  }

  /**
   * Register a callback for a lifecycle event.
   *
   * Supported events:
   *   - 'yearChange'        — fired when the target year changes (before transform starts)
   *   - 'transformProgress' — fired during transform with progress 0–1
   *   - 'transformComplete' — fired when the transform finishes successfully
   *   - 'transformError'    — fired if the transform fails
   *
   * @param {'yearChange'|'transformProgress'|'transformComplete'|'transformError'} event
   * @param {Function} callback
   * @returns {() => void} unsubscribe function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  }

  /**
   * Convenience alias for `on('yearChange', cb)`.
   * @param {Function} callback
   * @returns {() => void}
   */
  onYearChange(callback) {
    return this.on('yearChange', callback);
  }

  /**
   * Convenience alias for `on('transformProgress', cb)`.
   * @param {Function} callback
   * @returns {() => void}
   */
  onTransformProgress(callback) {
    return this.on('transformProgress', callback);
  }

  /**
   * Convenience alias for `on('transformComplete', cb)`.
   * @param {Function} callback
   * @returns {() => void}
   */
  onTransformComplete(callback) {
    return this.on('transformComplete', callback);
  }

  /**
   * Convenience alias for `on('transformError', cb)`.
   * @param {Function} callback
   * @returns {() => void}
   */
  onTransformError(callback) {
    return this.on('transformError', callback);
  }

  /**
   * Emit an event to all registered listeners.
   * @param {string} event
   * @param {*} data
   * @private
   */
  _emit(event, data) {
    const set = this._listeners.get(event);
    if (set) {
      for (const cb of set) {
        try {
          cb(data);
        } catch (err) {
          // Listener errors should not break the transform pipeline
          console.error(`[PeriodManager] listener error for "${event}":`, err);
        }
      }
    }
  }

  /**
   * Check whether a year is supported.
   * @param {number} year
   * @returns {boolean}
   */
  isSupportedYear(year) {
    return year in ERA_LOADERS;
  }

  /**
   * Load and validate a period package for the given year without transforming.
   *
   * Uses dynamic import() to code-split each era's assets.
   *
   * @param {number} year
   * @returns {Promise<PeriodPackage>}
   * @throws {Error} if the year is unsupported or the package fails validation
   */
  async loadPeriodPackage(year) {
    if (!this.isSupportedYear(year)) {
      throw new Error(`PeriodManager: unsupported year ${year}. Supported: ${SUPPORTED_YEARS.join(', ')}`);
    }

    const eraModule = await ERA_LOADERS[year]();

    if (typeof eraModule.createPeriodPackage !== 'function') {
      throw new Error(
        `PeriodManager: era module for ${year} does not export createPeriodPackage()`,
      );
    }

    const pkg = eraModule.createPeriodPackage();

    // Fail fast: validate before the transform begins
    validatePeriodPackage(pkg);

    return pkg;
  }

  /**
   * Transition the café to the given year.
   *
   * Runs a deterministic transform:
   *   1. Fade out current era (setFadeOpacity 1→0 on old, or dim).
   *   2. Swap meshes, textures, decor, signage, lighting.
   *   3. Crossfade audio (stop old, start new with ramp).
   *   4. Fade in new era.
   *
   * Returns a promise that resolves after the transform completes.
   *
   * @param {number} year — the target era year
   * @returns {Promise<PeriodPackage>} — resolves with the new package after transform
   * @throws {Error} if the year is unsupported or validation fails
   */
  async setYear(year) {
    if (!this.isSupportedYear(year)) {
      const err = new Error(
        `PeriodManager: unsupported year ${year}. Supported: ${SUPPORTED_YEARS.join(', ')}`,
      );
      this._emit('transformError', { year, error: err });
      throw err;
    }

    // Prevent overlapping transforms
    if (this._transforming) {
      throw new Error(
        `PeriodManager: transform already in progress (target: ${this._currentYear} → ${year})`,
      );
    }

    this._transforming = true;
    const previousYear = this._currentYear;

    // Emit yearChange before starting the transform
    this._emit('yearChange', { from: previousYear, to: year });

    try {
      // 1. Dynamically load + validate the new period package
      const newPackage = await this.loadPeriodPackage(year);

      // 2. Fade out the current era
      await this._runFade(1, 0, 0.45, (opacity) => {
        this._adapter.setFadeOpacity(opacity);
        this._emit('transformProgress', { phase: 'fadeOut', progress: 1 - opacity });
      });

      // 3. Stop current audio (will crossfade in the new one)
      if (this._currentPackage) {
        await this._adapter.stopAudio();
      }

      // 4. Swap meshes, textures, decor, signage, lighting
      await this._adapter.applyMeshes(newPackage);
      this._emit('transformProgress', { phase: 'swap', progress: 0.5 });

      await this._adapter.applyDecor(newPackage);
      await this._adapter.applySignage(newPackage);
      await this._adapter.applyLighting(newPackage);

      // 5. Crossfade audio — start new music and SFX
      await this._adapter.startMusic(newPackage);
      await this._adapter.startSfx(newPackage);

      this._emit('transformProgress', { phase: 'audioCrossfade', progress: 0.6 });

      // 6. Fade in the new era
      await this._runFade(0, 1, 0.55, (opacity) => {
        this._adapter.setFadeOpacity(opacity);
        this._emit('transformProgress', { phase: 'fadeIn', progress: 0.6 + opacity * 0.4 });
      });

      // 7. Commit the new state
      this._currentYear = year;
      this._currentPackage = newPackage;

      this._emit('transformProgress', { phase: 'done', progress: 1 });
      this._emit('transformComplete', { year, package: newPackage });

      return newPackage;
    } catch (err) {
      this._emit('transformError', { year, error: err });
      throw err;
    } finally {
      this._transforming = false;
    }
  }

  /**
   * Run an animated fade from `from` to `to` over a fraction of the total duration.
   *
   * This is a deterministic step-wise animation. In production the adapter's
   * requestAnimationFrame loop drives the actual interpolation; here we use
   * a promise-based timing approach that is testable without a real renderer.
   *
   * @param {number} from    — start opacity
   * @param {number} to      — end opacity
   * @param {number} fraction — fraction of total transform duration for this phase
   * @param {(opacity: number) => void} onUpdate
   * @returns {Promise<void>}
   * @private
   */
  async _runFade(from, to, fraction, onUpdate) {
    const phaseDuration = this._transformDuration * fraction;
    const steps = Math.max(1, Math.floor(phaseDuration / 16)); // ~60fps
    const stepDuration = phaseDuration / steps;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Ease-in-out cubic for smooth visual transition
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      const opacity = from + (to - from) * eased;
      onUpdate(opacity);
      if (i < steps) {
        await this._delay(stepDuration);
      }
    }
  }

  /**
   * Promise-based delay.
   * @param {number} ms
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Default singleton instance for production use.
 *
 * Bridges the `yearChange` lifecycle event to the AudioManager so that the
 * audio bus crossfades whenever the era changes — preserving the
 * feature/coroid-c1c7f1-build-audio-bus-sfx audio integration. Production
 * code (js/main.js) imports this singleton and calls `setYear()` /
 * `getYear()`; unit tests instantiate `new PeriodManager({...})` directly
 * to keep listener sets isolated from audio wiring.
 */
const periodManager = new PeriodManager();

// Wire the audio bus onto the singleton only.
periodManager.onYearChange(({ from, to }) => {
  audioManager.onYearChange(to, from);
});

export default periodManager;

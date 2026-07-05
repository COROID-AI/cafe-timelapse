import { CafeSceneRenderer } from './scene-renderer.js';
import { TimelineSlider } from './timeline-slider.js';

/**
 * Application entry point for the Café Timelapse shell.
 *
 * Boots the persistent 3D café scene (room shell, navigation, collision,
 * lighting) and the top-of-screen era timeline, then exposes a small public
 * API on `window.CafeScene` that downstream period-content layers
 * (PeriodManager, era packages, SFX, etc.) build on top of.
 */

const container = document.getElementById('app');
const renderer = new CafeSceneRenderer(container);

const timeline = new TimelineSlider({ container, initialYear: 1945 });

/**
 * Public scene API exposed for era-content layers (PeriodManager, etc.).
 *
 * The persistent café shell — walls, floor, ceiling, windows, counter, door,
 * floor lamp, lighting, camera navigation, and collision — is managed by the
 * {@link CafeSceneRenderer} and is never torn down when eras change. Only the
 * *era content* (furniture, decor, equipment, signage, …) is swapped via the
 * `mountEra` / `unmountEra` helpers below.
 *
 * @namespace CafeScene
 * @property {number} activeYear - The currently selected timeline year.
 * @property {number[]} years    - The ordered list of selectable era years.
 */
window.CafeScene = {
  years: timeline.years.slice(),
  activeYear: timeline.getYear(),

  /**
   * Mount a period package's 3D content group into the persistent café scene.
   *
   * Any previously mounted era is automatically unmounted (and its GPU
   * resources disposed) first, so calling this performs a clean, atomic swap.
   * The persistent shell is untouched.
   *
   * @example
   * const group = new THREE.Group();
   * // …add period furniture, equipment, signage, patrons…
   * window.CafeScene.mountEra(group);
   *
   * @param {THREE.Object3D} eraGroup - The Three.js group holding all
   *   period-specific meshes/decor for the selected year.
   * @returns {void}
   */
  mountEra(eraGroup) {
    return renderer.mountEra(eraGroup);
  },

  /**
   * Unmount (remove + dispose) the currently mounted era content group, if any.
   *
   * Safe to call when no era is mounted (no-op).
   *
   * @returns {void}
   */
  unmountEra() {
    return renderer.unmountEra();
  },
};

timeline.addEventListener('change', (event) => {
  const { year } = event.detail;
  window.CafeScene.activeYear = year;
  // Era content packages are authored + wired by a downstream task
  // (PeriodManager). The shell simply records the selection here.
});

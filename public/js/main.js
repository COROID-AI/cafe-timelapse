import { CafeSceneRenderer } from './scene-renderer.js';
import { TimelineSlider } from './timeline-slider.js';
import { PeriodManager } from '@/managers/PeriodManager.js';
import { AudioManager } from './audio-manager.js';
import { Inspector } from './inspector.js';

/**
 * Application entry point for the Café Timelapse shell.
 *
 * Boots the persistent 3D café scene (room shell, navigation, collision,
 * lighting) and the top-of-screen era timeline, then exposes a small public
 * API on `window.CafeScene` that downstream period-content layers
 * (PeriodManager, era packages, SFX, etc.) build on top of.
 */

// --- Boot resilience --------------------------------------------------------
// The boot sequence is wrapped so that a failure (e.g. unavailable WebGL in a
// headless screenshot environment, a module error) never leaves a blank page.
// The loading overlay added in index.html is visible until the scene is ready;
// on error it shows a readable message instead of an empty screen.
const bootEl = document.getElementById('cafe-boot');
const bootStatusEl = document.getElementById('cafe-boot-status');
function hideBootOverlay() {
  if (!bootEl) return;
  bootEl.style.opacity = '0';
  const el = bootEl;
  setTimeout(() => el.remove(), 600);
}
function showBootError(message) {
  if (bootEl) {
    bootEl.classList.add('cafe-boot-error');
    if (bootStatusEl) bootStatusEl.textContent = message;
  }
  // eslint-disable-next-line no-console
  console.error('[Café Timelapse]', message);
}

/**
 * Detects whether a WebGL context can be created at all.  In some headless /
 * screenshot environments WebGL is unavailable, which would otherwise cause
 * THREE.WebGLRenderer to throw synchronously and leave a blank page.
 * @returns {boolean}
 */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

if (!isWebGLAvailable()) {
  showBootError(
    'This scene requires WebGL, which is unavailable in the current browser or environment.',
  );
} else {
  try {

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

  /**
   * Returns the currently mounted era content group, or null.
   * @returns {THREE.Object3D | null}
   */
  getMountedEra() {
    return renderer.getMountedEra();
  },

  /**
   * Returns the persistent era group layer.  Used by PeriodManager for
   * cross-fade transitions.
   * @returns {THREE.Group}
   */
  getEraGroup() {
    return renderer.getEraGroup();
  },

  /**
   * Adds an era child group without removing the current one (for cross-fade).
   * @param {THREE.Object3D} group
   * @returns {void}
   */
  mountEraChild(group) {
    return renderer.mountEraChild(group);
  },

  /**
   * Removes + disposes a specific era child group (post cross-fade cleanup).
   * @param {THREE.Object3D} group
   * @returns {void}
   */
  disposeEraChild(group) {
    return renderer.disposeEraChild(group);
  },

  /**
   * Designates a mounted group as the active era after a cross-fade.
   * @param {THREE.Object3D} group
   * @returns {void}
   */
  setActiveEra(group) {
    return renderer.setActiveEra(group);
  },

  /**
   * Sets the opacity of every mesh inside the era content layer for
   * cross-fade transitions.
   * @param {number} opacity - Target opacity in 0..1.
   * @returns {void}
   */
  setEraOpacity(opacity) {
    return renderer.setEraOpacity(opacity);
  },

  /**
   * Applies a per-era lighting profile to the persistent base lights so the
   * overall mood of the room visibly changes when the timeline slides.
   * @param {number} year
   * @returns {void}
   */
  applyLightingProfile(year) {
    return renderer.applyLightingProfile(year);
  },
};

/**
 * PeriodManager — subscribes to the timeline and orchestrates era content
 * mounting + 1.5s cross-fade transitions.  Mounts the initial era on
 * construction.
 */
const periodManager = new PeriodManager({
  timeline,
  sceneApi: window.CafeScene,
  initialYear: timeline.getYear(),
});

/**
 * Inspector — interactive hotspot markers + detail side panel.  Renders glowing
 * markers at key scene objects (menu board, coffee machine, music source,
 * counter technology, one patron) for the active era.  Hover shows a label;
 * click opens a side panel with an era-specific description, price list, or
 * product detail.  Markers are rebuilt on every era change.
 */
const inspector = new Inspector({
  camera: renderer.camera,
  domElement: renderer.renderer.domElement,
  scene: renderer.scene,
});
inspector.setEra(timeline.getYear());
renderer.addUpdateCallback(inspector.update);
window.CafeScene.inspector = inspector;

// Apply the initial era's distinct lighting profile.
window.CafeScene.applyLightingProfile(timeline.getYear());

// Keep activeYear in sync after each transition settles.
timeline.addEventListener('change', (event) => {
  const { year } = event.detail;
  window.CafeScene.activeYear = year;
  // Rebuild hotspot markers for the newly selected era.
  inspector.setEra(year);
  // Tune the base lighting mood for the new era.
  window.CafeScene.applyLightingProfile(year);
});

/**
 * AudioManager — layered soundscape (music + ambience + machine SFX) that
 * cross-fades with each era change.  Audio does not autoplay until the user
 * interacts with the page (browser autoplay policy).  Wrapped in try/catch so
 * an AudioContext failure (common in some headless environments) never breaks
 * the visual scene.
 */
let audioManager = null;
try {
  audioManager = new AudioManager({
    timeline,
    initialYear: timeline.getYear(),
  });
  // Expose on the public API for debugging / external control.
  window.CafeScene.audioManager = audioManager;
} catch (audioErr) {
  // eslint-disable-next-line no-console
  console.warn('[Café Timelapse] Audio unavailable; continuing without sound.', audioErr);
}

/**
 * Unlocks the AudioContext on the first user gesture.  Browsers block audio
 * playback until the user has interacted with the page (click, keypress, or
 * touch).  This listener fires once, resumes the context, and starts the
 * initial era's soundscape.
 */
const unlockAudio = () => {
  if (audioManager) audioManager.unlock();
  // Remove the listeners once unlocked — no need to keep firing.
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
  window.removeEventListener('touchstart', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);
window.addEventListener('touchstart', unlockAudio);

// --- Boot success: hide the loading overlay ---------------------------------
// The scene, timeline, period content, and inspector are all ready.  We defer
// the overlay removal by a couple of animation frames so the WebGL canvas has
// actually painted at least one frame before the overlay fades away — this
// guarantees a screenshot taken during fade-out sees the 3D scene, not a
// blank canvas mid-transition.
function _revealScene() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      hideBootOverlay();
    });
  });
}
_revealScene();

  } catch (bootErr) {
    // Any unexpected failure during scene construction (e.g. a geometry error,
    // a Three.js API mismatch) is surfaced as a readable message rather than a
    // perpetually-blank page with a frozen loading spinner.
    showBootError(
      'The scene failed to load: ' +
      (bootErr && bootErr.message ? bootErr.message : String(bootErr)),
    );
  }
} // end of WebGL-available boot block

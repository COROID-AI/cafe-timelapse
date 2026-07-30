/**
 * main.ts — application entrypoint.
 *
 * Initializes a Three.js renderer and drives the {@link SceneManager}, which
 * owns the persistent scene, per-era groups, and lighting environment.
 * Registers all era fragments then mounts the first era. The render loop
 * integrates with the manager via its `render` and `onResize` points.
 */
import { WebGLRenderer } from 'three';
import { getSceneManager } from './systems/SceneManager.js';
import { TransitionController } from './systems/TransitionController.js';
import { registerEraFragments } from './registry/eraFragments.js';
import { ERAS } from './data/eras.js';

function bootstrap(): void {
  const container =
    document.getElementById('app') ??
    document.body.appendChild(document.createElement('div'));

  // --- Renderer (the manager owns scene + camera) --------------------------
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // --- Register era fragments + mount the first era ------------------------
  // Side-effectful: populates the shared AssetRegistry for all six eras.
  registerEraFragments();

  const sceneManager = getSceneManager();
  // Wire the cross-fade transition controller so era changes animate smoothly
  // (fade + scale morph + camera dolly) instead of hard-cutting. The controller
  // self-registers as the manager's transition hook on construction.
  new TransitionController(sceneManager);
  sceneManager.setActiveEra(ERAS[0].year);

  // --- Resize ---------------------------------------------------------------
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    sceneManager.onResize(window.innerWidth, window.innerHeight);
  });

  // --- Render loop ----------------------------------------------------------
  function animate(): void {
    requestAnimationFrame(animate);
    sceneManager.render(renderer);
  }
  animate();
}

bootstrap();

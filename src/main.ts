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
import { registerEraFragments } from './registry/eraFragments.js';
import { ERAS } from './data/eras.js';
import {
  ERA_CHANGE_EVENT,
  TimelineSlider,
  type EraChangeEventDetail,
} from './ui/TimelineSlider.js';

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
  sceneManager.setActiveEra(ERAS[0].year);

  // --- Timeline UI (top bar) -----------------------------------------------
  // The slider overlays the canvas and emits eraChange on every selection.
  // We forward that event to SceneManager.setActiveEra (which drives the
  // transition controller via its hooks). The audio engine, when present,
  // can subscribe to the same eraChange event independently.
  const timeline = new TimelineSlider({ initialYear: ERAS[0].year }).mount(
    document.body,
  );
  timeline.element.addEventListener(
    ERA_CHANGE_EVENT,
    (e: Event) => {
      const { year } = (e as CustomEvent<EraChangeEventDetail>).detail;
      sceneManager.setActiveEra(year);
    },
  );

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

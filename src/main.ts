/**
 * main.ts — application entrypoint.
 *
 * Initializes a Three.js renderer, scene, and camera, registers all era
 * fragments, and renders a clearly non-black placeholder scene so `npm run dev`
 * shows a canvas immediately. Later tasks replace this placeholder with the
 * real SceneManager, navigation controls, and timeline UI.
 */
import {
  AmbientLight,
  Clock,
  DirectionalLight,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
} from 'three';
import { assetRegistry } from './registry/AssetRegistry.js';
import { registerEraFragments } from './registry/eraFragments.js';
import { ERAS } from './data/eras.js';
import { Navigation } from './systems/Navigation.js';

function bootstrap(): void {
  const container =
    document.getElementById('app') ??
    document.body.appendChild(document.createElement('div'));

  // --- Renderer -------------------------------------------------------------
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // --- Scene ----------------------------------------------------------------
  const scene = new Scene();

  // --- Camera ---------------------------------------------------------------
  const camera = new PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100,
  );
  camera.position.set(0, 2, 12);
  camera.lookAt(0, 0, 0);

  // --- Lighting -------------------------------------------------------------
  scene.add(new AmbientLight(0xffffff, 0.6));
  const key = new DirectionalLight(0xffffff, 1.4);
  key.position.set(5, 10, 7);
  scene.add(key);
  const fill = new DirectionalLight(0xffd9a0, 0.4);
  fill.position.set(-6, 4, -4);
  scene.add(fill);

  // --- Register era fragments + mount the first era -------------------------
  // Side-effectful: populates the shared AssetRegistry for all six eras.
  registerEraFragments();

  // Build and mount the placeholder fragments for the first era so the scene
  // is clearly non-black on load. Downstream tasks swap this for SceneManager.
  const firstEra = ERAS[0];
  for (const fragment of assetRegistry.buildFragmentsForEra(firstEra.year)) {
    scene.add(fragment);
  }

  // --- Navigation -----------------------------------------------------------
  // Orbit/pan/zoom rig clamped to the café interior, with a close-up inspection
  // mode. Listeners are wired to the renderer canvas.
  const nav = new Navigation({ camera, domElement: renderer.domElement });

  // --- Resize ---------------------------------------------------------------
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // --- Render loop ----------------------------------------------------------
  const clock = new Clock();
  function animate(): void {
    requestAnimationFrame(animate);
    nav.update(clock.getDelta());
    renderer.render(scene, camera);
  }
  animate();
}

bootstrap();

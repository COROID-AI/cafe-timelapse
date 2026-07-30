/**
 * main.ts — application entrypoint.
 *
 * Initializes a Three.js renderer and drives the {@link SceneManager}, which
 * owns the persistent scene, per-era groups, and lighting environment.
 * Registers all era fragments then mounts the first era. The render loop
 * integrates with the manager via its `render` and `onResize` points.
 *
 * Audio integration: the shared {@link AudioEngine} is seeded with the first
 * era and wired to era transitions so the ambient beds crossfade in step with
 * the scene. No audio plays until the first user gesture unlocks the
 * AudioContext (autoplay policy) — the mute toggle (see
 * {@link mountAudioControls}) is that gesture surface.
 */
import { WebGLRenderer } from 'three';
import { getSceneManager } from './systems/SceneManager.js';
import type { EraTransitionInfo } from './systems/SceneManager.js';
import { registerEraFragments } from './registry/eraFragments.js';
import { ERAS } from './data/eras.js';
import { getAudioEngine } from './systems/AudioEngine.js';
import { mountAudioControls } from './ui/AudioControls.js';

function bootstrap(): void {
  const container =
    document.getElementById('app') ??
    document.body.appendChild(document.createElement('div'));

  // --- Renderer (the manager owns scene + camera) --------------------------
  const renderer = new WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  container.appendChild(renderer.domElement);

  // --- Register era fragments ----------------------------------------------
  // Side-effectful: populates the shared AssetRegistry for all six eras.
  registerEraFragments();

  // --- Audio engine ---------------------------------------------------------
  // Seed the target era and wire era transitions so the ambient beds
  // crossfade in step with the scene. No audio plays until the first user
  // gesture unlocks the AudioContext (autoplay policy) — the mute toggle
  // mounted below is that gesture surface.
  const audioEngine = getAudioEngine();
  audioEngine.setEra(ERAS[0].year);
  mountAudioControls();

  // --- Scene manager (wired to drive audio on era change) ------------------
  const sceneManager = getSceneManager({
    hooks: {
      onTransitionStart: (info: EraTransitionInfo) => {
        audioEngine.setEra(info.toYear);
      },
    },
  });
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

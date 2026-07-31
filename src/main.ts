/**
 * main.ts — application entrypoint.
 *
 * Initializes a Three.js renderer and drives the {@link SceneManager}, which
 * owns the persistent scene (including the era-neutral café
 * {@link ArchitectureShell}), per-era groups, and lighting environment.
 * Registers all era fragments then mounts the first era. The render loop
 * integrates with the manager via its `render` and `onResize` points, and the
 * {@link Navigation} orbit/pan/zoom rig (clamped to the canonical café
 * interior bounds) drives the manager's camera.
 *
 * Audio integration: the shared {@link AudioEngine} is seeded with the first
 * era and wired to era transitions so the ambient beds crossfade in step with
 * the scene. No audio plays until the first user gesture unlocks the
 * AudioContext (autoplay policy) — the mute toggle (see
 * {@link mountAudioControls}) is that gesture surface.
 */
import { Clock, WebGLRenderer } from 'three';
import { getSceneManager } from './systems/SceneManager.js';
import type { EraTransitionInfo } from './systems/SceneManager.js';
import { registerEraFragments } from './registry/eraFragments.js';
import { ERAS } from './data/eras.js';
import { getAudioEngine } from './systems/AudioEngine.js';
import { mountAudioControls } from './ui/AudioControls.js';
import { Navigation } from './systems/Navigation.js';
import { INTERIOR_BOUNDS } from './world/layout.js';
// Era-population modules MUST be imported before registerEraFragments() so their
// detailed patron factories win the AssetRegistry slot over the placeholder stub.
import './characters/patrons1945.js';
import './characters/patrons2005.js';

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
  // Owns the persistent scene, the café ArchitectureShell (a base layer that
  // survives era switches), the per-era groups, and the lighting rig.
  const sceneManager = getSceneManager({
    hooks: {
      onTransitionStart: (info: EraTransitionInfo) => {
        audioEngine.setEra(info.toYear);
      },
    },
  });
  sceneManager.setActiveEra(ERAS[0].year);

  // --- Navigation -----------------------------------------------------------
  // Orbit/pan/zoom rig clamped to the canonical café interior bounds (single
  // source of truth from layout.ts), with a close-up inspection mode.
  // Listeners are wired to the renderer canvas and drive the manager's camera.
  const nav = new Navigation({
    camera: sceneManager.mainCamera,
    domElement: renderer.domElement,
    bounds: INTERIOR_BOUNDS,
  });

  // --- Resize ---------------------------------------------------------------
  window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    sceneManager.onResize(window.innerWidth, window.innerHeight);
  });

  // --- Render loop ----------------------------------------------------------
  const clock = new Clock();
  function animate(): void {
    requestAnimationFrame(animate);
    nav.update(clock.getDelta());
    sceneManager.render(renderer);
  }
  animate();
}

bootstrap();

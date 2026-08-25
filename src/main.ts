import * as THREE from 'three';
import { CafeScene } from './cafe/CafeScene';
import { NavigationController } from './cafe/NavigationController';
import { registerFurniturePropGroup } from './cafe/props/furniture';
import { EraTransitionController } from './cafe/EraTransitionController';
import './style.css';

/**
 * Application shell for the Café Time Period Timelapse.
 *
 * This module owns only the render foundation: renderer, scene, camera and
 * the render loop. Everything café-specific lives in CafeScene, which builds
 * the permanent room shell, the lighting/mood rig, and hosts the era
 * prop-group registry. Camera behaviour (orbit + free-fly inspect) is fully
 * delegated to the NavigationController.
 */

const canvas = document.getElementById('app') as HTMLCanvasElement;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x15131a);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.05, // Near plane tight enough for close-up prop inspection.
  120,
);
camera.position.set(7.4, 4.8, 8.8);

// --- Permanent café shell + lighting rig + prop-group registry --------------

const cafeScene = new CafeScene({ scene, renderer, camera });

// Detail-category prop groups plug in here, one register call per category.
registerFurniturePropGroup(cafeScene);

// Initial era until further era-content tasks land. Routes the neutral era
// seam through every registered group; era content tasks plug in here.
cafeScene.applyEra(2025);

// --- Era transition morphing -------------------------------------------------

/**
 * Animated era-swap system. The timeline UI task drives it via
 * `eraTransitions.transitionTo(year)` (plus `onProgress` for the morph
 * indicator); the loop below feeds it the shared render-loop clock delta.
 */
const eraTransitions = new EraTransitionController(cafeScene, { renderer });

// --- Dual navigation: damped orbit + free-fly inspect ------------------------

// Reusable bounds buffer so the per-frame bounds query allocates nothing.
const shellBounds = new THREE.Box3();

const navigation = new NavigationController({
  camera,
  domElement: canvas,
  scene,
  getBounds: () => cafeScene.getShellBounds(shellBounds),
  resolveFocusFrame: (point) => cafeScene.getCloseUpFrame(point),
});

// --- Render loop & resize ----------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  // One clock read per frame, shared by every per-frame system so each sees
  // the same elapsed delta (orbit damping, fly smoothing, era morphing).
  const delta = clock.getDelta();
  navigation.update(delta);
  eraTransitions.update(delta);

  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

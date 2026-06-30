/**
 * Café Time Period Timelapse — application entry point.
 *
 * Bootstraps the Three.js engine (Scene, PerspectiveCamera, WebGLRenderer),
 * wires up OrbitControls, installs an interior lighting rig, renders a basic
 * café room shell, and starts the render loop.
 *
 * The engine is also bridged onto `window.Cafe` and a `cafe:ready` event is
 * dispatched so downstream modules / classic scripts can plug into the
 * bootstrapped engine.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {
  createCafeShell,
  CAFE_DIMENSIONS,
  getCounterAnchor,
} from './cafe-shell.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

// CAFE_DIMENSIONS is now imported from ./cafe-shell.js (single source of truth).

const CAMERA_CONFIG = {
  fov: 55,
  near: 0.1,
  far: 100,
  position: new THREE.Vector3(0, 2.2, 7.5),
  target: new THREE.Vector3(0, 1.6, 0),
};

// ---------------------------------------------------------------------------
// Core engine: Scene / Camera / Renderer
// ---------------------------------------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x121216);
scene.fog = new THREE.Fog(0x121216, 20, 48);

const camera = new THREE.PerspectiveCamera(
  CAMERA_CONFIG.fov,
  window.innerWidth / window.innerHeight,
  CAMERA_CONFIG.near,
  CAMERA_CONFIG.far
);
camera.position.copy(CAMERA_CONFIG.position);

const canvasContainer = document.getElementById('canvas-container');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
canvasContainer.appendChild(renderer.domElement);

// ---------------------------------------------------------------------------
// Controls: rotate, zoom, pan within the interior space
// ---------------------------------------------------------------------------

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(CAMERA_CONFIG.target);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 18;
controls.maxPolarAngle = Math.PI * 0.495; // keep camera above the floor
controls.update();

// ---------------------------------------------------------------------------
// Interior lighting rig
// ---------------------------------------------------------------------------

/**
 * Ambient base + warm directional key (casts shadows) + warm point fill near
 * the counter to illuminate the café interior.
 */
function buildLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  const keyLight = new THREE.DirectionalLight(0xffe9c7, 0.95);
  keyLight.position.set(-4, 8, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(2048, 2048);
  keyLight.shadow.camera.near = 0.5;
  keyLight.shadow.camera.far = 30;
  keyLight.shadow.camera.left = -12;
  keyLight.shadow.camera.right = 12;
  keyLight.shadow.camera.top = 12;
  keyLight.shadow.camera.bottom = -12;
  keyLight.shadow.bias = -0.0005;
  scene.add(keyLight);

  const counterFill = new THREE.PointLight(0xffd9a0, 0.7, 16, 1.6);
  counterFill.position.set(0, 2.8, -2);
  scene.add(counterFill);

  return { ambient, keyLight, counterFill };
}

const lights = buildLighting();

// ---------------------------------------------------------------------------
// Café architecture shell
// Floor, ceiling, back + side walls (with window openings & a door), and the
// counter base. Built in ./cafe-shell.js as the fixed era-agnostic room that
// every period configuration decorates.
// ---------------------------------------------------------------------------

// The detailed architecture shell (floor, ceiling, walls with window openings
// and a door, counter base) is provided by ./cafe-shell.js so that era swaps
// only change period prop groups, not the room itself.
const cafeShell = createCafeShell();
const counterAnchor = getCounterAnchor();
scene.add(cafeShell);

// ---------------------------------------------------------------------------
// Responsive resize handling
// ---------------------------------------------------------------------------

function onResize() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
window.addEventListener('resize', onResize);

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  clock.getDelta(); // keep clock primed for downstream consumers
  controls.update();
  renderer.render(scene, camera);
}
animate();

// ---------------------------------------------------------------------------
// Engine bridge for downstream tasks (modules or classic scripts)
// ---------------------------------------------------------------------------

window.Cafe = Object.assign(window.Cafe || {}, {
  THREE,
  scene,
  camera,
  renderer,
  controls,
  lights,
  cafeShell,
  CAFE_DIMENSIONS,
  CAMERA_CONFIG,
  clock,
});

// Notify any waiting classic scripts that the engine is ready.
window.dispatchEvent(new CustomEvent('cafe:ready', { detail: window.Cafe }));

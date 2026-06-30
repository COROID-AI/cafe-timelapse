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
import { TimelineUI, YEARS } from './timeline-ui.js';
import { PeriodManager } from './period-manager.js';

// Era asset builders (side-effect imports: each registers its era on import
// via the `cafe:ready` event / PeriodManager.registerEra). ES module imports
// are hoisted and executed before this module's body runs, so the listeners
// are in place before the `cafe:ready` event is dispatched below.
import './period1945.js';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/** Dimensions of the café interior (metres). X = width, Y = height, Z = depth. */
const CAFE_DIMENSIONS = {
  width: 12,
  depth: 10,
  height: 3.5,
};

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
// Basic café room shell
// (floor, back + side walls, counter zone, window panes).
// The detailed architecture shell is built by a downstream task; this is a
// functional placeholder that renders without errors.
// ---------------------------------------------------------------------------

function buildCafeShell() {
  const group = new THREE.Group();
  group.name = 'CafeShell';

  const { width, depth, height } = CAFE_DIMENSIONS;

  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0x6b4a2b,
    roughness: 0.85,
    metalness: 0.0,
  });
  const wallMaterial = new THREE.MeshStandardMaterial({
    color: 0xcfc6b8,
    roughness: 0.95,
    metalness: 0.0,
  });
  const counterMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    roughness: 0.6,
    metalness: 0.05,
  });
  const windowMaterial = new THREE.MeshStandardMaterial({
    color: 0xbfe3ff,
    emissive: 0x88bbff,
    emissiveIntensity: 0.35,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(width, depth), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.name = 'floor';
  group.add(floor);

  // Back wall
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.2), wallMaterial);
  backWall.position.set(0, height / 2, -depth / 2);
  backWall.receiveShadow = true;
  backWall.name = 'backWall';
  group.add(backWall);

  // Left wall
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, depth), wallMaterial);
  leftWall.position.set(-width / 2, height / 2, 0);
  leftWall.receiveShadow = true;
  leftWall.name = 'leftWall';
  group.add(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.2, height, depth), wallMaterial);
  rightWall.position.set(width / 2, height / 2, 0);
  rightWall.receiveShadow = true;
  rightWall.name = 'rightWall';
  group.add(rightWall);

  // Counter zone (placeholder)
  const counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 1.1, 0.9), counterMaterial);
  counter.position.set(0, 0.55, -depth / 2 + 0.7);
  counter.castShadow = true;
  counter.receiveShadow = true;
  counter.name = 'counter';
  group.add(counter);

  // Window panes on the side walls (glowing placeholders)
  const windowGeometry = new THREE.BoxGeometry(0.06, 1.4, 2.2);
  const leftWindow = new THREE.Mesh(windowGeometry, windowMaterial);
  leftWindow.position.set(-width / 2 - 0.02, 1.7, 1.5);
  leftWindow.name = 'leftWindow';
  group.add(leftWindow);

  const rightWindow = leftWindow.clone();
  rightWindow.position.x = width / 2 + 0.02;
  rightWindow.name = 'rightWindow';
  group.add(rightWindow);

  scene.add(group);
  return group;
}

const cafeShell = buildCafeShell();

// ---------------------------------------------------------------------------
// Timeline slider UI — single source of truth for the active period.
// Dispatches a `period-change` CustomEvent on `window` that the PeriodManager
// subscribes to.
// ---------------------------------------------------------------------------

const timeline = new TimelineUI(YEARS, 0);

// ---------------------------------------------------------------------------
// PeriodManager — swaps era asset groups on the café shell and cross-fades
// them whenever the timeline dispatches a `period-change` event. Downstream
// era-asset tasks register their builders via `periodManager.registerEra()`.
// ---------------------------------------------------------------------------

const periodManager = new PeriodManager(scene, cafeShell, { duration: 1500 });
periodManager.start(timeline.currentYear);

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
  const delta = clock.getDelta(); // keep clock primed for downstream consumers
  controls.update();
  periodManager.update(delta); // drive era cross-fade transitions
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
  timeline,
  periodManager,
  YEARS,
  CAFE_DIMENSIONS,
  CAMERA_CONFIG,
  clock,
});

// Notify any waiting classic scripts that the engine is ready.
window.dispatchEvent(new CustomEvent('cafe:ready', { detail: window.Cafe }));

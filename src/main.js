/**
 * main.js — Vite entry point for Café Timelapse.
 *
 * Responsibilities:
 *  - Create the Three.js renderer, scene, and camera
 *  - Build the base café room shell (floor, walls, ceiling, window, counter)
 *  - Set up the lighting rig (ambient + directional + 2 point lights)
 *  - Initialize OrbitControls and PointerLockControls; toggle with F
 *  - Register all era packs with PeriodManager
 *  - Wire the timeline UI
 *  - Run the render loop with resize handling
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { buildCafeRoom, ROOM_WIDTH, ROOM_DEPTH } from './cafe-room.js';
import '../css/style.css';
import * as PeriodManager from '../js/period-manager.js';
import * as TimelineUI from '../js/timeline-ui.js';
import * as AudioManager from '../js/audio-manager.js';

// Register era packs
import period1945 from '../js/period1945.js';
import period1965 from '../js/period1965.js';
import period1985 from '../js/period1985.js';
import period2005 from '../js/period2005.js';
import period2025 from '../js/period2025.js';

// ─── Globals ──────────────────────────────────────────────────────────

/** @type {THREE.WebGLRenderer} */
let renderer;

/** @type {THREE.Scene} */
let scene;

/** @type {THREE.PerspectiveCamera} */
let camera;

/** @type {OrbitControls} */
let orbitControls;

/** @type {PointerLockControls} */
let pointerLockControls;

/** @type {'orbit' | 'fps'} */
let navMode = 'orbit';

/** @type {THREE.Group} */
let contentGroup;

// Lighting references (so era packs can override)
/** @type {THREE.AmbientLight} */
let ambientLight;

/** @type {THREE.DirectionalLight} */
let directionalLight;

/** @type {THREE.PointLight} */
let pointLight1;

/** @type {THREE.PointLight} */
let pointLight2;

// First-person movement state
const fpMove = { forward: false, backward: false, left: false, right: false };
const fpVelocity = new THREE.Vector3();
const fpDirection = new THREE.Vector3();

// ─── Initialization ───────────────────────────────────────────────────

/**
 * Boot the entire application.
 */
function init() {
  // Renderer
  const canvas = /** @type {HTMLCanvasElement} */ (
    document.getElementById('scene-canvas')
  );
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1614);
  scene.fog = new THREE.Fog(0x1a1614, 15, 35);

  // Camera — positioned to see the full room from the front
  camera = new THREE.PerspectiveCamera(
    60, // FOV
    window.innerWidth / window.innerHeight, // Aspect
    0.1, // Near
    100, // Far
  );
  // Default orbit camera position: standing at the front of the room
  camera.position.set(0, 2.5, ROOM_DEPTH / 2 - 1);
  camera.lookAt(0, 1.5, 0);

  // ─── Lighting Rig ──────────────────────────────────────
  setupLighting();

  // ─── Café Room Shell ───────────────────────────────────
  const cafeRoom = buildCafeRoom();
  scene.add(cafeRoom);

  // Content group for era-specific content
  contentGroup = new THREE.Group();
  contentGroup.name = 'EraContent';
  scene.add(contentGroup);
  PeriodManager.setContentGroup(contentGroup);

  // ─── Controls ──────────────────────────────────────────
  setupControls(canvas);

  // ─── Era Packs ─────────────────────────────────────────
  registerEraPacks();

  // ─── Timeline UI ───────────────────────────────────────
  TimelineUI.init();

  // ─── Audio ─────────────────────────────────────────────
  registerAudio();

  // Listen to year changes to update lighting and audio
  PeriodManager.on('yearchange', (data) => {
    updateLighting(data.package);
    AudioManager.setYear(data.year);
    updateNavHelp();
  });

  // Set default year to 2025
  PeriodManager.setYear(2025);

  // ─── Event Listeners ───────────────────────────────────
  window.addEventListener('resize', onResize);

  // Resume audio on first user interaction (autoplay policy)
  const resumeAudio = () => {
    AudioManager.resume();
    window.removeEventListener('click', resumeAudio);
    window.removeEventListener('keydown', resumeAudio);
  };
  window.addEventListener('click', resumeAudio);
  window.addEventListener('keydown', resumeAudio);

  // Start render loop
  animate();

  console.log('[Café Timelapse] Booted successfully.');
}

/**
 * Set up the base lighting rig: ambient + directional + 2 point lights.
 */
function setupLighting() {
  // Ambient — fills the room with soft base illumination
  ambientLight = new THREE.AmbientLight(0xfff8f0, 0.8);
  scene.add(ambientLight);

  // Directional — simulates sunlight through the window
  directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
  directionalLight.position.set(5, 8, 3);
  directionalLight.target.position.set(0, 0, -ROOM_DEPTH / 2);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 30;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 10;
  directionalLight.shadow.camera.bottom = -10;
  directionalLight.shadow.bias = -0.0005; // Prevent shadow acne / z-fighting
  scene.add(directionalLight);
  scene.add(directionalLight.target);

  // Point light 1 — warm light over the counter area
  pointLight1 = new THREE.PointLight(0xfff5e0, 1.2, 10, 1.5);
  pointLight1.position.set(-3, 3, 2);
  pointLight1.castShadow = true;
  pointLight1.shadow.mapSize.width = 512;
  pointLight1.shadow.mapSize.height = 512;
  pointLight1.shadow.bias = -0.001;
  scene.add(pointLight1);

  // Point light 2 — fill light on the opposite side
  pointLight2 = new THREE.PointLight(0xffe8d0, 1.0, 10, 1.5);
  pointLight2.position.set(3, 3, -2);
  pointLight2.castShadow = true;
  pointLight2.shadow.mapSize.width = 512;
  pointLight2.shadow.mapSize.height = 512;
  pointLight2.shadow.bias = -0.001;
  scene.add(pointLight2);
}

/**
 * Update lighting based on era pack overrides.
 * @param {import('../src/contracts/PeriodPackage.js').PeriodPackage|null} pkg
 */
function updateLighting(pkg) {
  if (!pkg || !pkg.lighting) return;

  const l = pkg.lighting;

  if (l.ambientIntensity !== undefined) {
    ambientLight.intensity = l.ambientIntensity;
  }
  if (l.ambientColor) {
    ambientLight.color.set(l.ambientColor);
  }

  if (l.directionalIntensity !== undefined) {
    directionalLight.intensity = l.directionalIntensity;
  }
  if (l.directionalColor) {
    directionalLight.color.set(l.directionalColor);
  }
  if (l.directionalPosition) {
    directionalLight.position.set(
      l.directionalPosition[0],
      l.directionalPosition[1],
      l.directionalPosition[2],
    );
  }

  if (l.point1Intensity !== undefined) {
    pointLight1.intensity = l.point1Intensity;
  }
  if (l.point1Color) {
    pointLight1.color.set(l.point1Color);
  }
  if (l.point1Position) {
    pointLight1.position.set(
      l.point1Position[0],
      l.point1Position[1],
      l.point1Position[2],
    );
  }

  if (l.point2Intensity !== undefined) {
    pointLight2.intensity = l.point2Intensity;
  }
  if (l.point2Color) {
    pointLight2.color.set(l.point2Color);
  }
  if (l.point2Position) {
    pointLight2.position.set(
      l.point2Position[0],
      l.point2Position[1],
      l.point2Position[2],
    );
  }
}

/**
 * Set up OrbitControls and PointerLockControls.
 * @param {HTMLCanvasElement} canvas
 */
function setupControls(canvas) {
  // OrbitControls — default navigation mode
  orbitControls = new OrbitControls(camera, canvas);
  orbitControls.enableDamping = true;
  orbitControls.dampingFactor = 0.08;
  orbitControls.minDistance = 1.5;
  orbitControls.maxDistance = 20;
  orbitControls.maxPolarAngle = Math.PI * 0.49; // Don't go below floor
  orbitControls.target.set(0, 1.5, 0);
  orbitControls.update();

  // PointerLockControls — first-person mode
  pointerLockControls = new PointerLockControls(camera, document.body);

  // F key toggles between orbit and first-person
  window.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      // Don't toggle if user is typing in an input
      const target = /** @type {HTMLElement} */ (e.target);
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
      toggleNavMode();
    }
  });

  // Pointer lock change event
  pointerLockControls.addEventListener('lock', () => {
    const overlay = document.getElementById('pointer-lock-overlay');
    if (overlay) overlay.style.display = 'none';
  });

  pointerLockControls.addEventListener('unlock', () => {
    // If we're still in fps mode, show the overlay again
    if (navMode === 'fps') {
      const overlay = document.getElementById('pointer-lock-overlay');
      if (overlay) overlay.style.display = 'flex';
    }
  });

  // Click overlay to lock pointer
  const overlay = document.getElementById('pointer-lock-overlay');
  if (overlay) {
    overlay.addEventListener('click', () => {
      pointerLockControls.lock();
    });
  }

  // WASD movement for first-person mode
  window.addEventListener('keydown', (e) => {
    if (navMode !== 'fps') return;
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        fpMove.forward = true;
        break;
      case 'KeyS':
      case 'ArrowDown':
        fpMove.backward = true;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        fpMove.left = true;
        break;
      case 'KeyD':
      case 'ArrowRight':
        fpMove.right = true;
        break;
    }
  });

  window.addEventListener('keyup', (e) => {
    switch (e.code) {
      case 'KeyW':
      case 'ArrowUp':
        fpMove.forward = false;
        break;
      case 'KeyS':
      case 'ArrowDown':
        fpMove.backward = false;
        break;
      case 'KeyA':
      case 'ArrowLeft':
        fpMove.left = false;
        break;
      case 'KeyD':
      case 'ArrowRight':
        fpMove.right = false;
        break;
    }
  });
}

/**
 * Toggle between orbit and first-person navigation modes.
 */
function toggleNavMode() {
  if (navMode === 'orbit') {
    // Switch to first-person
    navMode = 'fps';
    orbitControls.enabled = false;
    scene.add(pointerLockControls.getObject());

    // Position the fps camera at current orbit position
    // (PointerLockControls uses the camera directly)
    const overlay = document.getElementById('pointer-lock-overlay');
    if (overlay) overlay.style.display = 'flex';

    const fpHelp = document.getElementById('fp-help');
    if (fpHelp) fpHelp.style.display = 'flex';

    updateNavHUD();
  } else {
    // Switch back to orbit
    navMode = 'orbit';
    if (pointerLockControls.isLocked) {
      pointerLockControls.unlock();
    }
    scene.remove(pointerLockControls.getObject());
    orbitControls.enabled = true;

    const overlay = document.getElementById('pointer-lock-overlay');
    if (overlay) overlay.style.display = 'none';

    const fpHelp = document.getElementById('fp-help');
    if (fpHelp) fpHelp.style.display = 'none';

    updateNavHUD();
  }
}

/**
 * Update the HUD navigation mode display.
 */
function updateNavHUD() {
  const navEl = document.getElementById('hud-nav-mode');
  if (navEl) {
    navEl.textContent = navMode === 'orbit' ? 'Orbit' : 'First-Person';
  }
}

/**
 * Update nav help visibility based on mode.
 */
function updateNavHelp() {
  // Called on year change — no-op for now but available for future use
}

/**
 * Register all era packs with PeriodManager.
 */
function registerEraPacks() {
  PeriodManager.register(1945, period1945);
  PeriodManager.register(1965, period1965);
  PeriodManager.register(1985, period1985);
  PeriodManager.register(2005, period2005);
  PeriodManager.register(2025, period2025);
}

/**
 * Register audio configs for each era.
 */
function registerAudio() {
  if (period1945.audio) AudioManager.registerAudio(1945, period1945.audio);
  if (period1965.audio) AudioManager.registerAudio(1965, period1965.audio);
  if (period1985.audio) AudioManager.registerAudio(1985, period1985.audio);
  if (period2005.audio) AudioManager.registerAudio(2005, period2005.audio);
  if (period2025.audio) AudioManager.registerAudio(2025, period2025.audio);
}

/**
 * Handle window resize.
 */
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Update first-person movement.
 * @param {number} delta - Time since last frame in seconds
 */
function updateFPSMovement(delta) {
  if (navMode !== 'fps' || !pointerLockControls.isLocked) return;

  // Damping
  fpVelocity.x -= fpVelocity.x * 8.0 * delta;
  fpVelocity.z -= fpVelocity.z * 8.0 * delta;

  fpDirection.z = Number(fpMove.forward) - Number(fpMove.backward);
  fpDirection.x = Number(fpMove.right) - Number(fpMove.left);
  fpDirection.normalize();

  const speed = 4.0; // meters per second

  if (fpMove.forward || fpMove.backward) {
    fpVelocity.z -= fpDirection.z * speed * delta;
  }
  if (fpMove.left || fpMove.right) {
    fpVelocity.x -= fpDirection.x * speed * delta;
  }

  pointerLockControls.moveRight(-fpVelocity.x * delta);
  pointerLockControls.moveForward(-fpVelocity.z * delta);

  // Clamp position to room bounds
  const obj = pointerLockControls.getObject();
  obj.position.x = Math.max(-ROOM_WIDTH / 2 + 0.5, Math.min(ROOM_WIDTH / 2 - 0.5, obj.position.x));
  obj.position.z = Math.max(-ROOM_DEPTH / 2 + 0.5, Math.min(ROOM_DEPTH / 2 - 0.5, obj.position.z));
  obj.position.y = 1.7; // Eye height
}

// ─── Render Loop ──────────────────────────────────────────────────────

const clock = new THREE.Clock();

/**
 * Main animation loop.
 */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();

  // Update controls
  if (navMode === 'orbit') {
    orbitControls.update();
  } else {
    updateFPSMovement(delta);
  }

  renderer.render(scene, camera);
}

// ─── Boot ─────────────────────────────────────────────────────────────

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

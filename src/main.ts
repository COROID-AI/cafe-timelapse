import './style.css';
import * as THREE from 'three';
import { ERAS, type EraYear } from './data/eras';
import { registerAllEras, getEraRegistration } from './registry';
import { Navigation, type NavigationMode } from './systems/Navigation';
import { buildCaféShell } from './systems/cafeShell';

const eraLabel = document.querySelector<HTMLParagraphElement>('#era-label');
const modeLabel = document.querySelector<HTMLSpanElement>('#mode-label');

// --- Scene, camera, renderer ---------------------------------------------

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x17171c);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(8, 6, 12);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.querySelector('#app')?.appendChild(renderer.domElement);

// --- Lights ----------------------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const keyLight = new THREE.DirectionalLight(0xfff2df, 2.2);
keyLight.position.set(6, 10, 6);
keyLight.castShadow = true;
scene.add(keyLight);

// --- Café shell + placeholder scene ----------------------------------------
// The shell defines the interior collision volume the navigation rig clamps
// against. A stand-in café floor makes the room visible before era fragment
// geometry is built in later phases.

const shellGroup = new THREE.Group();
buildCaféShell(shellGroup);
scene.add(shellGroup);

const floor = new THREE.Mesh(
  new THREE.BoxGeometry(10, 0.1, 8),
  new THREE.MeshStandardMaterial({ color: 0x5a4a3a, roughness: 0.9 }),
);
floor.position.y = -0.05;
floor.receiveShadow = true;
scene.add(floor);

const counter = new THREE.Mesh(
  new THREE.BoxGeometry(3.2, 1.0, 1.0),
  new THREE.MeshStandardMaterial({ color: 0x8a6a4a, roughness: 0.7 }),
);
counter.position.set(-1.5, 0.5, -2.4);
counter.castShadow = true;
scene.add(counter);

const table = new THREE.Mesh(
  new THREE.CylinderGeometry(0.55, 0.55, 0.08, 24),
  new THREE.MeshStandardMaterial({ color: 0x7a5a3a, roughness: 0.8 }),
);
table.position.set(2.4, 0.6, 0.5);
table.castShadow = true;
scene.add(table);

// --- Navigation -------------------------------------------------------------
// Orbit (left-drag rotate, right/middle-drag pan, wheel/pinch zoom), a walk-up
// close mode (F key / button), arrow-key + WASD support, smooth damping, and
// collision clamping to the café shell.

const modeButton = document.querySelector<HTMLButtonElement>('#mode-toggle');

const navigation = new Navigation(camera, renderer.domElement, {
  bounds: {
    minX: -7,
    maxX: 7,
    minY: 0,
    maxY: 4,
    minZ: -5.5,
    maxZ: 5.5,
  },
  collisionMargin: 0.25,
  initialTarget: new THREE.Vector3(0, 1.4, 0),
  initialRadius: 6.5,
  onModeChange: (mode: NavigationMode) => {
    if (modeLabel) modeLabel.textContent = mode === 'orbit' ? 'Orbit' : 'Walk';
    if (modeButton) modeButton.textContent = mode === 'orbit' ? 'Walk up close (F)' : 'Orbit (F)';
  },
});

modeButton?.addEventListener('click', () => {
  navigation.toggleMode();
  navigation.focus();
});

// --- Timeline / era switching ---------------------------------------------

let currentEra: EraYear = ERAS[0];

async function switchEra(era: EraYear): Promise<void> {
  currentEra = era;
  const registration = getEraRegistration(era);
  if (eraLabel) {
    eraLabel.textContent = registration
      ? `Era ${era} — ${registration.fragments.length} scene fragments registered`
      : `Era ${era} — not yet registered`;
  }
}

// --- Animation loop ---------------------------------------------------------

let lastTime = performance.now();

function animate(now: number): void {
  requestAnimationFrame(animate);
  const dt = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  navigation.update(dt);
  renderer.render(scene, camera);
}

async function init(): Promise<void> {
  await registerAllEras();
  await switchEra(currentEra);
  navigation.focus();
  requestAnimationFrame(animate);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

void init();

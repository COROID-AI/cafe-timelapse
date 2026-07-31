import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { ERAS, type EraYear } from './data/eras';
import { registerAllEras, getEraRegistration } from './registry';

const eraLabel = document.querySelector<HTMLParagraphElement>('#era-label');

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

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- Lights ----------------------------------------------------------------

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const keyLight = new THREE.DirectionalLight(0xfff2df, 2.2);
keyLight.position.set(6, 10, 6);
keyLight.castShadow = true;
scene.add(keyLight);

// --- Placeholder scene -----------------------------------------------------
// A stand-in café floor so `npm run dev` visibly renders before era fragment
// geometry is built in later phases.

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

function animate(): void {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

async function init(): Promise<void> {
  await registerAllEras();
  await switchEra(currentEra);
  animate();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

void init();

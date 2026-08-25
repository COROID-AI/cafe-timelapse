import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import './style.css';

/**
 * Application shell for the Café Time Period Timelapse.
 *
 * This module owns only the render foundation:
 * renderer, scene, camera, controls, lights, ground plane, and the
 * render loop. All café content arrives in later tasks on top of this base.
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
scene.background = new THREE.Color(0x1a1a22);

const camera = new THREE.PerspectiveCamera(
  50,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(6, 4, 8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.minDistance = 2;
controls.maxDistance = 30;
controls.update();

// --- Lighting rig -----------------------------------------------------------

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfff2e0, 2.2);
directionalLight.position.set(6, 10, 4);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.near = 1;
directionalLight.shadow.camera.far = 40;
directionalLight.shadow.camera.left = -15;
directionalLight.shadow.camera.right = 15;
directionalLight.shadow.camera.top = 15;
directionalLight.shadow.camera.bottom = -15;
directionalLight.shadow.bias = -0.0005;
scene.add(directionalLight);

// --- Ground plane ------------------------------------------------------------

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(40, 40),
  new THREE.MeshStandardMaterial({ color: 0x3a3630, roughness: 0.9 }),
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// --- Placeholder mesh --------------------------------------------------------
// Proves the render loop, tone mapping, and shadows work. Replaced later by
// actual café content.

const placeholder = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0xd98e4a, roughness: 0.35 }),
);
placeholder.position.set(0, 1, 0);
placeholder.castShadow = true;
placeholder.receiveShadow = true;
scene.add(placeholder);

// --- Render loop & resize ----------------------------------------------------

function animate() {
  requestAnimationFrame(animate);

  const t = performance.now() / 1000;
  placeholder.rotation.y = t * 0.4;
  placeholder.position.y = 1 + Math.sin(t * 1.5) * 0.25;

  controls.update();
  renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

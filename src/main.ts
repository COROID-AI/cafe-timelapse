import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CafeScene } from './cafe/CafeScene';
import './style.css';

/**
 * Application shell for the Café Time Period Timelapse.
 *
 * This module owns only the render foundation: renderer, scene, camera,
 * controls and the render loop. Everything café-specific lives in CafeScene,
 * which builds the permanent room shell, the lighting/mood rig, and hosts the
 * era prop-group registry.
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

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.2, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2 - 0.04;
controls.minDistance = 0.55;
controls.maxDistance = 26;
controls.update();

// --- Permanent café shell + lighting rig + prop-group registry --------------

const cafeScene = new CafeScene({ scene, renderer, camera });

// Initial era until the timeline slider task lands. Routes the neutral era
// seam through every registered group; era content tasks plug in here.
cafeScene.applyEra(2025);

// --- Render loop & resize ----------------------------------------------------

function animate() {
  requestAnimationFrame(animate);

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

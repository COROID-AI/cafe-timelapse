import * as THREE from 'three';

/**
 * Scaffold entry point for the Café Timelapse scene.
 *
 * This module bootstraps a minimal Three.js renderer, scene, and camera so the
 * Vite + Three.js toolchain is verified end-to-end. The full period-aware café
 * (furniture, timeline slider, SFX, navigation, etc.) is built in subsequent
 * tasks on top of this scaffold.
 */

const app = document.getElementById('app');

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a1a);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000,
);
camera.position.set(0, 1.6, 5);
camera.lookAt(0, 1, 0);

renderer.render(scene, camera);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.render(scene, camera);
});

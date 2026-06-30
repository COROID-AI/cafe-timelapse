/**
 * SceneManager — owns the Three.js scene, camera, renderer, controls,
 * lighting, and the animation loop. Exposes a shared `scene` reference
 * that period modules and the café shell attach to.
 */

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CAMERA_CONFIG } from "./config.js";

export class SceneManager {
  constructor(container) {
    this.container = container;

    // ---- Scene ----
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a1f);

    // ---- Camera ----
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_CONFIG.fieldOfView,
      container.clientWidth / container.clientHeight,
      CAMERA_CONFIG.nearPlane,
      CAMERA_CONFIG.farPlane
    );
    this.camera.position.set(
      CAMERA_CONFIG.initialPosition.x,
      CAMERA_CONFIG.initialPosition.y,
      CAMERA_CONFIG.initialPosition.z
    );

    // ---- Renderer ----
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.container.appendChild(this.renderer.domElement);

    // ---- Controls ----
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = CAMERA_CONFIG.enableDamping;
    this.controls.dampingFactor = CAMERA_CONFIG.dampingFactor;
    this.controls.enablePan = CAMERA_CONFIG.enablePan;
    this.controls.minDistance = CAMERA_CONFIG.minDistance;
    this.controls.maxDistance = CAMERA_CONFIG.maxDistance;
    this.controls.minPolarAngle = CAMERA_CONFIG.minPolarAngle;
    this.controls.maxPolarAngle = CAMERA_CONFIG.maxPolarAngle;
    this.controls.target.set(
      CAMERA_CONFIG.initialTarget.x,
      CAMERA_CONFIG.initialTarget.y,
      CAMERA_CONFIG.initialTarget.z
    );
    this.controls.update();

    // ---- Lighting ----
    this._setupLighting();

    // ---- Resize ----
    this._onResize = this._onResize.bind(this);
    window.addEventListener("resize", this._onResize);

    // ---- Animation Loop ----
    this.clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this._animate();
  }

  /**
   * Ambient + directional lighting to illuminate the café interior.
   */
  _setupLighting() {
    // Soft ambient fill so no surface is pitch black.
    const ambient = new THREE.AmbientLight(0xffffff, 0.45);
    this.scene.add(ambient);

    // Hemisphere light for natural sky/ground gradient.
    const hemi = new THREE.HemisphereLight(0xfff4e6, 0x3a2a1a, 0.35);
    hemi.position.set(0, 10, 0);
    this.scene.add(hemi);

    // Primary directional light — simulates sunlight through windows.
    const directional = new THREE.DirectionalLight(0xffefd5, 0.8);
    directional.position.set(6, 8, 4);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 2048;
    directional.shadow.mapSize.height = 2048;
    directional.shadow.camera.near = 0.5;
    directional.shadow.camera.far = 40;
    directional.shadow.camera.left = -12;
    directional.shadow.camera.right = 12;
    directional.shadow.camera.top = 12;
    directional.shadow.camera.bottom = -12;
    directional.shadow.bias = -0.0005;
    this.scene.add(directional);

    // Store references for period modules to adjust intensity/color.
    this.lights = { ambient, hemi, directional };
  }

  _onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  _animate() {
    requestAnimationFrame(this._animate);
    const delta = this.clock.getDelta();
    this.controls.update();

    // Allow period modules to hook into the frame loop.
    if (this.onUpdate) {
      this.onUpdate(delta, this.clock.elapsedTime);
    }

    this.renderer.render(this.scene, this.camera);
  }

  /** Clean up listeners and free GPU resources. */
  dispose() {
    window.removeEventListener("resize", this._onResize);
    this.controls.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

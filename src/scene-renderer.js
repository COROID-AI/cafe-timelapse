/**
 * @file src/scene-renderer.js
 * Three.js renderer wrapper. Builds the persistent café shell (room walls,
 * floor with wood/tile/stone variants driven by era palette, ceiling beams,
 * windows, door, baseboards) and a slot Group where era-specific content is
 * mounted. Owns the WebGLRenderer, PerspectiveCamera, OrbitControls, raycaster,
 * and the requestAnimationFrame loop.
 *
 * Targets 60fps on mid-range laptops; pixelRatio capped at min(devicePixelRatio,2).
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createFloorTexture, createTileTexture } from './utils/canvas-text.js';

// Room dimensions (the café interior bounds).
const ROOM = { w: 8, d: 7, h: 3.6 };

export default class SceneRenderer {
  /**
   * @param {HTMLElement} container
   */
  constructor(container) {
    this.container = container;
    this.updateCallbacks = [];

    // --- Renderer ---
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    // --- Scene ---
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0806);
    this.scene.fog = new THREE.Fog(0x0a0806, 12, 22);

    // --- Camera ---
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    this.camera.position.set(0, 2.4, 5.5);
    this.camera.lookAt(0, 1.2, 0);

    // --- Controls ---
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 1.2, 0);
    // Clamp so the user cannot escape the room interior.
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 8;
    this.controls.minPolarAngle = 0.3;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.minAzimuthAngle = -Math.PI / 2 + 0.2;
    this.controls.maxAzimuthAngle = Math.PI / 2 - 0.2;
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;
    // Pan clamp bounds (room half-extents minus margin).
    this._panBounds = { x: ROOM.w / 2 - 1.5, z: ROOM.d / 2 - 1.5 };

    // --- Raycaster ---
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    // --- Persistent lights (tuned per era via applyLightingProfile) ---
    this.hemi = new THREE.HemisphereLight(0xffeedd, 0x2a1a10, 0.5);
    this.scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight(0xffffff, 0.3);
    this.scene.add(this.ambient);

    this.keyLight = new THREE.DirectionalLight(0xffd9a0, 1.4);
    this.keyLight.position.set(-3, 6, 2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(2048, 2048);
    this.keyLight.shadow.camera.left = -6;
    this.keyLight.shadow.camera.right = 6;
    this.keyLight.shadow.camera.top = 6;
    this.keyLight.shadow.camera.bottom = -6;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 20;
    this.keyLight.shadow.bias = -0.0005;
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.DirectionalLight(0xccddff, 0.4);
    this.fillLight.position.set(4, 4, -3);
    this.scene.add(this.fillLight);

    // --- Persistent café shell ---
    this.eraSlot = new THREE.Group();
    this.eraSlot.name = 'era-slot';
    this.scene.add(this.eraSlot);

    this._buildShell();

    // --- Resize ---
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);

    // Pan clamp
    this._panOffset = new THREE.Vector3();
    const origPan = this.controls._panStart ? null : null;
    this.controls.addEventListener('change', () => {
      // Clamp target within room bounds.
      const t = this.controls.target;
      t.x = THREE.MathUtils.clamp(t.x, -this._panBounds.x, this._panBounds.x);
      t.z = THREE.MathUtils.clamp(t.z, -this._panBounds.z, this._panBounds.z);
    });

    // --- Render loop ---
    this.clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);

    this._eraLights = [];
  }

  /* ------------------------------------------------------------------ *
   * Persistent shell: floor, walls, ceiling, windows, door, baseboards
   * ------------------------------------------------------------------ */
  _buildShell() {
    const { w, d, h } = ROOM;

    // Floor (wood by default; era may swap texture).
    const floorTex = createFloorTexture({ base: 0x6b4a2b, plank: 0x5a3a20, rows: 8 });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8, metalness: 0.0 });
    this.floorMat = floorMat;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    this.floor = floor;

    // Walls
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2e, roughness: 0.9, side: THREE.DoubleSide });
    this.wallMat = wallMat;

    // Back wall (z = -d/2)
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(w, h), wallMat);
    backWall.position.set(0, h / 2, -d / 2);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // Left wall (x = -w/2)
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(d, h), wallMat);
    leftWall.position.set(-w / 2, h / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // Right wall (x = w/2) with window cutout illusion (two panels around a gap)
    const rightWallTop = new THREE.Mesh(new THREE.PlaneGeometry(d, 0.8), wallMat);
    rightWallTop.position.set(w / 2, h - 0.4, 0);
    rightWallTop.rotation.y = -Math.PI / 2;
    rightWallTop.receiveShadow = true;
    this.scene.add(rightWallTop);
    const rightWallBot = new THREE.Mesh(new THREE.PlaneGeometry(d, 1.0), wallMat);
    rightWallBot.position.set(w / 2, 0.5, 0);
    rightWallBot.rotation.y = -Math.PI / 2;
    rightWallBot.receiveShadow = true;
    this.scene.add(rightWallBot);

    // Window frame + glass in the gap (y from 1.0 to 2.8)
    const winFrameMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.6 });
    const winGlassMat = new THREE.MeshStandardMaterial({
      color: 0xbfe0f0, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.35
    });
    const winY = 1.9;
    const winH = 1.8;
    const winGlass = new THREE.Mesh(new THREE.PlaneGeometry(d - 1, winH), winGlassMat);
    winGlass.position.set(w / 2, winY, 0);
    winGlass.rotation.y = -Math.PI / 2;
    this.scene.add(winGlass);
    // window mullions
    const mulH = 0.04;
    const mulMat = winFrameMat;
    for (let i = 1; i < 3; i++) {
      const v = new THREE.Mesh(new THREE.PlaneGeometry(d - 1, mulH), mulMat);
      v.position.set(w / 2, winY - winH / 2 + (winH / 3) * i, 0);
      v.rotation.y = -Math.PI / 2;
      this.scene.add(v);
    }
    const hMul = new THREE.Mesh(new THREE.PlaneGeometry(mulH, winH), mulMat);
    hMul.position.set(w / 2, winY, 0);
    hMul.rotation.y = -Math.PI / 2;
    this.scene.add(hMul);
    // Frame around window
    const frameThick = 0.06;
    const fTop = new THREE.Mesh(new THREE.BoxGeometry(0.02, frameThick, d - 1 + frameThick * 2), mulMat);
    fTop.position.set(w / 2 - 0.005, winY + winH / 2 + frameThick / 2, 0);
    this.scene.add(fTop);
    const fBot = new THREE.Mesh(new THREE.BoxGeometry(0.02, frameThick, d - 1 + frameThick * 2), mulMat);
    fBot.position.set(w / 2 - 0.005, winY - winH / 2 - frameThick / 2, 0);
    this.scene.add(fBot);

    // Outside glow plane (simulated daylight) behind window
    const dayMat = new THREE.MeshBasicMaterial({ color: 0x9ec5d8, fog: false });
    const dayGlow = new THREE.Mesh(new THREE.PlaneGeometry(d, h), dayMat);
    dayGlow.position.set(w / 2 + 0.4, h / 2, 0);
    dayGlow.rotation.y = -Math.PI / 2;
    this.scene.add(dayGlow);
    this.dayGlow = dayGlow;

    // Front wall with a door gap (z = d/2) — split into two panels
    const frontLeft = new THREE.Mesh(new THREE.PlaneGeometry(w / 2 - 0.5, h), wallMat);
    frontLeft.position.set(-(w / 4 + 0.25), h / 2, d / 2);
    frontLeft.rotation.y = Math.PI;
    frontLeft.receiveShadow = true;
    this.scene.add(frontLeft);
    const frontRight = new THREE.Mesh(new THREE.PlaneGeometry(w / 2 - 0.5, h), wallMat);
    frontRight.position.set(w / 4 + 0.25, h / 2, d / 2);
    frontRight.rotation.y = Math.PI;
    frontRight.receiveShadow = true;
    this.scene.add(frontRight);
    // Door header above the gap
    const doorHeader = new THREE.Mesh(new THREE.PlaneGeometry(1.0, h - 2.2), wallMat);
    doorHeader.position.set(0, h - (h - 2.2) / 2, d / 2);
    doorHeader.rotation.y = Math.PI;
    this.scene.add(doorHeader);
    // Door itself (open inward)
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x3a2818, roughness: 0.6 });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.2, 0.06), doorMat);
    door.position.set(-0.5, 1.1, d / 2 - 0.05);
    door.rotation.y = 0.5;
    door.castShadow = true;
    this.scene.add(door);

    // Ceiling
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0x3a2e26, roughness: 0.9 });
    this.ceilMat = ceilMat;
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(w, d), ceilMat);
    ceiling.position.y = h;
    ceiling.rotation.x = Math.PI / 2;
    ceiling.receiveShadow = true;
    this.scene.add(ceiling);
    this.ceiling = ceiling;

    // Ceiling beams (rustic)
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0a, roughness: 0.7 });
    for (let i = -1; i <= 1; i++) {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.18), beamMat);
      beam.position.set(0, h - 0.06, i * 2.2);
      beam.castShadow = true;
      this.scene.add(beam);
    }

    // Baseboards
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x2a1a0e, roughness: 0.6 });
    const baseH = 0.12;
    const baseBack = new THREE.Mesh(new THREE.BoxGeometry(w, baseH, 0.03), baseMat);
    baseBack.position.set(0, baseH / 2, -d / 2 + 0.02);
    this.scene.add(baseBack);
    const baseLeft = new THREE.Mesh(new THREE.BoxGeometry(0.03, baseH, d), baseMat);
    baseLeft.position.set(-w / 2 + 0.02, baseH / 2, 0);
    this.scene.add(baseLeft);
    const baseRight = new THREE.Mesh(new THREE.BoxGeometry(0.03, baseH, d), baseMat);
    baseRight.position.set(w / 2 - 0.02, baseH / 2, 0);
    this.scene.add(baseRight);
    const baseFrontL = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 0.5, baseH, 0.03), baseMat);
    baseFrontL.position.set(-(w / 4 + 0.25), baseH / 2, d / 2 - 0.02);
    this.scene.add(baseFrontL);
    const baseFrontR = new THREE.Mesh(new THREE.BoxGeometry(w / 2 - 0.5, baseH, 0.03), baseMat);
    baseFrontR.position.set(w / 4 + 0.25, baseH / 2, d / 2 - 0.02);
    this.scene.add(baseFrontR);
  }

  /* ------------------------------------------------------------------ *
   * Era mounting + lighting profiles
   * ------------------------------------------------------------------ */

  /** Mount an era group into the slot. */
  mountEraGroup(group) {
    this.eraSlot.add(group);
  }

  /** Remove an era group from the slot and dispose its resources. */
  unmountEraGroup(group) {
    this.eraSlot.remove(group);
    group.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m.map && m.map !== this.floorMat?.map) m.map.dispose();
          m.dispose();
        }
      }
    });
  }

  /**
   * Apply an era's lighting profile + floor/wall textures.
   * @param {import('./contracts/PeriodPackage.js').PeriodPackage} pkg
   */
  applyLightingProfile(pkg) {
    const L = pkg.lighting;
    this.hemi.color.setHex(L.ambient);
    this.hemi.groundColor.setHex(pkg.palette.wood);
    this.hemi.intensity = L.ambientI;
    this.ambient.intensity = L.ambientI * 0.5;
    this.keyLight.color.setHex(L.key);
    this.keyLight.intensity = L.keyI;
    this.fillLight.color.setHex(L.fill);
    this.fillLight.intensity = L.fillI;
    this.renderer.toneMappingExposure = L.exposure;

    // Tint the daylight glow by era key light.
    if (this.dayGlow) this.dayGlow.material.color.setHex(L.key).multiplyScalar(0.7);

    // Wall color follows palette wood (subtle).
    this.wallMat.color.setHex(pkg.palette.wood).multiplyScalar(0.55);
    this.ceilMat.color.setHex(pkg.palette.wood).multiplyScalar(0.35);
    this.scene.background = new THREE.Color(pkg.palette.wood).multiplyScalar(0.12);
    this.scene.fog.color = new THREE.Color(pkg.palette.wood).multiplyScalar(0.12);

    // Floor texture: wood for 1945/2005/2025, tile for 1965/1985.
    this.floorMat.map?.dispose();
    if (pkg.id === '1965' || pkg.id === '1985') {
      const a = pkg.id === '1965' ? 0xe8e0d0 : 0xeeeeee;
      const b = pkg.id === '1965' ? 0xb89868 : 0x2a2a4a;
      this.floorMat.map = createTileTexture({ a, b, cells: 8 });
      this.floorMat.color.setHex(0xffffff);
      this.floorMat.roughness = 0.3;
      this.floorMat.metalness = 0.1;
    } else {
      this.floorMat.map = createFloorTexture({
        base: pkg.id === '1945' ? 0x6b4a2b : pkg.id === '2005' ? 0x7a5230 : 0xc9a87a,
        plank: pkg.id === '1945' ? 0x5a3a20 : pkg.id === '2005' ? 0x6a4220 : 0xb89868,
        rows: 8
      });
      this.floorMat.color.setHex(0xffffff);
      this.floorMat.roughness = 0.8;
      this.floorMat.metalness = 0.0;
    }
    this.floorMat.needsUpdate = true;
  }

  /* ------------------------------------------------------------------ *
   * Raycasting
   * ------------------------------------------------------------------ */

  /** Set pointer NDC for a raycast. */
  setPointer(clientX, clientY) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * Raycast against a list of candidate meshes (e.g. hotspot invisible meshes).
   * @param {THREE.Object3D[]} targets
   * @returns {THREE.Intersection|null}
   */
  raycast(targets) {
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(targets, false);
    return hits.length > 0 ? hits[0] : null;
  }

  /** Project a world position to screen coordinates (for DOM hotspots). */
  worldToScreen(worldPos) {
    const v = worldPos.clone().project(this.camera);
    const rect = this.renderer.domElement.getBoundingClientRect();
    return {
      x: (v.x * 0.5 + 0.5) * rect.width + rect.left,
      y: (-v.y * 0.5 + 0.5) * rect.height + rect.top,
      behind: v.z > 1
    };
  }

  /* ------------------------------------------------------------------ *
   * Loop + resize
   * ------------------------------------------------------------------ */

  addUpdateCallback(fn) {
    this.updateCallbacks.push(fn);
  }

  removeUpdateCallback(fn) {
    const i = this.updateCallbacks.indexOf(fn);
    if (i >= 0) this.updateCallbacks.splice(i, 1);
  }

  _animate() {
    this._raf = requestAnimationFrame(this._animate);
    const dt = this.clock.getDelta();
    const elapsed = this.clock.elapsedTime;

    // Era lamp flicker/breathing handled in update callbacks (hotspot markers).
    for (const cb of this.updateCallbacks) {
      try { cb(dt, elapsed); } catch (e) { console.error('[SceneRenderer] update callback error', e); }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /** Disable/enable camera controls (used by inspector panel). */
  setControlsEnabled(enabled) {
    this.controls.enabled = enabled;
  }

  getDomElement() {
    return this.renderer.domElement;
  }

  getCamera() {
    return this.camera;
  }

  getScene() {
    return this.scene;
  }

  dispose() {
    cancelAnimationFrame(this._raf);
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}

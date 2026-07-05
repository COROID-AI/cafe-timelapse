import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

/**
 * Café Timelapse — persistent 3D scene renderer.
 *
 * Builds and owns the *café shell*: the structural room (floor, ceiling, four
 * walls, two windows, a back door, a front counter, a base floor lamp), the
 * ambient/point lighting, the camera, and the dual navigation modes
 * (OrbitControls + pointer-lock first-person walking with WASD/arrow keys).
 *
 * The shell is persistent — it is never torn down when eras change. Era content
 * (furniture, decor, equipment, signage, …) is mounted/unmounted into a
 * dedicated `eraGroup` layer via {@link CafeSceneRenderer#mountEra} /
 * {@link CafeSceneRenderer#unmountEra}.
 *
 * @module scene-renderer
 */

// ---------------------------------------------------------------------------
// Dimensions (metres). The room is centred on the origin.
// ---------------------------------------------------------------------------
const ROOM = {
  width: 10, // X: -5 .. 5
  depth: 8, // Z: -4 .. 4
  height: 3, // Y: 0 .. 3
};
const HALF_W = ROOM.width / 2;
const HALF_D = ROOM.depth / 2;

// Camera / navigation tuning.
const EYE_HEIGHT = 1.6;
const WALK_SPEED = 3.2; // metres / second
const CAMERA_RADIUS = 0.35; // collision margin around the camera

// Back-door opening on the back wall (−Z).
const DOOR = { width: 1.1, height: 2.1 };
// Counter block near the front wall (+Z).
const COUNTER = {
  width: 3.2,
  height: 1.05,
  depth: 0.7,
  z: 3.4,
};
// Windows on the left + right walls.
const WINDOW = { width: 2.0, height: 1.2, sill: 0.9 };

const UI_STYLE_ID = 'cafe-scene-ui-styles';

/**
 * Injects the walk-mode toggle button + crosshair styles exactly once.
 * @returns {void}
 */
function ensureUiStyles() {
  if (document.getElementById(UI_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = UI_STYLE_ID;
  style.textContent = `
    .cafe-ui-toggle {
      position: fixed;
      right: 18px;
      bottom: 18px;
      z-index: 50;
      padding: 10px 16px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.18);
      background: rgba(20,16,12,0.62);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #f3ece0;
      font-family: system-ui, sans-serif;
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: background 0.15s ease, transform 0.1s ease;
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .cafe-ui-toggle:hover { background: rgba(40,30,20,0.78); }
    .cafe-ui-toggle:active { transform: translateY(1px); }
    .cafe-ui-toggle.is-walking { background: rgba(120,60,20,0.8); border-color: rgba(255,200,120,0.5); }
    .cafe-crosshair {
      position: fixed;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      z-index: 40;
      width: 18px; height: 18px;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    .cafe-crosshair::before, .cafe-crosshair::after {
      content: ""; position: absolute; background: rgba(255,255,255,0.75);
      box-shadow: 0 0 4px rgba(0,0,0,0.6);
    }
    .cafe-crosshair::before { left: 50%; top: 0; width: 2px; height: 100%; transform: translateX(-50%); }
    .cafe-crosshair::after  { top: 50%; left: 0; height: 2px; width: 100%; transform: translateY(-50%); }
    .cafe-crosshair.is-visible { opacity: 1; }
    .cafe-hint {
      position: fixed; left: 50%; bottom: 70px; transform: translateX(-50%);
      z-index: 45; color: rgba(243,236,224,0.7); font-family: system-ui, sans-serif;
      font-size: 12px; pointer-events: none; opacity: 0; transition: opacity 0.3s ease;
    }
    .cafe-hint.is-visible { opacity: 1; }
  `;
  document.head.appendChild(style);
}

/**
 * Build an axis-aligned bounding box (AABB) collision wall list for the room.
 *
 * The back wall (−Z) has a door opening carved out by splitting it into a left
 * segment, a right segment, and a header above the door. The counter is a
 * standalone solid box.
 *
 * @returns {THREE.Box3[]} Array of AABBs the camera cannot penetrate.
 */
function buildCollisionBoxes() {
  const boxes = [];
  const push = (min, max) => boxes.push(new THREE.Box3(
    new THREE.Vector3(...min), new THREE.Vector3(...max)));

  // Left wall (+X face handled below; left is −X).
  push([-HALF_W, 0, -HALF_D], [-HALF_W + 0.2, ROOM.height, HALF_D]);
  // Right wall (+X).
  push([HALF_W - 0.2, 0, -HALF_D], [HALF_W, ROOM.height, HALF_D]);

  // Front wall (+Z) — solid.
  push([-HALF_W, 0, HALF_D - 0.2], [HALF_W, ROOM.height, HALF_D]);

  // Back wall (−Z) with a centred door opening of DOOR.width × DOOR.height.
  const dhw = DOOR.width / 2;
  const wallT = 0.2;
  // left of door
  push([-HALF_W, 0, -HALF_D], [-dhw, ROOM.height, -HALF_D + wallT]);
  // right of door
  push([dhw, 0, -HALF_D], [HALF_W, ROOM.height, -HALF_D + wallT]);
  // header above door
  push([-dhw, DOOR.height, -HALF_D], [dhw, ROOM.height, -HALF_D + wallT]);

  // Counter (solid box the camera cannot walk through).
  const chw = COUNTER.width / 2;
  push(
    [-chw, 0, COUNTER.z - COUNTER.depth / 2],
    [chw, COUNTER.height, COUNTER.z + COUNTER.depth / 2],
  );

  return boxes;
}

/**
 * Creates a window-shaped wall segment helper — returns a Group of three
 * opaque panels (top, left, right of the opening) used when assembling a wall
 * with a window hole by composition.
 *
 * (The actual window glass + frame is added separately.)
 *
 * @param {Object} p
 * @param {number} p.openWidth  Width of the window opening.
 * @param {number} p.openHeight Height of the window opening.
 * @param {number} p.sill       Y of the window sill.
 * @param {number} p.wallHeight Total wall height.
 * @param {number} p.wallWidth  Total wall width.
 * @param {THREE.Material} p.material Shared wall material.
 * @param {number} p.thickness  Panel thickness.
 * @returns {THREE.Group}
 */
function buildWallWithWindow({
  openWidth, openHeight, sill, wallHeight, wallWidth, material, thickness,
}) {
  const group = new THREE.Group();
  const ohw = openWidth / 2;
  const topH = wallHeight - (sill + openHeight);
  const sideW = (wallWidth - openWidth) / 2;

  // Top panel.
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(wallWidth, topH, thickness), material);
  top.position.set(0, sill + openHeight + topH / 2, 0);
  group.add(top);

  // Left panel.
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(sideW, openHeight, thickness), material);
  left.position.set(-ohw - sideW / 2, sill + openHeight / 2, 0);
  group.add(left);

  // Right panel.
  const right = new THREE.Mesh(
    new THREE.BoxGeometry(sideW, openHeight, thickness), material);
  right.position.set(ohw + sideW / 2, sill + openHeight / 2, 0);
  group.add(right);

  // Sill / bottom panel below the window.
  const bottom = new THREE.Mesh(
    new THREE.BoxGeometry(wallWidth, sill, thickness), material);
  bottom.position.set(0, sill / 2, 0);
  group.add(bottom);

  return group;
}

/**
 * CaféSceneRenderer — owns the persistent 3D café shell and navigation.
 */
export class CafeSceneRenderer {
  /**
   * @param {HTMLElement} container DOM element to mount the canvas into.
   */
  constructor(container) {
    this.container = container || document.body;

    // --- Renderer -----------------------------------------------------------
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.container.appendChild(this.renderer.domElement);

    // --- Scene --------------------------------------------------------------
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x14110d);

    // --- Camera -------------------------------------------------------------
    this.camera = new THREE.PerspectiveCamera(
      62, window.innerWidth / window.innerHeight, 0.05, 200);
    this.camera.position.set(0, EYE_HEIGHT, 2.6);

    // --- Lighting -----------------------------------------------------------
    this._buildLights();

    // --- Room shell (persistent) -------------------------------------------
    this.shell = new THREE.Group();
    this.shell.name = 'cafeShell';
    this.scene.add(this.shell);
    this._buildRoom();

    // --- Era content layer (swapped per period) ----------------------------
    this.eraGroup = new THREE.Group();
    this.eraGroup.name = 'cafeEra';
    this.scene.add(this.eraGroup);

    // --- Collision ----------------------------------------------------------
    this.colliders = buildCollisionBoxes();

    // --- Navigation ---------------------------------------------------------
    this._buildOrbitControls();
    this._buildPointerLockControls();
    this._buildWalkToggleButton();
    this._registerInput();

    // --- Loop ---------------------------------------------------------------
    this._clock = new THREE.Clock();
    this._animate = this._animate.bind(this);
    this.renderer.setAnimationLoop(this._animate);

    // --- Resize -------------------------------------------------------------
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  // -------------------------------------------------------------------------
  // Lighting
  // -------------------------------------------------------------------------
  /** @private */
  _buildLights() {
    const hemi = new THREE.HemisphereLight(0xfff1d6, 0x3b2a1a, 0.55);
    this.scene.add(hemi);

    const ambient = new THREE.AmbientLight(0xffffff, 0.18);
    this.scene.add(ambient);

    // Warm key light (the floor lamp is added in _buildRoom; this is a soft
    // ceiling fill so the room reads even before era lighting is mounted).
    this.keyLight = new THREE.PointLight(0xffd9a0, 0.9, 16, 1.6);
    this.keyLight.position.set(0, ROOM.height - 0.25, 0);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.bias = -0.0004;
    this.scene.add(this.keyLight);
  }

  // -------------------------------------------------------------------------
  // Room shell
  // -------------------------------------------------------------------------
  /** @private */
  _buildRoom() {
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x6b5640, roughness: 0.92, metalness: 0.0,
    });
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x4a3526, roughness: 0.85, metalness: 0.0,
    });
    const ceilMat = new THREE.MeshStandardMaterial({
      color: 0x5a4838, roughness: 0.95, metalness: 0.0,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x2e2117, roughness: 0.6, metalness: 0.1,
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x9fc4d8, roughness: 0.05, metalness: 0.2,
      transparent: true, opacity: 0.32,
    });
    const counterMat = new THREE.MeshStandardMaterial({
      color: 0x3c2a1c, roughness: 0.5, metalness: 0.15,
    });
    const topMat = new THREE.MeshStandardMaterial({
      color: 0x1c1410, roughness: 0.35, metalness: 0.25,
    });

    // Floor.
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    this.shell.add(floor);

    // Ceiling.
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(ROOM.width, ROOM.depth), ceilMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = ROOM.height;
    ceiling.receiveShadow = true;
    ceiling.name = 'ceiling';
    this.shell.add(ceiling);

    // Front wall (+Z) — solid.
    const front = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM.width, ROOM.height, 0.2), wallMat);
    front.position.set(0, ROOM.height / 2, HALF_D - 0.1);
    front.receiveShadow = true;
    front.castShadow = false;
    front.name = 'wallFront';
    this.shell.add(front);

    // Back wall (−Z) with a centred door opening.
    this._buildBackWall(wallMat, frameMat);

    // Left wall (−X) with a window.
    this._buildSideWall({
      axis: 'left', mat: wallMat, frameMat, glassMat,
    });
    // Right wall (+X) with a window.
    this._buildSideWall({
      axis: 'right', mat: wallMat, frameMat, glassMat,
    });

    // Counter.
    this._buildCounter(counterMat, topMat);

    // Base floor lamp.
    this._buildFloorLamp();
  }

  /**
   * Back wall with a door opening (composed of header + two side panels) plus
   * a door frame and a simple door leaf.
   * @private
   */
  _buildBackWall(wallMat, frameMat) {
    const wallT = 0.2;
    const dhw = DOOR.width / 2;
    const group = new THREE.Group();
    group.name = 'wallBack';

    // Header above door.
    const headerH = ROOM.height - DOOR.height;
    const header = new THREE.Mesh(
      new THREE.BoxGeometry(ROOM.width, headerH, wallT), wallMat);
    header.position.set(0, DOOR.height + headerH / 2, -HALF_D + wallT / 2);
    header.receiveShadow = true;
    group.add(header);

    // Left of door.
    const leftW = HALF_W - dhw;
    const left = new THREE.Mesh(
      new THREE.BoxGeometry(leftW, DOOR.height, wallT), wallMat);
    left.position.set(-HALF_W + leftW / 2, DOOR.height / 2, -HALF_D + wallT / 2);
    left.receiveShadow = true;
    group.add(left);

    // Right of door.
    const right = new THREE.Mesh(
      new THREE.BoxGeometry(leftW, DOOR.height, wallT), wallMat);
    right.position.set(HALF_W - leftW / 2, DOOR.height / 2, -HALF_D + wallT / 2);
    right.receiveShadow = true;
    group.add(right);

    // Door frame (trim) around the opening.
    const trimT = 0.06;
    const trimDepth = wallT + 0.04;
    // top trim
    const topTrim = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR.width + trimT * 2, trimT, trimDepth), frameMat);
    topTrim.position.set(0, DOOR.height, -HALF_D + wallT / 2);
    group.add(topTrim);
    // left trim
    const sideTrim = new THREE.Mesh(
      new THREE.BoxGeometry(trimT, DOOR.height, trimDepth), frameMat);
    sideTrim.position.set(-dhw, DOOR.height / 2, -HALF_D + wallT / 2);
    group.add(sideTrim);
    // right trim
    const sideTrim2 = sideTrim.clone();
    sideTrim2.position.x = dhw;
    group.add(sideTrim2);

    // Door leaf (closed, hinged on the left).
    const leaf = new THREE.Mesh(
      new THREE.BoxGeometry(DOOR.width - 0.04, DOOR.height - 0.04, 0.05), frameMat);
    leaf.position.set(-0.02, DOOR.height / 2, -HALF_D + wallT / 2 - 0.02);
    leaf.castShadow = true;
    leaf.name = 'doorLeaf';
    group.add(leaf);

    this.shell.add(group);
  }

  /**
   * Builds a side wall (left/right) with a window opening, glass pane, and
   * a window frame.
   * @private
   * @param {Object} p
   * @param {'left'|'right'} p.axis
   */
  _buildSideWall({ axis, mat, frameMat, glassMat }) {
    const wallT = 0.2;
    const isLeft = axis === 'left';
    const group = buildWallWithWindow({
      openWidth: WINDOW.width,
      openHeight: WINDOW.height,
      sill: WINDOW.sill,
      wallHeight: ROOM.height,
      wallWidth: ROOM.depth, // wall spans along Z
      material: mat,
      thickness: wallT,
    });
    group.name = `wall${isLeft ? 'Left' : 'Right'}`;

    // Rotate so the wall faces along X and place at the correct side.
    group.rotation.y = Math.PI / 2;
    const xPos = isLeft ? -HALF_W + wallT / 2 : HALF_W - wallT / 2;
    group.position.set(xPos, 0, 0);
    group.traverse((o) => { if (o.isMesh) o.receiveShadow = true; });
    this.shell.add(group);

    // Window glass pane inside the opening.
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(WINDOW.width, WINDOW.height), glassMat);
    glass.rotation.y = Math.PI / 2;
    glass.position.set(xPos, WINDOW.sill + WINDOW.height / 2, 0);
    glass.name = `glass${isLeft ? 'Left' : 'Right'}`;
    this.shell.add(glass);

    // Window frame (mullions) for a touch of detail.
    const frameGroup = new THREE.Group();
    frameGroup.name = `frame${isLeft ? 'Left' : 'Right'}`;
    const mullionH = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, WINDOW.width, 0.05), frameMat);
    mullionH.rotation.x = Math.PI / 2;
    mullionH.position.set(xPos, WINDOW.sill + WINDOW.height / 2, 0);
    const mullionV = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, WINDOW.height, 0.05), frameMat);
    mullionV.position.set(xPos, WINDOW.sill + WINDOW.height / 2, 0);
    frameGroup.add(mullionH, mullionV);

    // Outer sill trim.
    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.06, WINDOW.width + 0.1), frameMat);
    sill.rotation.y = Math.PI / 2;
    sill.position.set(xPos, WINDOW.sill - 0.04, 0);
    frameGroup.add(sill);

    this.shell.add(frameGroup);
  }

  /**
   * Front counter near the +Z wall.
   * @private
   */
  _buildCounter(counterMat, topMat) {
    const group = new THREE.Group();
    group.name = 'counter';

    const base = new THREE.Mesh(
      new THREE.BoxGeometry(COUNTER.width, COUNTER.height, COUNTER.depth),
      counterMat);
    base.position.set(0, COUNTER.height / 2, COUNTER.z);
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // Counter top slab (slightly wider, glossy).
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(COUNTER.width + 0.12, 0.06, COUNTER.depth + 0.12),
      topMat);
    top.position.set(0, COUNTER.height + 0.03, COUNTER.z);
    top.castShadow = true;
    top.receiveShadow = true;
    group.add(top);

    // Customer-side toe kick (visual detail).
    const kick = new THREE.Mesh(
      new THREE.BoxGeometry(COUNTER.width, 0.12, 0.08), counterMat);
    kick.position.set(0, 0.06, COUNTER.z - COUNTER.depth / 2 - 0.04);
    group.add(kick);

    this.shell.add(group);
  }

  /**
   * Base floor lamp — a standing lamp in a corner providing warm accent light.
   * @private
   */
  _buildFloorLamp() {
    const group = new THREE.Group();
    group.name = 'floorLamp';

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x1a1a1a, roughness: 0.4, metalness: 0.7,
    });
    const shadeMat = new THREE.MeshStandardMaterial({
      color: 0xf2e2c0, roughness: 0.6, metalness: 0.0,
      emissive: 0xffb86b, emissiveIntensity: 0.35,
    });

    const poleH = 1.5;
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.025, poleH, 12), metalMat);
    pole.position.set(0, poleH / 2, 0);
    pole.castShadow = true;
    group.add(pole);

    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.2, 0.05, 24), metalMat);
    base.position.y = 0.025;
    base.castShadow = true;
    group.add(base);

    const shade = new THREE.Mesh(
      new THREE.ConeGeometry(0.22, 0.28, 24, 1, true), shadeMat);
    shade.position.y = poleH + 0.06;
    shade.rotation.x = Math.PI; // open downward
    group.add(shade);

    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.06, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0xfff0d0, emissive: 0xffce8a, emissiveIntensity: 1.2,
      }));
    bulb.position.y = poleH - 0.02;
    group.add(bulb);

    // Actual light source.
    const lampLight = new THREE.PointLight(0xffb86b, 1.1, 8, 2);
    lampLight.position.y = poleH - 0.02;
    lampLight.castShadow = true;
    lampLight.shadow.mapSize.set(512, 512);
    group.add(lampLight);

    // Park it in the front-left corner.
    group.position.set(-HALF_W + 0.55, 0, HALF_D - 0.6);
    this.shell.add(group);
  }

  // -------------------------------------------------------------------------
  // OrbitControls (inspect mode)
  // -------------------------------------------------------------------------
  /** @private */
  _buildOrbitControls() {
    this.orbit = new OrbitControls(this.camera, this.renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.minDistance = 0.6;
    this.orbit.maxDistance = 9;
    this.orbit.maxPolarAngle = Math.PI * 0.495; // don't go below the floor
    this.orbit.target.set(0, EYE_HEIGHT * 0.6, 0);
    this.orbit.update();
  }

  // -------------------------------------------------------------------------
  // PointerLockControls (first-person walk mode)
  // -------------------------------------------------------------------------
  /** @private */
  _buildPointerLockControls() {
    this.pointerLock = new PointerLockControls(this.camera, this.renderer.domElement);
    // PointerLockControls is added to the scene on lock and removed on unlock,
    // so we keep a reference but don't add it to the scene yet.
    this.walkMode = false;
    this._move = { forward: 0, right: 0 }; // -1, 0, 1
    this._velocity = new THREE.Vector3();
  }

  /** @private */
  _buildWalkToggleButton() {
    ensureUiStyles();

    this._crosshair = document.createElement('div');
    this._crosshair.className = 'cafe-crosshair';
    document.body.appendChild(this._crosshair);

    this._hint = document.createElement('div');
    this._hint.className = 'cafe-hint';
    this._hint.textContent = 'WASD / Arrows to move · Esc to release';
    document.body.appendChild(this._hint);

    this._walkBtn = document.createElement('button');
    this._walkBtn.type = 'button';
    this._walkBtn.className = 'cafe-ui-toggle';
    this._walkBtn.textContent = '🚶 Walk Mode';
    this._walkBtn.title = 'Toggle first-person walk mode (pointer lock)';
    document.body.appendChild(this._walkBtn);

    this._walkBtn.addEventListener('click', () => {
      if (this.walkMode) {
        // Exit.
        if (document.pointerLockElement) document.exitPointerLock();
      } else {
        // Enter — request pointer lock on the canvas.
        this.pointerLock.lock();
      }
    });

    const onLock = () => {
      this.walkMode = true;
      this.orbit.enabled = false;
      this._walkBtn.classList.add('is-walking');
      this._walkBtn.textContent = '🎥 Orbit Mode';
      this._crosshair.classList.add('is-visible');
      this._hint.classList.add('is-visible');
      setTimeout(() => this._hint.classList.remove('is-visible'), 2600);
    };
    const onUnlock = () => {
      this.walkMode = false;
      this.orbit.enabled = true;
      this._walkBtn.classList.remove('is-walking');
      this._walkBtn.textContent = '🚶 Walk Mode';
      this._crosshair.classList.remove('is-visible');
      this._hint.classList.remove('is-visible');
      // Reset movement so the camera doesn't drift after releasing.
      this._move.forward = 0;
      this._move.right = 0;
    };

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement === this.renderer.domElement) onLock();
      else onUnlock();
    });
  }

  // -------------------------------------------------------------------------
  // Keyboard input (WASD + arrows)
  // -------------------------------------------------------------------------
  /** @private */
  _registerInput() {
    this._onKeyDown = (e) => {
      if (!this.walkMode) return;
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this._move.forward = 1; break;
        case 'KeyS': case 'ArrowDown': this._move.forward = -1; break;
        case 'KeyD': case 'ArrowRight': this._move.right = 1; break;
        case 'KeyA': case 'ArrowLeft': this._move.right = -1; break;
        default: break;
      }
    };
    this._onKeyUp = (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp':
          if (this._move.forward > 0) this._move.forward = 0; break;
        case 'KeyS': case 'ArrowDown':
          if (this._move.forward < 0) this._move.forward = 0; break;
        case 'KeyD': case 'ArrowRight':
          if (this._move.right > 0) this._move.right = 0; break;
        case 'KeyA': case 'ArrowLeft':
          if (this._move.right < 0) this._move.right = 0; break;
        default: break;
      }
    };
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  // -------------------------------------------------------------------------
  // Collision resolution
  // -------------------------------------------------------------------------
  /**
   * Clamps a desired camera position so it (plus its collision radius) cannot
   * intersect any AABB in {@link CafeSceneRenderer#colliders}, and cannot
   * leave the room bounds or go below the floor.
   *
   * Uses a per-axis resolution: we test X and Z independently so the camera
   * slides along walls instead of sticking.
   *
   * @private
   * @param {THREE.Vector3} desired Next-frame position the camera wants.
   * @returns {THREE.Vector3} The collision-safe position.
   */
  _resolveCollision(desired) {
    const safe = desired.clone();

    // Keep inside the room footprint (minus radius).
    const minX = -HALF_W + CAMERA_RADIUS;
    const maxX = HALF_W - CAMERA_RADIUS;
    const minZ = -HALF_D + CAMERA_RADIUS;
    const maxZ = HALF_D - CAMERA_RADIUS;
    safe.x = Math.max(minX, Math.min(maxX, safe.x));
    safe.z = Math.max(minZ, Math.min(maxZ, safe.z));
    safe.y = EYE_HEIGHT; // lock to eye height while walking

    // Build a small AABB around the candidate position.
    const makeBox = (p) => new THREE.Box3(
      new THREE.Vector3(p.x - CAMERA_RADIUS, 0, p.z - CAMERA_RADIUS),
      new THREE.Vector3(p.x + CAMERA_RADIUS, ROOM.height, p.z + CAMERA_RADIUS));

    // Per-axis resolution so we slide along walls.
    const tryX = safe.clone(); tryX.x = desired.x;
    if (!this._intersectsAny(makeBox(tryX))) safe.x = tryX.x;
    const tryZ = safe.clone(); tryZ.z = desired.z;
    if (!this._intersectsAny(makeBox(tryZ))) safe.z = tryZ.z;

    return safe;
  }

  /**
   * @private
   * @param {THREE.Box3} box
   * @returns {boolean}
   */
  _intersectsAny(box) {
    for (let i = 0; i < this.colliders.length; i++) {
      if (box.intersectsBox(this.colliders[i])) return true;
    }
    return false;
  }

  // -------------------------------------------------------------------------
  // Era content mounting (public-ish API used by window.CafeScene)
  // -------------------------------------------------------------------------

  /**
   * Mount a period package's 3D content group into the scene.
   *
   * Removes + disposes any previously mounted era group first (atomic swap).
   * The persistent shell is untouched.
   *
   * @param {THREE.Object3D} eraGroup
   * @returns {void}
   */
  mountEra(eraGroup) {
    if (this.eraGroup === eraGroup) return;
    this.unmountEra();
    this.eraGroup.add(eraGroup);
    this._mountedEra = eraGroup;
  }

  /**
   * Unmount + dispose the currently mounted era content group (if any).
   * @returns {void}
   */
  unmountEra() {
    if (this._mountedEra) {
      this._disposeObject(this._mountedEra);
      this.eraGroup.remove(this._mountedEra);
      this._mountedEra = null;
    }
  }

  /**
   * Recursively disposes geometries + materials of an Object3D subtree.
   * @private
   * @param {THREE.Object3D} obj
   */
  _disposeObject(obj) {
    obj.traverse((node) => {
      if (node.isMesh) {
        node.geometry?.dispose?.();
        const mat = node.material;
        if (Array.isArray(mat)) mat.forEach((m) => m?.dispose?.());
        else mat?.dispose?.();
      }
    });
  }

  // -------------------------------------------------------------------------
  // Animation loop
  // -------------------------------------------------------------------------
  /** @private */
  _animate() {
    const dt = Math.min(this._clock.getDelta(), 0.05);

    if (this.walkMode) {
      this._updateWalk(dt);
    } else {
      this.orbit.update();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * First-person walk update: read movement input, compute desired position,
   * resolve collisions, and apply.
   * @private
   * @param {number} dt
   */
  _updateWalk(dt) {
    const speed = WALK_SPEED;
    const moveZ = this._move.forward; // +forward
    const moveX = this._move.right; // +right

    if (moveZ === 0 && moveX === 0) return;

    // PointerLockControls.moveForward/moveRight move the camera along its
    // facing direction; we compute a desired delta and collide-resolve it.
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, this.camera.up).normalize();

    const delta = new THREE.Vector3();
    delta.addScaledVector(forward, moveZ * speed * dt);
    delta.addScaledVector(right, moveX * speed * dt);

    const desired = this.camera.position.clone().add(delta);
    const safe = this._resolveCollision(desired);
    this.camera.position.copy(safe);
  }

  // -------------------------------------------------------------------------
  // Resize / teardown
  // -------------------------------------------------------------------------
  /** @private */
  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * Tear down the renderer, remove listeners, and dispose GPU resources.
   * @returns {void}
   */
  dispose() {
    this.renderer.setAnimationLoop(null);
    window.removeEventListener('resize', this._onResize);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    this.unmountEra();
    this._disposeObject(this.shell);
    this._walkBtn?.remove();
    this._crosshair?.remove();
    this._hint?.remove();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}

export default CafeSceneRenderer;

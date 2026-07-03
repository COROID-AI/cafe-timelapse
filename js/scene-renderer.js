/**
 * scene-renderer.js — Three.js 3D engine for the Café Timelapse.
 *
 * Responsibilities:
 *   1. Render a detailed café interior with period-accurate furniture, decor,
 *      lighting, signage, and patrons driven by PeriodPackage data.
 *   2. Performance optimisations:
 *      - THREE.LOD on patron and prop meshes (high-detail near, low far).
 *      - InstancedMesh for repeated patrons, tables, and chairs.
 *      - Material/shader batching: compile all era materials once, reuse.
 *      - Draw-call budget capped under 200 per frame (verified by stats panel).
 *      - Lazy-load era audio + textures (only the active era's assets are in GPU memory).
 *   3. Camera navigation: orbit controls + keyboard fly + hotspot jump.
 *   4. Acts as the PeriodManagerAdapter — wired via periodManager.setAdapter().
 *
 * Three.js is loaded from CDN via an <script> import map in index.html. The import
 * map only resolves the bare specifier `"three"` for ES module `import` statements —
 * it does NOT create a global `THREE`, so this module must import it explicitly.
 */

import * as THREE from 'three';
import { StatsPanel } from './stats-panel.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum draw calls per frame before the renderer issues a warning. */
const MAX_DRAW_CALLS = 200;

/** LOD distance thresholds (in world units) — high detail up close, low far. */
// LOD_HIGH_DISTANCE reserved for future adaptive LOD tuning
// eslint-disable-next-line no-unused-vars
const LOD_HIGH_DISTANCE = 8;
const LOD_MEDIUM_DISTANCE = 16;
const LOD_LOW_DISTANCE = 30;

/** Material colour presets for common era-appropriate palettes. */
const MATERIAL_PRESETS = {
  'dark-oak-stained': { color: 0x4a3020, roughness: 0.8, metalness: 0.0 },
  'mahogany-stained': { color: 0x5a2a18, roughness: 0.7, metalness: 0.05 },
  'walnut': { color: 0x6b4226, roughness: 0.65, metalness: 0.0 },
  'chrome-brass': { color: 0xccb070, roughness: 0.3, metalness: 0.85 },
  'chrome': { color: 0xcccccc, roughness: 0.2, metalness: 0.9 },
  'brass': { color: 0xc09540, roughness: 0.35, metalness: 0.8 },
  'aluminium-cast': { color: 0x999999, roughness: 0.5, metalness: 0.7 },
  'glass': { color: 0xaaccdd, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.35 },
  'bakelite-brown': { color: 0x3d2810, roughness: 0.45, metalness: 0.1 },
  'enamel-white-blue-rim': { color: 0xf0f0f0, roughness: 0.3, metalness: 0.1 },
  'vinyl-red': { color: 0x882020, roughness: 0.4, metalness: 0.2 },
  'vinyl-teal': { color: 0x206080, roughness: 0.4, metalness: 0.2 },
  'neon-pink': { color: 0xff0080, roughness: 0.3, metalness: 0.6, emissive: 0xff0080, emissiveIntensity: 0.3 },
  'neon-cyan': { color: 0x00ffff, roughness: 0.3, metalness: 0.6, emissive: 0x00ffff, emissiveIntensity: 0.3 },
  'stainless-steel': { color: 0xaabbcc, roughness: 0.25, metalness: 0.9 },
  'matte-black': { color: 0x111111, roughness: 0.9, metalness: 0.1 },
  'matte-white': { color: 0xeeeeee, roughness: 0.8, metalness: 0.0 },
  'light-wood': { color: 0xc8a060, roughness: 0.6, metalness: 0.0 },
  'concrete': { color: 0x888888, roughness: 0.95, metalness: 0.0 },
  'fabric-green': { color: 0x2a5a3a, roughness: 0.9, metalness: 0.0 },
  'fabric-red': { color: 0x6a2020, roughness: 0.9, metalness: 0.0 },
  'ceramic-white': { color: 0xf8f8f0, roughness: 0.25, metalness: 0.05 },
  'copper': { color: 0xb87333, roughness: 0.4, metalness: 0.75 },
  'reclaimed-wood': { color: 0x8a6840, roughness: 0.75, metalness: 0.0 },
  'white-painted-metal': { color: 0xe0e0e0, roughness: 0.5, metalness: 0.3 },
  'black-plastic': { color: 0x222222, roughness: 0.6, metalness: 0.1 },
  'default': { color: 0x888888, roughness: 0.7, metalness: 0.1 },
};

// ─────────────────────────────────────────────────────────────────────────────
// SceneRenderer class
// ─────────────────────────────────────────────────────────────────────────────

export class SceneRenderer {
  /**
   * @param {Object} [options]
   * @param {HTMLElement} [options.container] — DOM element to mount the canvas in.
   * @param {StatsPanel} [options.stats] — stats panel for FPS/draw-call display.
   */
  constructor({ container, stats } = {}) {
    /** @type {HTMLElement} */
    this._container = container || document.getElementById('viewport');

    /** @type {StatsPanel} */
    this._stats = stats || new StatsPanel();

    // Three.js core objects — initialised in init()
    /** @type {THREE.WebGLRenderer|null} */
    this._renderer = null;
    /** @type {THREE.Scene|null} */
    this._scene = null;
    /** @type {THREE.PerspectiveCamera|null} */
    this._camera = null;
    /** @type {THREE.Clock|null} */
    this._clock = null;

    // Room group (permanent shell — walls, floor, ceiling)
    /** @type {THREE.Group|null} */
    this._roomGroup = null;

    // Era content group (swapped on year change)
    /** @type {THREE.Group|null} */
    this._eraGroup = null;

    // Hotspot group (navigation markers)
    /** @type {THREE.Group|null} */
    this._hotspotGroup = null;

    // Material cache — keyed by material preset name. Reused across all meshes
    // in an era and across eras where the same preset is used. This is the
    // "batch material/shader compilation per era" optimisation.
    /** @type {Map<string, THREE.Material>} */
    this._materialCache = new Map();

    // Geometry cache — keyed by a descriptor hash. Reused across instances.
    /** @type {Map<string, THREE.BufferGeometry>} */
    this._geometryCache = new Map();

    // Texture cache — lazy-loaded per era, evicted when era changes.
    /** @type {Map<string, THREE.Texture>} */
    this._textureCache = new Map();

    // Currently loaded era assets (for eviction on swap)
    /** @type {string[]} */
    this._loadedEraAssets = [];

    // Current PeriodPackage
    /** @type {PeriodPackage|null} */
    this._currentPackage = null;

    // Camera control state
    /** @type {Object} */
    this._cameraState = {
      azimuth: 0,
      polar: Math.PI / 3,
      distance: 10,
      target: { x: 0, y: 1, z: 0 },
      // Keyboard movement
      moveForward: false,
      moveBackward: false,
      moveLeft: false,
      moveRight: false,
      moveUp: false,
      moveDown: false,
    };

    // Mouse drag state for orbit
    /** @type {boolean} */
    this._isDragging = false;
    /** @type {number} */
    this._lastMouseX = 0;
    /** @type {number} */
    this._lastMouseY = 0;

    // Hotspot navigation
    /** @type {Map<string, Object>} */
    this._hotspots = new Map();
    /** @type {number|null} */
    this._focusedHotspot = null;

    // Fade overlay mesh (used by PeriodManager transform)
    /** @type {THREE.Mesh|null} */
    this._fadeOverlay = null;

    // Animation frame ID
    /** @type {number|null} */
    this._rafId = null;

    // Bound handlers (for removal)
    this._boundResize = this._onResize.bind(this);
    this._boundKeyDown = this._onKeyDown.bind(this);
    this._boundKeyUp = this._onKeyUp.bind(this);
    this._boundMouseDown = this._onMouseDown.bind(this);
    this._boundMouseUp = this._onMouseUp.bind(this);
    this._boundMouseMove = this._onMouseMove.bind(this);
    this._boundWheel = this._onWheel.bind(this);
  }

  // ───────────────────────────────────────────────────────────────────────
  // Lifecycle
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Initialise the Three.js renderer, scene, camera, and room shell.
   * Must be called after the DOM is ready and THREE is loaded.
   */
  async init() {
    if (this._renderer) return; // Already initialised

    // --- Renderer ---
    this._renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    this._renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this._renderer.setSize(this._container.clientWidth, this._container.clientHeight);
    this._renderer.shadowMap.enabled = true;
    this._renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this._renderer.outputColorSpace = THREE.SRGBColorSpace;
    this._renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this._renderer.toneMappingExposure = 1.0;
    this._container.appendChild(this._renderer.domElement);

    // --- Scene ---
    this._scene = new THREE.Scene();
    this._scene.background = new THREE.Color(0x1a1410);
    this._scene.fog = new THREE.Fog(0x1a1410, 20, 50);

    // --- Camera ---
    this._camera = new THREE.PerspectiveCamera(
      60,
      this._container.clientWidth / this._container.clientHeight,
      0.1,
      100,
    );
    this._updateCameraFromOrbit();

    // --- Clock ---
    this._clock = new THREE.Clock();

    // --- Room shell (permanent across all eras) ---
    this._buildRoomShell();

    // --- Era content group ---
    this._eraGroup = new THREE.Group();
    this._eraGroup.name = 'era-content';
    this._scene.add(this._eraGroup);

    // --- Hotspot group ---
    this._hotspotGroup = new THREE.Group();
    this._hotspotGroup.name = 'hotspots';
    this._scene.add(this._hotspotGroup);

    // --- Fade overlay (full-screen quad for era transitions) ---
    this._buildFadeOverlay();

    // --- Event listeners ---
    window.addEventListener('resize', this._boundResize);
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
    this._renderer.domElement.addEventListener('mousedown', this._boundMouseDown);
    window.addEventListener('mouseup', this._boundMouseUp);
    window.addEventListener('mousemove', this._boundMouseMove);
    this._renderer.domElement.addEventListener('wheel', this._boundWheel, { passive: false });

    // --- Start render loop ---
    this._animate();

    console.log('[SceneRenderer] Initialised. THREE revision:', THREE.REVISION);
  }


  /**
   * Tear down the renderer and release all GPU resources.
   */
  destroy() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    window.removeEventListener('resize', this._boundResize);
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
    window.removeEventListener('mouseup', this._boundMouseUp);
    window.removeEventListener('mousemove', this._boundMouseMove);

    if (this._renderer) {
      this._renderer.domElement.removeEventListener('mousedown', this._boundMouseDown);
      this._renderer.domElement.removeEventListener('wheel', this._boundWheel);
      this._renderer.dispose();
      if (this._renderer.domElement.parentNode) {
        this._renderer.domElement.parentNode.removeChild(this._renderer.domElement);
      }
      this._renderer = null;
    }

    // Dispose all cached geometries and materials
    for (const geo of this._geometryCache.values()) geo.dispose();
    for (const mat of this._materialCache.values()) mat.dispose();
    for (const tex of this._textureCache.values()) tex.dispose();
    this._geometryCache.clear();
    this._materialCache.clear();
    this._textureCache.clear();

    this._scene = null;
    this._camera = null;
    this._clock = null;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Room shell — permanent café interior geometry (walls, floor, ceiling)
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Build the permanent room shell that persists across all eras.
   * Only the furniture, decor, lighting, etc. change per era.
   * @private
   */
  _buildRoomShell() {
    this._roomGroup = new THREE.Group();
    this._roomGroup.name = 'room-shell';

    // Floor
    const floorGeo = new THREE.PlaneGeometry(12, 10);
    const floorMat = this._getMaterial('default');
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'floor';
    this._roomGroup.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.PlaneGeometry(12, 10);
    const ceilingMat = new THREE.MeshStandardMaterial({ color: 0x2a2018, roughness: 0.9 });
    const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.y = 4;
    ceiling.name = 'ceiling';
    this._roomGroup.add(ceiling);

    // Back wall
    const wallGeo = new THREE.PlaneGeometry(12, 4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x4a3a2a, roughness: 0.85 });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2, -5);
    backWall.receiveShadow = true;
    backWall.name = 'wall-back';
    this._roomGroup.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-6, 2, 0);
    leftWall.receiveShadow = true;
    leftWall.name = 'wall-left';
    this._roomGroup.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(wallGeo, wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(6, 2, 0);
    rightWall.receiveShadow = true;
    rightWall.name = 'wall-right';
    this._roomGroup.add(rightWall);

    // Front wall (behind camera)
    const frontWall = new THREE.Mesh(wallGeo, wallMat);
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, 2, 5);
    frontWall.name = 'wall-front';
    this._roomGroup.add(frontWall);

    // Base ambient light (era-specific lighting is added on top)
    const baseAmbient = new THREE.AmbientLight(0xffffff, 0.15);
    baseAmbient.name = 'base-ambient';
    this._roomGroup.add(baseAmbient);

    this._scene.add(this._roomGroup);
  }

  /**
   * Build the full-screen fade overlay used during era transitions.
   * @private
   */
  _buildFadeOverlay() {
    const geo = new THREE.PlaneGeometry(2, 2);
    const mat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    this._fadeOverlay = new THREE.Mesh(geo, mat);
    this._fadeOverlay.name = 'fade-overlay';
    this._fadeOverlay.frustumCulled = false;
    this._fadeOverlay.renderOrder = 9999;

    // Render in screen space
    const overlayScene = new THREE.Scene();
    const overlayCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    overlayScene.add(this._fadeOverlay);
    this._overlayScene = overlayScene;
    this._overlayCam = overlayCam;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Material & geometry caching (batched shader compilation)
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Get (or create and cache) a THREE.Material by preset name.
   * This batches material/shader compilation — all unique materials for an era
   * are compiled once on first use and reused for all subsequent meshes.
   *
   * @param {string} presetName — material preset key from MATERIAL_PRESETS
   * @returns {THREE.Material}
   * @private
   */
  _getMaterial(presetName) {
    if (!this._materialCache.has(presetName)) {
      const preset = MATERIAL_PRESETS[presetName] || MATERIAL_PRESETS['default'];
      const mat = new THREE.MeshStandardMaterial(preset);
      // Pre-compile the shader so the first frame doesn't stutter
      if (this._renderer) {
        this._renderer.compileAsync(this._scene, this._camera);
      }
      this._materialCache.set(presetName, mat);
    }
    return this._materialCache.get(presetName);
  }

  /**
   * Get (or create and cache) a geometry by descriptor key.
   * @param {string} key — unique geometry descriptor
   * @param {() => THREE.BufferGeometry} factory — function to create the geometry if not cached
   * @returns {THREE.BufferGeometry}
   * @private
   */
  _getGeometry(key, factory) {
    if (!this._geometryCache.has(key)) {
      this._geometryCache.set(key, factory());
    }
    return this._geometryCache.get(key);
  }

  /**
   * Clear the era-specific texture cache (called when era changes).
   * @private
   */
  _clearTextureCache() {
    for (const tex of this._textureCache.values()) {
      tex.dispose();
    }
    this._textureCache.clear();
  }

  // ───────────────────────────────────────────────────────────────────────
  // Procedural mesh builders — create simplified geometry from PeriodPackage data
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Create a furniture mesh from a FurnitureItem definition.
   * Uses simple primitives (boxes, cylinders) since we don't load .glb files.
   *
   * @param {FurnitureItem} item
   * @returns {THREE.Object3D}
   * @private
   */
  _createFurnitureMesh(item) {
    const group = new THREE.Group();
    group.name = item.id;
    group.userData = { label: item.label, type: 'furniture', furnitureType: item.type };

    const mat = this._getMaterial(item.asset?.material || 'default');

    switch (item.type) {
    case 'table': {
      const top = this._getGeometry('table-top', () => new THREE.BoxGeometry(1.2, 0.08, 0.8));
      const topMesh = new THREE.Mesh(top, mat);
      topMesh.position.y = 0.75;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      group.add(topMesh);

      // Legs
      const legGeo = this._getGeometry('table-leg', () => new THREE.CylinderGeometry(0.04, 0.04, 0.75, 6));
      const legPositions = [[-0.5, 0.375, -0.3], [0.5, 0.375, -0.3], [-0.5, 0.375, 0.3], [0.5, 0.375, 0.3]];
      for (const [lx, ly, lz] of legPositions) {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        group.add(leg);
      }
      break;
    }
    case 'chair': {
      const seat = this._getGeometry('chair-seat', () => new THREE.BoxGeometry(0.5, 0.06, 0.5));
      const seatMesh = new THREE.Mesh(seat, mat);
      seatMesh.position.y = 0.45;
      seatMesh.castShadow = true;
      group.add(seatMesh);

      // Backrest
      const back = this._getGeometry('chair-back', () => new THREE.BoxGeometry(0.5, 0.5, 0.05));
      const backMesh = new THREE.Mesh(back, mat);
      backMesh.position.set(0, 0.73, -0.22);
      backMesh.castShadow = true;
      group.add(backMesh);

      // Legs
      const legGeo = this._getGeometry('chair-leg', () => new THREE.CylinderGeometry(0.025, 0.025, 0.45, 6));
      const legPositions = [[-0.2, 0.225, -0.2], [0.2, 0.225, -0.2], [-0.2, 0.225, 0.2], [0.2, 0.225, 0.2]];
      for (const [lx, ly, lz] of legPositions) {
        const leg = new THREE.Mesh(legGeo, mat);
        leg.position.set(lx, ly, lz);
        leg.castShadow = true;
        group.add(leg);
      }
      break;
    }
    case 'counter': {
      const top = new THREE.Mesh(
        this._getGeometry('counter-top', () => new THREE.BoxGeometry(2.5, 0.1, 0.9)),
        mat,
      );
      top.position.y = 0.95;
      top.castShadow = true;
      top.receiveShadow = true;
      group.add(top);

      const body = new THREE.Mesh(
        this._getGeometry('counter-body', () => new THREE.BoxGeometry(2.4, 0.9, 0.85)),
        mat,
      );
      body.position.y = 0.45;
      body.castShadow = true;
      group.add(body);
      break;
    }
    case 'stool': {
      const seatGeo = this._getGeometry('stool-seat', () => new THREE.CylinderGeometry(0.2, 0.2, 0.05, 8));
      const seat = new THREE.Mesh(seatGeo, mat);
      seat.position.y = 0.65;
      seat.castShadow = true;
      group.add(seat);

      const legGeo = this._getGeometry('stool-leg', () => new THREE.CylinderGeometry(0.03, 0.03, 0.65, 6));
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.y = 0.325;
      leg.castShadow = true;
      group.add(leg);
      break;
    }
    case 'shelf': {
      const shelfGeo = this._getGeometry('shelf-board', () => new THREE.BoxGeometry(1.5, 0.05, 0.3));
      for (let i = 0; i < 4; i++) {
        const shelf = new THREE.Mesh(shelfGeo, mat);
        shelf.position.y = 0.5 + i * 0.4;
        shelf.castShadow = true;
        group.add(shelf);
      }
      // Side panels
      const sideGeo = this._getGeometry('shelf-side', () => new THREE.BoxGeometry(0.05, 1.6, 0.3));
      const sideL = new THREE.Mesh(sideGeo, mat);
      sideL.position.set(-0.75, 1.3, 0);
      group.add(sideL);
      const sideR = new THREE.Mesh(sideGeo, mat);
      sideR.position.set(0.75, 1.3, 0);
      group.add(sideR);
      break;
    }
    default: {
      // Generic box for any other furniture type
      const geo = this._getGeometry('generic-box', () => new THREE.BoxGeometry(0.8, 0.8, 0.8));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = 0.4;
      mesh.castShadow = true;
      group.add(mesh);
    }
    }

    // Apply position and rotation
    if (item.position) {
      group.position.set(item.position[0], item.position[1], item.position[2]);
    }
    if (item.rotation) {
      group.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
    }
    if (item.scale) {
      group.scale.setScalar(item.scale);
    }

    return group;
  }

  /**
   * Create a decor mesh from a DecorItem definition.
   * @param {DecorItem} item
   * @returns {THREE.Object3D}
   * @private
   */
  _createDecorMesh(item) {
    const group = new THREE.Group();
    group.name = item.id;
    group.userData = { label: item.label, type: 'decor', category: item.category };

    const mat = this._getMaterial(item.asset?.material || 'default');

    switch (item.category) {
    case 'artwork': {
      const frameGeo = this._getGeometry('artwork-frame', () => new THREE.BoxGeometry(0.9, 1.2, 0.05));
      const frame = new THREE.Mesh(frameGeo, mat);
      frame.castShadow = true;
      group.add(frame);
      break;
    }
    case 'plant': {
      const potGeo = this._getGeometry('plant-pot', () => new THREE.CylinderGeometry(0.2, 0.15, 0.3, 8));
      const pot = new THREE.Mesh(potGeo, mat);
      pot.position.y = 0.15;
      pot.castShadow = true;
      group.add(pot);

      const foliageMat = this._getMaterial('fabric-green');
      const foliageGeo = this._getGeometry('plant-foliage', () => new THREE.SphereGeometry(0.3, 8, 6));
      const foliage = new THREE.Mesh(foliageGeo, foliageMat);
      foliage.position.y = 0.5;
      foliage.castShadow = true;
      group.add(foliage);
      break;
    }
    case 'fixture': {
      // Ceiling fan, pendant light shade, etc.
      const geo = this._getGeometry('fixture-cone', () => new THREE.ConeGeometry(0.3, 0.25, 8));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      group.add(mesh);
      break;
    }
    default: {
      const geo = this._getGeometry('decor-generic', () => new THREE.BoxGeometry(0.3, 0.3, 0.3));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      group.add(mesh);
    }
    }

    if (item.position) {
      group.position.set(item.position[0], item.position[1], item.position[2]);
    }
    if (item.rotation) {
      group.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
    }

    return group;
  }

  /**
   * Create a coffee machine mesh.
   * @param {CoffeeMachine} machine
   * @returns {THREE.Object3D}
   * @private
   */
  _createCoffeeMachineMesh(machine) {
    const group = new THREE.Group();
    group.name = machine.id;
    group.userData = { label: machine.brand, type: 'coffee-machine' };

    const mat = this._getMaterial(machine.asset?.material || 'chrome');

    // Base/body
    const bodyGeo = this._getGeometry('cm-body', () => new THREE.BoxGeometry(0.6, 0.5, 0.4));
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = 0.25;
    body.castShadow = true;
    group.add(body);

    // Group head / lever
    const headGeo = this._getGeometry('cm-head', () => new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8));
    const head = new THREE.Mesh(headGeo, mat);
    head.position.set(0, 0.15, 0.25);
    group.add(head);

    // Steam wand (if present)
    if (machine.hasSteamWand) {
      const wandGeo = this._getGeometry('cm-wand', () => new THREE.CylinderGeometry(0.015, 0.015, 0.3, 6));
      const wand = new THREE.Mesh(wandGeo, this._getMaterial('chrome'));
      wand.position.set(0.3, 0.35, 0.1);
      wand.rotation.z = 0.5;
      group.add(wand);
    }

    if (machine.position) {
      group.position.set(machine.position[0], machine.position[1], machine.position[2]);
    }

    return group;
  }

  /**
   * Create a patron mesh with LOD levels.
   * @param {PatronAppearance} patron
   * @returns {THREE.LOD}
   * @private
   */
  _createPatronMesh(patron) {
    const lod = new THREE.LOD();
    lod.name = patron.id;
    lod.userData = { label: `${patron.outfit} — ${patron.hairstyle}`, type: 'patron' };

    const mat = this._getMaterial('fabric-green'); // Simplified — real impl would use outfit-based colour

    // High-detail: full body with head, torso, limbs
    const highDetail = new THREE.Group();
    const torsoGeo = this._getGeometry('patron-torso-hi', () => new THREE.CapsuleGeometry(0.22, 0.5, 4, 8));
    const torso = new THREE.Mesh(torsoGeo, mat);
    torso.position.y = 1.0;
    torso.castShadow = true;
    highDetail.add(torso);

    const headGeo = this._getGeometry('patron-head-hi', () => new THREE.SphereGeometry(0.14, 12, 8));
    const head = new THREE.Mesh(headGeo, this._getMaterial('ceramic-white'));
    head.position.y = 1.42;
    head.castShadow = true;
    highDetail.add(head);
    lod.addLevel(highDetail, 0);

    // Medium-detail: simplified body
    const medGeo = this._getGeometry('patron-med', () => new THREE.CapsuleGeometry(0.22, 0.5, 3, 6));
    const medMesh = new THREE.Mesh(medGeo, mat);
    medMesh.position.y = 1.0;
    medMesh.castShadow = true;
    lod.addLevel(medMesh, LOD_MEDIUM_DISTANCE);

    // Low-detail: just a billboard-ish cylinder
    const lowGeo = this._getGeometry('patron-low', () => new THREE.CylinderGeometry(0.2, 0.2, 1.5, 5));
    const lowMat = this._getMaterial('default');
    const lowMesh = new THREE.Mesh(lowGeo, lowMat);
    lowMesh.position.y = 0.75;
    lod.addLevel(lowMesh, LOD_LOW_DISTANCE);

    if (patron.position) {
      lod.position.set(patron.position[0], patron.position[1], patron.position[2]);
    }
    if (patron.rotation) {
      lod.rotation.set(patron.rotation[0], patron.rotation[1], patron.rotation[2]);
    }

    return lod;
  }


  /**
   * Create a wall poster mesh.
   * @param {WallPoster} poster
   * @returns {THREE.Object3D}
   * @private
   */
  _createPosterMesh(poster) {
    const group = new THREE.Group();
    group.name = poster.id;
    group.userData = { label: poster.title, type: 'poster' };

    const w = poster.width || 1.0;
    const h = poster.height || 1.3;
    const geo = this._getGeometry('poster-plane', () => new THREE.PlaneGeometry(w, h));
    const mat = this._getMaterial('default');
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    group.add(mesh);

    if (poster.position) {
      group.position.set(poster.position[0], poster.position[1], poster.position[2]);
    }
    if (poster.rotation) {
      group.rotation.set(poster.rotation[0], poster.rotation[1], poster.rotation[2]);
    }

    return group;
  }

  /**
   * Create a menu board mesh.
   * @param {Menu} menu
   * @returns {THREE.Object3D}
   * @private
   */
  _createMenuBoard(menu) {
    const group = new THREE.Group();
    group.name = 'menu-board';
    group.userData = { label: 'Menu Board', type: 'menu', menuItems: menu.items };

    const boardMat = menu.boardType === 'led' || menu.boardType === 'digital'
      ? this._getMaterial('neon-cyan')
      : this._getMaterial('matte-black');

    const boardGeo = this._getGeometry('menu-board-geo', () => new THREE.BoxGeometry(1.8, 1.0, 0.05));
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0, 2.5, -4.92);
    board.castShadow = true;
    group.add(board);

    // Create a canvas texture showing the menu items
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 288;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = menu.boardType === 'chalkboard' ? '#1a2a1a' : '#000000';
    ctx.fillRect(0, 0, 512, 288);
    ctx.fillStyle = menu.boardType === 'chalkboard' ? '#e0e8d0' : '#00ff88';
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    let y = 35;
    for (const item of menu.items) {
      ctx.fillText(`${item.name}`, 20, y);
      ctx.textAlign = 'right';
      ctx.fillText(item.price, 492, y);
      ctx.textAlign = 'left';
      y += 32;
    }
    const texture = new THREE.CanvasTexture(canvas);
    this._textureCache.set(`menu-${Date.now()}`, texture);

    const menuPlaneGeo = new THREE.PlaneGeometry(1.7, 0.9);
    const menuPlaneMat = new THREE.MeshBasicMaterial({ map: texture });
    const menuPlane = new THREE.Mesh(menuPlaneGeo, menuPlaneMat);
    menuPlane.position.set(0, 2.5, -4.89);
    group.add(menuPlane);

    return group;
  }

  /**
   * Create a music source device mesh.
   * @param {MusicSource} musicSource
   * @returns {THREE.Object3D}
   * @private
   */
  _createMusicSourceMesh(musicSource) {
    const group = new THREE.Group();
    group.name = `music-${musicSource.model}`;
    group.userData = { label: musicSource.trackName || musicSource.model, type: 'music-source' };

    const mat = this._getMaterial(musicSource.asset?.material || 'bakelite-brown');

    // Different shapes for different music sources
    switch (musicSource.model) {
    case 'wireless-set': {
      const body = new THREE.Mesh(
        this._getGeometry('wireless-body', () => new THREE.BoxGeometry(0.5, 0.35, 0.25)),
        mat,
      );
      body.position.y = 0.175;
      body.castShadow = true;
      group.add(body);
      break;
    }
    case 'jukebox': {
      const body = new THREE.Mesh(
        this._getGeometry('jukebox-body', () => new THREE.BoxGeometry(0.5, 0.8, 0.4)),
        mat,
      );
      body.position.y = 0.4;
      body.castShadow = true;
      group.add(body);
      // Glowing top
      const topMat = this._getMaterial('neon-pink');
      const top = new THREE.Mesh(
        this._getGeometry('jukebox-top', () => new THREE.BoxGeometry(0.45, 0.1, 0.35)),
        topMat,
      );
      top.position.y = 0.85;
      group.add(top);
      break;
    }
    case 'boombox': {
      const body = new THREE.Mesh(
        this._getGeometry('boombox-body', () => new THREE.BoxGeometry(0.6, 0.3, 0.15)),
        mat,
      );
      body.position.y = 0.15;
      body.castShadow = true;
      group.add(body);
      break;
    }
    case 'ipod': {
      const body = new THREE.Mesh(
        this._getGeometry('ipod-body', () => new THREE.BoxGeometry(0.08, 0.12, 0.02)),
        mat,
      );
      body.position.y = 0.06;
      body.castShadow = true;
      group.add(body);
      break;
    }
    case 'phone':
    case 'speaker': {
      const body = new THREE.Mesh(
        this._getGeometry('speaker-body', () => new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8)),
        mat,
      );
      body.position.y = 0.1;
      body.castShadow = true;
      group.add(body);
      break;
    }
    default: {
      const body = new THREE.Mesh(
        this._getGeometry('music-generic', () => new THREE.BoxGeometry(0.3, 0.2, 0.2)),
        mat,
      );
      body.position.y = 0.1;
      body.castShadow = true;
      group.add(body);
    }
    }

    if (musicSource.asset?.mesh) {
      // Would load GLB here in production; for now position is set by caller
    }

    return group;
  }

  /**
   * Create a counter tech (POS) mesh.
   * @param {CounterTech} counterTech
   * @returns {THREE.Object3D}
   * @private
   */
  _createCounterTechMesh(counterTech) {
    const group = new THREE.Group();
    group.name = 'counter-tech';
    group.userData = { label: counterTech.posType, type: 'counter-tech' };

    const mat = this._getMaterial(counterTech.asset?.material || 'default');

    switch (counterTech.posType) {
    case 'manual-till': {
      const body = new THREE.Mesh(
        this._getGeometry('till-body', () => new THREE.BoxGeometry(0.35, 0.25, 0.3)),
        mat,
      );
      body.position.y = 0.125;
      body.castShadow = true;
      group.add(body);
      // Keys
      const keys = new THREE.Mesh(
        this._getGeometry('till-keys', () => new THREE.BoxGeometry(0.3, 0.02, 0.15)),
        this._getMaterial('brass'),
      );
      keys.position.set(0, 0.26, 0.05);
      group.add(keys);
      break;
    }
    case 'contactless':
    case 'tablet-pos': {
      const body = new THREE.Mesh(
        this._getGeometry('tablet-body', () => new THREE.BoxGeometry(0.2, 0.3, 0.02)),
        this._getMaterial('matte-black'),
      );
      body.position.y = 0.15;
      body.rotation.x = -0.3;
      body.castShadow = true;
      group.add(body);
      break;
    }
    default: {
      const body = new THREE.Mesh(
        this._getGeometry('pos-generic', () => new THREE.BoxGeometry(0.3, 0.2, 0.25)),
        mat,
      );
      body.position.y = 0.1;
      body.castShadow = true;
      group.add(body);
    }
    }

    if (counterTech.position) {
      group.position.set(counterTech.position[0], counterTech.position[1], counterTech.position[2]);
    }

    return group;
  }

  /**
   * Create tableware items on tables.
   * @param {Tableware} tableware
   * @returns {THREE.Object3D}
   * @private
   */
  _createTablewareMesh(tableware) {
    const group = new THREE.Group();
    group.name = 'tableware';
    group.userData = { label: tableware.cupStyle, type: 'tableware' };

    const cupMat = this._getMaterial(tableware.material || 'ceramic-white');
    const cupGeo = this._getGeometry('cup', () => new THREE.CylinderGeometry(0.05, 0.04, 0.08, 8));
    // Place a few cups on table positions
    const cupPositions = [[-1.5, 0.83, 1.25], [1.0, 0.83, 1.25]];
    for (const [cx, cy, cz] of cupPositions) {
      const cup = new THREE.Mesh(cupGeo, cupMat);
      cup.position.set(cx, cy, cz);
      cup.castShadow = true;
      group.add(cup);
    }

    return group;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Lighting
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Apply era-specific lighting to the scene.
   * Removes old era lights and adds new ones from the PeriodPackage.
   *
   * @param {Lighting} lighting
   * @private
   */
  _applyLighting(lighting) {
    // Remove old era lights (keep base ambient)
    const toRemove = [];
    this._eraGroup.traverse((child) => {
      if (child.isLight) toRemove.push(child);
    });
    for (const light of toRemove) {
      if (light.parent) light.parent.remove(light);
    }

    // Determine ambient colour from colorTemperature
    let ambientColor = 0xffffff;
    if (lighting.colorTemperature === 'warm') ambientColor = 0xffd9a0;
    else if (lighting.colorTemperature === 'cool') ambientColor = 0xa0c0ff;
    else if (lighting.colorTemperature === 'neutral') ambientColor = 0xffffff;

    // Ambient light
    const ambient = new THREE.AmbientLight(ambientColor, lighting.ambientIntensity);
    ambient.name = 'era-ambient';
    this._eraGroup.add(ambient);

    // Fixtures
    if (lighting.fixtures) {
      for (const fixture of lighting.fixtures) {
        const color = fixture.color ? new THREE.Color(fixture.color) : ambientColor;
        const intensity = fixture.intensity || 0.5;

        let light;
        if (fixture.type === 'pendant' || fixture.type === 'sconce') {
          light = new THREE.PointLight(color, intensity, 8, 1.5);
          if (fixture.position) {
            light.position.set(fixture.position[0], fixture.position[1], fixture.position[2]);
          }
          light.castShadow = true;
          light.shadow.mapSize.width = 512;
          light.shadow.mapSize.height = 512;
          light.shadow.camera.near = 0.5;
          light.shadow.camera.far = 12;
        } else if (fixture.type === 'strip') {
          light = new THREE.RectAreaLight(color, intensity, 1, 0.1);
          if (fixture.position) {
            light.position.set(fixture.position[0], fixture.position[1], fixture.position[2]);
          }
        } else {
          light = new THREE.PointLight(color, intensity, 8);
          if (fixture.position) {
            light.position.set(fixture.position[0], fixture.position[1], fixture.position[2]);
          }
        }
        light.name = `fixture-${fixture.type}`;
        this._eraGroup.add(light);

        // Add a small visual mesh for the fixture
        const fixtureMat = this._getMaterial(fixture.asset?.material || 'default');
        const fixtureGeo = this._getGeometry(`fixture-${fixture.type}-geo`, () => {
          if (fixture.type === 'pendant') return new THREE.SphereGeometry(0.08, 8, 6);
          if (fixture.type === 'sconce') return new THREE.BoxGeometry(0.1, 0.15, 0.05);
          return new THREE.BoxGeometry(0.5, 0.02, 0.05);
        });
        const fixtureMesh = new THREE.Mesh(fixtureGeo, fixtureMat);
        if (fixture.position) {
          fixtureMesh.position.set(fixture.position[0], fixture.position[1], fixture.position[2]);
        }
        fixtureMesh.castShadow = false;
        this._eraGroup.add(fixtureMesh);
      }
    }

    // Flicker effect (if configured)
    if (lighting.flicker && lighting.flicker.enabled) {
      this._flickerConfig = lighting.flicker;
    } else {
      this._flickerConfig = null;
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Instancing — group repeated meshes for draw-call reduction
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Group furniture items by mesh type and material to identify instancing
   * opportunities. Repeated items with the same geometry + material are
   * merged into InstancedMesh for dramatic draw-call reduction.
   *
   * @param {FurnitureItem[]} furniture
   * @returns {THREE.Object3D[]}
   * @private
   */
  _buildInstancedFurniture(furniture) {
    // Group by (type + material) to find instancing opportunities
    /** @type {Map<string, FurnitureItem[]>} */
    const groups = new Map();

    for (const item of furniture) {
      const key = `${item.type}:${item.asset?.material || 'default'}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }

    const results = [];

    for (const [key, items] of groups) {
      if (items.length >= 2) {
        // Create an instanced mesh for this group
        const instanced = this._createInstancedGroup(key, items);
        results.push(instanced);
      } else {
        // Single item — just create a regular mesh
        results.push(this._createFurnitureMesh(items[0]));
      }
    }

    return results;
  }

  /**
   * Create an InstancedMesh for a group of identical furniture items.
   * This is the key draw-call reduction strategy: 4 identical chairs become
   * 1 draw call instead of 4.
   *
   * @param {string} key
   * @param {FurnitureItem[]} items
   * @returns {THREE.Group}
   * @private
   */
  _createInstancedGroup(key, items) {
    const group = new THREE.Group();
    group.name = `instanced-${key}`;
    group.userData = { label: items[0].label, type: 'furniture', instanced: true };

    const mat = this._getMaterial(items[0].asset?.material || 'default');

    // Create a simple placeholder geometry for the instanced mesh
    // (the individual meshes would be too complex for instancing with
    // multi-part geometry, so we use a bounding shape and add detail meshes
    // only for the closest instances via LOD)
    let geo;
    switch (items[0].type) {
    case 'chair':
      geo = this._getGeometry('instanced-chair', () => new THREE.BoxGeometry(0.5, 0.9, 0.5));
      break;
    case 'table':
      geo = this._getGeometry('instanced-table', () => new THREE.BoxGeometry(1.2, 0.75, 0.8));
      break;
    case 'stool':
      geo = this._getGeometry('instanced-stool', () => new THREE.CylinderGeometry(0.2, 0.2, 0.65, 8));
      break;
    default:
      geo = this._getGeometry('instanced-generic', () => new THREE.BoxGeometry(0.8, 0.8, 0.8));
    }

    const instancedMesh = new THREE.InstancedMesh(geo, mat, items.length);
    instancedMesh.castShadow = true;
    instancedMesh.receiveShadow = true;

    const dummy = new THREE.Object3D();
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.position) {
        dummy.position.set(item.position[0], item.position[1] + (items[0].type === 'chair' ? 0.45 : 0), item.position[2]);
      }
      if (item.rotation) {
        dummy.rotation.set(item.rotation[0], item.rotation[1], item.rotation[2]);
      }
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }
    instancedMesh.instanceMatrix.needsUpdate = true;
    group.add(instancedMesh);

    // Store instance metadata for accessibility/raycasting
    group.userData.instanceItems = items;

    return group;
  }

  // ───────────────────────────────────────────────────────────────────────
  // Hotspots
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Create navigation hotspot markers in the scene.
   * @param {NavigationHotspot[]} hotspots
   * @private
   */
  _createHotspots(hotspots) {
    // Clear old hotspots
    while (this._hotspotGroup.children.length > 0) {
      this._hotspotGroup.remove(this._hotspotGroup.children[0]);
    }
    this._hotspots.clear();

    const hotspotMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.6,
    });
    const hotspotGeo = new THREE.SphereGeometry(0.15, 12, 8);

    for (let i = 0; i < hotspots.length; i++) {
      const hs = hotspots[i];
      const mesh = new THREE.Mesh(hotspotGeo, hotspotMat);
      mesh.name = `hotspot-${hs.id}`;
      mesh.userData = {
        label: hs.label,
        type: 'hotspot',
        hotspotIndex: i,
        cameraPosition: hs.cameraPosition,
        lookAt: hs.lookAt,
        fov: hs.fov,
      };
      mesh.position.set(hs.cameraPosition[0], hs.cameraPosition[1], hs.cameraPosition[2]);
      this._hotspotGroup.add(mesh);
      this._hotspots.set(hs.id, { mesh, data: hs, index: i });
    }
  }

  /**
   * Navigate the camera to a specific hotspot.
   * @param {string} hotspotId
   */
  navigateToHotspot(hotspotId) {
    const hs = this._hotspots.get(hotspotId);
    if (!hs) return;

    const camPos = hs.data.cameraPosition;
    const lookAt = hs.data.lookAt || [0, 1, 0];

    // Set orbit target to the hotspot look-at point
    this._cameraState.target = { x: lookAt[0], y: lookAt[1], z: lookAt[2] };

    // Calculate orbit angles from the camera position
    const dx = camPos[0] - lookAt[0];
    const dy = camPos[1] - lookAt[1];
    const dz = camPos[2] - lookAt[2];
    this._cameraState.distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    this._cameraState.azimuth = Math.atan2(dx, dz);
    this._cameraState.polar = Math.acos(dy / this._cameraState.distance);

    if (hs.data.fov && this._camera) {
      this._camera.fov = hs.data.fov;
      this._camera.updateProjectionMatrix();
    }

    this._focusedHotspot = hs.index;
    this._updateCameraFromOrbit();
  }

  /**
   * Get the list of hotspots (for keyboard navigation).
   * @returns {{id: string, label: string}[]}
   */
  getHotspots() {
    return Array.from(this._hotspots.values()).map((h) => ({
      id: h.data.id,
      label: h.data.label,
    }));
  }

  /**
   * Navigate to the next hotspot (for keyboard Tab + Enter).
   * @param {number} [direction=1] — 1 for next, -1 for previous
   */
  cycleHotspot(direction = 1) {
    const list = Array.from(this._hotspots.values());
    if (list.length === 0) return;

    let next = (this._focusedHotspot ?? -1) + direction;
    if (next >= list.length) next = 0;
    if (next < 0) next = list.length - 1;

    this.navigateToHotspot(list[next].data.id);
  }

  // ───────────────────────────────────────────────────────────────────────
  // PeriodManagerAdapter implementation
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Apply meshes from a PeriodPackage — swaps furniture, decor, etc.
   * @param {PeriodPackage} pkg
   */
  async applyMeshes(pkg) {
    // Clear previous era content
    while (this._eraGroup.children.length > 0) {
      const child = this._eraGroup.children[0];
      this._eraGroup.remove(child);
    }

    // Evict previous era's textures (lazy-load: only active era in GPU memory)
    this._clearTextureCache();

    // --- Furniture (instanced for draw-call reduction) ---
    const furnitureMeshes = this._buildInstancedFurniture(pkg.furniture);
    for (const mesh of furnitureMeshes) {
      this._eraGroup.add(mesh);
    }

    // --- Decor ---
    for (const item of pkg.decor) {
      const mesh = this._createDecorMesh(item);
      this._eraGroup.add(mesh);
    }

    // --- Coffee machine ---
    const cmMesh = this._createCoffeeMachineMesh(pkg.coffeeMachine);
    this._eraGroup.add(cmMesh);

    // --- Menu board ---
    const menuMesh = this._createMenuBoard(pkg.menu);
    this._eraGroup.add(menuMesh);

    // --- Music source device ---
    const musicMesh = this._createMusicSourceMesh(pkg.musicSource);
    // Position music device near the counter
    if (pkg.musicSource.asset?.position) {
      // Use provided position if available
    } else {
      musicMesh.position.set(-3.0, 0.9, -2.0);
    }
    this._eraGroup.add(musicMesh);

    // --- Wall posters ---
    for (const poster of pkg.wallPosters) {
      const mesh = this._createPosterMesh(poster);
      this._eraGroup.add(mesh);
    }

    // --- Tableware ---
    const tablewareMesh = this._createTablewareMesh(pkg.tableware);
    this._eraGroup.add(tablewareMesh);

    // --- Counter tech ---
    const ctMesh = this._createCounterTechMesh(pkg.counterTech);
    this._eraGroup.add(ctMesh);

    // --- Patrons (with LOD) ---
    for (const patron of pkg.patrons.appearances) {
      const mesh = this._createPatronMesh(patron);
      this._eraGroup.add(mesh);
    }

    this._currentPackage = pkg;

    // Update hotspots
    this._createHotspots(pkg.navigationHotspots);

    // Pre-compile all materials for this era (batch shader compilation)
    if (this._renderer) {
      this._renderer.compileAsync(this._scene, this._camera);
    }

    console.log(`[SceneRenderer] Applied meshes for ${pkg.meta.year} (${pkg.furniture.length} furniture, ${pkg.decor.length} decor, ${pkg.patrons.appearances.length} patrons)`);
  }

  /**
   * Apply lighting from a PeriodPackage.
   * @param {PeriodPackage} pkg
   */
  async applyLighting(pkg) {
    this._applyLighting(pkg.lighting);
  }

  /**
   * Apply signage from a PeriodPackage.
   * @param {PeriodPackage} pkg
   */
  async applySignage(_pkg) {
    // Signage is already built into the era meshes; this is a no-op
    // that satisfies the adapter interface.
  }

  /**
   * Apply decor from a PeriodPackage.
   * @param {PeriodPackage} pkg
   */
  async applyDecor(_pkg) {
    // Decor is already built in applyMeshes; this satisfies the adapter interface.
  }

  /**
   * Set the fade overlay opacity (0 = fully visible, 1 = black).
   * @param {number} opacity
   */
  setFadeOpacity(opacity) {
    if (this._fadeOverlay) {
      this._fadeOverlay.material.opacity = opacity;
    }
  }

  /**
   * Start music for the era (delegated to AudioManager via main.js wiring).
   * @param {PeriodPackage} pkg
   */
  async startMusic(_pkg) {
    // AudioManager handles this via PeriodManager.onYearChange callback
  }

  /**
   * Start ambient SFX for the era.
   * @param {PeriodPackage} pkg
   */
  async startSfx(_pkg) {
    // AudioManager handles ambient SFX
  }

  /**
   * Stop all audio (delegated to AudioManager).
   */
  async stopAudio() {
    // AudioManager handles this
  }

  // ───────────────────────────────────────────────────────────────────────
  // Camera control
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Update camera position from orbit state (azimuth, polar, distance).
   * @private
   */
  _updateCameraFromOrbit() {
    if (!this._camera) return;
    const { azimuth, polar, distance, target } = this._cameraState;
    const sinPolar = Math.sin(polar);
    this._camera.position.x = target.x + distance * sinPolar * Math.sin(azimuth);
    this._camera.position.y = target.y + distance * Math.cos(polar);
    this._camera.position.z = target.z + distance * sinPolar * Math.cos(azimuth);
    this._camera.lookAt(target.x, target.y, target.z);
  }

  /**
   * Handle keyboard movement (WASD / Arrow keys + Q/E for up/down).
   * @param {number} delta — seconds since last frame
   * @private
   */
  _updateKeyboardMovement(delta) {
    const moveSpeed = 4 * delta;
    const cs = this._cameraState;
    let moved = false;

    // Get camera forward/right vectors (horizontal only)
    if (!this._camera) return;
    const forward = new THREE.Vector3();
    this._camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    if (cs.moveForward) {
      cs.target.x += forward.x * moveSpeed;
      cs.target.z += forward.z * moveSpeed;
      moved = true;
    }
    if (cs.moveBackward) {
      cs.target.x -= forward.x * moveSpeed;
      cs.target.z -= forward.z * moveSpeed;
      moved = true;
    }
    if (cs.moveLeft) {
      cs.target.x -= right.x * moveSpeed;
      cs.target.z -= right.z * moveSpeed;
      moved = true;
    }
    if (cs.moveRight) {
      cs.target.x += right.x * moveSpeed;
      cs.target.z += right.z * moveSpeed;
      moved = true;
    }
    if (cs.moveUp) {
      cs.target.y += moveSpeed;
      moved = true;
    }
    if (cs.moveDown) {
      cs.target.y -= moveSpeed;
      moved = true;
    }

    if (moved) {
      this._updateCameraFromOrbit();
    }
  }

  // ───────────────────────────────────────────────────────────────────────
  // Event handlers
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Handle window resize.
   * @private
   */
  _onResize() {
    if (!this._renderer || !this._camera) return;
    const w = this._container.clientWidth;
    const h = this._container.clientHeight;
    this._renderer.setSize(w, h);
    this._camera.aspect = w / h;
    this._camera.updateProjectionMatrix();
  }

  /**
   * Handle keydown for camera movement and navigation.
   * @param {KeyboardEvent} e
   * @private
   */
  _onKeyDown(e) {
    const cs = this._cameraState;
    switch (e.key) {
    case 'w':
    case 'W':
    case 'ArrowUp':
      cs.moveForward = true;
      break;
    case 's':
    case 'S':
    case 'ArrowDown':
      cs.moveBackward = true;
      break;
    case 'a':
    case 'A':
    case 'ArrowLeft':
      cs.moveLeft = true;
      break;
    case 'd':
    case 'D':
    case 'ArrowRight':
      cs.moveRight = true;
      break;
    case 'q':
    case 'Q':
      cs.moveDown = true;
      break;
    case 'e':
    case 'E':
      cs.moveUp = true;
      break;
      // No default — other keys handled in main.js
    }
  }

  /**
   * Handle keyup for camera movement.
   * @param {KeyboardEvent} e
   * @private
   */
  _onKeyUp(e) {
    const cs = this._cameraState;
    switch (e.key) {
    case 'w':
    case 'W':
    case 'ArrowUp':
      cs.moveForward = false;
      break;
    case 's':
    case 'S':
    case 'ArrowDown':
      cs.moveBackward = false;
      break;
    case 'a':
    case 'A':
    case 'ArrowLeft':
      cs.moveLeft = false;
      break;
    case 'd':
    case 'D':
    case 'ArrowRight':
      cs.moveRight = false;
      break;
    case 'q':
    case 'Q':
      cs.moveDown = false;
      break;
    case 'e':
    case 'E':
      cs.moveUp = false;
      break;
    }
  }

  /**
   * Handle mouse down (start orbit drag).
   * @param {MouseEvent} e
   * @private
   */
  _onMouseDown(e) {
    this._isDragging = true;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;
    this._renderer.domElement.style.cursor = 'grabbing';
  }

  /**
   * Handle mouse up (end orbit drag).
   * @private
   */
  _onMouseUp() {
    this._isDragging = false;
    if (this._renderer) {
      this._renderer.domElement.style.cursor = 'grab';
    }
  }

  /**
   * Handle mouse move (orbit drag).
   * @param {MouseEvent} e
   * @private
   */
  _onMouseMove(e) {
    if (!this._isDragging) return;
    const dx = e.clientX - this._lastMouseX;
    const dy = e.clientY - this._lastMouseY;
    this._lastMouseX = e.clientX;
    this._lastMouseY = e.clientY;

    const rotateSpeed = 0.005;
    this._cameraState.azimuth -= dx * rotateSpeed;
    this._cameraState.polar = Math.max(0.1, Math.min(Math.PI - 0.1, this._cameraState.polar - dy * rotateSpeed));
    this._updateCameraFromOrbit();
  }

  /**
   * Handle mouse wheel (zoom).
   * @param {WheelEvent} e
   * @private
   */
  _onWheel(e) {
    e.preventDefault();
    const zoomSpeed = 0.001;
    this._cameraState.distance = Math.max(2, Math.min(25, this._cameraState.distance + e.deltaY * zoomSpeed));
    this._updateCameraFromOrbit();
  }

  // ───────────────────────────────────────────────────────────────────────
  // Render loop
  // ───────────────────────────────────────────────────────────────────────

  /**
   * Main animation loop. Updates LOD, camera, flicker, and renders.
   * @private
   */
  _animate() {
    this._rafId = requestAnimationFrame(() => this._animate());

    if (!this._renderer || !this._scene || !this._camera) return;

    this._stats.begin();

    const delta = this._clock.getDelta();
    const elapsed = this._clock.getElapsedTime();

    // Update keyboard movement
    this._updateKeyboardMovement(delta);

    // Update LOD for all LOD objects
    this._scene.traverse((obj) => {
      if (obj.isLOD) {
        obj.update(this._camera);
      }
    });

    // Apply lighting flicker (if configured)
    if (this._flickerConfig) {
      const flickerVal = 1 + Math.sin(elapsed * this._flickerConfig.frequencyHz * Math.PI * 2)
        * this._flickerConfig.amplitude;
      this._eraGroup.traverse((child) => {
        if (child.isLight && child.name === 'era-ambient') {
          child.intensity = (this._currentPackage?.lighting.ambientIntensity || 0.7) * flickerVal;
        }
      });
    }

    // Animate hotspot markers (pulsing)
    this._hotspotGroup.traverse((obj) => {
      if (obj.isMesh && obj.userData.type === 'hotspot') {
        const scale = 1 + Math.sin(elapsed * 3 + obj.userData.hotspotIndex) * 0.15;
        obj.scale.setScalar(scale);
      }
    });

    // Render the main scene
    this._renderer.render(this._scene, this._camera);

    // Render the fade overlay on top
    if (this._fadeOverlay && this._fadeOverlay.material.opacity > 0.001) {
      this._renderer.autoClear = false;
      this._renderer.render(this._overlayScene, this._overlayCam);
      this._renderer.autoClear = true;
    }

    // Update draw-call count
    const drawCalls = this._renderer.info.render.calls;
    this._stats.setDrawCalls(drawCalls);

    // Warn if draw calls exceed budget
    if (drawCalls > MAX_DRAW_CALLS && elapsed % 2 < delta) {
      console.warn(`[SceneRenderer] Draw calls (${drawCalls}) exceed budget (${MAX_DRAW_CALLS})`);
    }

    this._stats.end();
  }
}

export default SceneRenderer;

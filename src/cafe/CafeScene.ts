import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getEra } from './eras/getEra';
import type {
  EraConfig,
  EraLightingMood,
  EraYear,
  PropGroupBuilder,
  PropGroupKey,
  PropGroupUpdater,
  PropUpdateContext,
} from './types';

/**
 * Fixed footprint of the permanent café shell, in metres.
 */
export interface RoomDimensions {
  width: number;
  depth: number;
  height: number;
}

/** Camera framing for inspecting a world-space point up close. */
export interface CloseUpFrame {
  /** Suggested camera position, clamped inside the room shell. */
  position: THREE.Vector3;
  /** The point being inspected. */
  lookAt: THREE.Vector3;
}

export interface CafeSceneOptions {
  /** Main scene owned by the app shell; the shell and prop groups attach here. */
  scene: THREE.Scene;
  /** Optional renderer, driven by the exposure hook. */
  renderer?: THREE.WebGLRenderer;
  /** Optional camera, used to compute camera-facing close-up framing. */
  camera?: THREE.Camera;
  /**
   * Era lookup routed into every registered prop group by {@link applyEra}.
   * Defaults to the neutral {@link getEra} seam; era-content tasks inject the
   * real period database here without touching the shell.
   */
  resolveEra?: (year: EraYear) => EraConfig;
}

interface RegisteredPropGroup {
  key: PropGroupKey;
  group: THREE.Group;
  updater: PropGroupUpdater;
}

/* ------------------------------------------------------------------------- */
/* Permanent shell layout constants (metres)                                  */
/* ------------------------------------------------------------------------- */

const ROOM_WIDTH = 12;
const ROOM_DEPTH = 10;
const ROOM_HEIGHT = 3.6;
const WALL_T = 0.18;
const HALF_W = ROOM_WIDTH / 2;
const HALF_D = ROOM_DEPTH / 2;
/** Wall centrelines sit just outside the interior volume. */
const WALL_S_Z = -HALF_D - WALL_T / 2;
const WALL_N_Z = HALF_D + WALL_T / 2;
const WALL_E_X = HALF_W + WALL_T / 2;
const WALL_W_X = -WALL_E_X;

const WINDOW_SILL = 0.85;
const WINDOW_HEIGHT = 1.75;
const WINDOW_TOP = WINDOW_SILL + WINDOW_HEIGHT;
const WINDOW_WIDTH_SOUTH = 1.9;
const WINDOW_WIDTH_EAST = 1.6;
/** Opening centres along their walls. */
const WINDOW_CENTERS_SOUTH_X = [-4, 0, 4] as const;
const WINDOW_CENTERS_EAST_Z = [-2.25, 2.25] as const;

const DOOR_WIDTH = 1.05;
const DOOR_HEIGHT = 2.15;
const DOOR_CENTER_Z = 3.2;
const PLANK_ROWS = 42;

/**
 * Resolution of the permanent sun shadow map, in texels per side.
 *
 * The ortho shadow frustum is tightened to the room footprint (~13 m across),
 * so 2048² resolves ≈160 texels/m — crisp contact edges on furniture and
 * counter props without a per-frame fill cost that a 4096² map would add.
 * {@link CafeScene.setSunShadowMapSize} temporarily trades resolution for
 * speed while an era morph plays (see the app shell).
 */
export const SUN_SHADOW_MAP_SIZE = 2048;

/* ------------------------------------------------------------------------- */
/* Static-shell geometry helpers                                              */
/* ------------------------------------------------------------------------- */

/** One axis-aligned box in some local frame, ready to be baked and merged. */
interface BoxSpec {
  w: number;
  h: number;
  d: number;
  x: number;
  y: number;
  z: number;
}

/**
 * Bakes one box spec into world/local-space geometry. Translation only keeps
 * axis-aligned normals exact; rotations go through `applyMatrix4`, which
 * renormalises them correctly.
 */
function geometryFromSpec(spec: BoxSpec, matrix?: THREE.Matrix4): THREE.BoxGeometry {
  const geometry = new THREE.BoxGeometry(spec.w, spec.h, spec.d);
  geometry.translate(spec.x, spec.y, spec.z);
  if (matrix) geometry.applyMatrix4(matrix);
  return geometry;
}

interface MergeOptions {
  cast?: boolean;
  receive?: boolean;
  name?: string;
}

/**
 * Performance pass workhorse: merges every static box handed in into ONE
 * draw call per material. The permanent shell used to spend ~139 draw calls
 * (64 of them individual floor planks); merging per material drops the whole
 * shell to ~14 meshes without touching a single visible surface. Merged
 * geometry is registered in `ownedGeometries` so teardown stays leak-free.
 */
function addMergedMesh(
  parent: THREE.Object3D,
  material: THREE.Material,
  geometries: THREE.BufferGeometry[],
  ownedGeometries: THREE.BufferGeometry[],
  options: MergeOptions,
): THREE.Mesh | null {
  if (geometries.length === 0) return null;
  const merged = mergeGeometries(geometries, false);
  if (!merged) return null;
  merged.computeBoundingBox();
  merged.computeBoundingSphere();
  ownedGeometries.push(merged);

  const mesh = new THREE.Mesh(merged, material);
  mesh.castShadow = options.cast ?? true;
  mesh.receiveShadow = options.receive ?? true;
  if (options.name) mesh.name = options.name;
  parent.add(mesh);
  return mesh;
}

/** Deterministic PRNG so the plank layout is stable across reloads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface ShellMaterials {
  underlay: THREE.MeshStandardMaterial;
  planks: THREE.MeshStandardMaterial[];
  plaster: THREE.MeshStandardMaterial;
  framePaint: THREE.MeshStandardMaterial;
  sillWood: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  doorWood: THREE.MeshStandardMaterial;
  trim: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
}

/** PBR materials for the permanent shell — realistic base colours/roughness. */
function createShellMaterials(): ShellMaterials {
  const plankBase = new THREE.Color(0x8a5a36);
  const planks = [-0.075, -0.03, 0.008, 0.045, 0.085].map((lightness) =>
    new THREE.MeshStandardMaterial({
      color: plankBase.clone().offsetHSL(0.002, -0.02, lightness),
      roughness: 0.58,
      metalness: 0.02,
    }),
  );

  return {
    underlay: new THREE.MeshStandardMaterial({ color: 0x2e2a25, roughness: 0.95 }),
    planks,
    // Warm lime-plaster walls.
    plaster: new THREE.MeshStandardMaterial({ color: 0xe7dfd2, roughness: 0.94 }),
    // Layered oil paint on joinery.
    framePaint: new THREE.MeshStandardMaterial({ color: 0xd9d3c5, roughness: 0.55 }),
    sillWood: new THREE.MeshStandardMaterial({ color: 0x6b4f38, roughness: 0.5 }),
    // Single-glazed pane look; never casts shadows so sunlight pools survive.
    glass: new THREE.MeshStandardMaterial({
      color: 0xcfe3e8,
      roughness: 0.06,
      metalness: 0.05,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    }),
    doorWood: new THREE.MeshStandardMaterial({ color: 0x5a4130, roughness: 0.52 }),
    // Stained baseboards, crowns and thresholds.
    trim: new THREE.MeshStandardMaterial({ color: 0x4c3a2c, roughness: 0.55 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xb08d3e, metalness: 0.85, roughness: 0.32 }),
  };
}

interface LightingRig {
  ambient: THREE.AmbientLight;
  hemisphere: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  sunTarget: THREE.Object3D;
  accents: THREE.PointLight[];
}

/**
 * Scene-wide mood rig: ambient fill, sky bounce, one shadow-casting sun that
 * streams through the window openings, and tintable accent points.
 */
function createLightingRig(): LightingRig {
  const ambient = new THREE.AmbientLight(0xfff4e6, 0.42);

  const hemisphere = new THREE.HemisphereLight(0xdfe8f2, 0x574430, 0.28);

  const sun = new THREE.DirectionalLight(0xffeed8, 2.8);
  sun.position.set(2.5, 7.6, -11.5); // Outside the street windows, slightly east.
  sun.castShadow = true;
  sun.shadow.mapSize.set(SUN_SHADOW_MAP_SIZE, SUN_SHADOW_MAP_SIZE);
  // Ortho frustum tuned to the room footprint projected along the light
  // direction (~13 m span). The previous ±12 m frustum wasted over half its
  // texels on empty street; this tightening raises ground resolution to
  // ≈160 texels/m for crisper contact shadows at identical map cost.
  sun.shadow.camera.near = 8; // Light sits ~15 m out; skip empty depth range.
  sun.shadow.camera.far = 30;
  sun.shadow.camera.left = -6.5;
  sun.shadow.camera.right = 6.5;
  sun.shadow.camera.top = 6.5;
  sun.shadow.camera.bottom = -6.5;
  sun.shadow.bias = -0.00035;
  sun.shadow.normalBias = 0.03; // Softened contact edges on thin geometry.
  sun.shadow.camera.updateProjectionMatrix();

  const sunTarget = new THREE.Object3D();
  sunTarget.position.set(-0.5, 0.9, 2.0);
  sun.target = sunTarget;

  const accents: THREE.PointLight[] = [];
  const accentPositions: Array<[number, number, number]> = [
    [-3.4, 3.05, -1.6],
    [0.3, 3.05, 1.8],
    [3.5, 3.05, -2.4],
  ];
  for (const [x, y, z] of accentPositions) {
    const light = new THREE.PointLight(0xffd9a6, 12, 7.5, 1.8);
    light.position.set(x, y, z);
    light.castShadow = false;
    accents.push(light);
  }

  return { ambient, hemisphere, sun, sunTarget, accents };
}

/* ------------------------------------------------------------------------- */
/* CafeScene                                                                  */
/* ------------------------------------------------------------------------- */

/**
 * Central orchestrator of the café.
 *
 * Owns the permanent room shell (floor, walls, ceiling, window openings with
 * frame geometry, doorway), the scene-wide lighting/mood rig, and the
 * prop-group registry every detail category plugs into. Era-specific content
 * lives entirely in registered groups; this class stays period-neutral.
 *
 * ## Rendering notes (performance pass)
 *
 * The shell is fully static, so every box is baked into per-material merged
 * geometries (`addMergedMesh`) — roughly 14 draw calls instead of ~139 — and
 * the whole shell freezes its matrices after construction
 * (`matrixAutoUpdate = false`), removing per-frame matrix work. Neither
 * change alters what is drawn, only how cheaply.
 */
export class CafeScene {
  readonly scene: THREE.Scene;
  /** Group holding the permanent architecture; added to the main scene. */
  readonly room: THREE.Group;
  readonly ambientLight: THREE.AmbientLight;
  readonly hemisphereLight: THREE.HemisphereLight;
  readonly sunLight: THREE.DirectionalLight;
  readonly sunTarget: THREE.Object3D;
  /** Era-tintable accent points hanging over the room. */
  readonly accentLights: THREE.PointLight[] = [];

  private readonly propsRoot = new THREE.Group();
  private readonly propGroups = new Map<PropGroupKey, RegisteredPropGroup>();
  private readonly resolveEraFn: (year: EraYear) => EraConfig;
  private readonly renderer?: THREE.WebGLRenderer;
  private readonly camera?: THREE.Camera;
  private readonly fog = new THREE.FogExp2(0x171310, 0.014);
  private readonly materials = createShellMaterials();
  private readonly shellBounds = new THREE.Box3();
  private readonly ownedGeometries: THREE.BufferGeometry[] = [];

  private currentConfig: EraConfig | null = null;
  private previousYear: EraYear | null = null;

  constructor(options: CafeSceneOptions) {
    this.scene = options.scene;
    this.renderer = options.renderer;
    this.camera = options.camera;
    this.resolveEraFn = options.resolveEra ?? getEra;

    this.propsRoot.name = 'cafe-prop-groups';

    this.room = new THREE.Group();
    this.room.name = 'cafe-room-shell';
    this.buildRoomShell();
    this.scene.add(this.room);
    this.shellBounds.setFromObject(this.room);

    this.scene.add(this.propsRoot);

    const rig = createLightingRig();
    this.ambientLight = rig.ambient;
    this.hemisphereLight = rig.hemisphere;
    this.sunLight = rig.sun;
    this.sunTarget = rig.sunTarget;
    this.accentLights.push(...rig.accents);
    this.scene.add(
      this.ambientLight,
      this.hemisphereLight,
      this.sunLight,
      this.sunTarget,
      ...this.accentLights,
    );

    this.scene.fog = this.fog;
  }

  /* ----- Registry plumbing --------------------------------------------- */

  /**
   * Registers one detail category (furniture, machines, menu, posters,
   * tableware, signage, counter tech, patrons).
   *
   * `key` must match its {@link EraConfig} section name exactly so wiring is
   * 1:1. The builder runs immediately; if an era was already applied, the
   * updater runs once right away so late registrants sync with the current
   * state instead of waiting for the next slider move.
   */
  registerPropGroup(key: PropGroupKey, builder: PropGroupBuilder, updater: PropGroupUpdater): this {
    if (this.propGroups.has(key)) {
      throw new Error(`Prop group "${key}" is already registered.`);
    }
    const group = builder({ host: this });
    group.name = `prop-group:${key}`;
    // Content defaults to full shadow participation; individual meshes can
    // still opt out afterwards (e.g. glow panels).
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    this.propsRoot.add(group);
    this.propGroups.set(key, { key, group, updater });

    if (this.currentConfig) {
      updater(this.currentConfig, { host: this, previousYear: this.previousYear });
    }
    return this;
  }

  /** Removes a prop group's object graph from the scene. */
  unregisterPropGroup(key: PropGroupKey): boolean {
    const entry = this.propGroups.get(key);
    if (!entry) return false;
    this.propsRoot.remove(entry.group);
    this.propGroups.delete(key);
    return true;
  }

  hasPropGroup(key: PropGroupKey): boolean {
    return this.propGroups.has(key);
  }

  getPropGroup(key: PropGroupKey): THREE.Group | undefined {
    return this.propGroups.get(key)?.group;
  }

  get propGroupKeys(): PropGroupKey[] {
    return [...this.propGroups.keys()];
  }

  /* ----- Era routing ---------------------------------------------------- */

  /**
   * Resolves the requested year through the era lookup and routes the full
   * {@link EraConfig} into every registered group's updater, after applying
   * the config's lighting/fog/exposure mood. Returns the applied config.
   */
  applyEra(year: EraYear): EraConfig {
    const config = this.resolveEraFn(year);
    this.currentConfig = config;
    this.applyLightingMood(config.lighting);

    const context: PropUpdateContext = { host: this, previousYear: this.previousYear };
    for (const entry of this.propGroups.values()) {
      entry.updater(config, context);
    }
    this.previousYear = config.year;
    return config;
  }

  /** Config most recently applied via {@link applyEra}, if any. */
  get currentEra(): EraConfig | null {
    return this.currentConfig;
  }

  /**
   * Resolves a year through the configured era lookup WITHOUT applying it.
   * The era-transition controller uses this to preview a target era's
   * lighting mood before the animated swap commits via {@link applyEra}.
   */
  resolveEra(year: EraYear): EraConfig {
    return this.resolveEraFn(year);
  }

  /* ----- Mood hooks ----------------------------------------------------- */

  /**
   * Applies partial lighting overrides. Undefined fields leave the current
   * state untouched, so era configs only need to express what changes.
   */
  applyLightingMood(mood: EraLightingMood | undefined): void {
    if (!mood) return;
    if (mood.ambientColor !== undefined) this.ambientLight.color.set(mood.ambientColor);
    if (mood.ambientIntensity !== undefined) this.ambientLight.intensity = mood.ambientIntensity;
    if (mood.hemisphereSkyColor !== undefined) this.hemisphereLight.color.set(mood.hemisphereSkyColor);
    if (mood.hemisphereGroundColor !== undefined) {
      this.hemisphereLight.groundColor.set(mood.hemisphereGroundColor);
    }
    if (mood.hemisphereIntensity !== undefined) {
      this.hemisphereLight.intensity = mood.hemisphereIntensity;
    }
    if (mood.sunColor !== undefined) this.sunLight.color.set(mood.sunColor);
    if (mood.sunIntensity !== undefined) this.sunLight.intensity = mood.sunIntensity;
    if (mood.accentColor !== undefined || mood.accentIntensity !== undefined) {
      for (const light of this.accentLights) {
        if (mood.accentColor !== undefined) light.color.set(mood.accentColor);
        if (mood.accentIntensity !== undefined) light.intensity = mood.accentIntensity;
      }
    }
    if (mood.fogColor !== undefined) this.fog.color.set(mood.fogColor);
    if (mood.fogDensity !== undefined) this.fog.density = mood.fogDensity;
    if (mood.exposure !== undefined) this.setExposure(mood.exposure);
  }

  /** Scene-wide fog hook for era moods. */
  setFog(color: THREE.ColorRepresentation, density: number): void {
    this.fog.color.set(color);
    this.fog.density = density;
  }

  /** Tone-mapping exposure hook for era moods. */
  setExposure(value: number): void {
    if (this.renderer) this.renderer.toneMappingExposure = value;
  }

  /**
   * Shadow-quality dial for the app shell's transition governor: swaps the
   * sun's shadow map to `size` texels per side. Disposing the live target
   * makes three.js reallocate lazily on the next shadow render. Restoring
   * {@link SUN_SHADOW_MAP_SIZE} returns to the tuned steady-state quality.
   */
  setSunShadowMapSize(size: number): void {
    const clamped = Math.min(Math.max(Math.round(size), 256), 4096);
    const shadow = this.sunLight.shadow;
    if (shadow.mapSize.x === clamped && shadow.mapSize.y === clamped) return;
    shadow.mapSize.set(clamped, clamped);
    if (shadow.map) {
      shadow.map.dispose();
      shadow.map = null;
    }
  }

  /* ----- Bounds & close-up inspection ----------------------------------- */

  /** Recomputes the bounding box of the permanent shell. */
  refreshShellBounds(): THREE.Box3 {
    this.shellBounds.setFromObject(this.room);
    return this.shellBounds.clone();
  }

  /** Current bounding box of the permanent shell (copied into `target`). */
  getShellBounds(target: THREE.Box3 = new THREE.Box3()): THREE.Box3 {
    return target.copy(this.shellBounds);
  }

  get roomDimensions(): RoomDimensions {
    return { width: ROOM_WIDTH, depth: ROOM_DEPTH, height: ROOM_HEIGHT };
  }

  /**
   * Camera-facing framing info for inspecting a world-space point up close:
   * the suggested position sits on the ray from the point towards the current
   * camera at `distance`, then clamps inside the shell bounds so close-ups
   * never poke through walls, floor or ceiling.
   */
  getCloseUpFrame(targetWorld: THREE.Vector3, distance = 1.15): CloseUpFrame {
    const direction = new THREE.Vector3(0.45, 0.5, 1);
    if (this.camera) direction.copy(this.camera.position).sub(targetWorld);
    if (direction.lengthSq() < 1e-6) direction.set(0.45, 0.5, 1);
    direction.normalize();

    const position = targetWorld.clone().addScaledVector(direction, distance);
    const pad = 0.3;
    const min = this.shellBounds.min.clone().addScalar(pad);
    const max = this.shellBounds.max.clone().addScalar(-pad);

    position.x = THREE.MathUtils.clamp(position.x, min.x, max.x);
    position.z = THREE.MathUtils.clamp(position.z, min.z, max.z);
    const minY = Math.max(min.y, targetWorld.y + 0.12);
    position.y = THREE.MathUtils.clamp(position.y, minY, Math.max(max.y, minY));

    return { position, lookAt: targetWorld.clone() };
  }

  /* ----- Teardown -------------------------------------------------------- */

  dispose(): void {
    for (const key of [...this.propGroups.keys()]) this.unregisterPropGroup(key);
    this.scene.remove(this.room);
    this.scene.remove(this.propsRoot);
    this.scene.remove(this.ambientLight, this.hemisphereLight, this.sunLight, this.sunTarget);
    for (const light of this.accentLights) this.scene.remove(light);
    this.accentLights.length = 0;
    this.scene.fog = null;
    this.currentConfig = null;

    for (const geometry of this.ownedGeometries) geometry.dispose();
    this.ownedGeometries.length = 0;

    const materials = new Set<THREE.Material | THREE.Material[]>();
    this.room.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      materials.add(mesh.material);
    });
    for (const material of materials) {
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material.dispose();
    }
  }

  /* ----- Permanent shell construction ------------------------------------ */

  /**
   * Builds the entire static shell as merged per-material meshes.
   *
   * Draw-call ledger (was → now):
   * - floor: 64 plank boxes → 5 meshes (one per timber shade)
   * - walls + ceiling: 17 plaster boxes → 1 mesh
   * - window frames + door casing: 33 painted boxes → 1 mesh
   * - glazing: 5 panes → 1 transparent mesh (still shadow-exempt)
   * - sills: 5 boards → 1 mesh; trim (baseboards/crowns/threshold): 10 → 1
   * - door leaf wood: 3 boxes → 1 mesh; brass hardware stays 2 tiny meshes
   */
  private buildRoomShell(): void {
    const owned = this.ownedGeometries;
    const { materials, room } = this;

    /* --- Floor ---------------------------------------------------------- */

    addMergedMesh(
      room,
      materials.underlay,
      [
        geometryFromSpec({
          w: ROOM_WIDTH + 2 * WALL_T,
          h: 0.08,
          d: ROOM_DEPTH + 2 * WALL_T,
          x: 0,
          y: -0.04,
          z: 0,
        }),
      ],
      owned,
      { cast: false, name: 'floor-underlay' },
    );

    // Strip flooring: deterministic layout, one merged mesh per shade.
    const random = mulberry32(0xcafe);
    const plankDepth = ROOM_DEPTH / PLANK_ROWS;
    const plankBuckets: BoxSpec[][] = materials.planks.map(() => []);
    const pushPlank = (
      shade: number,
      lenX: number,
      centerZ: number,
      centerX: number,
    ): void => {
      plankBuckets[shade].push({
        w: lenX,
        h: 0.04,
        d: plankDepth - 0.005,
        x: centerX,
        y: 0.02,
        z: centerZ,
      });
    };

    for (let row = 0; row < PLANK_ROWS; row += 1) {
      const centerZ = -HALF_D + plankDepth * (row + 0.5);
      const shade = Math.floor(random() * materials.planks.length);
      if (random() < 0.55) {
        // Split rows get staggered end joints like real strip flooring.
        const jointU = 0.3 + random() * 0.4;
        const gap = 0.006;
        const lenA = ROOM_WIDTH * jointU;
        const lenB = ROOM_WIDTH - lenA - gap;
        pushPlank(shade, lenA, centerZ, -HALF_W + lenA / 2);
        pushPlank(
          Math.floor(random() * materials.planks.length),
          lenB,
          centerZ,
          HALF_W - lenB / 2,
        );
      } else {
        pushPlank(shade, ROOM_WIDTH, centerZ, 0);
      }
    }
    plankBuckets.forEach((specs, index) => {
      addMergedMesh(
        room,
        materials.planks[index],
        specs.map((spec) => geometryFromSpec(spec)),
        owned,
        { cast: false, name: `floor-planks-${index}` },
      );
    });

    /* --- Walls (all plaster masonry in one mesh) ------------------------ */

    const pierY = (WINDOW_SILL + WINDOW_TOP) / 2;
    const headerHeight = ROOM_HEIGHT - WINDOW_TOP;
    const headerY = (WINDOW_TOP + ROOM_HEIGHT) / 2;
    const plasterSpecs: BoxSpec[] = [];

    // South wall (street frontage): three window openings.
    plasterSpecs.push(
      { w: ROOM_WIDTH + 2 * WALL_T, h: WINDOW_SILL, d: WALL_T, x: 0, y: WINDOW_SILL / 2, z: WALL_S_Z },
      { w: ROOM_WIDTH + 2 * WALL_T, h: headerHeight, d: WALL_T, x: 0, y: headerY, z: WALL_S_Z },
    );
    const southPierEdges: Array<[number, number]> = [
      [-HALF_W - WALL_T / 2, -4.95],
      [-3.05, -0.95],
      [0.95, 3.05],
      [4.95, HALF_W + WALL_T / 2],
    ];
    for (const [from, to] of southPierEdges) {
      plasterSpecs.push({
        w: to - from,
        h: WINDOW_HEIGHT,
        d: WALL_T,
        x: (from + to) / 2,
        y: pierY,
        z: WALL_S_Z,
      });
    }

    // East wall (side street): two window openings.
    plasterSpecs.push(
      { w: WALL_T, h: WINDOW_SILL, d: ROOM_DEPTH, x: WALL_E_X, y: WINDOW_SILL / 2, z: 0 },
      { w: WALL_T, h: headerHeight, d: ROOM_DEPTH, x: WALL_E_X, y: headerY, z: 0 },
    );
    const eastPierEdges: Array<[number, number]> = [
      [-HALF_D, -3.05],
      [-1.45, 1.45],
      [3.05, HALF_D],
    ];
    for (const [from, to] of eastPierEdges) {
      plasterSpecs.push({
        w: WALL_T,
        h: WINDOW_HEIGHT,
        d: to - from,
        x: WALL_E_X,
        y: pierY,
        z: (from + to) / 2,
      });
    }

    // West wall: solid, with the doorway opening near the north end.
    const doorFrom = DOOR_CENTER_Z - DOOR_WIDTH / 2;
    const doorTo = DOOR_CENTER_Z + DOOR_WIDTH / 2;
    plasterSpecs.push(
      {
        w: WALL_T,
        h: ROOM_HEIGHT,
        d: doorFrom + HALF_D,
        x: WALL_W_X,
        y: ROOM_HEIGHT / 2,
        z: (-HALF_D + doorFrom) / 2,
      },
      {
        w: WALL_T,
        h: ROOM_HEIGHT - DOOR_HEIGHT,
        d: DOOR_WIDTH,
        x: WALL_W_X,
        y: (DOOR_HEIGHT + ROOM_HEIGHT) / 2,
        z: DOOR_CENTER_Z,
      },
      {
        w: WALL_T,
        h: ROOM_HEIGHT,
        d: HALF_D - doorTo,
        x: WALL_W_X,
        y: ROOM_HEIGHT / 2,
        z: (doorTo + HALF_D) / 2,
      },
    );

    // North wall (kitchen side): solid.
    plasterSpecs.push({
      w: ROOM_WIDTH + 2 * WALL_T,
      h: ROOM_HEIGHT,
      d: WALL_T,
      x: 0,
      y: ROOM_HEIGHT / 2,
      z: WALL_N_Z,
    });

    // Ceiling slab closing the top of the volume (blocks the sun above roof).
    plasterSpecs.push({
      w: ROOM_WIDTH + 2 * WALL_T,
      h: 0.12,
      d: ROOM_DEPTH + 2 * WALL_T,
      x: 0,
      y: ROOM_HEIGHT + 0.06,
      z: 0,
    });

    addMergedMesh(
      room,
      materials.plaster,
      plasterSpecs.map((spec) => geometryFromSpec(spec)),
      owned,
      { name: 'walls-and-ceiling' },
    );

    /* --- Window joinery, glazing & sills -------------------------------- */

    interface WindowUnitSpec {
      cx: number;
      cz: number;
      ry: number;
      width: number;
    }
    const windowUnits: WindowUnitSpec[] = [
      ...WINDOW_CENTERS_SOUTH_X.map((cx) => ({ cx, cz: WALL_S_Z, ry: 0, width: WINDOW_WIDTH_SOUTH })),
      ...WINDOW_CENTERS_EAST_Z.map((cz) => ({
        cx: WALL_E_X,
        cz,
        ry: -Math.PI / 2, // Inward normal faces -x.
        width: WINDOW_WIDTH_EAST,
      })),
    ];

    const frameGeoms: THREE.BufferGeometry[] = [];
    const glassGeoms: THREE.BufferGeometry[] = [];
    const sillGeoms: THREE.BufferGeometry[] = [];

    for (const unit of windowUnits) {
      const height = WINDOW_HEIGHT;
      const half = height / 2;
      const halfW = unit.width / 2;
      const frameThickness = 0.09;
      const frameDepth = 0.26; // Slightly proud of both wall faces.
      const unitMatrix = new THREE.Matrix4()
        .makeRotationY(unit.ry)
        .setPosition(unit.cx, WINDOW_SILL + half, unit.cz);

      const localFrames: BoxSpec[] = [
        // Outer frame rails and stiles.
        { w: unit.width + frameThickness * 2, h: frameThickness, d: frameDepth, x: 0, y: half + frameThickness / 2, z: 0 },
        { w: unit.width + frameThickness * 2, h: frameThickness, d: frameDepth, x: 0, y: -half - frameThickness / 2, z: 0 },
        { w: frameThickness, h: height, d: frameDepth, x: -(halfW + frameThickness / 2), y: 0, z: 0 },
        { w: frameThickness, h: height, d: frameDepth, x: halfW + frameThickness / 2, y: 0, z: 0 },
        // Glazing bars: central mullion plus a transom bar at 22% height.
        { w: 0.05, h: height, d: 0.2, x: 0, y: 0, z: 0 },
        { w: unit.width, h: 0.05, d: 0.2, x: 0, y: height * 0.22, z: 0 },
      ];
      for (const spec of localFrames) frameGeoms.push(geometryFromSpec(spec, unitMatrix));

      // Pane — transparent, and excluded from shadow casting so the sun keeps
      // streaming through the opening.
      glassGeoms.push(
        geometryFromSpec({ w: unit.width, h: height, d: 0.02, x: 0, y: 0, z: 0 }, unitMatrix),
      );

      // Interior sill board protruding into the room.
      sillGeoms.push(
        geometryFromSpec(
          { w: unit.width + 0.16, h: 0.05, d: 0.34, x: 0, y: -half - 0.025, z: 0.05 },
          unitMatrix,
        ),
      );
    }

    /* --- Doorway casing & threshold join the shared static buckets ------- */

    // Casing jambs/head are axis-aligned after the doorway group's quarter-
    // turn, so they bake straight into world space alongside the windows.
    const jambOffset = DOOR_WIDTH / 2 + 0.045;
    const doorMatrix = new THREE.Matrix4()
      .makeRotationY(Math.PI / 2) // Local +z faces into the room (+x world).
      .setPosition(WALL_W_X, 0, DOOR_CENTER_Z);
    const casingLocal: BoxSpec[] = [
      { w: 0.09, h: DOOR_HEIGHT, d: 0.26, x: -jambOffset, y: DOOR_HEIGHT / 2, z: 0 },
      { w: 0.09, h: DOOR_HEIGHT, d: 0.26, x: jambOffset, y: DOOR_HEIGHT / 2, z: 0 },
      { w: DOOR_WIDTH + 0.18, h: 0.09, d: 0.26, x: 0, y: DOOR_HEIGHT + 0.045, z: 0 },
    ];
    for (const spec of casingLocal) frameGeoms.push(geometryFromSpec(spec, doorMatrix));

    /* --- Emit the merged static-shell meshes ----------------------------- */

    addMergedMesh(room, materials.framePaint, frameGeoms, owned, { name: 'shell-joinery' });
    addMergedMesh(room, materials.glass, glassGeoms, owned, {
      cast: false,
      name: 'window-glazing',
    });
    addMergedMesh(room, materials.sillWood, sillGeoms, owned, { name: 'window-sills' });

    /* --- Trim: baseboards, crowns, threshold ---------------------------- */

    const boardHeight = 0.12;
    const boardY = 0.04 + boardHeight / 2;
    const crownY = ROOM_HEIGHT - 0.035;
    const trimSpecs: BoxSpec[] = [
      // Baseboards skirting every wall (west split around the doorway).
      { w: ROOM_WIDTH, h: boardHeight, d: 0.03, x: 0, y: boardY, z: -(HALF_D - 0.015) },
      { w: ROOM_WIDTH, h: boardHeight, d: 0.03, x: 0, y: boardY, z: HALF_D - 0.015 },
      { w: 0.03, h: boardHeight, d: ROOM_DEPTH, x: HALF_W - 0.015, y: boardY, z: 0 },
      {
        w: 0.03,
        h: boardHeight,
        d: doorFrom + HALF_D,
        x: -(HALF_W - 0.015),
        y: boardY,
        z: (-HALF_D + doorFrom) / 2,
      },
      {
        w: 0.03,
        h: boardHeight,
        d: HALF_D - doorTo,
        x: -(HALF_W - 0.015),
        y: boardY,
        z: (doorTo + HALF_D) / 2,
      },
      // Crown moulding at the ceiling line.
      { w: ROOM_WIDTH, h: 0.07, d: 0.04, x: 0, y: crownY, z: -(HALF_D - 0.02) },
      { w: ROOM_WIDTH, h: 0.07, d: 0.04, x: 0, y: crownY, z: HALF_D - 0.02 },
      { w: 0.04, h: 0.07, d: ROOM_DEPTH, x: HALF_W - 0.02, y: crownY, z: 0 },
      { w: 0.04, h: 0.07, d: ROOM_DEPTH, x: -(HALF_W - 0.02), y: crownY, z: 0 },
    ];
    const trimGeoms: THREE.BufferGeometry[] = trimSpecs.map((spec) => geometryFromSpec(spec));
    // Threshold over the boards rides along with the trim merge (baked
    // through the doorway's quarter-turn).
    trimGeoms.push(
      geometryFromSpec(
        { w: DOOR_WIDTH + 0.18, h: 0.045, d: 0.36, x: 0, y: 0.062, z: 0 },
        doorMatrix,
      ),
    );
    addMergedMesh(room, materials.trim, trimGeoms, owned, { name: 'shell-trim' });

    /* --- Panelled door leaf standing ajar -------------------------------- */

    // Its wood boxes merge into ONE geometry in leaf-local space; the leaf
    // group keeps its authored swing transform so brass hardware rides along.
    const leaf = new THREE.Group();
    leaf.name = 'door-leaf';
    leaf.position.set(-(DOOR_WIDTH / 2) + 0.01, 0.04, 0);
    leaf.rotation.y = -1.2;
    const doorWidth = DOOR_WIDTH - 0.04;
    const doorHeight = DOOR_HEIGHT - 0.04;
    const leafLocal: BoxSpec[] = [
      { w: doorWidth, h: doorHeight, d: 0.045, x: doorWidth / 2, y: doorHeight / 2, z: 0 },
      {
        w: doorWidth - 0.34,
        h: doorHeight * 0.32,
        d: 0.02,
        x: doorWidth / 2,
        y: doorHeight * 0.3,
        z: 0.032,
      },
      {
        w: doorWidth - 0.34,
        h: doorHeight * 0.36,
        d: 0.02,
        x: doorWidth / 2,
        y: doorHeight * 0.71,
        z: 0.032,
      },
    ];
    addMergedMesh(
      leaf,
      materials.doorWood,
      leafLocal.map((spec) => geometryFromSpec(spec)),
      owned,
      { name: 'door-leaf-wood' },
    );

    const spindleGeometry = new THREE.CylinderGeometry(0.011, 0.011, 0.07, 12);
    const knobGeometry = new THREE.SphereGeometry(0.028, 16, 12);
    owned.push(spindleGeometry, knobGeometry);
    const spindle = new THREE.Mesh(spindleGeometry, materials.brass);
    spindle.rotation.x = Math.PI / 2;
    spindle.position.set(doorWidth - 0.12, 1.02, 0.05);
    spindle.castShadow = true;
    const knob = new THREE.Mesh(knobGeometry, materials.brass);
    knob.position.set(doorWidth - 0.12, 1.02, 0.088);
    knob.castShadow = true;
    leaf.add(spindle, knob);

    const doorway = new THREE.Group();
    doorway.name = 'doorway-unit';
    doorway.position.copy(new THREE.Vector3(WALL_W_X, 0, DOOR_CENTER_Z));
    doorway.rotation.y = Math.PI / 2;
    doorway.add(leaf);
    room.add(doorway);

    /* --- Freeze static matrices ------------------------------------------ */

    // The shell never moves: bake world matrices once and opt out of the
    // per-frame update walk entirely.
    this.room.updateMatrixWorld(true);
    this.room.traverse((obj) => {
      obj.matrixAutoUpdate = false;
      obj.matrixWorldAutoUpdate = false;
    });
  }
}

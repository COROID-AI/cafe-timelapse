import * as THREE from 'three';
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

/* ------------------------------------------------------------------------- */
/* Shared geometry & small helpers                                            */
/* ------------------------------------------------------------------------- */

/** One unit cube reused (scaled) by every box-shaped shell part. */
const sharedUnitBox = new THREE.BoxGeometry(1, 1, 1);

interface BoxOptions {
  cast?: boolean;
  receive?: boolean;
}

function makeBox(
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  options?: BoxOptions,
): THREE.Mesh {
  const mesh = new THREE.Mesh(sharedUnitBox, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  mesh.castShadow = options?.cast ?? true;
  mesh.receiveShadow = options?.receive ?? true;
  return mesh;
}

/** Deterministic PRNG so the plank layout is stable across reloads. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
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
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 40;
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03; // Softened contact edges on thin geometry.

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
    this.buildFloor();
    this.buildWalls();
    this.buildWindows();
    this.buildDoorway();
    this.buildCeilingAndTrim();
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

    const geometries = new Set<THREE.BufferGeometry>(this.ownedGeometries);
    const materials = new Set<THREE.Material | THREE.Material[]>();
    this.room.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      materials.add(mesh.material);
    });
    for (const geometry of geometries) {
      // sharedUnitBox is module-level and may outlive this instance.
      if (geometry !== sharedUnitBox) geometry.dispose();
    }
    for (const material of materials) {
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material.dispose();
    }
  }

  /* ----- Permanent shell construction ------------------------------------ */

  private addPlank(material: THREE.MeshStandardMaterial, lenX: number, centerZ: number, centerX: number): void {
    const plank = makeBox(material, lenX, 0.04, ROOM_DEPTH / PLANK_ROWS - 0.005, centerX, 0.02, centerZ, {
      cast: false,
    });
    this.room.add(plank);
  }

  private buildFloor(): void {
    // Dark sub-floor slab under the boards.
    this.room.add(
      makeBox(this.materials.underlay, ROOM_WIDTH + 2 * WALL_T, 0.08, ROOM_DEPTH + 2 * WALL_T, 0, -0.04, 0, {
        cast: false,
      }),
    );

    const random = mulberry32(0xcafe);
    const plankDepth = ROOM_DEPTH / PLANK_ROWS;
    for (let row = 0; row < PLANK_ROWS; row += 1) {
      const centerZ = -HALF_D + plankDepth * (row + 0.5);
      const shade = this.materials.planks[Math.floor(random() * this.materials.planks.length)];
      if (random() < 0.55) {
        // Split rows get staggered end joints like real strip flooring.
        const jointU = 0.3 + random() * 0.4;
        const gap = 0.006;
        const lenA = ROOM_WIDTH * jointU;
        const lenB = ROOM_WIDTH - lenA - gap;
        this.addPlank(shade, lenA, centerZ, -HALF_W + lenA / 2);
        this.addPlank(this.materials.planks[Math.floor(random() * this.materials.planks.length)], lenB, centerZ, HALF_W - lenB / 2);
      } else {
        this.addPlank(shade, ROOM_WIDTH, centerZ, 0);
      }
    }
  }

  private buildWalls(): void {
    const plaster = this.materials.plaster;
    const pierY = (WINDOW_SILL + WINDOW_TOP) / 2;
    const headerHeight = ROOM_HEIGHT - WINDOW_TOP;
    const headerY = (WINDOW_TOP + ROOM_HEIGHT) / 2;

    // South wall (street frontage): three window openings.
    this.room.add(makeBox(plaster, ROOM_WIDTH + 2 * WALL_T, WINDOW_SILL, WALL_T, 0, WINDOW_SILL / 2, WALL_S_Z));
    this.room.add(makeBox(plaster, ROOM_WIDTH + 2 * WALL_T, headerHeight, WALL_T, 0, headerY, WALL_S_Z));
    const southPierEdges: Array<[number, number]> = [
      [-HALF_W - WALL_T / 2, -4.95],
      [-3.05, -0.95],
      [0.95, 3.05],
      [4.95, HALF_W + WALL_T / 2],
    ];
    for (const [from, to] of southPierEdges) {
      this.room.add(
        makeBox(plaster, to - from, WINDOW_HEIGHT, WALL_T, (from + to) / 2, pierY, WALL_S_Z),
      );
    }

    // East wall (side street): two window openings.
    this.room.add(makeBox(plaster, WALL_T, WINDOW_SILL, ROOM_DEPTH, WALL_E_X, WINDOW_SILL / 2, 0));
    this.room.add(makeBox(plaster, WALL_T, headerHeight, ROOM_DEPTH, WALL_E_X, headerY, 0));
    const eastPierEdges: Array<[number, number]> = [
      [-HALF_D, -3.05],
      [-1.45, 1.45],
      [3.05, HALF_D],
    ];
    for (const [from, to] of eastPierEdges) {
      this.room.add(makeBox(plaster, WALL_T, WINDOW_HEIGHT, to - from, WALL_E_X, pierY, (from + to) / 2));
    }

    // West wall: solid, with the doorway opening near the north end.
    const doorFrom = DOOR_CENTER_Z - DOOR_WIDTH / 2;
    const doorTo = DOOR_CENTER_Z + DOOR_WIDTH / 2;
    this.room.add(
      makeBox(plaster, WALL_T, ROOM_HEIGHT, doorFrom + HALF_D, WALL_W_X, ROOM_HEIGHT / 2, (-HALF_D + doorFrom) / 2),
    );
    this.room.add(
      makeBox(plaster, WALL_T, ROOM_HEIGHT - DOOR_HEIGHT, DOOR_WIDTH, WALL_W_X, (DOOR_HEIGHT + ROOM_HEIGHT) / 2, DOOR_CENTER_Z),
    );
    this.room.add(
      makeBox(plaster, WALL_T, ROOM_HEIGHT, HALF_D - doorTo, WALL_W_X, ROOM_HEIGHT / 2, (doorTo + HALF_D) / 2),
    );

    // North wall (kitchen side): solid.
    this.room.add(makeBox(plaster, ROOM_WIDTH + 2 * WALL_T, ROOM_HEIGHT, WALL_T, 0, ROOM_HEIGHT / 2, WALL_N_Z));
  }

  private buildWindows(): void {
    const specs: Array<{ cx: number; cz: number; ry: number; width: number }> = [
      ...WINDOW_CENTERS_SOUTH_X.map((cx) => ({ cx, cz: WALL_S_Z, ry: 0, width: WINDOW_WIDTH_SOUTH })),
      ...WINDOW_CENTERS_EAST_Z.map((cz) => ({
        cx: WALL_E_X,
        cz,
        ry: -Math.PI / 2, // Inward normal faces -x.
        width: WINDOW_WIDTH_EAST,
      })),
    ];
    for (const spec of specs) {
      const unit = this.createWindowUnit(spec.width, WINDOW_HEIGHT);
      unit.name = 'window-unit';
      unit.position.set(spec.cx, WINDOW_SILL + WINDOW_HEIGHT / 2, spec.cz);
      unit.rotation.y = spec.ry;
      this.room.add(unit);
    }
  }

  /** Builds one window (frame, mullion, transom bar, glass, inner sill). */
  private createWindowUnit(width: number, height: number): THREE.Group {
    const { framePaint, glass, sillWood } = this.materials;
    const group = new THREE.Group();
    const frameThickness = 0.09;
    const frameDepth = 0.26; // Slightly proud of both wall faces.
    const half = height / 2;
    const halfW = width / 2;

    // Outer frame rails and stiles.
    group.add(makeBox(framePaint, width + frameThickness * 2, frameThickness, frameDepth, 0, half + frameThickness / 2, 0));
    group.add(makeBox(framePaint, width + frameThickness * 2, frameThickness, frameDepth, 0, -half - frameThickness / 2, 0));
    group.add(makeBox(framePaint, frameThickness, height, frameDepth, -(halfW + frameThickness / 2), 0, 0));
    group.add(makeBox(framePaint, frameThickness, height, frameDepth, halfW + frameThickness / 2, 0, 0));

    // Glazing bars: central vertical mullion plus a transom bar at 72% height.
    group.add(makeBox(framePaint, 0.05, height, 0.2, 0, 0, 0));
    group.add(makeBox(framePaint, width, 0.05, 0.2, 0, height * 0.22, 0));

    // Pane — transparent, and excluded from shadow casting so the sun keeps
    // streaming through the opening.
    group.add(makeBox(glass, width, height, 0.02, 0, 0, 0, { cast: false }));

    // Interior sill board protruding into the room.
    group.add(makeBox(sillWood, width + 0.16, 0.05, 0.34, 0, -half - 0.025, 0.05));

    return group;
  }

  private buildDoorway(): void {
    const { framePaint, trim, doorWood, brass } = this.materials;
    const group = new THREE.Group();
    group.name = 'doorway-unit';
    group.position.set(WALL_W_X, 0, DOOR_CENTER_Z);
    group.rotation.y = Math.PI / 2; // Local +z faces into the room (+x world).

    // Casing jambs and head.
    const jambOffset = DOOR_WIDTH / 2 + 0.045;
    group.add(makeBox(framePaint, 0.09, DOOR_HEIGHT, 0.26, -jambOffset, DOOR_HEIGHT / 2, 0));
    group.add(makeBox(framePaint, 0.09, DOOR_HEIGHT, 0.26, jambOffset, DOOR_HEIGHT / 2, 0));
    group.add(makeBox(framePaint, DOOR_WIDTH + 0.18, 0.09, 0.26, 0, DOOR_HEIGHT + 0.045, 0));

    // Threshold over the boards.
    group.add(makeBox(trim, DOOR_WIDTH + 0.18, 0.045, 0.36, 0, 0.062, 0));

    // Panelled door leaf standing ajar, hinged at the north jamb.
    const leaf = new THREE.Group();
    leaf.name = 'door-leaf';
    leaf.position.set(-(DOOR_WIDTH / 2) + 0.01, 0.04, 0);
    leaf.rotation.y = -1.2;
    const doorWidth = DOOR_WIDTH - 0.04;
    const doorHeight = DOOR_HEIGHT - 0.04;
    leaf.add(makeBox(doorWood, doorWidth, doorHeight, 0.045, doorWidth / 2, doorHeight / 2, 0));
    // Raised panel mouldings (lower + upper field).
    leaf.add(makeBox(doorWood, doorWidth - 0.34, doorHeight * 0.32, 0.02, doorWidth / 2, doorHeight * 0.3, 0.032));
    leaf.add(makeBox(doorWood, doorWidth - 0.34, doorHeight * 0.36, 0.02, doorWidth / 2, doorHeight * 0.71, 0.032));

    const spindleGeometry = new THREE.CylinderGeometry(0.011, 0.011, 0.07, 12);
    const knobGeometry = new THREE.SphereGeometry(0.028, 16, 12);
    this.ownedGeometries.push(spindleGeometry, knobGeometry);
    const spindle = new THREE.Mesh(spindleGeometry, brass);
    spindle.rotation.x = Math.PI / 2;
    spindle.position.set(doorWidth - 0.12, 1.02, 0.05);
    spindle.castShadow = true;
    const knob = new THREE.Mesh(knobGeometry, brass);
    knob.position.set(doorWidth - 0.12, 1.02, 0.088);
    knob.castShadow = true;
    leaf.add(spindle, knob);
    group.add(leaf);

    this.room.add(group);
  }

  private buildCeilingAndTrim(): void {
    // Ceiling slab closing the top of the volume (blocks the sun above the roof).
    this.room.add(
      makeBox(this.materials.plaster, ROOM_WIDTH + 2 * WALL_T, 0.12, ROOM_DEPTH + 2 * WALL_T, 0, ROOM_HEIGHT + 0.06, 0),
    );

    // Stained baseboards skirting every wall (split around the doorway west).
    const boardHeight = 0.12;
    const boardY = 0.04 + boardHeight / 2;
    this.room.add(makeBox(this.materials.trim, ROOM_WIDTH, boardHeight, 0.03, 0, boardY, -(HALF_D - 0.015)));
    this.room.add(makeBox(this.materials.trim, ROOM_WIDTH, boardHeight, 0.03, 0, boardY, HALF_D - 0.015));
    this.room.add(makeBox(this.materials.trim, 0.03, boardHeight, ROOM_DEPTH, HALF_W - 0.015, boardY, 0));
    const doorFrom = DOOR_CENTER_Z - DOOR_WIDTH / 2;
    const doorTo = DOOR_CENTER_Z + DOOR_WIDTH / 2;
    this.room.add(makeBox(this.materials.trim, 0.03, boardHeight, doorFrom + HALF_D, -(HALF_W - 0.015), boardY, (-HALF_D + doorFrom) / 2));
    this.room.add(makeBox(this.materials.trim, 0.03, boardHeight, HALF_D - doorTo, -(HALF_W - 0.015), boardY, (doorTo + HALF_D) / 2));

    // Simple crown moulding at the ceiling line.
    const crownY = ROOM_HEIGHT - 0.035;
    this.room.add(makeBox(this.materials.trim, ROOM_WIDTH, 0.07, 0.04, 0, crownY, -(HALF_D - 0.02)));
    this.room.add(makeBox(this.materials.trim, ROOM_WIDTH, 0.07, 0.04, 0, crownY, HALF_D - 0.02));
    this.room.add(makeBox(this.materials.trim, 0.04, 0.07, ROOM_DEPTH, HALF_W - 0.02, crownY, 0));
    this.room.add(makeBox(this.materials.trim, 0.04, 0.07, ROOM_DEPTH, -(HALF_W - 0.02), crownY, 0));
  }
}

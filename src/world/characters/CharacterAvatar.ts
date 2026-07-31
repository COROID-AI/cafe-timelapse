/**
 * CharacterAvatar — reusable low-poly stylized human figure system.
 *
 * Phase 5 shared character/patron system. Builds a stylized human figure
 * (head, torso, arms, legs) from primitive geometry, parameterized by an era
 * PatronConfig (body palette, hairstyle shape/color, outfit garments, held
 * gadget/accessory). Each avatar carries the shared idle/subtle-motion loop
 * (breathing, slight head turn, occasional sip) driven from the main render
 * loop via {@link updateCharacterAnimations}, and placement helpers seat
 * avatars at the architecture seating anchors (tables / counter stools).
 *
 * Performance: static body parts are merged into a single BufferGeometry with
 * per-material groups, so each avatar renders in ~3 draw calls (static body,
 * head + hair, animated right arm + held gadget) instead of one mesh per
 * primitive. A shared {@link AvatarMaterialCache} lets a roster reuse surfaces
 * across every avatar in an era.
 *
 * Headless-safe: pure object-graph work (no WebGL required to build), so the
 * QA gate can verify the system in CI without a browser.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type {
  AccessoryKind,
  HairstyleKind,
  PatronConfig,
} from '../../data/EraData';
import type { EraYear } from '../../data/eras';
import { ANCHORS } from '../layout';

// --- Shared figure dimensions (world units / metres) -------------------------

const HEAD_R = 0.11;
const TORSO_H = 0.7;
const STANDING_LEG_H = 0.8;
/** How far a seated avatar's dangling legs clear the floor. */
const SEATED_LEG_CLEARANCE = 0.04;
/** Standard chair seat height used by the era table anchors. */
const TABLE_SEAT_HEIGHT = 0.46;
/** Standard counter-stool seat height. */
const STOOL_SEAT_HEIGHT = 0.62;
/** Default counter-stool z positions (matches the shell counter run). */
const DEFAULT_STOOL_Z = [-3.0, -1.8, -0.6, 0.6];

export type AvatarPosture = 'standing' | 'seated';

// --- Materials ---------------------------------------------------------------

/** The six material slots an avatar's body palette maps onto. */
export interface AvatarMaterials {
  skin: THREE.Material;
  shirt: THREE.Material;
  pants: THREE.Material;
  shoes: THREE.Material;
  hair: THREE.Material;
  accent: THREE.Material;
}

/**
 * Per-roster material cache: reuses the same material instance for the same
 * part + colour so a full era of patrons shares surfaces instead of creating
 * one material per avatar per part.
 */
export class AvatarMaterialCache {
  private readonly materials = new Map<string, THREE.Material>();

  /** Resolve (and cache) the six materials for a patron config. */
  get(config: PatronConfig): AvatarMaterials {
    return {
      skin: this.for('skin', config.skin, 0.6),
      shirt: this.for('shirt', config.shirt, 0.8),
      pants: this.for('pants', config.pants, 0.85),
      shoes: this.for('shoes', config.shoes, 0.5),
      hair: this.for('hair', config.hair.color, 0.8),
      accent: this.for('accent', config.accent ?? '#D94F3D', 0.55),
    };
  }

  /** Number of distinct materials currently cached. */
  get size(): number {
    return this.materials.size;
  }

  /** Release every cached material. */
  dispose(): void {
    for (const material of this.materials.values()) material.dispose();
    this.materials.clear();
  }

  private for(part: string, color: string, roughness: number): THREE.Material {
    const key = `${part}:${color}`;
    let material = this.materials.get(key);
    if (!material) {
      material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness,
      });
      material.name = `avatar-${part}-${color}`;
      this.materials.set(key, material);
    }
    return material;
  }
}

/** Convenience: build a fresh material set for one avatar (no cache sharing). */
export function makeAvatarMaterials(config: PatronConfig): AvatarMaterials {
  return new AvatarMaterialCache().get(config);
}

// --- Geometry helpers ----------------------------------------------------------

interface Part {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}

function box(w: number, h: number, d: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(w, h, d);
}

function sphere(r: number, widthSegments = 10, heightSegments = 8): THREE.SphereGeometry {
  return new THREE.SphereGeometry(r, widthSegments, heightSegments);
}

function cylinder(rTop: number, rBottom: number, h: number, radialSegments = 8): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(rTop, rBottom, h, radialSegments);
}

function torus(radius: number, tube: number, radialSegments = 6, tubularSegments = 16): THREE.TorusGeometry {
  return new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments);
}

/**
 * Merge parts into one mesh with per-part material groups (a single draw
 * call). Falls back to a group of individual meshes when the geometries are
 * incompatible — the fallback is only used defensively.
 */
function buildMesh(
  parts: Part[],
  name: string,
  castShadow: boolean,
  receiveShadow: boolean,
): THREE.Object3D {
  const applyShadow = (mesh: THREE.Mesh): void => {
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;
  };
  if (parts.length === 1) {
    const mesh = new THREE.Mesh(parts[0].geometry, parts[0].material);
    mesh.name = name;
    applyShadow(mesh);
    return mesh;
  }
  try {
    const merged = mergeGeometries(
      parts.map((part) => part.geometry),
      true,
    );
    if (merged) {
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, parts.map((part) => part.material));
      mesh.name = name;
      applyShadow(mesh);
      return mesh;
    }
  } catch {
    // fall through to per-part meshes below
  }
  const group = new THREE.Group();
  group.name = name;
  for (const part of parts) {
    const mesh = new THREE.Mesh(part.geometry, part.material);
    applyShadow(mesh);
    group.add(mesh);
  }
  return group;
}

/** Build the hair geometry for a hairstyle kind (head-local coordinates). */
function buildHair(parts: Part[], hair: THREE.Material, kind: HairstyleKind): void {
  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number): void => {
    geometry.translate(x, y, z);
    parts.push({ geometry, material: hair });
  };
  const capR = HEAD_R * 1.04;
  const cap = (sx: number, sy: number): THREE.SphereGeometry => {
    const g = sphere(capR);
    g.scale(sx, sy, sx);
    return g;
  };

  switch (kind) {
    case 'buzz':
      add(cap(1, 0.45), 0, HEAD_R * 0.3, 0);
      break;
    case 'short':
      add(cap(1, 0.75), 0, HEAD_R * 0.45, 0);
      add(box(0.12, 0.04, 0.05), 0, HEAD_R * 0.55, HEAD_R * 0.85);
      break;
    case 'side-swept': {
      // 2000s asymmetric fringe sweeping across the forehead.
      add(cap(1, 0.72), 0, HEAD_R * 0.4, 0);
      const fringe = box(0.26, 0.05, 0.07);
      fringe.rotateZ(-0.35);
      add(fringe, 0.03, HEAD_R * 0.42, HEAD_R * 0.82);
      const side = box(0.06, 0.18, 0.1);
      side.rotateZ(-0.15);
      add(side, HEAD_R * 0.85, 0, 0);
      break;
    }
    case 'bob':
      add(cap(1, 0.8), 0, HEAD_R * 0.4, 0);
      add(box(0.07, 0.16, 0.12), -HEAD_R * 0.92, -0.03, 0);
      add(box(0.07, 0.16, 0.12), HEAD_R * 0.92, -0.03, 0);
      break;
    case 'beehive':
      add(cap(1, 0.8), 0, HEAD_R * 0.35, 0);
      add(sphere(0.09), 0, HEAD_R * 0.95, 0);
      add(sphere(0.07), 0, HEAD_R * 1.5, 0);
      break;
    case 'bouffant':
      add(cap(1, 0.85), 0, HEAD_R * 0.4, 0);
      add(sphere(0.1), 0, HEAD_R * 0.9, 0);
      add(sphere(0.08), 0, HEAD_R * 1.25, -HEAD_R * 0.1);
      break;
    case 'beret': {
      add(cap(0.9, 0.55), 0, HEAD_R * 0.55, 0);
      add(cylinder(HEAD_R * 1.1, HEAD_R * 1.1, 0.02, 10), 0, HEAD_R * 0.35, 0);
      break;
    }
    case 'cap': {
      add(cap(0.95, 0.5), 0, HEAD_R * 0.5, 0);
      add(box(0.16, 0.02, 0.06), 0, HEAD_R * 0.35, HEAD_R * 0.85);
      break;
    }
    case 'ponytail': {
      add(cap(1, 0.8), 0, HEAD_R * 0.4, 0);
      const tail = cylinder(0.035, 0.03, 0.18, 8);
      tail.rotateX(-0.4);
      add(tail, 0, -0.05, -HEAD_R * 0.85);
      break;
    }
    case 'bun': {
      add(cap(1, 0.8), 0, HEAD_R * 0.4, 0);
      add(sphere(0.06), 0, HEAD_R * 0.7, -HEAD_R * 0.85);
      break;
    }
    case 'braids': {
      add(cap(1, 0.8), 0, HEAD_R * 0.4, 0);
      const braid = (side: number): void => {
        const g = cylinder(0.022, 0.022, 0.22, 6);
        g.rotateX(0.25);
        add(g, side * HEAD_R * 0.85, -0.08, 0);
      };
      braid(-1);
      braid(1);
      break;
    }
    case 'curls': {
      add(cap(1, 0.8), 0, HEAD_R * 0.4, 0);
      add(sphere(0.05), -HEAD_R * 0.85, 0.02, HEAD_R * 0.3);
      add(sphere(0.05), HEAD_R * 0.85, 0.02, HEAD_R * 0.3);
      add(sphere(0.045), 0, HEAD_R * 0.75, -HEAD_R * 0.5);
      break;
    }
    case 'waves': {
      add(cap(1, 0.75), 0, HEAD_R * 0.4, 0);
      add(sphere(0.055), -HEAD_R * 0.9, -0.01, HEAD_R * 0.25);
      add(sphere(0.055), HEAD_R * 0.9, -0.01, HEAD_R * 0.25);
      break;
    }
    case 'messy': {
      add(cap(1, 0.8), 0, HEAD_R * 0.4, 0);
      const top = sphere(0.06);
      top.rotateZ(0.35);
      add(top, 0.03, HEAD_R * 0.85, 0);
      break;
    }
    case 'spiky': {
      // 2000s spiky crop: short cap with small upright spikes.
      add(cap(1, 0.68), 0, HEAD_R * 0.38, 0);
      for (const [sx, sz] of [
        [-0.5, 0.5],
        [0, 0.7],
        [0.5, 0.5],
        [-0.8, 0],
        [0.8, 0],
        [-0.4, -0.5],
        [0.4, -0.5],
      ]) {
        const spike = cylinder(0.016, 0.008, 0.07, 6);
        spike.rotateX(0.15 * sx + 0.2);
        spike.rotateZ(-0.25 * sz);
        add(spike, sx * HEAD_R * 0.75, HEAD_R * 0.68, sz * HEAD_R * 0.7);
      }
      break;
    }
    default:
      add(cap(1, 0.8), 0, HEAD_R * 0.4, 0);
      break;
  }
}

/** Head-worn accessories (glasses, headphones) ride the head pivot. */
function buildHeadAccessory(
  parts: Part[],
  accent: THREE.Material,
  accessory: AccessoryKind,
): void {
  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number): void => {
    geometry.translate(x, y, z);
    parts.push({ geometry, material: accent });
  };
  if (accessory === 'glasses') {
    add(box(0.16, 0.014, 0.03), 0, 0.02, HEAD_R * 0.92);
  } else if (accessory === 'headphones') {
    const band = torus(HEAD_R * 0.85, 0.014);
    band.rotateX(Math.PI / 2);
    add(band, 0, 0.03, 0);
    add(box(0.03, 0.06, 0.02), -HEAD_R * 0.85, -0.04, 0);
    add(box(0.03, 0.06, 0.02), HEAD_R * 0.85, -0.04, 0);
  }
}

/**
 * Handheld accessories ride the animated right arm (so they move with the
 * arm during idle motion). A 'cup' is placed in the hand for the sip loop.
 */
function buildHandAccessory(
  parts: Part[],
  accent: THREE.Material,
  accessory: AccessoryKind,
): void {
  const add = (geometry: THREE.BufferGeometry, x: number, y: number, z: number): void => {
    geometry.translate(x, y, z);
    parts.push({ geometry, material: accent });
  };
  switch (accessory) {
    case 'book':
      add(box(0.16, 0.05, 0.12), 0, -0.52, 0.06);
      break;
    case 'purse':
      add(box(0.14, 0.11, 0.06), 0, -0.48, 0.06);
      break;
    case 'case':
      add(box(0.1, 0.07, 0.02), 0, -0.52, 0.05);
      break;
    case 'mirror':
      add(cylinder(0.04, 0.04, 0.015, 10), 0, -0.52, 0.06);
      break;
    case 'radio':
      add(box(0.14, 0.08, 0.05), 0, -0.48, 0.06);
      break;
    case 'walkman':
      add(box(0.09, 0.06, 0.03), 0, -0.52, 0.05);
      break;
    case 'ipod': {
      // Early iPod: slim white slab with the click wheel (silver accent ring).
      add(box(0.075, 0.115, 0.014), 0, -0.54, 0.05);
      const wheel = cylinder(0.026, 0.026, 0.016, 12);
      add(wheel, 0, -0.515, 0.056);
      break;
    }
    case 'calculator':
      add(box(0.08, 0.05, 0.02), 0, -0.48, 0.06);
      break;
    case 'phone':
      add(box(0.05, 0.1, 0.012), 0, -0.55, 0.05);
      break;
    case 'flip-phone': {
      // 2000s clamshell flip phone: two folded halves joined by a hinge.
      add(box(0.048, 0.09, 0.012), 0, -0.545, 0.05);
      add(box(0.048, 0.09, 0.012), 0, -0.485, 0.044);
      add(box(0.012, 0.02, 0.016), 0, -0.515, 0.047);
      break;
    }
    case 'laptop': {
      // Open laptop: base keyboard slab with a tilted screen (2005 chunky
      // laptops and later thin models share this silhouette).
      add(box(0.26, 0.025, 0.2), 0, -0.455, 0.1);
      const screen = box(0.26, 0.18, 0.018);
      screen.rotateX(-0.35);
      add(screen, 0, -0.4, 0.06);
      break;
    }
    case 'wristband':
      add(box(0.06, 0.03, 0.06), 0, -0.42, 0.03);
      break;
    case 'cigarette':
      add(cylinder(0.008, 0.008, 0.1, 6), 0, -0.5, 0.09);
      break;
    case 'cup':
      add(cylinder(0.035, 0.028, 0.09, 10), 0, -0.6, 0.05);
      break;
    default:
      break;
  }
}

// --- Deterministic per-avatar variation ----------------------------------------

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed >>> 0 || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

// --- Avatar options ------------------------------------------------------------

export interface CharacterAvatarOptions {
  /** The era PatronConfig that parameterizes this figure. */
  config: PatronConfig;
  /** Standing or seated figure. Default 'standing'. */
  posture?: AvatarPosture;
  /** Hip height when seated (the chair/stool seat height). Default 0.46. */
  seatHeight?: number;
  /** Global scale factor applied to the root. Default 1. */
  scale?: number;
  /** Root group name override. */
  name?: string;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** Pre-built material set (otherwise resolved from config + cache). */
  materials?: AvatarMaterials;
  /** Shared cache used to resolve materials (roster-owned). */
  materialCache?: AvatarMaterialCache;
  /** Fixed seed so animation phases are deterministic across mounts. */
  seed?: number;
  /** Override the first sip delay (seconds). Default random 4–10 s. */
  sipDelay?: number;
}

/**
 * CharacterAvatar — a low-poly stylized human figure built from primitive
 * geometry and parameterized by a PatronConfig.
 *
 * Structure (rooted at the floor, facing +z):
 *   avatar root
 *   └─ body group            ← breathing scale
 *      ├─ static mesh        ← merged legs/torso/left arm/shoes/neck/hands
 *      ├─ head pivot         ← head turn (head + hair + head-worn accessory)
 *      └─ arm pivot          ← occasional sip / sway (right arm + held gadget)
 */
export class CharacterAvatar {
  readonly root: THREE.Group;
  readonly config: PatronConfig;
  readonly posture: AvatarPosture;

  private readonly bodyGroup: THREE.Group;
  private readonly headPivot: THREE.Group;
  private readonly armPivot: THREE.Group;
  private readonly materials: AvatarMaterials;
  private readonly ownsMaterials: boolean;
  private readonly phase: number;
  private readonly rand: () => number;
  private readonly sipDuration: number;
  private readonly sipAngle = -2.2;
  private sipTimer: number;
  private sipProgress = -1;

  constructor(options: CharacterAvatarOptions) {
    this.config = options.config;
    this.posture = options.posture ?? 'standing';
    const seatHeight = options.seatHeight ?? TABLE_SEAT_HEIGHT;

    const seed =
      options.seed ??
      hashString(
        `${this.config.name ?? ''}:${this.config.hair.kind}:${this.config.shirt}:${this.config.accessory ?? 'none'}`,
      );
    this.rand = seededRandom(seed);
    this.phase = this.rand() * Math.PI * 2;
    this.sipTimer = options.sipDelay ?? 4 + this.rand() * 6;
    this.sipDuration = 1.4 + this.rand() * 0.6;

    this.ownsMaterials = !options.materialCache && !options.materials;
    this.materials =
      options.materials ??
      (options.materialCache
        ? options.materialCache.get(this.config)
        : makeAvatarMaterials(this.config));

    this.root = new THREE.Group();
    this.root.name = options.name ?? `avatar-${this.config.name ?? this.config.hair.kind}`;
    this.root.userData.characterAvatar = this;
    if (options.scale !== undefined) this.root.scale.setScalar(options.scale);

    this.bodyGroup = new THREE.Group();
    this.bodyGroup.name = 'avatar-body';
    this.root.add(this.bodyGroup);

    const cast = options.castShadow ?? true;
    const receive = options.receiveShadow ?? true;
    const { skin, shirt, pants, shoes, hair, accent } = this.materials;
    const accessory = this.config.accessory ?? 'none';

    const hipY = this.posture === 'seated' ? seatHeight : STANDING_LEG_H;
    const torsoCenterY = hipY + TORSO_H / 2;
    const shoulderY = hipY + TORSO_H - 0.06;
    const headY = shoulderY + HEAD_R + 0.03;

    // --- Static body parts (merged into one mesh) ---------------------------
    const staticParts: Part[] = [];

    if (this.posture === 'seated') {
      // Dangling legs from the seat, tilted slightly forward.
      const legH = Math.max(0.2, hipY - SEATED_LEG_CLEARANCE);
      for (const side of [-1, 1]) {
        const leg = box(0.11, legH, 0.12);
        leg.rotateX(-0.12);
        leg.translate(side * 0.07, hipY - legH / 2, 0.02);
        staticParts.push({ geometry: leg, material: pants });
      }
    } else {
      for (const side of [-1, 1]) {
        const leg = box(0.11, STANDING_LEG_H, 0.12);
        leg.translate(side * 0.07, STANDING_LEG_H / 2, 0);
        staticParts.push({ geometry: leg, material: pants });
      }
    }

    for (const side of [-1, 1]) {
      const shoe = box(0.1, 0.05, 0.15);
      shoe.translate(side * 0.07, 0.03, 0.05);
      staticParts.push({ geometry: shoe, material: shoes });
    }

    // Bootcut jeans flare at the ankle (2000s period leg silhouette).
    if (this.config.legStyle === 'bootcut') {
      const flareH = 0.07;
      const flareY = this.posture === 'seated' ? 0.08 : flareH / 2 + 0.01;
      for (const side of [-1, 1]) {
        const flare = box(0.15, flareH, 0.15);
        flare.translate(side * 0.07, flareY, 0.02);
        staticParts.push({ geometry: flare, material: pants });
      }
    }

    const torsoW = this.config.style === 'poncho' ? 0.44 : 0.34;
    const torso = box(torsoW, TORSO_H, 0.22);
    torso.translate(0, torsoCenterY, 0);
    staticParts.push({ geometry: torso, material: shirt });

    // Slim tie worn at the chest (1965 slim-suit patrons).
    if (accessory === 'tie') {
      const tie = box(0.05, 0.26, 0.02);
      tie.translate(0, torsoCenterY - 0.04, 0.115);
      staticParts.push({ geometry: tie, material: accent });
    }

    if (this.config.style === 'dress') {
      const skirt = cylinder(0.2, 0.3, 0.3, 10);
      skirt.translate(0, hipY + 0.15, 0);
      staticParts.push({ geometry: skirt, material: shirt });
    } else if (this.config.style === 'poncho') {
      const hem = cylinder(0.24, 0.28, 0.16, 10);
      hem.translate(0, hipY + 0.12, 0);
      staticParts.push({ geometry: hem, material: shirt });
    } else if (this.config.style === 'jumpsuit') {
      const belt = box(0.36, 0.04, 0.24);
      belt.translate(0, hipY + 0.03, 0);
      staticParts.push({ geometry: belt, material: accent });
    }

    const neck = box(0.07, 0.09, 0.07);
    neck.translate(0, shoulderY + 0.045, 0);
    staticParts.push({ geometry: neck, material: skin });

    // Left arm + both hands (the right arm is animated separately below).
    const leftArm = box(0.1, 0.55, 0.11);
    leftArm.translate(-0.24, shoulderY - 0.275, 0);
    staticParts.push({ geometry: leftArm, material: shirt });

    const leftHand = sphere(0.045);
    leftHand.translate(-0.24, shoulderY - 0.58, 0.03);
    staticParts.push({ geometry: leftHand, material: skin });

    // --- Head pivot (head + hair + head-worn accessory) ----------------------
    const headParts: Part[] = [];
    const headSphere = sphere(HEAD_R);
    headParts.push({ geometry: headSphere, material: skin });
    buildHair(headParts, hair, this.config.hair.kind);
    buildHeadAccessory(headParts, accent, accessory);

    this.headPivot = new THREE.Group();
    this.headPivot.name = 'avatar-head';
    this.headPivot.position.set(0, headY, 0);
    this.headPivot.add(buildMesh(headParts, 'avatar-head-mesh', cast, receive));
    this.bodyGroup.add(this.headPivot);

    // --- Right arm pivot (occasional sip / sway) ------------------------------
    this.armPivot = new THREE.Group();
    this.armPivot.name = 'avatar-arm-right';
    this.armPivot.position.set(0.24, shoulderY, 0);
    const armParts: Part[] = [];
    const rightArm = box(0.1, 0.55, 0.11);
    rightArm.translate(0, -0.275, 0);
    armParts.push({ geometry: rightArm, material: shirt });
    const rightHand = sphere(0.045);
    rightHand.translate(0, -0.58, 0.03);
    armParts.push({ geometry: rightHand, material: skin });
    buildHandAccessory(armParts, accent, accessory);
    this.armPivot.add(buildMesh(armParts, 'avatar-arm-mesh', cast, receive));
    this.bodyGroup.add(this.armPivot);

    // --- Merged static body ----------------------------------------------------
    this.bodyGroup.add(buildMesh(staticParts, 'avatar-static', cast, receive));

    // Initialize animation transforms so a freshly built avatar is stable.
    this.update(0, 0);
  }

  /** Current head-turn rotation (radians) — exposed for animation checks. */
  get headTurn(): number {
    return this.headPivot.rotation.y;
  }

  /** Current right-arm raise (radians) — exposed for sip animation checks. */
  get armRaise(): number {
    return this.armPivot.rotation.x;
  }

  /** Current breathing scale on the body group's y axis. */
  get breathScale(): number {
    return this.bodyGroup.scale.y;
  }

  /**
   * Advance the shared idle/subtle-motion loop. Call from the main render
   * loop once per frame (directly, or via {@link updateCharacterAnimations}).
   *   - breathing: slow scale pulse on the body group;
   *   - head turn: gentle yaw/tilt/nod on the head pivot;
   *   - occasional sip: cup-holders raise the right arm toward the face on a
   *     per-avatar schedule; other patrons get a subtle arm sway instead.
   */
  update(dt: number, elapsed: number): void {
    const t = elapsed + this.phase;
    const breath = Math.sin(t * 1.9);
    this.bodyGroup.scale.set(
      1 + 0.004 * breath,
      1 + 0.012 * breath,
      1 + 0.004 * breath,
    );
    this.headPivot.rotation.y = 0.14 * Math.sin(t * 0.5 + this.phase);
    this.headPivot.rotation.z = 0.03 * Math.sin(t * 0.8 + this.phase * 1.3);
    this.headPivot.rotation.x = 0.02 * Math.sin(t * 0.7 + this.phase * 1.7);

    if (this.config.accessory === 'cup') {
      if (this.sipProgress < 0) {
        this.sipTimer -= dt;
        if (this.sipTimer <= 0) this.sipProgress = 0;
      } else {
        this.sipProgress += dt / this.sipDuration;
        const k = this.sipProgress;
        if (k >= 1) {
          this.sipProgress = -1;
          this.sipTimer = 4 + this.rand() * 8;
          this.armPivot.rotation.x = 0;
        } else {
          // Bell curve: raise toward the face, hold, lower.
          this.armPivot.rotation.x = this.sipAngle * Math.sin(k * Math.PI);
        }
      }
    } else {
      // Subtle sway for patrons holding gadgets.
      this.armPivot.rotation.z = 0.02 * Math.sin(t * 0.9 + this.phase);
    }
  }

  /** Release the avatar's geometries (and its own materials when unshared). */
  dispose(): void {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    this.root.traverse((object) => {
      const mesh = object as THREE.Mesh;
      if (mesh.geometry) geometries.add(mesh.geometry);
      if (!this.ownsMaterials || !mesh.material) return;
      if (Array.isArray(mesh.material)) {
        for (const material of mesh.material) materials.add(material);
      } else {
        materials.add(mesh.material);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
  }
}

// --- Placement helpers ----------------------------------------------------------

/** Direction from an anchor to seat at (used by {@link seatAtAnchor}). */
export type TableSide = 'north' | 'south' | 'east' | 'west' | 'auto';

export interface SeatOptions {
  /** Offset distance from the anchor. Tables default 0.72; stools default 0.1. */
  distance?: number;
  /** Direction from the anchor to seat at. Default 'auto' (index-driven). */
  side?: TableSide;
  /** Index used to pick an automatic side around a table. Default 0. */
  index?: number;
  /** Override the final y-rotation (radians). Defaults to facing the anchor. */
  facing?: number;
}

/** Deterministic sides around a round table (south, west, east, north, corners). */
const TABLE_SIDES: ReadonlyArray<readonly [number, number]> = [
  [0, 1],
  [-1, 0],
  [1, 0],
  [0, -1],
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
];

/**
 * Generic placement helper: seat an avatar beside any anchor position, facing
 * the anchor. Tables and counter stools are specializations of this helper.
 */
export function seatAtAnchor(
  avatar: CharacterAvatar,
  anchor: THREE.Vector3,
  options: SeatOptions = {},
): void {
  const side = options.side ?? 'auto';
  const index = options.index ?? 0;
  let dx = 0;
  let dz = 0;
  if (side === 'auto') {
    const pair = TABLE_SIDES[index % TABLE_SIDES.length];
    dx = pair[0];
    dz = pair[1];
  } else if (side === 'north') {
    dz = -1;
  } else if (side === 'south') {
    dz = 1;
  } else if (side === 'east') {
    dx = 1;
  } else if (side === 'west') {
    dx = -1;
  }
  const distance = options.distance ?? 0.72;
  const position = new THREE.Vector3(
    anchor.x + dx * distance,
    0,
    anchor.z + dz * distance,
  );
  avatar.root.position.copy(position);
  avatar.root.rotation.y =
    options.facing ?? Math.atan2(anchor.x - position.x, anchor.z - position.z);
}

/** Seat an avatar beside one of the architecture seating-table anchors. */
export function seatAtTable(
  avatar: CharacterAvatar,
  table: THREE.Vector3,
  options: SeatOptions = {},
): void {
  seatAtAnchor(avatar, table, { distance: 0.72, ...options });
}

/** Seat an avatar at a counter stool, facing the bar (east wall). */
export function seatAtCounter(
  avatar: CharacterAvatar,
  stool: THREE.Vector3,
  options: SeatOptions = {},
): void {
  const distance = options.distance ?? 0.1;
  const position = new THREE.Vector3(stool.x - distance, 0, stool.z);
  avatar.root.position.copy(position);
  avatar.root.rotation.y = options.facing ?? Math.PI / 2;
}

/**
 * Standard counter-stool anchor positions (west of the counter bar, matching
 * the shell's counter run). Pass custom z positions when an era's furniture
 * places stools differently (e.g. 2055 pod stools).
 */
export function counterStoolAnchors(
  zs: number[] = DEFAULT_STOOL_Z,
): THREE.Vector3[] {
  const stoolX = ANCHORS.counter.position.x - 0.85;
  return zs.map((z) => new THREE.Vector3(stoolX, 0, z));
}

// --- Roster -----------------------------------------------------------------------

export interface CharacterRosterOptions {
  /** Parent group avatars are mounted into (an era fragment group). */
  parent: THREE.Object3D;
  /** Table anchors; defaults to ANCHORS.seatingTables. */
  tables?: THREE.Vector3[];
  /** Counter stool anchors; defaults to []. */
  stools?: THREE.Vector3[];
  /** Posture for table seats. Default 'seated'. */
  tablePosture?: AvatarPosture;
  /** Posture for stool seats. Default 'seated'. */
  stoolPosture?: AvatarPosture;
  /** Table seat height. Default 0.46. */
  tableSeatHeight?: number;
  /** Stool seat height. Default 0.62. */
  stoolSeatHeight?: number;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export interface RosterMountOptions {
  /** Override tables for this mount (falls back to roster/ANCHORS). */
  tables?: THREE.Vector3[];
  /** Override stools for this mount. */
  stools?: THREE.Vector3[];
}

/**
 * CharacterRoster — mounts the right set of avatars for an era and removes
 * the previous set. Each `mount` clears the previous era's avatars (disposing
 * their geometry and shared materials) before seating the new patrons at the
 * architecture seating anchors: table anchors first, then counter stools.
 */
export class CharacterRoster {
  readonly root: THREE.Group;
  private readonly options: CharacterRosterOptions;
  private readonly cache = new AvatarMaterialCache();
  private avatars: CharacterAvatar[] = [];

  constructor(options: CharacterRosterOptions) {
    this.options = options;
    this.root = new THREE.Group();
    this.root.name = 'character-roster';
    options.parent.add(this.root);
  }

  /** Number of avatars currently mounted. */
  get size(): number {
    return this.avatars.length;
  }

  /**
   * Mount the era's patrons, replacing any previously mounted avatars.
   * Patrons are seated at the table anchors first; when tables run out the
   * remaining patrons are seated at the counter stools.
   */
  mount(era: EraYear, configs: PatronConfig[], mountOptions: RosterMountOptions = {}): void {
    this.clear();
    const tables = mountOptions.tables ?? this.options.tables ?? ANCHORS.seatingTables;
    const stools = mountOptions.stools ?? this.options.stools ?? [];
    const cast = this.options.castShadow ?? true;
    const receive = this.options.receiveShadow ?? true;

    let tableIndex = 0;
    let stoolIndex = 0;
    for (const config of configs) {
      const atStool = stools.length > 0 && tableIndex >= tables.length;
      const seatHeight = atStool
        ? (this.options.stoolSeatHeight ?? STOOL_SEAT_HEIGHT)
        : (this.options.tableSeatHeight ?? TABLE_SEAT_HEIGHT);
      const posture: AvatarPosture = atStool
        ? (this.options.stoolPosture ?? 'seated')
        : (this.options.tablePosture ?? 'seated');

      const avatar = new CharacterAvatar({
        config,
        posture,
        seatHeight,
        castShadow: cast,
        receiveShadow: receive,
        materialCache: this.cache,
        seed: hashString(
          `${era}:${config.name ?? ''}:${config.hair.kind}:${config.shirt}:${config.accessory ?? 'none'}:${tableIndex}:${stoolIndex}`,
        ),
      });

      if (!atStool && tableIndex < tables.length) {
        seatAtTable(avatar, tables[tableIndex], {
          index: tableIndex % TABLE_SIDES.length,
        });
        tableIndex += 1;
      } else if (stools.length > 0) {
        seatAtCounter(avatar, stools[stoolIndex % stools.length], {
          index: stoolIndex,
        });
        stoolIndex += 1;
      } else {
        // No anchors at all: fan patrons across the room centre line.
        avatar.root.position.set((tableIndex - Math.max(1, configs.length / 2)) * 1.2, 0, 0.5);
      }

      this.root.add(avatar.root);
      this.avatars.push(avatar);
    }
  }

  /** Remove and dispose every mounted avatar. */
  clear(): void {
    for (const avatar of this.avatars) {
      this.root.remove(avatar.root);
      avatar.dispose();
    }
    this.avatars = [];
    this.cache.dispose();
  }

  /** Advance every mounted avatar's idle animation. */
  update(dt: number, elapsed: number): void {
    for (const avatar of this.avatars) avatar.update(dt, elapsed);
  }

  /** Remove the roster from its parent and release all resources. */
  dispose(): void {
    this.clear();
    this.root.removeFromParent();
  }
}

/**
 * Drive every avatar's idle/subtle-motion loop from the main render loop.
 * Finds mounted avatars by traversing the scene once per frame — avatars that
 * live inside era groups are picked up automatically and disappear with them
 * when the era is unmounted.
 */
export function updateCharacterAnimations(
  root: THREE.Object3D,
  dt: number,
  elapsed: number,
): void {
  root.traverse((object) => {
    const avatar = (object as THREE.Group).userData?.characterAvatar as
      | CharacterAvatar
      | undefined;
    if (avatar) avatar.update(dt, elapsed);
  });
}

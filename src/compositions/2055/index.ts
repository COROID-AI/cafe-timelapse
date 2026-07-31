/**
 * 2055 — near-future speculative café composition.
 *
 * This is the Phase 4 scene composition for the 2055 era. Every fragment
 * category required by the AssetRegistry is built from the shared procedural
 * asset library (src/assets) and mounted at the canonical layout anchors
 * (src/world/layout.ts), so the era mounts cleanly into the SceneManager:
 *
 *   - architecture      reactive smart-glass walls + programmable LED skirt
 *                       strips (the smart-glass / photopolymer resin /
 *                       mycelium finishes come from the shell surface slots,
 *                       dressed by ./surfaces.ts)
 *   - furnitureDecor    modular smart furniture: curved seamless pedestal
 *                       tables, morphing-foam pod chairs, counter pods, a
 *                       biophilic vertical garden wall, and a floating
 *                       holographic accent
 *   - coffeeMachines    robotic bean-to-cup arm (robo-barista) + automated
 *                       pour-over rig
 *   - menuBoard         holographic/AR menu panel with 2055 speculative prices
 *   - musicSource       ambient smart device with spatial audio + a
 *                       holographic emitter object
 *   - posters           holographic/animated advertisements
 *   - tableware         self-heating smart vessels + reusable smart cups
 *   - signageLighting   dynamic programmable LED surfaces + holographic
 *                       "BREW//2055" signage
 *   - counterTechnology fully autonomous kiosk, biometric/contactless order
 *                       terminal, and a drone delivery hatch
 *   - patrons           poncho and jumpsuit-wearing 2055 patrons
 *
 * All geometry is procedural and headless-safe (no WebGL required to build).
 */
import * as THREE from 'three';
import {
  materialFactory,
  materialFromSpec,
  PropPrimitives,
} from '../../assets';
import type { EraSurfaceMaterials } from './surfaces';
import {
  ANCHORS,
  ROOM_BOUNDS,
  ROOM_DEPTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
} from '../../world/layout';
import type { SurfaceSlots } from '../../world/ArchitectureShell';
import { era2055 } from '../../data/eras/2055';
import type { PatronConfig } from '../../data/EraData';
import { ERA_AUDIO_2055 } from '../../audio/eras/2055';
import {
  CharacterRoster,
  counterStoolAnchors,
} from '../../world/characters';
import { populate2055Surfaces } from './surfaces';

/** Shared 2055 surface materials (factory-cached per kind). */
const M = {
  trim: () => materialFactory.forEra(2055, 'trim'),
  metal: () => materialFactory.forEra(2055, 'metal'),
  chrome: () => materialFactory.forEra(2055, 'chrome'),
  plastic: () => materialFactory.forEra(2055, 'plastic'),
  ceramic: () => materialFactory.forEra(2055, 'ceramic'),
  glass: () => materialFactory.forEra(2055, 'glass'),
  fabric: () => materialFactory.forEra(2055, 'fabric'),
};

/** Emissive holo/teal accents for the 2055 palette. */
const holo = (): THREE.MeshPhysicalMaterial =>
  materialFromSpec({
    color: '#46D9C2',
    emissive: '#46D9C2',
    emissiveIntensity: 2.2,
    roughness: 0.25,
  });
const holoCyan = (): THREE.MeshPhysicalMaterial =>
  materialFromSpec({
    color: '#63E6FF',
    emissive: '#63E6FF',
    emissiveIntensity: 2.4,
    roughness: 0.2,
  });
const ledTeal = (): THREE.MeshPhysicalMaterial =>
  materialFromSpec({
    color: '#41F2C8',
    emissive: '#41F2C8',
    emissiveIntensity: 2.0,
    roughness: 0.3,
  });
const ledWarm = (): THREE.MeshPhysicalMaterial =>
  materialFromSpec({
    color: '#9BF0C0',
    emissive: '#9BF0C0',
    emissiveIntensity: 1.8,
    roughness: 0.3,
  });
const foliage = (): THREE.MeshPhysicalMaterial =>
  materialFromSpec({ color: '#2E5D46', roughness: 0.85 });
const foliageLight = (): THREE.MeshPhysicalMaterial =>
  materialFromSpec({ color: '#4E7A58', roughness: 0.85 });
const soil = (): THREE.MeshPhysicalMaterial =>
  materialFromSpec({ color: '#3A2E24', roughness: 1 });

/** A translucent holographic panel (emissive, double-sided, see-through). */
function holoPanel(color: string, intensity = 2.2): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color),
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 0.15,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/** Build one shadow-casting mesh with optional rotation, added to `target`. */
function mesh(
  target: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  name: string,
  rotation: { x?: number; y?: number; z?: number } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  if (rotation.x) m.rotation.x = rotation.x;
  if (rotation.y) m.rotation.y = rotation.y;
  if (rotation.z) m.rotation.z = rotation.z;
  m.name = name;
  m.castShadow = true;
  m.receiveShadow = true;
  target.add(m);
  return m;
}

function box(
  target: THREE.Object3D,
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  name: string,
  rotation: { x?: number; y?: number; z?: number } = {},
): THREE.Mesh {
  return mesh(target, new THREE.BoxGeometry(w, h, d), material, x, y, z, name, rotation);
}

function cylinder(
  target: THREE.Object3D,
  material: THREE.Material,
  rTop: number,
  rBottom: number,
  h: number,
  x: number,
  y: number,
  z: number,
  name: string,
  rotation: { x?: number; y?: number; z?: number } = {},
): THREE.Mesh {
  return mesh(target, new THREE.CylinderGeometry(rTop, rBottom, h, 16), material, x, y, z, name, rotation);
}

function sphere(
  target: THREE.Object3D,
  material: THREE.Material,
  r: number,
  x: number,
  y: number,
  z: number,
  name: string,
  scaleY = 1,
): THREE.Mesh {
  const s = mesh(target, new THREE.SphereGeometry(r, 16, 12), material, x, y, z, name);
  if (scaleY !== 1) s.scale.y = scaleY;
  return s;
}

// ---------------------------------------------------------------------------
// architecture
// ---------------------------------------------------------------------------

/**
 * Carbon-fibre trim band + programmable LED skirt strips (the smart-glass /
 * photopolymer / mycelium finishes are applied to the shell surface slots by
 * ./surfaces.ts).
 */
export function build2055Architecture(target: THREE.Object3D): void {
  const trim = M.trim();
  const led = ledTeal();
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const bandHeight = 1.15;
  const offset = 0.025;

  // Sleek carbon-fibre trim band around the room.
  box(target, trim, ROOM_WIDTH, 0.06, 0.03, 0, bandHeight, -halfD + offset, 'carbon-trim-back');
  box(target, trim, 0.03, 0.06, ROOM_DEPTH, -halfW + offset, bandHeight, 0, 'carbon-trim-left');
  box(target, trim, 0.03, 0.06, ROOM_DEPTH, halfW - offset, bandHeight, 0, 'carbon-trim-right');

  // Programmable LED skirt strips at the base of the walls.
  box(target, led, ROOM_WIDTH - 0.5, 0.05, 0.02, 0, 0.32, -halfD + 0.02, 'led-skirt-back');
  box(target, led, 0.02, 0.05, ROOM_DEPTH - 0.5, -halfW + 0.02, 0.32, 0, 'led-skirt-left');
  box(target, led, 0.02, 0.05, ROOM_DEPTH - 0.5, halfW - 0.02, 0.32, 0, 'led-skirt-right');

  // Embedded light veins crossing the photopolymer resin floor.
  box(target, led, 3.4, 0.006, 0.02, -2.2, 0.006, -3.6, 'floor-light-vein');
  box(target, led, 0.02, 0.006, 2.8, 1.2, 0.006, 0.6, 'floor-light-vein');
  box(target, led, 2.2, 0.006, 0.02, 3.6, 0.006, -4.0, 'floor-light-vein');
}

// ---------------------------------------------------------------------------
// furnitureDecor
// ---------------------------------------------------------------------------

/** A curved seamless pedestal table with a rounded top + LED edge ring. */
function buildSeamlessTable(target: THREE.Object3D, x: number, z: number): void {
  const group = new THREE.Group();
  group.name = 'seamless-table';
  // Flared seamless pedestal (covers the shell's neutral pedestal).
  cylinder(group, M.plastic(), 0.2, 0.32, 0.74, 0, 0.37, 0, 'table-pedestal');
  // Curved seamless top: a flattened sphere reads as a moulded surface.
  sphere(group, M.plastic(), 0.68, 0, 0.79, 0, 'table-top', 0.05);
  // Programmable LED edge ring.
  cylinder(group, ledTeal(), 0.665, 0.665, 0.012, 0, 0.81, 0, 'table-edge-led');
  group.position.set(x, 0, z);
  target.add(group);
}

/** A morphing-foam smart pod chair (flattened foam seat on a slim base). */
function buildPodChair(target: THREE.Object3D, x: number, z: number, rotationY = 0): void {
  const group = new THREE.Group();
  group.name = 'smart-pod';
  cylinder(group, M.trim(), 0.12, 0.16, 0.4, 0, 0.2, 0, 'pod-pedestal');
  sphere(group, M.fabric(), 0.3, 0, 0.47, 0, 'pod-seat', 0.5);
  cylinder(group, ledTeal(), 0.31, 0.31, 0.014, 0, 0.63, 0, 'pod-led');
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  target.add(group);
}

/** A counter-height smart pod stool. */
function buildCounterPod(target: THREE.Object3D, x: number, z: number): void {
  const group = new THREE.Group();
  group.name = 'counter-pod';
  cylinder(group, M.trim(), 0.12, 0.16, 0.62, 0, 0.31, 0, 'pod-pedestal');
  sphere(group, M.fabric(), 0.26, 0, 0.72, 0, 'pod-seat', 0.5);
  cylinder(group, ledTeal(), 0.27, 0.27, 0.014, 0, 0.85, 0, 'pod-led');
  group.position.set(x, 0, z);
  target.add(group);
}

/** A biophilic vertical garden wall (left wall, between the two posters). */
function buildVerticalGarden(target: THREE.Object3D): void {
  const group = new THREE.Group();
  group.name = 'vertical-garden';

  // Backing panel + water tray.
  box(group, M.trim(), 2.2, 2.4, 0.1, 0, 1.35, 0, 'garden-panel');
  box(group, M.trim(), 2.2, 0.08, 0.18, 0, 0.08, 0, 'garden-tray');

  // Planter cells with foliage puffs (3 columns × 5 rows).
  for (let row = 0; row < 5; row += 1) {
    for (let col = 0; col < 3; col += 1) {
      const cx = -0.7 + col * 0.7;
      const cy = 0.3 + row * 0.48;
      box(group, soil(), 0.62, 0.32, 0.14, cx, cy, 0.06, 'garden-cell');
      sphere(group, foliage(), 0.16, cx, cy + 0.04, 0.12, 'garden-foliage', 0.7);
      if ((row + col) % 2 === 0) {
        sphere(group, foliageLight(), 0.12, cx + 0.16, cy + 0.1, 0.13, 'garden-foliage', 0.6);
      }
    }
  }

  // Bioluminescent glow nodes among the plants.
  sphere(group, ledWarm(), 0.035, -0.9, 1.9, 0.15, 'garden-glow');
  sphere(group, ledTeal(), 0.03, 0.0, 1.55, 0.16, 'garden-glow');
  sphere(group, ledWarm(), 0.03, 0.85, 1.15, 0.15, 'garden-glow');

  // Hanging vine stems.
  cylinder(group, foliageLight(), 0.012, 0.008, 1.5, -1.0, 1.55, 0.18, 'garden-vine', { z: 0.18 });
  cylinder(group, foliageLight(), 0.01, 0.007, 1.2, 1.0, 1.45, 0.18, 'garden-vine', { z: -0.15 });

  // Mount on the left wall's interior face (between the two left posters).
  group.position.set(ROOM_BOUNDS.minX + 0.08, 0, 0);
  target.add(group);
}

/** A floating holographic accent above the centre table. */
function buildHoloAccent(target: THREE.Object3D): void {
  const group = new THREE.Group();
  group.name = 'holo-accent';
  // Projected glow disc beneath the core.
  cylinder(group, holoPanel('#46D9C2', 1.4), 0.3, 0.3, 0.012, 0, 1.1, 0, 'holo-glow-disc');
  // Emissive core + orbit ring.
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.09), holo());
  core.position.y = 1.35;
  core.name = 'holo-core';
  group.add(core);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 8, 24), holoCyan());
  ring.rotation.x = Math.PI / 2.2;
  ring.position.y = 1.3;
  ring.name = 'holo-orbit-ring';
  group.add(ring);
  // Floating data chips.
  sphere(group, holoCyan(), 0.02, 0.18, 1.45, 0.1, 'holo-chip');
  sphere(group, holoCyan(), 0.02, -0.15, 1.22, -0.08, 'holo-chip');
  group.position.set(0, 0, 2.5);
  target.add(group);
}

/** Seamless tables, pod chairs/stools, vertical garden and holo accent. */
export function build2055FurnitureDecor(target: THREE.Object3D): void {
  // Curved seamless tables at every seating anchor, with pod chairs around.
  ANCHORS.seatingTables.forEach((pos, index) => {
    buildSeamlessTable(target, pos.x, pos.z);
    buildPodChair(target, pos.x - 0.8, pos.z + 0.35, 0.6);
    buildPodChair(target, pos.x + 0.8, pos.z - 0.25, -0.6);
    if (index === 1) {
      buildPodChair(target, pos.x + 0.4, pos.z + 1.0, 0.1);
    }
  });

  // Smart pod stools along the counter (clear of the kiosk / pour-over).
  const stoolX = ANCHORS.counter.position.x - 0.85;
  for (const sz of [-2.4, -0.6, 1.2]) {
    buildCounterPod(target, stoolX, sz);
  }

  buildVerticalGarden(target);
  buildHoloAccent(target);
}

// ---------------------------------------------------------------------------
// coffeeMachines
// ---------------------------------------------------------------------------

/** Robotic bean-to-cup arm rooted at the counter top (y = 0). */
function buildRoboBarista(group: THREE.Group): void {
  const metal = M.metal();
  const chrome = M.chrome();
  const glass = M.glass();
  const led = ledTeal();

  // Rotating base pod with a status ring.
  cylinder(group, metal, 0.22, 0.26, 0.16, 0, 0.08, 0, 'robo-base');
  cylinder(group, led, 0.225, 0.225, 0.02, 0, 0.165, 0, 'robo-status-ring');
  // Vertical column + shoulder joint.
  cylinder(group, metal, 0.09, 0.11, 0.5, 0, 0.41, 0, 'robo-column');
  sphere(group, chrome, 0.12, 0, 0.68, 0, 'robo-shoulder');
  // Articulated upper arm angled out over the cup zone.
  cylinder(group, chrome, 0.05, 0.05, 0.5, 0.2, 0.78, 0, 'robo-upper-arm', { z: -0.9 });
  sphere(group, chrome, 0.07, 0.42, 0.55, 0, 'robo-elbow');
  // Forearm + end-effector nozzle.
  cylinder(group, chrome, 0.04, 0.04, 0.42, 0.62, 0.45, 0, 'robo-forearm', { z: 0.7 });
  cylinder(group, metal, 0.03, 0.05, 0.12, 0.78, 0.3, 0, 'robo-nozzle');
  // Bean hopper on the column top.
  sphere(group, glass, 0.09, 0, 0.93, 0, 'robo-hopper', 0.7);
  cylinder(group, chrome, 0.02, 0.02, 0.06, 0, 0.99, 0, 'robo-hopper-lid');
  // Grinder drum on the side.
  cylinder(group, metal, 0.08, 0.08, 0.14, -0.16, 0.55, 0.12, 'robo-grinder', { x: Math.PI / 2 });
  // Drip tray at the front base.
  box(group, metal, 0.34, 0.02, 0.26, 0.5, 0.012, 0, 'robo-drip-tray');
  // Status LEDs on the column.
  sphere(group, led, 0.018, 0.05, 0.66, 0.09, 'robo-led');
  sphere(group, ledWarm(), 0.018, 0.05, 0.74, 0.09, 'robo-led');
}

/** Automated pour-over rig rooted at the counter top (y = 0). */
function buildAutoPourOver(group: THREE.Group): void {
  const metal = M.metal();
  const chrome = M.chrome();
  const ceramic = M.ceramic();
  const glass = M.glass();

  // Base plate + stand column + arm.
  box(group, metal, 0.42, 0.02, 0.32, 0, 0.01, 0, 'pour-base');
  cylinder(group, metal, 0.03, 0.04, 0.5, 0, 0.26, 0, 'pour-column');
  box(group, metal, 0.3, 0.03, 0.03, 0.13, 0.51, 0, 'pour-arm');
  // Gooseneck spout angled over the brew vessel.
  cylinder(group, chrome, 0.015, 0.015, 0.2, 0.26, 0.42, 0, 'pour-gooseneck', { z: 0.6 });
  // Brew vessel + dripper on the scale plate.
  cylinder(group, ceramic, 0.09, 0.07, 0.13, -0.02, 0.09, 0, 'pour-vessel');
  cylinder(group, ceramic, 0.1, 0.07, 0.09, -0.02, 0.2, 0, 'pour-dripper');
  // Water reservoir with an emissive level indicator.
  cylinder(group, glass, 0.07, 0.07, 0.24, 0.1, 0.32, -0.09, 'pour-reservoir');
  cylinder(group, ledWarm(), 0.071, 0.071, 0.02, 0.1, 0.2, -0.09, 'pour-level');
  // Heater pad under the vessel.
  cylinder(group, ledTeal(), 0.05, 0.05, 0.02, -0.02, 0.022, 0, 'pour-heater');
}

/** Robotic bean-to-cup arm on the machine slot + automated pour-over rig. */
export function build2055CoffeeMachines(target: THREE.Object3D): void {
  const robo = new THREE.Group();
  robo.name = 'robo-barista';
  buildRoboBarista(robo);
  robo.position.copy(ANCHORS.machineSlot);
  target.add(robo);

  const pourOver = new THREE.Group();
  pourOver.name = 'auto-pour-over';
  buildAutoPourOver(pourOver);
  pourOver.position.set(ANCHORS.counter.position.x - 0.05, 1.08, -2.0);
  target.add(pourOver);
}

// ---------------------------------------------------------------------------
// menuBoard
// ---------------------------------------------------------------------------

/** Holographic/AR menu panel with the era's speculative 2055 prices. */
export function build2055MenuBoard(target: THREE.Object3D): void {
  const trim = M.trim();
  const holoFace = materialFromSpec({
    kind: 'letterboard',
    color: '#0A1820',
    texture: {
      kind: 'letterboard',
      color: '#0A1820',
      color2: '#63E6FF',
      size: 512,
      lines: era2055.menuBoard.items.map((item) => `${item.name.toUpperCase()} ${item.price}`),
    },
    emissive: '#0E3A46',
    emissiveIntensity: 0.7,
    roughness: 0.25,
    clearcoat: 0.6,
  });

  const board = new THREE.Group();
  board.name = 'holo-menu';

  // Recessed emitter rail behind the panel.
  box(board, trim, 1.9, 1.25, 0.06, 0, 0, 0, 'holo-menu-rail');
  // The glowing AR menu face.
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.05), holoFace);
  face.position.set(0, 0, 0.034);
  face.name = 'holo-menu-face';
  board.add(face);
  // Programmable LED border bars.
  box(board, ledTeal(), 1.82, 0.03, 0.02, 0, 0.56, 0.035, 'holo-menu-border');
  box(board, ledTeal(), 1.82, 0.03, 0.02, 0, -0.56, 0.035, 'holo-menu-border');
  box(board, ledTeal(), 0.03, 1.12, 0.02, 0.9, 0, 0.035, 'holo-menu-border');
  box(board, ledTeal(), 0.03, 1.12, 0.02, -0.9, 0, 0.035, 'holo-menu-border');
  // Floating AR chips around the panel.
  sphere(board, holoCyan(), 0.022, 1.0, 0.62, 0.06, 'holo-menu-chip');
  sphere(board, holoCyan(), 0.022, -1.0, -0.62, 0.06, 'holo-menu-chip');

  board.position.copy(ANCHORS.menuBoardWall.position);
  board.position.z += 0.03;
  target.add(board);
}

// ---------------------------------------------------------------------------
// musicSource
// ---------------------------------------------------------------------------

/** Ambient smart device + holographic emitter object, rooted at its base. */
function buildAmbientDevice(
  target: THREE.Object3D,
  x: number,
  y: number,
  z: number,
): void {
  const group = new THREE.Group();
  group.name = 'ambient-device';
  // Puck body with a control ring.
  cylinder(group, M.plastic(), 0.14, 0.16, 0.05, 0, 0.025, 0, 'device-puck');
  cylinder(group, ledTeal(), 0.145, 0.145, 0.012, 0, 0.055, 0, 'device-control-ring');
  // The phone/ambient slab on top.
  box(group, materialFromSpec({ color: '#0E1418', roughness: 0.2, metalness: 0.4 }), 0.16, 0.24, 0.008, 0, 0.18, 0, 'device-slab', { x: -0.18 });

  // Holographic emitter object floating above the device: base ring + core +
  // data chips (the spatial-audio emitter character).
  const emitter = new THREE.Group();
  emitter.name = 'holo-emitter';
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.008, 8, 24), holoCyan());
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.5;
  ring.name = 'emitter-ring';
  emitter.add(ring);
  const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.055), holo());
  core.position.y = 0.58;
  core.name = 'emitter-core';
  emitter.add(core);
  sphere(emitter, holoCyan(), 0.016, 0.1, 0.66, 0.08, 'emitter-chip');
  sphere(emitter, holoCyan(), 0.016, -0.09, 0.5, -0.07, 'emitter-chip');
  group.add(emitter);

  group.position.set(x, y, z);
  target.add(group);
}

/** Ambient devices with spatial audio + holographic emitters on counter/table. */
export function build2055MusicSource(target: THREE.Object3D): void {
  buildAmbientDevice(target, ANCHORS.counter.position.x - 0.35, 1.08, 0.9);
  buildAmbientDevice(target, 3.2, 0.79, 1.8);
}

// ---------------------------------------------------------------------------
// posters
// ---------------------------------------------------------------------------

/** Holographic/animated advertisements on the poster walls. */
export function build2055Posters(target: THREE.Object3D): void {
  const trim = M.trim();
  const adColors: Array<{ color: string; accent: string }> = [
    { color: '#0E2A33', accent: '#46D9C2' },
    { color: '#1A1230', accent: '#63E6FF' },
    { color: '#0B2B22', accent: '#41F2C8' },
    { color: '#2A0E24', accent: '#9BF0C0' },
    { color: '#10222E', accent: '#46D9C2' },
  ];

  ANCHORS.posterWalls.forEach((anchor, index) => {
    const def = adColors[index % adColors.length];
    const title = era2055.posters[index % era2055.posters.length]?.title ?? 'AD 2055';
    const ad = PropPrimitives.frame({
      width: 0.52,
      height: 0.72,
      rail: 0.03,
      depth: 0.04,
      material: trim,
      panelMaterial: materialFromSpec({
        kind: 'poster',
        color: def.color,
        texture: {
          kind: 'poster',
          color: def.color,
          color2: def.accent,
          size: 256,
          title,
        },
        emissive: def.accent,
        emissiveIntensity: 0.9,
        roughness: 0.3,
      }),
    });
    ad.name = `holo-ad-${index + 1}`;
    // Animated-ad accents: floating corner chips.
    sphere(ad, holoCyan(), 0.016, 0.2, 0.32, 0.03, 'holo-ad-chip');
    sphere(ad, holoCyan(), 0.016, -0.2, -0.32, 0.03, 'holo-ad-chip');
    ad.position.copy(anchor.position);
    ad.position.add(anchor.normal.clone().multiplyScalar(0.03));
    if (anchor.wall === 'left') ad.rotation.y = Math.PI / 2;
    else if (anchor.wall === 'right') ad.rotation.y = -Math.PI / 2;
    else ad.rotation.y = 0;
    target.add(ad);
  });
}

// ---------------------------------------------------------------------------
// tableware
// ---------------------------------------------------------------------------

/** A self-heating smart vessel (tall cup + emissive heating band). */
function buildSmartVessel(target: THREE.Object3D, x: number, y: number, z: number): void {
  const group = new THREE.Group();
  group.name = 'smart-vessel';
  cylinder(group, M.ceramic(), 0.05, 0.045, 0.14, 0, 0.07, 0, 'vessel-body');
  cylinder(group, ledWarm(), 0.052, 0.052, 0.02, 0, 0.03, 0, 'vessel-heat-band');
  cylinder(group, M.metal(), 0.032, 0.03, 0.012, 0, 0.138, 0, 'vessel-lid');
  group.position.set(x, y, z);
  target.add(group);
}

/** A reusable smart cup (graphene body + emissive self-heating ring). */
function buildSmartCup(target: THREE.Object3D, x: number, y: number, z: number, name: string): void {
  const cup = PropPrimitives.cup({
    height: 0.1,
    radius: 0.045,
    baseRadius: 0.035,
    material: M.ceramic(),
  });
  cup.name = name;
  const ring = new THREE.Mesh(
    new THREE.CylinderGeometry(0.047, 0.047, 0.012, 16),
    ledTeal(),
  );
  ring.position.y = 0.088;
  ring.name = 'smart-cup-heat-ring';
  cup.add(ring);
  cup.position.set(x, y, z);
  target.add(cup);
}

/** Self-heating smart vessels + reusable smart cups on tables/counter. */
export function build2055Tableware(target: THREE.Object3D): void {
  const tableTopY = 0.79;
  ANCHORS.seatingTables.forEach((pos, index) => {
    buildSmartCup(target, pos.x + 0.2, tableTopY, pos.z - 0.12, `smart-cup-${index + 1}`);
    buildSmartVessel(target, pos.x - 0.18, tableTopY, pos.z + 0.14);
  });

  // Reusable smart cups on the counter with a charging dock.
  const counterTopY = 1.08;
  for (let i = 0; i < 3; i += 1) {
    buildSmartCup(target, ANCHORS.counter.position.x - 0.25, counterTopY, -3.7 + i * 0.5, `counter-smart-cup-${i + 1}`);
  }
  const dock = new THREE.Group();
  dock.name = 'cup-charging-dock';
  cylinder(dock, M.trim(), 0.14, 0.16, 0.02, 0, 0.01, 0, 'dock-base');
  cylinder(dock, ledWarm(), 0.13, 0.13, 0.008, 0, 0.024, 0, 'dock-ring');
  dock.position.set(ANCHORS.counter.position.x - 0.25, counterTopY, -2.2);
  target.add(dock);
}

// ---------------------------------------------------------------------------
// signageLighting
// ---------------------------------------------------------------------------

/** Holographic "BREW//2055" signage above the door + programmable LED strips. */
export function build2055SignageLighting(target: THREE.Object3D): void {
  const trim = M.trim();
  const signFace = materialFromSpec({
    kind: 'letterboard',
    color: '#0A1820',
    texture: {
      kind: 'letterboard',
      color: '#0A1820',
      color2: '#63E6FF',
      size: 512,
      lines: ['BREW//2055'],
    },
    emissive: '#0E3A46',
    emissiveIntensity: 0.8,
    roughness: 0.2,
  });

  // Holographic floating sign above the door (storefront wall, faces in).
  const sign = new THREE.Group();
  sign.name = 'holo-sign';
  box(sign, trim, 1.7, 0.5, 0.08, 0, 0, 0, 'holo-sign-backing');
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 0.36), signFace);
  face.position.set(0, 0, 0.045);
  face.name = 'holo-sign-face';
  sign.add(face);
  box(sign, ledTeal(), 1.62, 0.025, 0.02, 0, 0.21, 0.045, 'holo-sign-border');
  box(sign, ledTeal(), 1.62, 0.025, 0.02, 0, -0.21, 0.045, 'holo-sign-border');
  sphere(sign, holoCyan(), 0.022, 0.86, 0.26, 0.07, 'holo-sign-chip');
  sphere(sign, holoCyan(), 0.022, -0.86, -0.26, 0.07, 'holo-sign-chip');
  sign.position.set(ANCHORS.entrance.position.x, 2.85, ROOM_BOUNDS.maxZ - 0.06);
  sign.rotation.y = Math.PI;
  target.add(sign);

  // Dynamic programmable LED ceiling strips at the lighting anchors.
  ANCHORS.lighting.forEach((point, index) => {
    const strip = new THREE.Group();
    strip.name = `led-strip-${index + 1}`;
    const length = index === 3 ? 1.8 : 2.6;
    box(strip, trim, length, 0.05, 0.12, 0, -0.03, 0, 'led-strip-housing');
    box(strip, ledTeal(), length - 0.2, 0.02, 0.06, 0, -0.065, 0, 'led-strip-glow');
    strip.position.set(point.x, ROOM_HEIGHT - 0.06, point.z);
    target.add(strip);
  });

  // Bioluminescent ceiling nodes (clusters of glowing nodes + stems).
  const nodeCluster = (cx: number, cz: number, count: number): void => {
    const cluster = new THREE.Group();
    cluster.name = 'bio-nodes';
    for (let i = 0; i < count; i += 1) {
      const nx = cx + (i % 2 === 0 ? -0.15 : 0.18);
      const nz = cz + (i % 3 === 0 ? 0.2 : -0.12);
      cylinder(cluster, M.trim(), 0.006, 0.006, 0.26, nx, -0.13, nz, 'node-stem');
      sphere(cluster, i % 2 === 0 ? ledWarm() : ledTeal(), 0.035, nx, -0.02, nz, 'bio-node');
    }
    cluster.position.set(cx, ROOM_HEIGHT - 0.04, cz);
    target.add(cluster);
  };
  nodeCluster(0, -1.0, 5);
  nodeCluster(-3.2, 2.0, 3);
  nodeCluster(2.2, 4.2, 2);
}

// ---------------------------------------------------------------------------
// counterTechnology
// ---------------------------------------------------------------------------

/** Fully autonomous order kiosk rooted at the counter top (y = 0). */
function buildAutoKiosk(group: THREE.Group): void {
  const metal = M.metal();
  const trim = M.trim();
  // Tall kiosk body.
  box(group, metal, 0.5, 0.62, 0.4, 0, 0.31, 0, 'kiosk-body');
  box(group, trim, 0.52, 0.04, 0.42, 0, 0.63, 0, 'kiosk-cap');
  // Order screen facing the customer side (-x, into the room).
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.42),
    materialFromSpec({
      kind: 'letterboard',
      color: '#04121A',
      texture: {
        kind: 'letterboard',
        color: '#04121A',
        color2: '#41F2C8',
        size: 256,
        lines: ['ORDER', 'READY'],
      },
      emissive: '#0E3A46',
      emissiveIntensity: 1.0,
      roughness: 0.2,
    }),
  );
  screen.position.set(-0.252, 0.36, 0);
  screen.rotation.y = -Math.PI / 2;
  screen.name = 'kiosk-screen';
  group.add(screen);
  // Collection drawer at the base.
  box(group, trim, 0.3, 0.07, 0.24, -0.05, 0.06, 0, 'kiosk-drawer');
  // Progress ring + status LEDs on the screen face.
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.008, 8, 20), holoCyan());
  ring.position.set(-0.252, 0.16, 0);
  ring.rotation.y = -Math.PI / 2;
  ring.name = 'kiosk-progress-ring';
  group.add(ring);
  sphere(group, ledWarm(), 0.018, 0.1, 0.55, 0.16, 'kiosk-led');
}

/** Biometric/contactless order terminal rooted at the counter top (y = 0). */
function buildOrderTerminal(group: THREE.Group): void {
  // Rounded base + angled screen + biometric pad.
  cylinder(group, M.plastic(), 0.12, 0.14, 0.06, 0, 0.03, 0, 'terminal-base');
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.16, 0.12),
    materialFromSpec({
      kind: 'letterboard',
      color: '#04121A',
      texture: {
        kind: 'letterboard',
        color: '#04121A',
        color2: '#63E6FF',
        size: 128,
        lines: ['PAY'],
      },
      emissive: '#0E3A46',
      emissiveIntensity: 1.0,
      roughness: 0.2,
    }),
  );
  screen.position.set(-0.1, 0.13, 0);
  screen.rotation.y = -Math.PI / 2;
  screen.rotation.x = 0.25;
  screen.name = 'terminal-screen';
  group.add(screen);
  // Biometric contactless pad.
  cylinder(group, ledTeal(), 0.045, 0.045, 0.012, -0.06, 0.075, 0, 'terminal-pad');
}

/** Drone delivery hatch on the right wall above the counter + a drone. */
function buildDroneHatch(target: THREE.Object3D): void {
  const hatch = new THREE.Group();
  hatch.name = 'drone-hatch';
  // Circular hatch housing mounted on the right wall (axis along +x).
  cylinder(hatch, M.metal(), 0.26, 0.26, 0.1, 0, 0, 0, 'hatch-housing', { z: Math.PI / 2 });
  cylinder(hatch, ledTeal(), 0.19, 0.19, 0.02, 0.02, 0, 0, 'hatch-ring', { z: Math.PI / 2 });
  const status = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), ledWarm());
  status.position.set(0.02, 0.26, 0.22);
  status.name = 'hatch-status';
  hatch.add(status);
  hatch.position.set(ROOM_BOUNDS.maxX - 0.06, 2.15, 1.5);
  target.add(hatch);

  // Delivery drone hovering beside the hatch.
  const drone = new THREE.Group();
  drone.name = 'delivery-drone';
  box(drone, M.plastic(), 0.14, 0.06, 0.14, 0, 0, 0, 'drone-body');
  box(drone, M.trim(), 0.02, 0.02, 0.4, 0, 0.02, 0, 'drone-arm');
  box(drone, M.trim(), 0.4, 0.02, 0.02, 0, 0.02, 0, 'drone-arm');
  for (const [dx, dz] of [
    [-0.2, -0.2],
    [0.2, -0.2],
    [-0.2, 0.2],
    [0.2, 0.2],
  ] as Array<[number, number]>) {
    cylinder(drone, M.glass(), 0.1, 0.1, 0.006, dx, 0.06, dz, 'drone-rotor');
  }
  box(drone, M.ceramic(), 0.06, 0.05, 0.06, 0, -0.05, 0, 'drone-payload');
  sphere(drone, ledTeal(), 0.012, 0, -0.035, 0, 'drone-light');
  drone.position.set(ROOM_BOUNDS.maxX - 0.55, 1.9, 1.95);
  drone.rotation.z = 0.08;
  drone.rotation.x = -0.05;
  target.add(drone);
}

/** Autonomous kiosk + biometric terminal + drone delivery hatch. */
export function build2055CounterTechnology(target: THREE.Object3D): void {
  const kiosk = new THREE.Group();
  kiosk.name = 'auto-kiosk';
  buildAutoKiosk(kiosk);
  kiosk.position.set(ANCHORS.counter.position.x - 0.05, 1.08, -3.2);
  target.add(kiosk);

  const terminal = new THREE.Group();
  terminal.name = 'order-terminal';
  buildOrderTerminal(terminal);
  terminal.position.set(ANCHORS.counter.position.x - 0.05, 1.08, -1.2);
  target.add(terminal);

  buildDroneHatch(target);
}

// ---------------------------------------------------------------------------
// patrons
// ---------------------------------------------------------------------------

/** 2055 patron configs consumed by the shared CharacterAvatar system. */
const PATRON_CONFIGS_2055: PatronConfig[] = [
  {
    name: 'poncho',
    skin: '#C88B5A',
    hair: { kind: 'braids', color: '#14181E' },
    shirt: '#3D4F5C',
    pants: '#1A1F26',
    shoes: '#14181E',
    style: 'poncho',
    accent: '#46D9C2',
    accessory: 'wristband',
  },
  {
    name: 'jumpsuit',
    skin: '#C88B5A',
    hair: { kind: 'buzz', color: '#14181E' },
    shirt: '#D6D9DC',
    pants: '#D6D9DC',
    shoes: '#14181E',
    style: 'jumpsuit',
    accent: '#63E6FF',
    accessory: 'glasses',
  },
  {
    name: 'holo-drinker',
    skin: '#C88B5A',
    hair: { kind: 'ponytail', color: '#3D4F5C' },
    shirt: '#1A1F26',
    pants: '#14181E',
    shoes: '#14181E',
    style: 'shirt-pants',
    accent: '#46D9C2',
    accessory: 'cup',
  },
];

/** Poncho, jumpsuit and holo-drinking 2055 patrons via the shared roster. */
export function build2055Patrons(target: THREE.Object3D): void {
  const roster = new CharacterRoster({
    parent: target,
    tables: ANCHORS.seatingTables,
    stools: counterStoolAnchors([-2.4, -0.6, 1.2]),
  });
  roster.mount(2055, PATRON_CONFIGS_2055);
  // The roster group is kept on the fragment so the shared animation driver
  // (updateCharacterAnimations) can find and update the mounted avatars.
}

// ---------------------------------------------------------------------------
// composition root
// ---------------------------------------------------------------------------

export interface CompositionResult {
  /** Root group with one child per fragment category (era-category naming). */
  group: THREE.Group;
  /** Surface materials created for the shell (null when no slots were given). */
  surfaces: EraSurfaceMaterials | null;
}

/**
 * Build the full 2055 composition. When `slots` is provided the shell surface
 * slots are also dressed (smart-glass walls, photopolymer resin floor,
 * mycelium ceiling). The era audio config is attached to the root's userData
 * so a future audio engine can read it from the mounted group.
 */
export function build2055Composition(
  group: THREE.Group = new THREE.Group(),
  slots?: SurfaceSlots,
): CompositionResult {
  const surfaces = slots ? populate2055Surfaces(slots) : null;

  const builders: Array<[string, (target: THREE.Object3D) => void]> = [
    ['architecture', build2055Architecture],
    ['furnitureDecor', build2055FurnitureDecor],
    ['coffeeMachines', build2055CoffeeMachines],
    ['menuBoard', build2055MenuBoard],
    ['musicSource', build2055MusicSource],
    ['posters', build2055Posters],
    ['tableware', build2055Tableware],
    ['signageLighting', build2055SignageLighting],
    ['counterTechnology', build2055CounterTechnology],
    ['patrons', build2055Patrons],
  ];
  for (const [category, builder] of builders) {
    const child = new THREE.Group();
    child.name = `2055-${category}`;
    builder(child);
    group.add(child);
  }

  group.userData.eraAudio = ERA_AUDIO_2055;
  return { group, surfaces };
}

/** The era audio config (spatial-audio bed, holo emitter, robotic brew). */
export { ERA_AUDIO_2055 };

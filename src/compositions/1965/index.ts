/**
 * 1965 — mid-century / beatnik café composition.
 *
 * This is the Phase 4 scene composition for the 1965 era. Every fragment
 * category required by the AssetRegistry is built from the shared procedural
 * asset library (src/assets) and mounted at the canonical layout anchors
 * (src/world/layout.ts), so the era mounts cleanly into the SceneManager:
 *
 *   - architecture      wood panelling + chrome dado rail overlays (the
 *                       geometric wallpaper / checkerboard tile / plaster
 *                       ceiling come from the shell surface slots, dressed by
 *                       ./surfaces.ts)
 *   - furnitureDecor    Formica booths with chrome trim, chrome-leg Formica
 *                       tables, vinyl stools at the counter
 *   - coffeeMachines    Faema E61-style espresso machine + electric drip urn
 *   - menuBoard         plastic changeable letter-board with 1965 prices
 *   - musicSource       tabletop mini-jukebox selectors
 *   - posters           mid-century modern + pop-art coffee ads
 *   - tableware         melamine diner mugs, glass creamers, sugar dispensers
 *   - signageLighting   glowing tube neon "COFFEE" + fluorescent ceiling tubes
 *   - counterTechnology early electric cash register
 *   - patrons           mod shift + beehive, bouffant dress + cigarette case,
 *                       slim suit + narrow tie, and sweater + transistor
 *                       radio sixties patrons
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
import { era1965 } from '../../data/eras/1965';
import type { PatronConfig } from '../../data/EraData';
import { ERA_AUDIO_1965 } from '../../audio/eras/1965';
import {
  CharacterRoster,
  counterStoolAnchors,
} from '../../world/characters';
import { populate1965Surfaces } from './surfaces';

/** Shared 1965 surface materials (factory-cached per kind). */
const M = {
  chrome: () => materialFactory.forEra(1965, 'chrome'),
  metal: () => materialFactory.forEra(1965, 'metal'),
  formica: () => materialFactory.forEra(1965, 'plastic'),
  vinyl: () => materialFactory.forEra(1965, 'leather'),
  melamine: () => materialFactory.forEra(1965, 'ceramic'),
  glass: () => materialFactory.forEra(1965, 'glass'),
  neon: () => materialFactory.forEra(1965, 'neon'),
};

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
 * Wood panelling below a chrome dado rail (the geometric wallpaper above is
 * applied to the shell wall slots by ./surfaces.ts).
 */
export function build1965Architecture(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const woodPanel = materialFactory.forEra(1965, 'woodPanel');
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const panelHeight = 1.15;
  const railHeight = 0.07;
  const offset = 0.025;

  // Wood panelling band on the back / left / right walls.
  box(target, woodPanel, ROOM_WIDTH, panelHeight, 0.02, 0, panelHeight / 2, -halfD + offset, 'wood-panelling-back');
  box(target, woodPanel, 0.02, panelHeight, ROOM_DEPTH, -halfW + offset, panelHeight / 2, 0, 'wood-panelling-left');
  box(target, woodPanel, 0.02, panelHeight, ROOM_DEPTH, halfW - offset, panelHeight / 2, 0, 'wood-panelling-right');

  // Chrome dado rail above the panelling.
  box(target, chrome, ROOM_WIDTH, railHeight, 0.03, 0, panelHeight + railHeight / 2, -halfD + offset + 0.005, 'chrome-dado-back');
  box(target, chrome, 0.03, railHeight, ROOM_DEPTH, -halfW + offset + 0.005, panelHeight + railHeight / 2, 0, 'chrome-dado-left');
  box(target, chrome, 0.03, railHeight, ROOM_DEPTH, halfW - offset - 0.005, panelHeight + railHeight / 2, 0, 'chrome-dado-right');
}

// ---------------------------------------------------------------------------
// furnitureDecor
// ---------------------------------------------------------------------------

/** A chrome-leg Formica table (top surface at `topY`). */
function buildChromeLegTable(
  target: THREE.Object3D,
  x: number,
  z: number,
  chrome: THREE.Material,
  formica: THREE.Material,
  radius = 0.66,
  topY = 0.775,
): void {
  const group = new THREE.Group();
  group.name = 'chrome-leg-table';
  // Formica top (covers the shell's neutral pedestal top).
  cylinder(group, formica, radius, radius, 0.03, 0, topY - 0.015, 0, 'formica-top');
  // Chrome trim ring around the top edge.
  cylinder(group, chrome, radius + 0.008, radius + 0.008, 0.038, 0, topY - 0.019, 0, 'formica-trim');
  // Four chrome legs.
  const legR = 0.022;
  for (const [lx, lz] of [
    [-0.5, -0.5],
    [0.5, -0.5],
    [-0.5, 0.5],
    [0.5, 0.5],
  ] as Array<[number, number]>) {
    cylinder(group, chrome, legR, legR, topY - 0.03, lx, (topY - 0.03) / 2, lz, 'chrome-leg');
  }
  group.position.set(x, 0, z);
  target.add(group);
}

/** One Formica booth: two vinyl benches facing a chrome-leg table. */
function buildBooth(
  target: THREE.Object3D,
  x: number,
  z: number,
  chrome: THREE.Material,
  formica: THREE.Material,
  vinyl: THREE.Material,
): void {
  const group = new THREE.Group();
  group.name = 'booth';
  const seatLength = 1.5;
  const seatDepth = 0.5;
  const seatY = 0.46;
  const backHeight = 0.55;

  // Back bench (against the wall side, at local z = -0.5).
  box(group, vinyl, seatLength, 0.08, seatDepth, 0, seatY, -0.5, 'booth-seat-back');
  box(group, chrome, seatLength, 0.03, 0.02, 0, seatY - 0.04, -0.28, 'booth-seat-trim');
  box(group, vinyl, seatLength, backHeight, 0.08, 0, seatY + backHeight / 2, -0.71, 'booth-backrest');

  // Front bench (facing the back bench, at local z = +0.9).
  box(group, vinyl, seatLength, 0.08, seatDepth, 0, seatY, 0.9, 'booth-seat-front');
  box(group, chrome, seatLength, 0.03, 0.02, 0, seatY - 0.04, 0.68, 'booth-seat-trim');
  box(group, vinyl, seatLength, backHeight, 0.08, 0, seatY + backHeight / 2, 1.11, 'booth-backrest');

  // Table between the benches.
  buildChromeLegTable(group, 0, 0.2, chrome, formica, 0.55, 0.775);

  group.position.set(x, 0, z);
  target.add(group);
}

/** A chrome pedestal stool with a round vinyl seat. */
function buildStool(
  target: THREE.Object3D,
  x: number,
  z: number,
  chrome: THREE.Material,
  vinyl: THREE.Material,
): void {
  const group = new THREE.Group();
  group.name = 'vinyl-stool';
  cylinder(group, chrome, 0.05, 0.07, 0.56, 0, 0.28, 0, 'stool-pedestal');
  cylinder(group, chrome, 0.16, 0.18, 0.03, 0, 0.03, 0, 'stool-base');
  cylinder(group, vinyl, 0.18, 0.16, 0.05, 0, 0.62, 0, 'stool-seat');
  cylinder(group, chrome, 0.185, 0.185, 0.02, 0, 0.625, 0, 'stool-seat-trim');
  group.position.set(x, 0, z);
  target.add(group);
}

/** Formica booths, chrome-leg tables and vinyl stools. */
export function build1965FurnitureDecor(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const formica = M.formica();
  const vinyl = M.vinyl();

  // Two Formica booths along the back wall.
  for (const bx of [-3.2, 3.2]) {
    buildBooth(target, bx, -4.6, chrome, formica, vinyl);
  }

  // Chrome-leg Formica tables at every seating anchor.
  for (const pos of ANCHORS.seatingTables) {
    buildChromeLegTable(target, pos.x, pos.z, chrome, formica);
  }

  // Vinyl stools along the counter.
  const stoolX = ANCHORS.counter.position.x - 0.85;
  for (const sz of [-3.0, -1.8, -0.6, 0.6]) {
    buildStool(target, stoolX, sz, chrome, vinyl);
  }
}

// ---------------------------------------------------------------------------
// coffeeMachines
// ---------------------------------------------------------------------------

/** Faema E61-style espresso machine rooted at the counter top (y = 0). */
function buildFaemaE61(group: THREE.Group, chrome: THREE.Material, metal: THREE.Material): void {
  // Chrome body.
  box(group, chrome, 0.55, 0.38, 0.45, 0, 0.21, 0, 'e61-body');
  // Boiler dome on the back.
  cylinder(group, chrome, 0.13, 0.13, 0.14, 0.12, 0.47, 0, 'e61-boiler');
  // Two group heads on the front (barista side, -x).
  sphere(group, chrome, 0.085, -0.15, 0.44, -0.17, 'e61-group-head');
  sphere(group, chrome, 0.085, -0.15, 0.44, 0.17, 'e61-group-head');
  // Portafilters.
  box(group, metal, 0.05, 0.04, 0.12, -0.21, 0.37, -0.17, 'e61-portafilter');
  box(group, metal, 0.05, 0.04, 0.12, -0.21, 0.37, 0.17, 'e61-portafilter');
  // Lever arm.
  cylinder(group, chrome, 0.012, 0.012, 0.24, -0.27, 0.52, 0, 'e61-lever', { z: -0.5 });
  // Steam wand.
  cylinder(group, chrome, 0.008, 0.008, 0.2, -0.25, 0.3, 0.2, 'e61-steam-wand', { x: 0.4 });
  // Drip tray at the front base.
  box(group, metal, 0.42, 0.02, 0.32, -0.24, 0.012, 0, 'e61-drip-tray');
}

/** The early electric drip urn rooted at the counter top (y = 0). */
function buildDripUrn(group: THREE.Group, chrome: THREE.Material, metal: THREE.Material): void {
  const glass = M.glass();
  const heater = materialFromSpec({ color: '#FF9A3C', emissive: '#FF7A1A', emissiveIntensity: 1.6, roughness: 0.4 });
  cylinder(group, chrome, 0.13, 0.1, 0.4, 0, 0.2, 0, 'urn-body');
  sphere(group, chrome, 0.07, 0, 0.42, 0, 'urn-lid', 0.7);
  cylinder(group, chrome, 0.02, 0.02, 0.08, -0.13, 0.16, 0, 'urn-spigot', { z: 0.9 });
  box(group, glass, 0.02, 0.24, 0.02, 0.1, 0.2, 0, 'urn-gauge');
  cylinder(group, heater, 0.05, 0.05, 0.04, 0, 0.02, 0, 'urn-heater');
  cylinder(group, metal, 0.16, 0.18, 0.03, 0, 0.015, 0, 'urn-base');
}

/** Faema E61-style espresso machine on the machine slot + electric drip urn. */
export function build1965CoffeeMachines(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const metal = M.metal();

  const machine = new THREE.Group();
  machine.name = 'faema-e61';
  buildFaemaE61(machine, chrome, metal);
  machine.position.copy(ANCHORS.machineSlot);
  target.add(machine);

  const urn = new THREE.Group();
  urn.name = 'drip-urn';
  buildDripUrn(urn, chrome, metal);
  urn.position.set(ANCHORS.counter.position.x - 0.05, 1.08, -1.2);
  target.add(urn);
}

// ---------------------------------------------------------------------------
// menuBoard
// ---------------------------------------------------------------------------

/** Plastic changeable letter-board with the era's 1965 prices. */
export function build1965MenuBoard(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const letterboard = materialFromSpec({
    kind: 'letterboard',
    color: '#1F2428',
    texture: {
      kind: 'letterboard',
      color: '#1F2428',
      color2: '#FFFFFF',
      size: 512,
      lines: era1965.menuBoard.items.map((item) => `${item.name.toUpperCase()} ${item.price}`),
    },
    roughness: 0.7,
    clearcoat: 0.3,
  });

  const board = new THREE.Group();
  board.name = 'letter-board';
  box(board, chrome, 1.7, 1.1, 0.05, 0, 0, 0, 'letter-board-frame');
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), letterboard);
  face.position.set(0, 0, 0.028);
  face.name = 'letter-board-face';
  board.add(face);
  // Slim chrome cap bars top and bottom (metal letter-board style).
  box(board, chrome, 1.74, 0.08, 0.06, 0, 0.53, 0, 'letter-board-cap');
  box(board, chrome, 1.74, 0.08, 0.06, 0, -0.53, 0, 'letter-board-cap');

  board.position.copy(ANCHORS.menuBoardWall.position);
  board.position.z += 0.03;
  target.add(board);
}

// ---------------------------------------------------------------------------
// musicSource
// ---------------------------------------------------------------------------

/** A tabletop mini-jukebox selector rooted at its base (y = 0). */
function buildMiniJukebox(
  target: THREE.Object3D,
  x: number,
  y: number,
  z: number,
  chrome: THREE.Material,
  plastic: THREE.Material,
  metal: THREE.Material,
): void {
  const glass = M.glass();
  const group = new THREE.Group();
  group.name = 'jukebox-selector';
  box(group, plastic, 0.3, 0.24, 0.2, 0, 0.12, 0, 'jukebox-body');
  box(group, chrome, 0.32, 0.03, 0.22, 0, 0.235, 0, 'jukebox-trim');
  // Record window (glass) on the front face.
  cylinder(group, glass, 0.06, 0.06, 0.012, -0.05, 0.18, 0.106, 'jukebox-window', { x: Math.PI / 2 });
  // Selection buttons.
  const buttonColors = [0xd94f3d, 0xf2a93b, 0x3b8f5f, 0x2f6fb2];
  for (let i = 0; i < buttonColors.length; i += 1) {
    const button = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.02, 10),
      new THREE.MeshStandardMaterial({ color: buttonColors[i], roughness: 0.4 }),
    );
    button.rotation.x = Math.PI / 2;
    button.position.set(-0.06 + i * 0.05, 0.07, 0.11);
    button.name = 'jukebox-button';
    button.castShadow = true;
    group.add(button);
  }
  // Coin slot.
  box(group, metal, 0.012, 0.03, 0.012, 0.1, 0.2, 0.106, 'jukebox-coin-slot');
  group.position.set(x, y, z);
  target.add(group);
}

/** Tabletop mini-jukebox selectors on the counter and a booth table. */
export function build1965MusicSource(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const plastic = M.formica();
  const metal = M.metal();
  buildMiniJukebox(target, ANCHORS.counter.position.x - 0.35, 1.08, 0.9, chrome, plastic, metal);
  buildMiniJukebox(target, -3.2, 0.775, -4.4, chrome, plastic, metal);
}

// ---------------------------------------------------------------------------
// posters
// ---------------------------------------------------------------------------

/** Mid-century modern + pop-art coffee ads on the poster walls. */
export function build1965Posters(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const posterColors: Array<{ color: string; accent: string }> = [
    { color: '#C94F3D', accent: '#F2D06B' },
    { color: '#2F6FB2', accent: '#EFE3B6' },
    { color: '#3B5E4A', accent: '#EFE3B6' },
    { color: '#E87A2F', accent: '#F4EFE6' },
    { color: '#D94F8F', accent: '#1F2428' },
  ];

  ANCHORS.posterWalls.forEach((anchor, index) => {
    const def = posterColors[index % posterColors.length];
    const title = era1965.posters[index % era1965.posters.length]?.title ?? 'Coffee';
    const poster = PropPrimitives.frame({
      width: 0.5,
      height: 0.7,
      rail: 0.035,
      material: chrome,
      panelMaterial: materialFromSpec({
        kind: 'poster',
        color: '#FFFFFF',
        texture: {
          kind: 'poster',
          color: def.color,
          color2: def.accent,
          size: 256,
          title,
        },
        roughness: 0.85,
      }),
    });
    poster.name = `poster-${index + 1}`;
    poster.position.copy(anchor.position);
    poster.position.add(anchor.normal.clone().multiplyScalar(0.03));
    if (anchor.wall === 'left') poster.rotation.y = Math.PI / 2;
    else if (anchor.wall === 'right') poster.rotation.y = -Math.PI / 2;
    else poster.rotation.y = 0;
    target.add(poster);
  });
}

// ---------------------------------------------------------------------------
// tableware
// ---------------------------------------------------------------------------

/** Melamine diner mugs, glass creamers and sugar dispensers on tables/counter. */
export function build1965Tableware(target: THREE.Object3D): void {
  const melamine = M.melamine();
  const glass = M.glass();
  const chrome = M.chrome();

  const tableTopY = 0.775;
  ANCHORS.seatingTables.forEach((pos, index) => {
    const mug = PropPrimitives.cup({
      height: 0.09,
      radius: 0.04,
      baseRadius: 0.03,
      handle: true,
      material: melamine,
    });
    mug.name = `melamine-mug-${index + 1}`;
    mug.position.set(pos.x + 0.18, tableTopY, pos.z - 0.1);
    target.add(mug);

    const creamer = PropPrimitives.cup({
      height: 0.06,
      radius: 0.028,
      baseRadius: 0.022,
      glass: true,
      material: glass,
    });
    creamer.name = `glass-creamer-${index + 1}`;
    creamer.position.set(pos.x - 0.1, tableTopY, pos.z + 0.12);
    target.add(creamer);

    if (index % 2 === 0) {
      const sugar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.09, 12), chrome);
      sugar.position.set(pos.x - 0.22, tableTopY + 0.045, pos.z - 0.08);
      sugar.name = `sugar-dispenser-${index + 1}`;
      sugar.castShadow = true;
      sugar.receiveShadow = true;
      target.add(sugar);
    }
  });

  // Mugs on the counter top.
  const counterTopY = 1.08;
  for (let i = 0; i < 3; i += 1) {
    const mug = PropPrimitives.cup({
      height: 0.09,
      radius: 0.04,
      baseRadius: 0.03,
      handle: true,
      material: melamine,
    });
    mug.name = `counter-mug-${i + 1}`;
    mug.position.set(ANCHORS.counter.position.x - 0.25, counterTopY, -3.4 + i * 0.5);
    target.add(mug);
  }

  // Creamers on the booth tables.
  for (const bx of [-3.2, 3.2]) {
    const creamer = PropPrimitives.cup({
      height: 0.06,
      radius: 0.028,
      baseRadius: 0.022,
      glass: true,
      material: glass,
    });
    creamer.name = 'booth-creamer';
    creamer.position.set(bx + 0.2, tableTopY, -4.4);
    target.add(creamer);
  }
}

// ---------------------------------------------------------------------------
// signageLighting
// ---------------------------------------------------------------------------

/** Glowing tube neon "COFFEE" above the door + fluorescent ceiling tubes. */
export function build1965SignageLighting(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const metal = M.metal();
  const neon = M.neon();
  const warmTube = materialFromSpec({
    color: '#FFF3D6',
    emissive: '#FFE9C4',
    emissiveIntensity: 2.0,
    roughness: 0.3,
  });

  // Glowing tube neon sign above the door (storefront wall, faces into room).
  const sign = new THREE.Group();
  sign.name = 'neon-sign';
  box(sign, metal, 1.3, 0.42, 0.08, 0, 0, 0, 'neon-backing');
  for (let i = 0; i < 3; i += 1) {
    cylinder(sign, neon, 0.02, 0.02, 0.4, -0.42 + i * 0.42, 0.06, 0.05, 'neon-tube', { z: Math.PI / 2 });
  }
  cylinder(sign, neon, 0.02, 0.02, 0.22, 0.44, -0.06, 0.05, 'neon-tube');
  cylinder(sign, chrome, 0.012, 0.012, 0.06, -0.66, -0.14, 0.05, 'neon-mount');
  cylinder(sign, chrome, 0.012, 0.012, 0.06, 0.66, -0.14, 0.05, 'neon-mount');
  sign.position.set(ANCHORS.entrance.position.x, 2.85, ROOM_BOUNDS.maxZ - 0.06);
  sign.rotation.y = Math.PI;
  target.add(sign);

  // Fluorescent ceiling tubes (long runs over the seating, short run over the
  // counter at the counter lighting anchor).
  const longZ = [-2.8, -0.4, 2.0];
  for (let i = 0; i < longZ.length; i += 1) {
    const tube = new THREE.Group();
    tube.name = `fluorescent-tube-${i + 1}`;
    box(tube, metal, 6.0, 0.06, 0.16, 0, -0.03, 0, 'tube-housing');
    box(tube, warmTube, 5.7, 0.045, 0.1, 0, -0.065, 0, 'tube-glow');
    box(tube, metal, 0.08, 0.05, 0.14, -2.96, -0.06, 0, 'tube-cap');
    box(tube, metal, 0.08, 0.05, 0.14, 2.96, -0.06, 0, 'tube-cap');
    tube.position.set(0, ROOM_HEIGHT - 0.06, longZ[i]);
    target.add(tube);
  }
  const counterTube = new THREE.Group();
  counterTube.name = 'fluorescent-tube-counter';
  box(counterTube, metal, 1.8, 0.06, 0.16, 0, -0.03, 0, 'tube-housing');
  box(counterTube, warmTube, 1.5, 0.045, 0.1, 0, -0.065, 0, 'tube-glow');
  box(counterTube, metal, 0.08, 0.05, 0.14, -0.86, -0.06, 0, 'tube-cap');
  box(counterTube, metal, 0.08, 0.05, 0.14, 0.86, -0.06, 0, 'tube-cap');
  counterTube.position.set(ANCHORS.lighting[3].x, ROOM_HEIGHT - 0.06, ANCHORS.lighting[3].z);
  target.add(counterTube);
}

// ---------------------------------------------------------------------------
// counterTechnology
// ---------------------------------------------------------------------------

/** Early electric cash register on the counter. */
export function build1965CounterTechnology(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const metal = M.metal();
  const darkGlass = materialFromSpec({ color: '#1F2428', roughness: 0.1, metalness: 0.3 });
  const receipt = materialFromSpec({ color: '#F4EFE6', roughness: 0.7 });

  const register = new THREE.Group();
  register.name = 'cash-register';
  // Body (front faces -x toward the barista).
  box(register, metal, 0.34, 0.2, 0.3, 0, 0.1, 0, 'register-body');
  box(register, chrome, 0.36, 0.03, 0.32, 0, 0.215, 0, 'register-top');
  // Angled display window on top.
  box(register, darkGlass, 0.16, 0.1, 0.03, 0.02, 0.29, -0.08, 'register-display', { x: -0.35 });
  // Electric keys on the front face.
  const keyColors = [0xd94f3d, 0xf2a93b, 0xd94f3d, 0x2f6fb2, 0xf2a93b];
  for (let i = 0; i < keyColors.length; i += 1) {
    const key = new THREE.Mesh(
      new THREE.CylinderGeometry(0.016, 0.016, 0.02, 10),
      new THREE.MeshStandardMaterial({ color: keyColors[i], roughness: 0.5 }),
    );
    key.rotation.z = Math.PI / 2;
    key.position.set(-0.18, 0.12, -0.08 + i * 0.06);
    key.name = 'register-key';
    key.castShadow = true;
    register.add(key);
  }
  // Crank handle on the side.
  cylinder(register, chrome, 0.015, 0.015, 0.12, 0.18, 0.16, 0, 'register-crank', { z: 0.6 });
  // Receipt roll on top.
  cylinder(register, receipt, 0.04, 0.04, 0.03, -0.08, 0.26, 0.12, 'register-receipt');

  register.position.set(ANCHORS.counter.position.x - 0.05, 1.08, -3.2);
  target.add(register);
}

// ---------------------------------------------------------------------------
// patrons
// ---------------------------------------------------------------------------

/** 1965 patron configs consumed by the shared CharacterAvatar system. */
const PATRON_CONFIGS_1965: PatronConfig[] = [
  {
    name: 'mod-woman',
    skin: '#C88B5A',
    hair: { kind: 'beehive', color: '#EFE3B6' },
    shirt: '#D94F8F',
    pants: '#EFE3B6',
    shoes: '#101010',
    style: 'dress',
    accessory: 'mirror',
  },
  {
    name: 'bouffant-lady',
    skin: '#C88B5A',
    hair: { kind: 'bouffant', color: '#2A1E14' },
    shirt: '#2F6B4F',
    pants: '#EFE3B6',
    shoes: '#101010',
    style: 'dress',
    accent: '#C9A227',
    accessory: 'case',
  },
  {
    name: 'slim-suit-man',
    skin: '#C88B5A',
    hair: { kind: 'short', color: '#1A1A1A' },
    shirt: '#EFE3B6',
    pants: '#3A322A',
    shoes: '#101010',
    style: 'shirt-pants',
    accent: '#8A1F2D',
    accessory: 'tie',
  },
  {
    name: 'sweater-man',
    skin: '#C88B5A',
    hair: { kind: 'short', color: '#2A1E14' },
    shirt: '#EFE3B6',
    pants: '#3A322A',
    shoes: '#101010',
    style: 'shirt-pants',
    accessory: 'radio',
  },
];

/** Beatnik, mod, and sweater-wearing sixties patrons via the shared roster. */
export function build1965Patrons(target: THREE.Object3D): void {
  const roster = new CharacterRoster({
    parent: target,
    tables: ANCHORS.seatingTables,
    stools: counterStoolAnchors(),
  });
  roster.mount(1965, PATRON_CONFIGS_1965);
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
 * Build the full 1965 composition. When `slots` is provided the shell surface
 * slots are also dressed (checkerboard floor, geometric wallpaper, plaster
 * ceiling). The era audio config is attached to the root's userData so a
 * future audio engine can read it from the mounted group.
 */
export function build1965Composition(
  group: THREE.Group = new THREE.Group(),
  slots?: SurfaceSlots,
): CompositionResult {
  const surfaces = slots ? populate1965Surfaces(slots) : null;

  const builders: Array<[string, (target: THREE.Object3D) => void]> = [
    ['architecture', build1965Architecture],
    ['furnitureDecor', build1965FurnitureDecor],
    ['coffeeMachines', build1965CoffeeMachines],
    ['menuBoard', build1965MenuBoard],
    ['musicSource', build1965MusicSource],
    ['posters', build1965Posters],
    ['tableware', build1965Tableware],
    ['signageLighting', build1965SignageLighting],
    ['counterTechnology', build1965CounterTechnology],
    ['patrons', build1965Patrons],
  ];
  for (const [category, builder] of builders) {
    const child = new THREE.Group();
    child.name = `1965-${category}`;
    builder(child);
    group.add(child);
  }

  group.userData.eraAudio = ERA_AUDIO_1965;
  return { group, surfaces };
}

/** The era audio config (motown/beat/folk generative bed, jukebox, urn hiss). */
export { ERA_AUDIO_1965 };

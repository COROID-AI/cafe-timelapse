/**
 * 2025 — modern third-wave / specialty café composition.
 *
 * This is the Phase 4 scene composition for the 2025 era. Every fragment
 * category required by the AssetRegistry is built from the shared procedural
 * asset library (src/assets) and mounted at the canonical layout anchors
 * (src/world/layout.ts), so the era mounts cleanly into the SceneManager:
 *
 *   - architecture      oak slat panelling overlays + oak reveals (the white
 *                       ceramic tile wall / polished concrete floor / matte
 *                       black exposed-services ceiling come from the shell
 *                       surface slots, dressed by ./surfaces.ts)
 *   - furnitureDecor    live-edge oak tables with tubular steel legs,
 *                       bouclé armchairs, hanging plants, magazine shelf
 *   - coffeeMachines    La Marzocco-style multi-group flat-white espresso
 *                       machine + V60 pour-over bar, knock box, barista scale
 *   - menuBoard         backlit digital menu screen with 2025 prices (~$4–6)
 *   - musicSource       smartphone + Bluetooth speaker (Sonos-style)
 *   - posters           minimalist typographic prints, local-roaster branding
 *   - tableware         artisan speckled stoneware, hand-blown glass tumblers,
 *                       compostable to-go cups
 *   - signageLighting   backlit "BREW" sign, warm LED strips, Edison pendant
 *                       bulb clusters
 *   - counterTechnology tablet POS + contactless/card reader + mobile-order
 *                       pick-up shelf
 *   - patrons           laptop-nomad third-wave patrons
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
import { era2025 } from '../../data/eras/2025';
import type { PatronConfig } from '../../data/EraData';
import { ERA_AUDIO_2025 } from '../../audio/eras/2025';
import {
  CharacterRoster,
  counterStoolAnchors,
} from '../../world/characters';
import { populate2025Surfaces } from './surfaces';

/** Shared 2025 surface materials (factory-cached per kind). */
const M = {
  chrome: () => materialFactory.forEra(2025, 'chrome'),
  metal: () => materialFactory.forEra(2025, 'metal'),
  oak: () => materialFactory.forEra(2025, 'wood'),
  oakPanel: () => materialFactory.forEra(2025, 'woodPanel'),
  boucle: () => materialFactory.forEra(2025, 'fabric'),
  stoneware: () => materialFactory.forEra(2025, 'ceramic'),
  glass: () => materialFactory.forEra(2025, 'glass'),
  neon: () => materialFactory.forEra(2025, 'neon'),
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
 * Oak slat panelling on the back wall around the menu board + oak window
 * reveals (the white ceramic tile / polished concrete / matte black ceiling
 * come from the shell surface slots, dressed by ./surfaces.ts).
 */
export function build2025Architecture(target: THREE.Object3D): void {
  const oak = M.oakPanel();
  const trim = materialFactory.forEra(2025, 'trim');
  const halfW = ROOM_WIDTH / 2;
  const halfD = ROOM_DEPTH / 2;
  const offset = 0.025;

  // Oak slat band behind the menu board on the back wall (height ~1.5m).
  const bandW = 2.3;
  const bandH = 1.5;
  const bandY = 2.3;
  for (let i = 0; i < 9; i += 1) {
    box(
      target,
      oak,
      0.09,
      bandH,
      0.02,
      -bandW / 2 + 0.05 + i * 0.26,
      bandY,
      -halfD + offset,
      `oak-slat-${i + 1}`,
    );
  }

  // Oak reveals framing the storefront door + windows (interior face).
  box(target, trim, 0.08, ROOM_HEIGHT, 0.08, -halfW + 0.1, ROOM_HEIGHT / 2, halfD - 0.02, 'oak-reveal-left');
  box(target, trim, 0.08, ROOM_HEIGHT, 0.08, halfW - 0.1, ROOM_HEIGHT / 2, halfD - 0.02, 'oak-reveal-right');
  box(target, trim, ROOM_WIDTH, 0.08, 0.08, 0, ROOM_HEIGHT - 0.3, halfD - 0.02, 'oak-reveal-top');

  // Minimal oak skirting along the side walls.
  for (const x of [-halfW + offset, halfW - offset]) {
    box(target, trim, 0.03, 0.12, ROOM_DEPTH, x, 0.06, 0, 'oak-skirting');
  }
}

// ---------------------------------------------------------------------------
// furnitureDecor
// ---------------------------------------------------------------------------

/** A live-edge oak table slab over the shell pedestal base (top at `topY`). */
function buildLiveEdgeTable(
  target: THREE.Object3D,
  x: number,
  z: number,
  oak: THREE.Material,
  steel: THREE.Material,
  topY = 0.775,
): void {
  const group = new THREE.Group();
  group.name = 'live-edge-oak-table';
  // Thick oak top with a rounded organic silhouette.
  cylinder(group, oak, 0.52, 0.5, 0.05, 0, topY - 0.025, 0, 'oak-top');
  // Tubular steel underframe legs (crossed pair for a modern scandi look).
  cylinder(group, steel, 0.022, 0.022, topY - 0.05, -0.2, (topY - 0.05) / 2, -0.2, 'steel-leg', { z: 0.5 });
  cylinder(group, steel, 0.022, 0.022, topY - 0.05, 0.2, (topY - 0.05) / 2, 0.2, 'steel-leg', { z: 0.5 });
  cylinder(group, steel, 0.022, 0.022, topY - 0.05, -0.2, (topY - 0.05) / 2, 0.2, 'steel-leg', { z: -0.5 });
  cylinder(group, steel, 0.022, 0.022, topY - 0.05, 0.2, (topY - 0.05) / 2, -0.2, 'steel-leg', { z: -0.5 });
  group.position.set(x, 0, z);
  target.add(group);
}

/** A plush bouclé armchair rooted at the floor. */
function buildBoucleArmchair(
  target: THREE.Object3D,
  x: number,
  z: number,
  boucle: THREE.Material,
  wood: THREE.Material,
  rotationY = 0,
): void {
  const group = new THREE.Group();
  group.name = 'boucle-armchair';
  box(group, wood, 0.72, 0.28, 0.68, 0, 0.14, 0, 'chair-frame');
  box(group, boucle, 0.7, 0.12, 0.66, 0, 0.34, 0, 'chair-seat');
  box(group, boucle, 0.7, 0.55, 0.14, 0, 0.68, -0.27, 'chair-back');
  for (const side of [-1, 1]) {
    box(group, boucle, 0.14, 0.28, 0.6, side * 0.29, 0.44, 0, 'chair-arm');
  }
  group.position.set(x, 0, z);
  group.rotation.y = rotationY;
  target.add(group);
}

/** A hanging pothos/monstera plant in a concrete pot (suspended from a hook). */
function buildHangingPlant(
  target: THREE.Object3D,
  x: number,
  z: number,
  y: number,
  concrete: THREE.Material,
  foliage: THREE.Material,
): void {
  const group = new THREE.Group();
  group.name = 'hanging-plant';
  cylinder(group, concrete, 0.07, 0.05, 0.1, 0, 0.05, 0, 'plant-pot');
  sphere(group, foliage, 0.1, 0, 0.13, 0, 'plant-foliage', 0.8);
  // Trailing vine strands.
  for (let i = 0; i < 4; i += 1) {
    const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.5, 6), foliage);
    strand.position.set(-0.06 + i * 0.04, -0.22, 0);
    strand.rotation.x = 0.25;
    strand.name = 'plant-vine';
    group.add(strand);
  }
  group.position.set(x, y, z);
  target.add(group);
}

/** A slim magazine/vinyl shelf on the back wall. */
function buildMagazineShelf(target: THREE.Object3D, x: number, z: number, y: number): void {
  const oak = M.oak();
  const shelf = new THREE.Group();
  shelf.name = 'magazine-shelf';
  box(shelf, oak, 1.1, 0.03, 0.25, 0, 0, 0, 'shelf-board');
  for (const side of [-1, 1]) {
    box(shelf, oak, 0.03, 0.3, 0.25, side * 0.55, -0.15, 0, 'shelf-bracket');
  }
  const covers = ['#E4DCC8', '#B98A54', '#9A958C', '#1C1C1E', '#A97B48'];
  for (let i = 0; i < covers.length; i += 1) {
    box(
      shelf,
      materialFromSpec({ kind: 'plastic', color: covers[i], roughness: 0.6 }),
      0.09,
      0.14,
      0.02,
      -0.4 + i * 0.2,
      0.09,
      0.1,
      'magazine',
    );
  }
  shelf.position.set(x, y, z);
  target.add(shelf);
}

/** Live-edge oak tables, bouclé armchairs, hanging plants, magazine shelf. */
export function build2025FurnitureDecor(target: THREE.Object3D): void {
  const oak = M.oak();
  const steel = materialFromSpec({
    kind: 'metal',
    color: '#1C1C1E',
    roughness: 0.3,
    metalness: 0.9,
  });
  const boucle = M.boucle();
  const concrete = materialFromSpec({
    kind: 'plastic',
    color: '#8F8B82',
    roughness: 0.9,
  });
  const foliage = materialFromSpec({
    kind: 'plastic',
    color: '#4A6B3A',
    roughness: 0.85,
  });

  // Live-edge oak tables at every seating anchor.
  for (const pos of ANCHORS.seatingTables) {
    buildLiveEdgeTable(target, pos.x, pos.z, oak, steel);
  }

  // Bouclé lounge armchairs near the west seating cluster.
  buildBoucleArmchair(target, -4.6, 0.9, boucle, oak, 0.4);
  buildBoucleArmchair(target, -5.1, 1.8, boucle, oak, -0.5);

  // Hanging plants along the storefront wall and over the counter.
  buildHangingPlant(target, -2.2, 4.8, ROOM_HEIGHT - 0.5, concrete, foliage);
  buildHangingPlant(target, 0.4, 4.9, ROOM_HEIGHT - 0.5, concrete, foliage);
  buildHangingPlant(target, 2.4, 4.8, ROOM_HEIGHT - 0.5, concrete, foliage);
  buildHangingPlant(target, ANCHORS.counter.position.x - 0.5, -2.6, ROOM_HEIGHT - 0.4, concrete, foliage);

  // Magazine/vinyl shelf on the back wall.
  buildMagazineShelf(target, -4.2, ROOM_BOUNDS.minZ + 0.05, 1.4);
}

// ---------------------------------------------------------------------------
// coffeeMachines
// ---------------------------------------------------------------------------

/** La Marzocco-style multi-group flat-white espresso machine (counter-top rooted). */
function buildFlatWhiteMachine(group: THREE.Group, chrome: THREE.Material, metal: THREE.Material): void {
  // Body.
  box(group, chrome, 0.7, 0.32, 0.48, 0, 0.18, 0, 'linea-body');
  // Two group heads on the front (barista side, -x).
  sphere(group, chrome, 0.09, -0.16, 0.4, -0.14, 'linea-group-head');
  sphere(group, chrome, 0.09, -0.16, 0.4, 0.14, 'linea-group-head');
  // Portafilters.
  box(group, metal, 0.06, 0.04, 0.12, -0.22, 0.32, -0.14, 'linea-portafilter');
  box(group, metal, 0.06, 0.04, 0.12, -0.22, 0.32, 0.14, 'linea-portafilter');
  // Steam wand.
  cylinder(group, chrome, 0.008, 0.008, 0.24, -0.3, 0.26, 0.2, 'linea-steam-wand', { x: 0.4 });
  // Drip tray at the front base.
  box(group, metal, 0.6, 0.02, 0.32, -0.26, 0.012, 0, 'linea-drip-tray');
  // Backlit brand panel on the front face.
  box(
    group,
    materialFromSpec({ kind: 'neon', color: '#1C1C1E', emissive: '#FFD9A0', emissiveIntensity: 1.6 }),
    0.3,
    0.03,
    0.01,
    -0.22,
    0.3,
    0.245,
    'linea-brand-panel',
  );
}

/** A V60 pour-over bar: kettle, dripper, scale and brew carafe. */
function buildPourOverBar(group: THREE.Group, metal: THREE.Material, glass: THREE.Material): void {
  // The counter itself is the shell; we add the bar kit on top.
  cylinder(group, metal, 0.07, 0.05, 0.12, -0.2, 0.06, 0.1, 'gooseneck-kettle');
  cylinder(group, glass, 0.05, 0.05, 0.1, 0.1, 0.05, -0.05, 'brew-carafe');
  // V60 dripper: a wide cone.
  const dripper = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.02, 0.08, 16, 1, true), glass);
  dripper.position.set(0.1, 0.09, 0.1);
  dripper.name = 'v60-dripper';
  group.add(dripper);
  // Scale under the dripper.
  box(group, metal, 0.12, 0.015, 0.12, 0.1, 0.008, 0.1, 'barista-scale');
  // Knock box beside the bar.
  box(group, metal, 0.12, 0.1, 0.1, 0.32, 0.05, 0.05, 'knock-box');
}

/** Multi-group flat-white espresso machine + V60 pour-over bar on the counter. */
export function build2025CoffeeMachines(target: THREE.Object3D): void {
  const chrome = M.chrome();
  const metal = M.metal();
  const glass = M.glass();

  const machine = new THREE.Group();
  machine.name = 'flat-white-espresso-machine';
  buildFlatWhiteMachine(machine, chrome, metal);
  machine.position.copy(ANCHORS.machineSlot);
  target.add(machine);

  const pourOver = new THREE.Group();
  pourOver.name = 'v60-pour-over-bar';
  buildPourOverBar(pourOver, metal, glass);
  pourOver.position.set(ANCHORS.counter.position.x - 0.05, 1.08, -1.4);
  target.add(pourOver);
}

// ---------------------------------------------------------------------------
// menuBoard
// ---------------------------------------------------------------------------

/** Backlit digital menu screen with 2025 prices (~$4–6). */
export function build2025MenuBoard(target: THREE.Object3D): void {
  const dark = materialFromSpec({
    kind: 'plastic',
    color: '#1C1C1E',
    roughness: 0.35,
    metalness: 0.4,
  });
  const screen = materialFromSpec({
    kind: 'neon',
    color: '#0B0E14',
    emissive: '#FFE3B8',
    emissiveIntensity: 1.4,
    roughness: 0.35,
    texture: {
      kind: 'digitalMenu',
      color: '#0B0E14',
      color2: '#FFE3B8',
      size: 512,
      title: era2025.menuBoard.title,
      lines: era2025.menuBoard.items.map((item) => `${item.name.toUpperCase()} ${item.price}`),
    },
  });

  const board = new THREE.Group();
  board.name = 'digital-menu-screen';
  // Slim bezel + screen face.
  box(board, dark, 1.7, 1.0, 0.05, 0, 0, 0, 'menu-bezel');
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), screen);
  face.position.set(0, 0, 0.028);
  face.name = 'menu-screen-face';
  board.add(face);
  // Backlit glow bar along the bottom edge.
  box(
    board,
    materialFromSpec({ kind: 'neon', color: '#FFD9A0', emissive: '#FFD9A0', emissiveIntensity: 2.2 }),
    1.7,
    0.03,
    0.02,
    0,
    -0.5,
    0.032,
    'menu-backlight',
  );

  board.position.copy(ANCHORS.menuBoardWall.position);
  board.position.z += 0.03;
  target.add(board);
}

// ---------------------------------------------------------------------------
// musicSource
// ---------------------------------------------------------------------------

/** Smartphone + Bluetooth speaker (Sonos-style) on the counter. */
export function build2025MusicSource(target: THREE.Object3D): void {
  const charcoal = materialFromSpec({
    kind: 'plastic',
    color: '#3A3A3E',
    roughness: 0.55,
    clearcoat: 0.3,
  });
  const grille = materialFromSpec({
    kind: 'fabric',
    color: '#2E2E32',
    roughness: 0.95,
  });
  const screenGlow = materialFromSpec({
    kind: 'neon',
    color: '#0B0E14',
    emissive: '#8FD0FF',
    emissiveIntensity: 1.5,
  });

  const group = new THREE.Group();
  group.name = 'bluetooth-speaker';
  // Sonos-style fabric-covered speaker body.
  cylinder(group, grille, 0.11, 0.11, 0.2, 0, 0.1, 0, 'speaker-body');
  cylinder(group, charcoal, 0.115, 0.115, 0.015, 0, 0.2, 0, 'speaker-top');
  // Top control dial.
  cylinder(group, charcoal, 0.03, 0.03, 0.008, 0, 0.21, 0, 'speaker-dial');

  // Smartphone propped next to it.
  const phone = new THREE.Group();
  phone.name = 'smartphone';
  box(phone, materialFromSpec({ kind: 'plastic', color: '#111214', roughness: 0.4, metalness: 0.7 }), 0.06, 0.12, 0.008, 0, 0.06, 0, 'phone-body');
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.052, 0.1), screenGlow);
  phoneScreen.position.set(0, 0.06, 0.005);
  phoneScreen.name = 'phone-screen';
  phone.add(phoneScreen);
  phone.position.set(0.2, 0.0, 0.0);
  phone.rotation.x = -0.2;
  group.add(phone);

  group.position.set(ANCHORS.counter.position.x - 0.1, 1.08, 1.6);
  target.add(group);
}

// ---------------------------------------------------------------------------
// posters
// ---------------------------------------------------------------------------

/** Minimalist typographic prints + local-roaster branding on the poster walls. */
export function build2025Posters(target: THREE.Object3D): void {
  const oak = M.oak();
  const posterTitles = [
    ...era2025.posters.map((p) => p.title),
    'House Filter',
    'Single Origin — Ethiopia',
    'Cold Brew',
  ];
  const posterColors: Array<{ color: string; accent: string }> = [
    { color: '#EDEAE2', accent: '#1C1C1E' },
    { color: '#1C1C1E', accent: '#EDEAE2' },
    { color: '#A97B48', accent: '#F5F4F0' },
    { color: '#9A958C', accent: '#F5F4F0' },
    { color: '#E4DCC8', accent: '#1C1C1E' },
  ];

  ANCHORS.posterWalls.forEach((anchor, index) => {
    const def = posterColors[index % posterColors.length];
    const title = posterTitles[index % posterTitles.length] ?? 'Coffee';
    const poster = PropPrimitives.frame({
      width: 0.5,
      height: 0.7,
      rail: 0.03,
      material: oak,
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

/** A compostable to-go cup with a bamboo-lid look (rooted at base). */
function buildCompostableCup(): THREE.Group {
  const fibre = materialFromSpec({
    kind: 'plastic',
    color: '#E8D9C0',
    roughness: 0.85,
  });
  const bambooLid = materialFromSpec({
    kind: 'plastic',
    color: '#C9A97A',
    roughness: 0.6,
  });
  const group = new THREE.Group();
  group.name = 'compostable-to-go-cup';
  cylinder(group, fibre, 0.032, 0.024, 0.1, 0, 0.05, 0, 'cup-body');
  cylinder(group, bambooLid, 0.034, 0.034, 0.014, 0, 0.112, 0, 'cup-lid');
  return group;
}

/** Artisan stoneware mugs, glass tumblers and compostable cups on tables. */
export function build2025Tableware(target: THREE.Object3D): void {
  const stoneware = M.stoneware();
  const glass = M.glass();
  const tableTopY = 0.775;

  ANCHORS.seatingTables.forEach((pos, index) => {
    // Artisan speckled stoneware cup + saucer.
    const mug = PropPrimitives.cup({
      height: 0.085,
      radius: 0.038,
      baseRadius: 0.028,
      handle: true,
      saucerMaterial: stoneware,
      material: stoneware,
    });
    mug.name = `stoneware-mug-${index + 1}`;
    mug.position.set(pos.x + 0.18, tableTopY, pos.z - 0.1);
    target.add(mug);

    // Hand-blown glass water tumbler.
    const tumbler = PropPrimitives.cup({
      height: 0.11,
      radius: 0.035,
      baseRadius: 0.024,
      glass: true,
      material: glass,
    });
    tumbler.name = `glass-tumbler-${index + 1}`;
    tumbler.position.set(pos.x - 0.1, tableTopY, pos.z + 0.12);
    target.add(tumbler);

    // Compostable to-go cup on every other table.
    if (index % 2 === 0) {
      const toGo = buildCompostableCup();
      toGo.position.set(pos.x - 0.22, tableTopY, pos.z - 0.08);
      target.add(toGo);
    }
  });

  // Stoneware mugs lined on the counter top.
  const counterTopY = 1.08;
  for (let i = 0; i < 3; i += 1) {
    const mug = PropPrimitives.cup({
      height: 0.085,
      radius: 0.038,
      baseRadius: 0.028,
      handle: true,
      saucerMaterial: stoneware,
      material: stoneware,
    });
    mug.name = `counter-mug-${i + 1}`;
    mug.position.set(ANCHORS.counter.position.x - 0.25, counterTopY, -3.6 + i * 0.5);
    target.add(mug);
  }
}

// ---------------------------------------------------------------------------
// signageLighting
// ---------------------------------------------------------------------------

/** Backlit "BREW" sign, warm LED strips, Edison pendant bulb clusters. */
export function build2025SignageLighting(target: THREE.Object3D): void {
  const darkMetal = materialFromSpec({
    kind: 'metal',
    color: '#1C1C1E',
    roughness: 0.4,
    metalness: 0.8,
  });
  const backlit = materialFromSpec({
    kind: 'neon',
    color: '#F5F4F0',
    emissive: '#FFE3B8',
    emissiveIntensity: 1.8,
    roughness: 0.4,
  });
  const edison = materialFromSpec({
    kind: 'neon',
    color: '#FFF2C4',
    emissive: '#FFC27A',
    emissiveIntensity: 2.4,
    roughness: 0.3,
  });

  // Backlit sans-serif "BREW" sign above the counter, facing into the room.
  const sign = PropPrimitives.signage({
    neon: false,
    width: 1.3,
    height: 0.34,
    depth: 0.06,
    faceMaterial: backlit,
    frameMaterial: darkMetal,
  });
  sign.name = 'backlit-brew-sign';
  sign.position.set(ANCHORS.counter.position.x, 2.75, ANCHORS.counter.position.z);
  sign.rotation.y = -Math.PI / 2;
  target.add(sign);

  // Edison pendant bulb clusters at every ceiling lighting anchor.
  for (const point of ANCHORS.lighting) {
    const cluster = new THREE.Group();
    cluster.name = 'edison-pendant-cluster';
    for (let i = 0; i < 3; i += 1) {
      const lamp = PropPrimitives.pendantLamp({
        height: 0.35,
        shadeRadius: 0.06,
        shadeHeight: 0.06,
        shadeMaterial: darkMetal,
        stemMaterial: darkMetal,
        bulbMaterial: edison,
      });
      lamp.position.set((i - 1) * 0.18, 0, (i % 2) * 0.1);
      cluster.add(lamp);
    }
    cluster.position.copy(point);
    target.add(cluster);
  }

  // Warm LED strip along the counter underside (glowing bar, faces the floor).
  const ledStrip = materialFromSpec({
    kind: 'neon',
    color: '#FFD9A0',
    emissive: '#FFD9A0',
    emissiveIntensity: 2.0,
  });
  box(
    target,
    ledStrip,
    ANCHORS.counter.length - 1.2,
    0.015,
    0.015,
    ANCHORS.counter.position.x - 0.05,
    ANCHORS.counter.height - 0.02,
    ANCHORS.counter.position.z,
    'counter-led-strip',
    { x: Math.PI / 2 },
  );
}

// ---------------------------------------------------------------------------
// counterTechnology
// ---------------------------------------------------------------------------

/** Tablet POS + contactless/card reader + mobile-order pick-up shelf. */
export function build2025CounterTechnology(target: THREE.Object3D): void {
  const charcoal = materialFromSpec({
    kind: 'plastic',
    color: '#1C1C1E',
    roughness: 0.4,
    metalness: 0.4,
  });
  const white = materialFromSpec({
    kind: 'plastic',
    color: '#F5F4F0',
    roughness: 0.35,
    clearcoat: 0.6,
  });
  const screenGlow = materialFromSpec({
    kind: 'neon',
    color: '#0B0E14',
    emissive: '#8FD0FF',
    emissiveIntensity: 1.5,
  });

  // Tablet POS terminal on a small stand.
  const pos = new THREE.Group();
  pos.name = 'tablet-pos';
  box(pos, charcoal, 0.2, 0.04, 0.14, 0, 0.02, 0, 'pos-base');
  box(pos, white, 0.26, 0.17, 0.012, 0, 0.14, 0, 'pos-tablet');
  const posScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.13), screenGlow);
  posScreen.position.set(0, 0.14, 0.008);
  posScreen.name = 'pos-screen';
  pos.add(posScreen);
  pos.position.set(ANCHORS.counter.position.x - 0.05, 1.08, -2.7);
  pos.rotation.y = -Math.PI / 2;
  target.add(pos);

  // Contactless card reader beside the terminal.
  const reader = new THREE.Group();
  reader.name = 'contactless-card-reader';
  box(reader, charcoal, 0.08, 0.05, 0.08, 0, 0.025, 0, 'reader-body');
  const readerScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.035), screenGlow);
  readerScreen.position.set(0, 0.05, 0.041);
  readerScreen.name = 'reader-screen';
  reader.add(readerScreen);
  reader.position.set(ANCHORS.counter.position.x - 0.3, 1.08, -2.7);
  reader.rotation.y = -Math.PI / 2;
  target.add(reader);

  // Mobile-order pick-up shelf (wall-mounted rack with a waiting order).
  const pickUp = new THREE.Group();
  pickUp.name = 'mobile-order-pickup-shelf';
  box(pickUp, white, 0.7, 0.03, 0.28, 0, 0, 0, 'pickup-shelf');
  box(pickUp, charcoal, 0.04, 0.22, 0.28, -0.33, -0.11, 0, 'pickup-bracket');
  box(pickUp, charcoal, 0.04, 0.22, 0.28, 0.33, -0.11, 0, 'pickup-bracket');
  // A waiting compostable cup with a cardboard sleeve.
  const cup = buildCompostableCup();
  cup.position.set(0, 0.05, 0);
  pickUp.add(cup);
  pickUp.position.set(ANCHORS.counter.position.x - 0.05, 1.42, 2.4);
  pickUp.rotation.y = -Math.PI / 2;
  target.add(pickUp);
}

// ---------------------------------------------------------------------------
// patrons
// ---------------------------------------------------------------------------

/**
 * 2025 patron configs consumed by the shared CharacterAvatar system.
 * Period styling: athleisure / oversized fits (hoodies, joggers, dad
 * trainers), beanies / top-knots, and modern gadgets — wireless earbuds,
 * smartphones, open laptops and reusable cups.
 */
const PATRON_CONFIGS_2025: PatronConfig[] = [
  {
    name: 'hoodie-nomad',
    skin: '#C88B5A',
    hair: { kind: 'top-knot', color: '#2A1E14' },
    shirt: '#8A8F98',
    pants: '#23262B',
    shoes: '#D8D4CC',
    style: 'oversized',
    accessory: 'laptop',
  },
  {
    name: 'athleisure-runner',
    skin: '#A9744F',
    hair: { kind: 'beanie', color: '#3A3F45' },
    shirt: '#4C6B57',
    pants: '#2B2F36',
    shoes: '#E8E6E0',
    style: 'oversized',
    accessory: 'phone',
  },
  {
    name: 'podcast-earbuds',
    skin: '#D19A6A',
    hair: { kind: 'top-knot', color: '#1C1410' },
    shirt: '#B8B2A8',
    pants: '#464A50',
    shoes: '#20242A',
    style: 'oversized',
    accent: '#E8E6E0',
    accessory: 'earbuds',
  },
  {
    name: 'barista-topknot',
    skin: '#B98A5E',
    hair: { kind: 'bun', color: '#1C1410' },
    shirt: '#6B4F3A',
    pants: '#3A332C',
    shoes: '#1A1A1A',
    style: 'oversized',
    accent: '#D8D4CC',
    accessory: 'cup',
  },
];

/** 2025 third-wave patrons via the shared roster (tables + stools). */
export function build2025Patrons(target: THREE.Object3D): void {
  const roster = new CharacterRoster({
    parent: target,
    tables: ANCHORS.seatingTables,
    stools: counterStoolAnchors(),
  });
  roster.mount(2025, PATRON_CONFIGS_2025);
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
 * Build the full 2025 composition. When `slots` is provided the shell surface
 * slots are also dressed (white ceramic tile walls, polished concrete floor,
 * matte black exposed-services ceiling). The era audio config is attached to
 * the root's userData so a future audio engine can read it from the mounted
 * group.
 */
export function build2025Composition(
  group: THREE.Group = new THREE.Group(),
  slots?: SurfaceSlots,
): CompositionResult {
  const surfaces = slots ? populate2025Surfaces(slots) : null;

  const builders: Array<[string, (target: THREE.Object3D) => void]> = [
    ['architecture', build2025Architecture],
    ['furnitureDecor', build2025FurnitureDecor],
    ['coffeeMachines', build2025CoffeeMachines],
    ['menuBoard', build2025MenuBoard],
    ['musicSource', build2025MusicSource],
    ['posters', build2025Posters],
    ['tableware', build2025Tableware],
    ['signageLighting', build2025SignageLighting],
    ['counterTechnology', build2025CounterTechnology],
    ['patrons', build2025Patrons],
  ];
  for (const [category, builder] of builders) {
    const child = new THREE.Group();
    child.name = `2025-${category}`;
    builder(child);
    group.add(child);
  }

  group.userData.eraAudio = ERA_AUDIO_2025;
  return { group, surfaces };
}

/** The era audio config (lo-fi generative bed, phone/BT speaker, steam hiss). */
export { ERA_AUDIO_2025 };

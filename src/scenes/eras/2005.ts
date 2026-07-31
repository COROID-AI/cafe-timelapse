/**
 * src/scenes/eras/2005.ts — the 2005 second-wave coffeehouse composition.
 *
 * Phase 4: turns the 2005 EraData record (src/data/eras/2005.ts) into real
 * Three.js geometry, composed from the shared procedural asset library
 * (TextureFactory / MaterialFactory / PropPrimitives) and mounted at the
 * canonical architecture anchors (src/world/layout.ts).
 *
 * Every builder is pure object-graph work (no WebGL), so the QA gates can
 * mount the fragment headlessly. The persistent café shell stays era-neutral;
 * this composition dresses its surface slots with era finishes — a warm
 * hardwood floor and an exposed red-brick feature wall — and populates the
 * anchors with the second-wave coffeehouse kit: overstuffed armchairs, low
 * wood tables, bookshelves, a superautomatic espresso machine + bulk brewer
 * with a pastry case, an illuminated printed menu board with 2005 prices, an
 * iPod + speaker dock, indie/bohemian poster art, ceramic 'for here' mugs
 * and paper to-go cups, warm halogen spots + pendant lamps with a chalkboard
 * A-frame, and a POS touchscreen terminal.
 */
import * as THREE from 'three';
import type { EraYear } from '../../data/eras';
import { era2005 } from '../../data/eras/2005';
import {
  ANCHORS,
  ROOM_BOUNDS,
  ROOM_DEPTH,
  ROOM_HEIGHT,
  ROOM_WIDTH,
} from '../../world/layout';
import {
  materialFactory,
  materialFromSpec,
  paletteFor,
  PropPrimitives,
  textureFactory,
} from '../../assets';

const P = PropPrimitives;

/** Small offset used to lift era finishes off the shell surfaces. */
const FINISH_OFFSET = 0.012;
/** Counter work-surface height (matches ANCHORS.machineSlot.y). */
const COUNTER_TOP_Y = ANCHORS.machineSlot.y;
/** Top of the shell's pedestal table bases (dressed with era table tops). */
const PEDESTAL_TOP_Y = 0.75;
/** Top surface of the era's wood table slabs (above the shell base). */
const TABLE_TOP_Y = 0.81;

/** Warm earth-tone book covers for the bookshelves. */
const BOOK_COLORS = ['#8A4A3A', '#A63A2E', '#B98A54', '#5A7A5A', '#2E6E8E', '#7A5A3A'];
/** Warm pastry colours for the display case. */
const PASTRY_COLORS = ['#B98A54', '#8A5A3A', '#D9A86C'];

function addBox(
  group: THREE.Group,
  width: number,
  height: number,
  depth: number,
  material: THREE.Material,
  position: THREE.Vector3,
  name: string,
  castShadow = true,
  receiveShadow = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.copy(position);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  group.add(mesh);
  return mesh;
}

function addCylinder(
  group: THREE.Group,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  material: THREE.Material,
  position: THREE.Vector3,
  name: string,
  segments = 20,
  castShadow = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material);
  mesh.position.copy(position);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function addPlane(
  group: THREE.Group,
  width: number,
  height: number,
  material: THREE.Material,
  position: THREE.Vector3,
  name: string,
  rotationY = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.copy(position);
  mesh.rotation.y = rotationY;
  mesh.name = name;
  group.add(mesh);
  return mesh;
}

/** A plump, overstuffed armchair rooted at the floor. */
function makeArmchair(
  bodyMaterial: THREE.Material,
  cushionMaterial: THREE.Material,
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'overstuffed-armchair';
  addBox(group, 0.78, 0.14, 0.74, cushionMaterial, new THREE.Vector3(0, 0.5, 0), 'armchair-seat');
  addBox(group, 0.78, 0.62, 0.18, bodyMaterial, new THREE.Vector3(0, 0.92, -0.28), 'armchair-back');
  for (const side of [-0.32, 0.32]) {
    addBox(group, 0.16, 0.24, 0.74, bodyMaterial, new THREE.Vector3(side, 0.62, 0), 'armchair-arm');
  }
  addBox(group, 0.62, 0.09, 0.6, bodyMaterial, new THREE.Vector3(0, 0.635, 0), 'armchair-cushion');
  addBox(group, 0.78, 0.05, 0.74, bodyMaterial, new THREE.Vector3(0, 0.03, 0), 'armchair-base');
  return group;
}

/** A tall bookshelf with several shelves of colourful books. */
function makeBookshelf(
  wood: THREE.Material,
  bookColors: string[],
): THREE.Group {
  const group = new THREE.Group();
  group.name = 'bookshelf';
  const w = 0.95;
  const h = 1.8;
  const d = 0.3;
  addBox(group, w, h, 0.06, wood, new THREE.Vector3(0, h / 2, 0), 'bookshelf-side', true, true);
  for (const shelfY of [0.45, 0.9, 1.35]) {
    addBox(group, w, 0.03, d - 0.05, wood, new THREE.Vector3(0, shelfY, 0), 'bookshelf-shelf', false, true);
    let bx = -w / 2 + 0.07;
    let count = 0;
    while (bx < w / 2 - 0.09 && count < 9) {
      const bw = 0.035 + ((count * 37) % 3) * 0.008;
      const bh = 0.16 + ((count * 13) % 4) * 0.03;
      const mat = materialFromSpec({
        kind: 'plastic',
        color: bookColors[count % bookColors.length],
        roughness: 0.6,
      });
      addBox(group, bw, bh, d - 0.14, mat, new THREE.Vector3(bx + bw / 2, shelfY + bh / 2, 0), 'book', false, false);
      bx += bw + 0.012;
      count += 1;
    }
  }
  return group;
}

/** A small standing rack with glossy magazines. */
function makeMagazineRack(wood: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.name = 'magazine-rack';
  addBox(group, 0.5, 0.06, 0.3, wood, new THREE.Vector3(0, 0.55, 0), 'rack-body', true, true);
  const covers = ['#D94F3D', '#2E6E8E', '#7A5A3A'];
  for (let i = 0; i < 3; i += 1) {
    const mat = materialFromSpec({
      kind: 'plastic',
      color: covers[i],
      roughness: 0.25,
      clearcoat: 0.9,
    });
    addBox(group, 0.11, 0.16, 0.02, mat, new THREE.Vector3(-0.16 + i * 0.16, 0.68, 0.08), 'magazine', false, false);
  }
  return group;
}

/** A paper to-go cup with a sleeve and lid, rooted at the base. */
function makePaperToGoCup(): THREE.Group {
  const paper = materialFromSpec({ kind: 'plastic', color: '#E8D9C0', roughness: 0.75 });
  const sleeve = materialFromSpec({ kind: 'plastic', color: '#7A4A2E', roughness: 0.7 });
  const lid = materialFromSpec({ kind: 'plastic', color: '#D8CFC0', roughness: 0.45 });
  const group = new THREE.Group();
  group.name = 'paper-to-go-cup';
  addCylinder(group, 0.032, 0.024, 0.1, paper, new THREE.Vector3(0, 0.05, 0), 'cup-body', 20);
  addCylinder(group, 0.0325, 0.0325, 0.028, sleeve, new THREE.Vector3(0, 0.045, 0), 'cup-sleeve', 20, false);
  addCylinder(group, 0.034, 0.034, 0.014, lid, new THREE.Vector3(0, 0.112, 0), 'cup-lid', 20, false);
  return group;
}

// ---------------------------------------------------------------------------
// Architecture — era finishes over the persistent shell surfaces
// ---------------------------------------------------------------------------

export function build2005Architecture(target: THREE.Group, era: EraYear): void {
  const palette = paletteFor(era);

  // Floor: warm hardwood planks over the shell floor slot.
  const floorTexture = textureFactory.get({
    kind: 'woodGrain',
    color: palette.floor,
    color2: '#7A5A2E',
    size: 256,
    repeats: 6,
  });
  const floorMaterial = materialFromSpec({
    kind: 'floor',
    color: palette.floor,
    roughness: 0.7,
    texture: floorTexture.texture,
  });
  const floor = addPlane(
    target,
    ROOM_WIDTH,
    ROOM_DEPTH,
    floorMaterial,
    new THREE.Vector3(0, FINISH_OFFSET, 0),
    'hardwood-floor',
  );
  floor.rotation.x = -Math.PI / 2;

  // Back wall: exposed red-brick feature wall (full height).
  const brickTexture = textureFactory.get({
    kind: 'brick',
    color: '#8A4A3A',
    color2: '#C9B8A8',
    size: 256,
    repeats: 5,
  });
  const brickMaterial = materialFromSpec({
    kind: 'wall',
    color: '#8A4A3A',
    roughness: 0.92,
    texture: brickTexture.texture,
  });
  addPlane(
    target,
    ROOM_WIDTH,
    ROOM_HEIGHT,
    brickMaterial,
    new THREE.Vector3(0, ROOM_HEIGHT / 2, ROOM_BOUNDS.minZ + FINISH_OFFSET),
    'wall-back-brick',
  );

  // Side walls: chocolate-brown plaster above a darker espresso band.
  const chocolateTexture = textureFactory.get({
    kind: 'wallpaper',
    color: palette.walls,
    color2: '#3A2316',
    size: 256,
    repeats: 3,
  });
  const chocolateMaterial = materialFromSpec({
    kind: 'wall',
    color: palette.walls,
    roughness: 0.9,
    texture: chocolateTexture.texture,
  });
  const espressoMaterial = materialFromSpec({
    kind: 'wall',
    color: '#33211A',
    roughness: 0.65,
  });
  const trimMaterial = materialFactory.forEra(era, 'trim');
  const bandHeight = 1.0;
  const upperHeight = ROOM_HEIGHT - bandHeight;

  // Left wall (interior face at x = minX, normal +X).
  addPlane(
    target,
    ROOM_DEPTH,
    upperHeight,
    chocolateMaterial,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET, bandHeight + upperHeight / 2, 0),
    'wall-left-plaster',
    Math.PI / 2,
  );
  addPlane(
    target,
    ROOM_DEPTH,
    bandHeight,
    espressoMaterial,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET, bandHeight / 2, 0),
    'wall-left-espresso-band',
    Math.PI / 2,
  );
  addBox(
    target,
    0.04,
    0.055,
    ROOM_DEPTH,
    trimMaterial,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET + 0.02, bandHeight + 0.0275, 0),
    'espresso-rail-left',
    false,
  );

  // Right wall (interior face at x = maxX, normal -X).
  addPlane(
    target,
    ROOM_DEPTH,
    upperHeight,
    chocolateMaterial,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET, bandHeight + upperHeight / 2, 0),
    'wall-right-plaster',
    -Math.PI / 2,
  );
  addPlane(
    target,
    ROOM_DEPTH,
    bandHeight,
    espressoMaterial,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET, bandHeight / 2, 0),
    'wall-right-espresso-band',
    -Math.PI / 2,
  );
  addBox(
    target,
    0.04,
    0.055,
    ROOM_DEPTH,
    trimMaterial,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET - 0.02, bandHeight + 0.0275, 0),
    'espresso-rail-right',
    false,
  );

  // Ceiling: dark exposed surface with wooden rafters crossing below it.
  const ceilingMaterial = materialFromSpec({
    kind: 'ceiling',
    color: palette.ceiling,
    roughness: 0.9,
  });
  const ceiling = addPlane(
    target,
    ROOM_WIDTH,
    ROOM_DEPTH,
    ceilingMaterial,
    new THREE.Vector3(0, ROOM_HEIGHT - FINISH_OFFSET, 0),
    'exposed-rafter-ceiling',
  );
  ceiling.rotation.x = Math.PI / 2;

  const rafterWood = materialFromSpec({
    kind: 'wood',
    color: '#4A3224',
    roughness: 0.6,
    metalness: 0.05,
  });
  for (const x of [-4.8, -2.9, -1, 0.9, 2.8, 4.7]) {
    addBox(
      target,
      0.14,
      0.12,
      ROOM_DEPTH,
      rafterWood,
      new THREE.Vector3(x, ROOM_HEIGHT - 0.08, 0),
      'exposed-rafter',
      true,
      false,
    );
  }
}

// ---------------------------------------------------------------------------
// Furniture & decor — armchairs, low wood tables, bookshelves, magazine rack
// ---------------------------------------------------------------------------

export function build2005FurnitureDecor(target: THREE.Group, era: EraYear): void {
  const wood = materialFactory.forEra(era, 'wood');
  const earthFabric = materialFromSpec({
    kind: 'fabric',
    color: '#7A4A2E',
    roughness: 0.92,
    sheen: 0.5,
  });
  const armchairBody = materialFromSpec({
    kind: 'leather',
    color: '#6A3A26',
    roughness: 0.65,
    sheen: 0.35,
  });

  // Lounge cluster: overstuffed armchairs around a low wood coffee table.
  const coffeeTable = new THREE.Group();
  coffeeTable.name = 'low-wood-coffee-table';
  coffeeTable.add(
    P.tableFrame({
      height: 0.36,
      width: 0.8,
      depth: 0.5,
      material: wood,
      castShadow: true,
      receiveShadow: true,
    }),
  );
  coffeeTable.add(
    P.tableTop({
      topY: 0.4,
      width: 0.8,
      depth: 0.5,
      material: wood,
      castShadow: true,
      receiveShadow: true,
    }),
  );
  coffeeTable.position.set(-5.3, 0, 0.9);
  target.add(coffeeTable);

  const loungeChairs: Array<[number, number, number]> = [
    [-5.6, 0.3, 0],
    [-4.6, 0.3, 0],
    [-5.1, 1.5, Math.PI],
  ];
  for (const [x, z, rotation] of loungeChairs) {
    const armchair = makeArmchair(armchairBody, earthFabric);
    armchair.position.set(x, 0, z);
    armchair.rotation.y = rotation;
    target.add(armchair);
  }

  // Low wood table tops over each shell pedestal base, with wood chairs.
  for (const seat of ANCHORS.seatingTables) {
    addBox(
      target,
      1.05,
      0.04,
      0.75,
      wood,
      new THREE.Vector3(seat.x, PEDESTAL_TOP_Y + 0.04, seat.z),
      'wood-table-top',
    );

    const chairNorth = P.chair({
      material: wood,
      seatMaterial: earthFabric,
      backMaterial: wood,
      seatY: 0.46,
      backHeight: 0.5,
      castShadow: true,
      receiveShadow: true,
    });
    chairNorth.name = 'wood-chair';
    chairNorth.position.set(seat.x + 0.75, 0, seat.z);
    chairNorth.rotation.y = -Math.PI / 2;
    target.add(chairNorth);

    const chairSouth = P.chair({
      material: wood,
      seatMaterial: earthFabric,
      backMaterial: wood,
      seatY: 0.46,
      backHeight: 0.5,
      castShadow: true,
      receiveShadow: true,
    });
    chairSouth.name = 'wood-chair';
    chairSouth.position.set(seat.x - 0.75, 0, seat.z);
    chairSouth.rotation.y = Math.PI / 2;
    target.add(chairSouth);
  }

  // Bookshelves against the side walls (clear of the counter run on the east).
  const leftShelf = makeBookshelf(wood, BOOK_COLORS);
  leftShelf.position.set(ROOM_BOUNDS.minX + 0.07, 0, 3.2);
  leftShelf.rotation.y = Math.PI / 2;
  target.add(leftShelf);

  const rightShelf = makeBookshelf(wood, BOOK_COLORS);
  rightShelf.position.set(ROOM_BOUNDS.maxX - 0.07, 0, 3.0);
  rightShelf.rotation.y = -Math.PI / 2;
  target.add(rightShelf);

  // Magazine rack beside the left bookshelf.
  const rack = makeMagazineRack(wood);
  rack.position.set(ROOM_BOUNDS.minX + 0.07, 0, 4.35);
  rack.rotation.y = Math.PI / 2;
  target.add(rack);
}

// ---------------------------------------------------------------------------
// Coffee machines — superautomatic espresso machine + bulk brewer + pastry case
// ---------------------------------------------------------------------------

export function build2005CoffeeMachines(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const darkPlastic = materialFromSpec({
    kind: 'plastic',
    color: '#2E2A26',
    roughness: 0.4,
    clearcoat: 0.4,
  });
  const darkWood = materialFromSpec({
    kind: 'wood',
    color: '#4A3224',
    roughness: 0.55,
  });
  const glass = materialFromSpec({
    kind: 'glass',
    color: '#B8C8CC',
    roughness: 0.1,
    transmission: 0.7,
    ior: 1.5,
    clearcoat: 0.6,
  });
  const screenGlow = materialFromSpec({
    kind: 'neon',
    color: '#2A2E33',
    emissive: '#7FD4FF',
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });

  // Superautomatic espresso machine (one-touch beans-to-cup).
  const machineSlot = ANCHORS.machineSlot;
  const machine = P.machineShell({
    groupHead: false,
    lever: false,
    steamWand: true,
    dripTray: true,
    material: chrome,
    accentMaterial: darkPlastic,
    width: 0.5,
    height: 0.4,
    depth: 0.4,
    castShadow: true,
  });
  machine.name = 'superautomatic-espresso-machine';
  addCylinder(machine, 0.06, 0.05, 0.12, darkPlastic, new THREE.Vector3(0, 0.44, 0), 'bean-hopper', 16);
  addBox(machine, 0.18, 0.04, 0.02, screenGlow, new THREE.Vector3(0, 0.3, 0.205), 'machine-lcd', false, false);
  addBox(machine, 0.16, 0.03, 0.05, chrome, new THREE.Vector3(0, 0.06, 0.18), 'brew-spout', false, false);
  machine.position.set(machineSlot.x, COUNTER_TOP_Y, machineSlot.z);
  target.add(machine);

  // Bulk brewer: a large stainless urn with a glass airpot carafe.
  const urn = new THREE.Group();
  urn.name = 'bulk-brewer-urn';
  addCylinder(urn, 0.13, 0.1, 0.34, chrome, new THREE.Vector3(0, 0.17, 0), 'urn-body', 20);
  addCylinder(urn, 0.14, 0.14, 0.02, chrome, new THREE.Vector3(0, 0.35, 0), 'urn-lid', 20, false);
  addCylinder(urn, 0.012, 0.012, 0.04, chrome, new THREE.Vector3(0.1, 0.12, 0.1), 'urn-spigot', 8, false);
  addCylinder(urn, 0.06, 0.05, 0.22, glass, new THREE.Vector3(-0.22, 0.11, 0.05), 'airpot-carafe', 16);
  addCylinder(urn, 0.062, 0.062, 0.012, darkPlastic, new THREE.Vector3(-0.22, 0.235, 0.05), 'airpot-lid', 16, false);
  urn.position.set(machineSlot.x, COUNTER_TOP_Y, -0.1);
  target.add(urn);

  // Pastry case on the counter: glass-fronted display with pastries.
  const pastry = new THREE.Group();
  pastry.name = 'pastry-case';
  addBox(pastry, 0.5, 0.28, 0.34, darkWood, new THREE.Vector3(0, 0.14, 0), 'pastry-case-body', true, true);
  const glassFront = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.2), glass);
  glassFront.position.set(0, 0.2, 0.171);
  glassFront.name = 'pastry-case-glass';
  pastry.add(glassFront);
  addBox(pastry, 0.46, 0.02, 0.3, darkWood, new THREE.Vector3(0, 0.24, 0), 'pastry-shelf', false, true);
  for (let i = 0; i < 3; i += 1) {
    addBox(
      pastry,
      0.09,
      0.05,
      0.07,
      materialFromSpec({ kind: 'plastic', color: PASTRY_COLORS[i], roughness: 0.6 }),
      new THREE.Vector3(-0.14 + i * 0.14, 0.275, 0.02),
      'pastry',
      false,
      false,
    );
  }
  pastry.position.set(machineSlot.x, COUNTER_TOP_Y, 1.45);
  target.add(pastry);
}

// ---------------------------------------------------------------------------
// Menu board — stylized printed/illuminated board with 2005 prices
// ---------------------------------------------------------------------------

export function build2005MenuBoard(target: THREE.Group, era: EraYear): void {
  const palette = paletteFor(era);
  const printedFace = materialFromSpec({
    kind: 'poster',
    color: '#F2E6C8',
    emissive: palette.neon,
    emissiveIntensity: 0.25,
    roughness: 0.7,
    texture: {
      kind: 'poster',
      color: '#F2E6C8',
      color2: '#5A3A2A',
      size: 512,
      title: 'Café Menu',
    },
  });
  const frameMaterial = materialFromSpec({
    kind: 'metal',
    color: '#1E1A14',
    roughness: 0.45,
    metalness: 0.7,
  });

  const board = P.frame({
    width: 1.8,
    height: 1.15,
    depth: 0.05,
    rail: 0.05,
    panelMaterial: printedFace,
    material: frameMaterial,
    castShadow: true,
  });
  board.name = 'menu-board';
  const anchor = ANCHORS.menuBoardWall;
  board.position.set(anchor.position.x, anchor.position.y, anchor.position.z + 0.03);
  target.add(board);
}

// ---------------------------------------------------------------------------
// Music source — iPod docked into a small speaker dock
// ---------------------------------------------------------------------------

export function build2005MusicSource(target: THREE.Group, _era: EraYear): void {
  const whitePlastic = materialFromSpec({
    kind: 'plastic',
    color: '#F4F4F0',
    roughness: 0.35,
    clearcoat: 0.6,
  });
  const darkPlastic = materialFromSpec({
    kind: 'plastic',
    color: '#2E2A26',
    roughness: 0.5,
  });
  const grille = materialFromSpec({
    kind: 'fabric',
    color: '#3A3A36',
    roughness: 0.95,
  });

  const dock = new THREE.Group();
  dock.name = 'ipod-speaker-dock';
  addBox(dock, 0.2, 0.05, 0.12, whitePlastic, new THREE.Vector3(0, 0.025, 0), 'dock-base', true, true);
  addCylinder(dock, 0.055, 0.055, 0.05, whitePlastic, new THREE.Vector3(0, 0.07, 0), 'dock-speaker', 20);
  const grilleDisk = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), grille);
  grilleDisk.position.set(0, 0.07, 0.026);
  grilleDisk.name = 'dock-speaker-grille';
  dock.add(grilleDisk);
  // The iPod: slim white body with a click wheel, docked upright.
  addBox(dock, 0.055, 0.1, 0.008, whitePlastic, new THREE.Vector3(0, 0.135, 0), 'ipod-body');
  const wheel = new THREE.Mesh(new THREE.CircleGeometry(0.018, 16), darkPlastic);
  wheel.position.set(0, 0.135, 0.006);
  wheel.name = 'ipod-click-wheel';
  dock.add(wheel);

  dock.position.set(ANCHORS.counter.position.x, COUNTER_TOP_Y, -2.6);
  target.add(dock);
}

// ---------------------------------------------------------------------------
// Posters — indie / bohemian coffee art
// ---------------------------------------------------------------------------

export function build2005Posters(target: THREE.Group, era: EraYear): void {
  const frameMaterial = materialFactory.forEra(era, 'trim');
  const posterColors = ['#A63A2E', '#B98A54', '#8A4A3A', '#2E6E8E'];
  const posterTitles = [
    ...era2005.posters.map((p) => p.title),
    'House Blend',
    'Open Mic Night',
  ];

  // Use the left-wall, right-wall and back-wall poster anchors (the menu
  // board owns the centre of the back wall).
  const posterAnchors = [
    ANCHORS.posterWalls[0],
    ANCHORS.posterWalls[1],
    ANCHORS.posterWalls[2],
    ANCHORS.posterWalls[4],
  ];

  posterTitles.forEach((title, index) => {
    const anchor = posterAnchors[index];
    if (!anchor) return;
    const color = posterColors[index % posterColors.length];
    const posterMaterial = materialFromSpec({
      kind: 'poster',
      color,
      roughness: 0.85,
      texture: {
        kind: 'poster',
        color,
        color2: '#F2E6C8',
        size: 512,
        title,
      },
    });
    const frame = P.frame({
      width: 0.55,
      height: 0.72,
      depth: 0.03,
      rail: 0.025,
      panelMaterial: posterMaterial,
      material: frameMaterial,
      castShadow: true,
    });
    frame.name = `poster-${index}`;
    frame.position.copy(anchor.position).addScaledVector(anchor.normal, 0.03);
    if (anchor.normal.x > 0) frame.rotation.y = Math.PI / 2;
    else if (anchor.normal.x < 0) frame.rotation.y = -Math.PI / 2;
    target.add(frame);
  });
}

// ---------------------------------------------------------------------------
// Tableware — ceramic 'for here' mugs + paper to-go cups
// ---------------------------------------------------------------------------

export function build2005Tableware(target: THREE.Group, _era: EraYear): void {
  const ceramic = materialFromSpec({
    kind: 'ceramic',
    color: '#F2EFE8',
    roughness: 0.3,
    clearcoat: 0.7,
  });

  for (const seat of ANCHORS.seatingTables) {
    // Ceramic 'for here' mug on a saucer.
    const mug = P.cup({
      handle: true,
      saucerMaterial: ceramic,
      material: ceramic,
      height: 0.075,
      radius: 0.033,
      castShadow: true,
    });
    mug.name = 'ceramic-for-here-mug';
    mug.position.set(seat.x - 0.16, TABLE_TOP_Y, seat.z + 0.1);
    target.add(mug);

    // Paper to-go cup with sleeve + lid.
    const paper = makePaperToGoCup();
    paper.position.set(seat.x + 0.16, TABLE_TOP_Y, seat.z - 0.1);
    target.add(paper);
  }
}

// ---------------------------------------------------------------------------
// Signage & lighting — warm halogen spots, pendant lamps, chalkboard A-frame
// ---------------------------------------------------------------------------

export function build2005SignageLighting(target: THREE.Group, era: EraYear): void {
  const palette = paletteFor(era);
  const darkMetal = materialFromSpec({
    kind: 'metal',
    color: '#1E1A14',
    roughness: 0.45,
    metalness: 0.7,
  });

  // Illuminated acrylic 'Bean & Leaf' sign above the counter, facing the room.
  const sign = P.signage({
    neon: false,
    width: 1.3,
    height: 0.34,
    depth: 0.06,
    faceMaterial: materialFromSpec({
      kind: 'wall',
      color: '#F2E6C8',
      emissive: palette.neon,
      emissiveIntensity: 0.45,
      roughness: 0.5,
    }),
    frameMaterial: darkMetal,
  });
  sign.name = 'illuminated-bean-leaf-sign';
  sign.position.set(ANCHORS.counter.position.x, 2.75, ANCHORS.counter.position.z);
  sign.rotation.y = -Math.PI / 2;
  target.add(sign);

  // Warm halogen bulbs for every fixture.
  const halogenBulb = materialFromSpec({
    kind: 'neon',
    color: '#FFF2C4',
    emissive: palette.neon,
    emissiveIntensity: 2.6,
  });

  // Pendant lamps at the ceiling lighting anchors.
  for (const point of ANCHORS.lighting) {
    const lamp = P.pendantLamp({
      height: 0.5,
      shadeRadius: 0.15,
      shadeHeight: 0.12,
      shadeMaterial: darkMetal,
      stemMaterial: darkMetal,
      bulbMaterial: halogenBulb,
    });
    lamp.name = 'warm-halogen-pendant';
    lamp.position.copy(point);
    target.add(lamp);
  }

  // Halogen wall spots flanking the menu board on the brick wall.
  for (const x of [-1.15, 1.15]) {
    const spot = P.wallLamp({
      arm: 0.16,
      shadeRadius: 0.08,
      shadeMaterial: darkMetal,
      bulbMaterial: halogenBulb,
    });
    spot.name = 'halogen-wall-spot';
    spot.position.set(x, 2.35, ROOM_BOUNDS.minZ + 0.02);
    target.add(spot);
  }

  // Halogen wall spots along the left lounge wall.
  for (const z of [0.8, 3.6]) {
    const spot = P.wallLamp({
      arm: 0.16,
      shadeRadius: 0.08,
      shadeMaterial: darkMetal,
      bulbMaterial: halogenBulb,
    });
    spot.name = 'halogen-wall-spot';
    spot.position.set(ROOM_BOUNDS.minX + 0.02, 2.35, z);
    spot.rotation.y = Math.PI / 2;
    target.add(spot);
  }

  // Chalkboard A-frame near the entrance, facing into the room.
  const chalkboardMaterial = materialFromSpec({
    kind: 'chalkboard',
    color: '#3E3228',
    roughness: 0.85,
    texture: {
      kind: 'chalkboard',
      color: '#3E3228',
      color2: '#F2E6C8',
      size: 256,
      title: "Today's Brew",
    },
  });
  const aFrame = new THREE.Group();
  aFrame.name = 'chalkboard-a-frame';
  addBox(aFrame, 0.62, 0.85, 0.04, chalkboardMaterial, new THREE.Vector3(0, 0.55, 0), 'a-frame-board', false, true);
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.7, 0.045), darkMetal);
    leg.position.set(side * 0.24, 0.3, 0);
    leg.rotation.x = side * 0.5;
    leg.name = 'a-frame-leg';
    aFrame.add(leg);
  }
  addBox(aFrame, 0.5, 0.03, 0.04, darkMetal, new THREE.Vector3(0, 0.12, 0), 'a-frame-crossbar', false, false);
  aFrame.position.set(-2.55, 0, 4.75);
  aFrame.rotation.y = Math.PI;
  target.add(aFrame);
}

// ---------------------------------------------------------------------------
// Counter technology — POS touchscreen terminal
// ---------------------------------------------------------------------------

export function build2005CounterTechnology(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const darkPlastic = materialFromSpec({
    kind: 'plastic',
    color: '#2E2A26',
    roughness: 0.45,
  });
  const whitePlastic = materialFromSpec({
    kind: 'plastic',
    color: '#F4F4F0',
    roughness: 0.35,
    clearcoat: 0.6,
  });
  const screenGlow = materialFromSpec({
    kind: 'neon',
    color: '#2A2E33',
    emissive: '#7FD4FF',
    emissiveIntensity: 1.4,
    roughness: 0.4,
  });

  const pos = new THREE.Group();
  pos.name = 'pos-touchscreen-terminal';
  addBox(pos, 0.28, 0.05, 0.22, darkPlastic, new THREE.Vector3(0, 0.025, 0), 'pos-base', true, true);
  addBox(pos, 0.03, 0.16, 0.03, chrome, new THREE.Vector3(0, 0.13, 0), 'pos-stand', false, false);
  const screenBody = addBox(pos, 0.26, 0.2, 0.02, darkPlastic, new THREE.Vector3(0, 0.28, 0), 'pos-screen-body', false, false);
  screenBody.rotation.x = -0.25;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.16), screenGlow);
  screen.position.set(0, 0.28, 0.012);
  screen.rotation.x = -0.25;
  screen.name = 'pos-touchscreen';
  pos.add(screen);
  // Receipt printer beside the terminal.
  addBox(pos, 0.12, 0.07, 0.1, whitePlastic, new THREE.Vector3(-0.22, 0.035, 0.1), 'pos-receipt-printer', false, false);

  // Face the screen out along the counter (towards the barista side, -X).
  pos.rotation.y = -Math.PI / 2;
  pos.position.set(ANCHORS.counter.position.x, COUNTER_TOP_Y, -1.75);
  target.add(pos);
}

// ---------------------------------------------------------------------------
// Patrons — figures arrive in a later phase; EraData already describes them.
// ---------------------------------------------------------------------------

export function build2005Patrons(_target: THREE.Group, _era: EraYear): void {
  // Intentionally empty: the era data supplies outfits/hairstyles/gadgets, and
  // the registry label/tags expose them. Simple stylised figures can be added
  // without changing the fragment contract.
}

/** Build every 2005 fragment category into one group (convenience). */
export function build2005Scene(target: THREE.Group, era: EraYear): void {
  build2005Architecture(target, era);
  build2005FurnitureDecor(target, era);
  build2005CoffeeMachines(target, era);
  build2005MenuBoard(target, era);
  build2005MusicSource(target, era);
  build2005Posters(target, era);
  build2005Tableware(target, era);
  build2005SignageLighting(target, era);
  build2005CounterTechnology(target, era);
  build2005Patrons(target, era);
}

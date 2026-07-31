/**
 * src/scenes/eras/1945.ts — the 1945 post-war café composition.
 *
 * Phase 4: turns the 1945 EraData record (src/data/eras/1945.ts) into real
 * Three.js geometry, composed from the shared procedural asset library
 * (TextureFactory / MaterialFactory / PropPrimitives) and mounted at the
 * canonical architecture anchors (src/world/layout.ts).
 *
 * Every builder is pure object-graph work (no WebGL), so the QA gates can
 * mount the fragment headlessly. The persistent café shell (floor, walls,
 * ceiling, counter zone, seating zone) stays era-neutral; this composition
 * dresses it with era finishes (linoleum floor, papered walls with dark-green
 * wainscoting, pressed-tin ceiling) and populates the anchors with furniture,
 * machines, menu board, radio, posters, tableware, signage/lighting and the
 * counter tech.
 */
import * as THREE from 'three';
import type { EraYear } from '../../data/eras';
import { era1945 } from '../../data/eras/1945';
import {
  ANCHORS,
  DOOR_HEIGHT,
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

/** Height of the dark-green wainscot (dado) band. */
const DADO_HEIGHT = 1.05;
/** Small offset used to lift era finishes off the shell surfaces. */
const FINISH_OFFSET = 0.012;

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

// ---------------------------------------------------------------------------
// Architecture — era finishes over the persistent shell surfaces
// ---------------------------------------------------------------------------

export function build1945Architecture(target: THREE.Group, era: EraYear): void {
  const palette = paletteFor(era);

  // Floor: black-and-white checkerboard linoleum.
  const floorTexture = textureFactory.get({
    kind: 'tile',
    color: palette.floor,
    color2: '#332B20',
    size: 256,
    repeats: 15,
  });
  const floorMaterial = materialFromSpec({
    kind: 'floor',
    color: palette.floor,
    roughness: 0.8,
    texture: floorTexture.texture,
  });
  const floor = addPlane(
    target,
    ROOM_WIDTH,
    ROOM_DEPTH,
    floorMaterial,
    new THREE.Vector3(0, FINISH_OFFSET, 0),
    'linoleum-floor',
  );
  // The floor plane faces +Z by default; rotate it flat onto the floor.
  floor.rotation.x = -Math.PI / 2;

  // Walls: scrubbed cream wallpaper above a dark-green dado (wainscot).
  const wallTexture = textureFactory.get({
    kind: 'wallpaper',
    color: palette.walls,
    color2: '#3A4A3C',
    size: 256,
    repeats: 3,
  });
  const upperWallMaterial = materialFromSpec({
    kind: 'wall',
    color: palette.walls,
    roughness: 0.9,
    texture: wallTexture.texture,
  });
  const dadoMaterial = materialFromSpec({
    kind: 'wall',
    color: palette.accent,
    roughness: 0.55,
  });
  const trimMaterial = materialFactory.forEra(era, 'trim');

  const upperHeight = ROOM_HEIGHT - DADO_HEIGHT;

  // Back wall (interior face at z = minZ, normal +Z).
  addPlane(
    target,
    ROOM_WIDTH,
    upperHeight,
    upperWallMaterial,
    new THREE.Vector3(0, DADO_HEIGHT + upperHeight / 2, ROOM_BOUNDS.minZ + FINISH_OFFSET),
    'wall-back-upper',
  );
  addPlane(
    target,
    ROOM_WIDTH,
    DADO_HEIGHT,
    dadoMaterial,
    new THREE.Vector3(0, DADO_HEIGHT / 2, ROOM_BOUNDS.minZ + FINISH_OFFSET),
    'wall-back-dado',
  );
  addBox(
    target,
    ROOM_WIDTH,
    0.055,
    0.04,
    trimMaterial,
    new THREE.Vector3(0, DADO_HEIGHT + 0.0275, ROOM_BOUNDS.minZ + FINISH_OFFSET + 0.02),
    'dado-rail-back',
    false,
  );

  // Left wall (interior face at x = minX, normal +X).
  addPlane(
    target,
    ROOM_DEPTH,
    upperHeight,
    upperWallMaterial,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET, DADO_HEIGHT + upperHeight / 2, 0),
    'wall-left-upper',
    Math.PI / 2,
  );
  addPlane(
    target,
    ROOM_DEPTH,
    DADO_HEIGHT,
    dadoMaterial,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET, DADO_HEIGHT / 2, 0),
    'wall-left-dado',
    Math.PI / 2,
  );
  addBox(
    target,
    0.04,
    0.055,
    ROOM_DEPTH,
    trimMaterial,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET + 0.02, DADO_HEIGHT + 0.0275, 0),
    'dado-rail-left',
    false,
  );

  // Right wall (interior face at x = maxX, normal -X).
  addPlane(
    target,
    ROOM_DEPTH,
    upperHeight,
    upperWallMaterial,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET, DADO_HEIGHT + upperHeight / 2, 0),
    'wall-right-upper',
    -Math.PI / 2,
  );
  addPlane(
    target,
    ROOM_DEPTH,
    DADO_HEIGHT,
    dadoMaterial,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET, DADO_HEIGHT / 2, 0),
    'wall-right-dado',
    -Math.PI / 2,
  );
  addBox(
    target,
    0.04,
    0.055,
    ROOM_DEPTH,
    trimMaterial,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET - 0.02, DADO_HEIGHT + 0.0275, 0),
    'dado-rail-right',
    false,
  );

  // Ceiling: pressed tin panels.
  const tinTexture = textureFactory.get({
    kind: 'tile',
    color: palette.ceiling,
    color2: '#8C8477',
    size: 256,
    repeats: 14,
  });
  const ceilingMaterial = materialFromSpec({
    kind: 'ceiling',
    color: palette.ceiling,
    roughness: 0.6,
    metalness: 0.35,
    texture: tinTexture.texture,
  });
  const ceiling = addPlane(
    target,
    ROOM_WIDTH,
    ROOM_DEPTH,
    ceilingMaterial,
    new THREE.Vector3(0, ROOM_HEIGHT - FINISH_OFFSET, 0),
    'tin-ceiling',
  );
  ceiling.rotation.x = Math.PI / 2;
}

// ---------------------------------------------------------------------------
// Furniture & decor — marble-top tables, bentwood chairs, walnut counter
// ---------------------------------------------------------------------------

export function build1945FurnitureDecor(target: THREE.Group, era: EraYear): void {
  const walnut = materialFactory.forEra(era, 'wood');
  const brass = materialFactory.forEra(era, 'brass');
  const rattan = materialFromSpec({
    kind: 'fabric',
    color: '#C8B08A',
    roughness: 0.92,
    sheen: 0.35,
  });
  const marble = materialFromSpec({
    kind: 'ceramic',
    color: '#ECE6D8',
    roughness: 0.16,
    clearcoat: 0.85,
  });

  // Small round marble-top tables: a marble slab over the shell's neutral
  // pedestal base at each seating anchor.
  const marbleTopY = 0.775;
  for (const seat of ANCHORS.seatingTables) {
    const top = addCylinder(
      target,
      0.55,
      0.55,
      0.035,
      marble,
      new THREE.Vector3(seat.x, marbleTopY + 0.0175, seat.z),
      'marble-table-top',
      28,
    );
    top.castShadow = true;

    // Two bentwood Thonet-style chairs per table, facing the table.
    const chairNorth = P.chair({
      material: walnut,
      seatMaterial: rattan,
      backMaterial: walnut,
      seatY: 0.46,
      backHeight: 0.55,
      castShadow: true,
      receiveShadow: true,
    });
    chairNorth.name = 'bentwood-chair';
    chairNorth.position.set(seat.x + 0.75, 0, seat.z);
    chairNorth.rotation.y = -Math.PI / 2;
    target.add(chairNorth);

    const chairSouth = P.chair({
      material: walnut,
      seatMaterial: rattan,
      backMaterial: walnut,
      seatY: 0.46,
      backHeight: 0.55,
      castShadow: true,
      receiveShadow: true,
    });
    chairSouth.name = 'bentwood-chair';
    chairSouth.position.set(seat.x - 0.75, 0, seat.z);
    chairSouth.rotation.y = Math.PI / 2;
    target.add(chairSouth);
  }

  // Walnut counter facing with brass fittings (the shell's counter zone is
  // era-neutral; this panel dresses the customer-facing side).
  const counter = ANCHORS.counter;
  const frontX = counter.position.x - counter.depth / 2;
  addBox(
    target,
    0.03,
    counter.height,
    counter.length,
    walnut,
    new THREE.Vector3(frontX - 0.015, counter.position.y, counter.position.z),
    'counter-walnut-facing',
    false,
  );
  addBox(
    target,
    0.035,
    0.045,
    counter.length,
    brass,
    new THREE.Vector3(frontX - 0.0175, counter.height + 0.02, counter.position.z),
    'counter-brass-trim',
    false,
  );
  addBox(
    target,
    0.02,
    0.06,
    counter.length,
    brass,
    new THREE.Vector3(frontX - 0.05, 0.15, counter.position.z),
    'counter-brass-footrail',
    false,
  );

  // Lace doily + vase of dried flowers on the counter.
  const doily = addCylinder(
    target,
    0.08,
    0.08,
    0.006,
    materialFromSpec({ kind: 'ceramic', color: '#F7F3EA', roughness: 0.95 }),
    new THREE.Vector3(counter.position.x, counter.height + 0.045, -2.15),
    'lace-doily',
    24,
    false,
  );
  doily.receiveShadow = false;
  addCylinder(
    target,
    0.035,
    0.03,
    0.12,
    materialFactory.forEra(era, 'ceramic'),
    new THREE.Vector3(counter.position.x, counter.height + 0.11, -2.15),
    'dried-flower-vase',
    16,
  );
  const stems = new THREE.Group();
  for (let i = 0; i < 5; i += 1) {
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.003, 0.003, 0.16, 6),
      materialFactory.forEra(era, 'trim'),
    );
    stem.position.set(
      (i - 2) * 0.018,
      0.08 + (i % 2) * 0.02,
      Math.sin(i * 1.7) * 0.012,
    );
    stems.add(stem);
  }
  stems.position.set(counter.position.x, counter.height + 0.17, -2.15);
  stems.name = 'dried-flower-stems';
  target.add(stems);

  // Curtained display cabinet for cakes along the back wall.
  const cabinet = new THREE.Group();
  cabinet.name = 'cake-display-cabinet';
  const cabinetWood = walnut;
  addBox(cabinet, 0.95, 1.45, 0.36, cabinetWood, new THREE.Vector3(0, 0.725, 0), 'cabinet-body', true, true);
  addBox(cabinet, 0.89, 1.35, 0.02, cabinetWood, new THREE.Vector3(0, 0.75, 0.17), 'cabinet-back-panel', false, true);
  // Glass front.
  const glassFront = new THREE.Mesh(
    new THREE.PlaneGeometry(0.85, 1.3),
    materialFromSpec({
      kind: 'glass',
      color: '#C9D8D8',
      roughness: 0.08,
      transmission: 0.8,
      ior: 1.5,
      clearcoat: 0.6,
    }),
  );
  glassFront.position.set(0, 0.74, 0.182);
  glassFront.name = 'cabinet-glass-front';
  cabinet.add(glassFront);
  // Two shelves + a cake plate.
  addBox(cabinet, 0.85, 0.02, 0.3, cabinetWood, new THREE.Vector3(0, 0.5, 0), 'cabinet-shelf', false, true);
  addBox(cabinet, 0.85, 0.02, 0.3, cabinetWood, new THREE.Vector3(0, 0.95, 0), 'cabinet-shelf', false, true);
  const cakePlate = addCylinder(cabinet, 0.12, 0.12, 0.015, materialFactory.forEra(era, 'ceramic'), new THREE.Vector3(0.1, 0.51, 0.02), 'cake-plate', 20, false);
  cakePlate.receiveShadow = false;
  cabinet.position.set(4.85, 0, ROOM_BOUNDS.minZ + 0.18);
  target.add(cabinet);
}

// ---------------------------------------------------------------------------
// Coffee machines — lever espresso machine + manual grinder + cafetière
// ---------------------------------------------------------------------------

export function build1945CoffeeMachines(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const brass = materialFactory.forEra(era, 'brass');
  const walnut = materialFactory.forEra(era, 'wood');
  const glass = materialFactory.forEra(era, 'glass');
  const machineSlot = ANCHORS.machineSlot;
  const counterTopY = machineSlot.y;

  // Lever espresso machine (Gaggia-style) — chrome body, brass fittings.
  const machine = P.machineShell({
    groupHead: true,
    lever: true,
    steamWand: true,
    dripTray: true,
    material: chrome,
    accentMaterial: brass,
    width: 0.55,
    height: 0.5,
    depth: 0.45,
    castShadow: true,
  });
  machine.name = 'lever-espresso-machine';
  machine.position.set(machineSlot.x, counterTopY, machineSlot.z);
  target.add(machine);

  // Manual burr grinder on the counter beside the machine.
  const grinder = new THREE.Group();
  grinder.name = 'manual-burr-grinder';
  addBox(grinder, 0.17, 0.24, 0.17, walnut, new THREE.Vector3(0, 0.12, 0), 'grinder-body', true, true);
  addCylinder(grinder, 0.05, 0.03, 0.1, chrome, new THREE.Vector3(0, 0.29, 0), 'grinder-hopper', 16);
  addCylinder(grinder, 0.055, 0.055, 0.018, brass, new THREE.Vector3(0, 0.35, 0), 'grinder-lid', 16, false);
  addBox(grinder, 0.13, 0.05, 0.04, brass, new THREE.Vector3(0, 0.05, 0.09), 'grinder-drawer', false, true);
  // Crank arm.
  const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), chrome);
  crank.rotation.z = Math.PI / 2;
  crank.position.set(0.085, 0.3, 0);
  crank.name = 'grinder-crank';
  grinder.add(crank);
  const handle = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), brass);
  handle.position.set(0.14, 0.3, 0);
  handle.name = 'grinder-handle';
  grinder.add(handle);
  grinder.position.set(machineSlot.x, counterTopY, machineSlot.z - 0.6);
  target.add(grinder);

  // Cafetière / French press on the counter.
  const press = new THREE.Group();
  press.name = 'cafetiere-french-press';
  addCylinder(press, 0.04, 0.04, 0.16, glass, new THREE.Vector3(0, 0.08, 0), 'press-carafe', 20);
  addCylinder(press, 0.042, 0.042, 0.012, chrome, new THREE.Vector3(0, 0.174, 0), 'press-lid', 20, false);
  addCylinder(press, 0.004, 0.004, 0.14, chrome, new THREE.Vector3(0, 0.25, 0), 'press-plunger-rod', 6, false);
  const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.012, 16), walnut);
  plunger.position.set(0, 0.33, 0);
  plunger.name = 'press-plunger-cap';
  press.add(plunger);
  press.position.set(machineSlot.x, counterTopY, machineSlot.z - 1.15);
  target.add(press);
}

// ---------------------------------------------------------------------------
// Menu board — hand-painted chalkboard with 1945 prices
// ---------------------------------------------------------------------------

export function build1945MenuBoard(target: THREE.Group, era: EraYear): void {
  const palette = paletteFor(era);
  const menuMaterial = materialFromSpec({
    kind: 'chalkboard',
    color: palette.signage,
    roughness: 0.85,
    texture: {
      kind: 'chalkboard',
      color: palette.signage,
      color2: palette.neon,
      size: 512,
      title: 'Refreshments',
    },
  });
  const frameMaterial = materialFactory.forEra(era, 'trim');

  const board = P.frame({
    width: 1.6,
    height: 1.15,
    depth: 0.05,
    rail: 0.045,
    panelMaterial: menuMaterial,
    material: frameMaterial,
    castShadow: true,
  });
  board.name = 'menu-board';
  const anchor = ANCHORS.menuBoardWall;
  board.position.set(anchor.position.x, anchor.position.y, anchor.position.z + 0.03);
  target.add(board);
}

// ---------------------------------------------------------------------------
// Music source — wooden tabletop wireless (valve radio)
// ---------------------------------------------------------------------------

export function build1945MusicSource(target: THREE.Group, era: EraYear): void {
  const walnut = materialFactory.forEra(era, 'wood');
  const brass = materialFactory.forEra(era, 'brass');
  const grille = materialFromSpec({
    kind: 'fabric',
    color: '#2E2A22',
    roughness: 0.95,
  });
  const dialGlass = materialFromSpec({
    kind: 'glass',
    color: '#E8D9A8',
    roughness: 0.2,
    transmission: 0.35,
    clearcoat: 0.8,
  });

  const radio = new THREE.Group();
  radio.name = 'tabletop-wireless-radio';
  addBox(radio, 0.42, 0.24, 0.2, walnut, new THREE.Vector3(0, 0.12, 0), 'radio-body', true, true);
  // Speaker grille.
  addPlane(radio, 0.16, 0.13, grille, new THREE.Vector3(0, 0.13, 0.101), 'radio-grille');
  // Dial window + knobs.
  addPlane(radio, 0.16, 0.055, dialGlass, new THREE.Vector3(0, 0.205, 0.101), 'radio-dial');
  addCylinder(radio, 0.016, 0.016, 0.02, brass, new THREE.Vector3(-0.1, 0.06, 0.101), 'radio-knob', 10, false);
  addCylinder(radio, 0.016, 0.016, 0.02, brass, new THREE.Vector3(0.1, 0.06, 0.101), 'radio-knob', 10, false);
  // Feet.
  for (const x of [-0.16, 0.16]) {
    for (const z of [-0.07, 0.07]) {
      const foot = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), brass);
      foot.position.set(x, 0.008, z);
      foot.name = 'radio-foot';
      radio.add(foot);
    }
  }
  // On the counter, away from the machine zone.
  radio.position.set(ANCHORS.counter.position.x, ANCHORS.machineSlot.y, -2.7);
  target.add(radio);
}

// ---------------------------------------------------------------------------
// Posters — WWII / late-war and ration-era advertising prints
// ---------------------------------------------------------------------------

export function build1945Posters(target: THREE.Group, era: EraYear): void {
  const frameMaterial = materialFactory.forEra(era, 'trim');

  // Use the left-wall, right-wall and one back-wall poster anchors (the menu
  // board owns the centre of the back wall).
  const posterAnchors = [
    ANCHORS.posterWalls[0],
    ANCHORS.posterWalls[1],
    ANCHORS.posterWalls[2],
    ANCHORS.posterWalls[4],
  ];

  era1945.posters.forEach((poster, index) => {
    const anchor = posterAnchors[index];
    if (!anchor) return;
    const posterMaterial = materialFromSpec({
      kind: 'poster',
      color: '#A03A2E',
      roughness: 0.85,
      texture: {
        kind: 'poster',
        color: '#A03A2E',
        color2: '#F0E2C8',
        size: 512,
        title: poster.title,
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
// Tableware — thick ceramic cups & saucers, glass sugar pourers
// ---------------------------------------------------------------------------

export function build1945Tableware(target: THREE.Group, era: EraYear): void {
  const ceramic = materialFromSpec({
    kind: 'ceramic',
    color: '#F4EFE6',
    roughness: 0.3,
    clearcoat: 0.7,
  });
  const glass = materialFactory.forEra(era, 'glass');
  const marbleTopY = 0.81; // top surface of the marble slabs

  for (const seat of ANCHORS.seatingTables) {
    // Thick ceramic cup + saucer.
    const cup = P.cup({
      handle: true,
      saucerMaterial: ceramic,
      material: ceramic,
      height: 0.07,
      radius: 0.032,
      castShadow: true,
    });
    cup.name = 'ceramic-cup';
    cup.position.set(seat.x - 0.18, marbleTopY + 0.008, seat.z + 0.12);
    target.add(cup);

    const cup2 = P.cup({
      handle: true,
      saucerMaterial: ceramic,
      material: ceramic,
      height: 0.07,
      radius: 0.032,
      castShadow: true,
    });
    cup2.name = 'ceramic-cup';
    cup2.position.set(seat.x + 0.18, marbleTopY + 0.008, seat.z - 0.08);
    target.add(cup2);

    // Glass sugar pourer.
    const pourer = new THREE.Group();
    pourer.name = 'glass-sugar-pourer';
    addCylinder(pourer, 0.028, 0.02, 0.09, glass, new THREE.Vector3(0, 0.045, 0), 'pourer-body', 16);
    addCylinder(pourer, 0.014, 0.014, 0.03, glass, new THREE.Vector3(0, 0.1, 0), 'pourer-neck', 12, false);
    addCylinder(pourer, 0.016, 0.016, 0.008, glass, new THREE.Vector3(0, 0.125, 0), 'pourer-lip', 12, false);
    pourer.position.set(seat.x + 0.02, marbleTopY, seat.z + 0.16);
    target.add(pourer);
  }
}

// ---------------------------------------------------------------------------
// Signage & lighting — neon CAFÉ sign, incandescent pendant lamps
// ---------------------------------------------------------------------------

export function build1945SignageLighting(target: THREE.Group, era: EraYear): void {
  const palette = paletteFor(era);
  const neon = materialFactory.forEra(era, 'neon');
  const brass = materialFactory.forEra(era, 'brass');
  const darkMetal = materialFromSpec({
    kind: 'metal',
    color: '#1E1A14',
    roughness: 0.4,
    metalness: 0.7,
  });

  // Neon 'CAFÉ' sign over the door (storefront interior face).
  const sign = P.signage({
    neon: true,
    width: 1.7,
    height: 0.42,
    depth: 0.07,
    faceMaterial: materialFromSpec({
      kind: 'wall',
      color: '#2A2118',
      roughness: 0.7,
    }),
    frameMaterial: darkMetal,
    neonMaterial: neon,
  });
  sign.name = 'neon-cafe-sign';
  sign.position.set(
    ANCHORS.entrance.position.x,
    DOOR_HEIGHT + 0.35,
    ROOM_BOUNDS.maxZ - 0.03,
  );
  sign.rotation.y = Math.PI; // face into the room
  target.add(sign);

  // Incandescent pendant lamps at the ceiling lighting anchors.
  const pendantBulb = materialFromSpec({
    kind: 'neon',
    color: '#FFF2C4',
    emissive: palette.neon,
    emissiveIntensity: 2.6,
  });
  for (const point of ANCHORS.lighting) {
    const lamp = P.pendantLamp({
      height: 0.55,
      shadeRadius: 0.16,
      shadeHeight: 0.13,
      shadeMaterial: brass,
      stemMaterial: darkMetal,
      bulbMaterial: pendantBulb,
    });
    lamp.name = 'incandescent-pendant';
    lamp.position.copy(point);
    target.add(lamp);
  }

  // Two wall sconces flanking the menu board on the back wall.
  for (const x of [-1.5, 1.5]) {
    const sconce = P.wallLamp({
      arm: 0.18,
      shadeRadius: 0.09,
      shadeMaterial: brass,
      bulbMaterial: pendantBulb,
    });
    sconce.name = 'tungsten-sconce';
    sconce.position.set(x, 2.35, ROOM_BOUNDS.minZ + 0.02);
    target.add(sconce);
  }
}

// ---------------------------------------------------------------------------
// Counter technology — brass manual cash register
// ---------------------------------------------------------------------------

export function build1945CounterTechnology(target: THREE.Group, era: EraYear): void {
  const brass = materialFactory.forEra(era, 'brass');
  const chrome = materialFactory.forEra(era, 'chrome');
  const glass = materialFromSpec({
    kind: 'glass',
    color: '#E8E4D8',
    roughness: 0.2,
    transmission: 0.3,
    clearcoat: 0.8,
  });

  const register = new THREE.Group();
  register.name = 'brass-cash-register';
  addBox(register, 0.34, 0.2, 0.3, brass, new THREE.Vector3(0, 0.1, 0), 'register-body', true, true);
  // Display dome.
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    brass,
  );
  dome.position.set(0, 0.2, 0);
  dome.name = 'register-dome';
  register.add(dome);
  // Price window on the dome.
  const windowPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.04), glass);
  windowPlane.position.set(0, 0.22, 0.098);
  windowPlane.rotation.x = -0.5;
  windowPlane.name = 'register-price-window';
  register.add(windowPlane);
  // Key rows.
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 4; col += 1) {
      addCylinder(
        register,
        0.009,
        0.009,
        0.012,
        chrome,
        new THREE.Vector3(-0.1 + col * 0.065, 0.05 + row * 0.045, 0.152),
        'register-key',
        8,
        false,
      );
    }
  }
  // Cash drawer at the front base.
  addBox(register, 0.3, 0.06, 0.1, brass, new THREE.Vector3(0, 0.035, 0.15), 'register-drawer', false, true);

  register.position.set(ANCHORS.counter.position.x, ANCHORS.machineSlot.y, -3.55);
  target.add(register);
}

// ---------------------------------------------------------------------------
// Patrons — figures arrive in a later phase; EraData already describes them.
// ---------------------------------------------------------------------------

export function build1945Patrons(_target: THREE.Group, _era: EraYear): void {
  // Intentionally empty: the era data supplies outfits/hairstyles/gadgets, and
  // the registry label/tags expose them. Simple stylised figures can be added
  // without changing the fragment contract.
}

/** Build every 1945 fragment category into one group (convenience). */
export function build1945Scene(target: THREE.Group, era: EraYear): void {
  build1945Architecture(target, era);
  build1945FurnitureDecor(target, era);
  build1945CoffeeMachines(target, era);
  build1945MenuBoard(target, era);
  build1945MusicSource(target, era);
  build1945Posters(target, era);
  build1945Tableware(target, era);
  build1945SignageLighting(target, era);
  build1945CounterTechnology(target, era);
  build1945Patrons(target, era);
}

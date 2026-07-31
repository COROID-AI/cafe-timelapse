/**
 * src/scenes/eras/1985.ts — the 1985 eighties espresso-bar composition.
 *
 * Phase 4: turns the 1985 EraData record (src/data/eras/1985.ts) into real
 * Three.js geometry, composed from the shared procedural asset library
 * (TextureFactory / MaterialFactory / PropPrimitives) and mounted at the
 * canonical architecture anchors (src/world/layout.ts).
 *
 * Every builder is pure object-graph work (no WebGL), so the QA gates can
 * mount the fragment headlessly. The persistent café shell (floor, walls,
 * ceiling, counter zone, seating zone) stays era-neutral; this composition
 * dresses it with era finishes (terrazzo floor, peach wallpaper, chrome
 * rails, lots of chrome-framed mirrors, suspended acoustic ceiling) and
 * populates the anchors with tubular chrome tables + pastel Memphis tops,
 * the commercial espresso machine + grinder doser + glass decanters on
 * warmers, a neon-marker chalkboard menu at 1985 dollar prices, a
 * ghetto-blaster, synth-wave posters, stoneware cappuccino cups + glass
 * demitasse, pink/blue neon + track lighting, and the LED cash register.
 */
import * as THREE from 'three';
import type { EraYear } from '../../data/eras';
import { era1985 } from '../../data/eras/1985';
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

/**
 * Mount a wall piece (mirror frame / poster) at a wall anchor: copy the
 * anchor position, nudge it off the wall face along the normal, and rotate it
 * so its +Z face points into the room.
 */
function mountWallPiece(
  target: THREE.Group,
  piece: THREE.Group,
  position: THREE.Vector3,
  normal: THREE.Vector3,
): void {
  piece.position.copy(position).addScaledVector(normal, 0.03);
  if (normal.x > 0) piece.rotation.y = Math.PI / 2;
  else if (normal.x < 0) piece.rotation.y = -Math.PI / 2;
  target.add(piece);
}

// ---------------------------------------------------------------------------
// Architecture — terrazzo floor, peach walls, chrome rails + mirrors
// ---------------------------------------------------------------------------

export function build1985Architecture(target: THREE.Group, era: EraYear): void {
  const palette = paletteFor(era);
  const chrome = materialFactory.forEra(era, 'chrome');

  // Floor: terrazzo tiles with pink and grey flecks.
  const floorTexture = textureFactory.get({
    kind: 'tile',
    color: palette.floor,
    color2: '#E98BA0',
    size: 256,
    repeats: 15,
  });
  const floorMaterial = materialFromSpec({
    kind: 'floor',
    color: palette.floor,
    roughness: 0.55,
    texture: floorTexture.texture,
  });
  const floor = addPlane(
    target,
    ROOM_WIDTH,
    ROOM_DEPTH,
    floorMaterial,
    new THREE.Vector3(0, FINISH_OFFSET, 0),
    'terrazzo-floor',
  );
  // The floor plane faces +Z by default; rotate it flat onto the floor.
  floor.rotation.x = -Math.PI / 2;

  // Walls: peach wallpaper, full height.
  const wallTexture = textureFactory.get({
    kind: 'wallpaper',
    color: palette.walls,
    color2: '#D98BA0',
    size: 256,
    repeats: 3,
  });
  const wallMaterial = materialFromSpec({
    kind: 'wall',
    color: palette.walls,
    roughness: 0.9,
    texture: wallTexture.texture,
  });
  addPlane(
    target,
    ROOM_WIDTH,
    ROOM_HEIGHT,
    wallMaterial,
    new THREE.Vector3(0, ROOM_HEIGHT / 2, ROOM_BOUNDS.minZ + FINISH_OFFSET),
    'wall-back-peach',
  );
  addPlane(
    target,
    ROOM_DEPTH,
    ROOM_HEIGHT,
    wallMaterial,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET, ROOM_HEIGHT / 2, 0),
    'wall-left-peach',
    Math.PI / 2,
  );
  addPlane(
    target,
    ROOM_DEPTH,
    ROOM_HEIGHT,
    wallMaterial,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET, ROOM_HEIGHT / 2, 0),
    'wall-right-peach',
    -Math.PI / 2,
  );

  // Chrome rails at dado height.
  addBox(
    target,
    ROOM_WIDTH,
    0.04,
    0.03,
    chrome,
    new THREE.Vector3(0, 1.05, ROOM_BOUNDS.minZ + FINISH_OFFSET + 0.02),
    'chrome-rail-back',
    false,
  );
  addBox(
    target,
    0.03,
    0.04,
    ROOM_DEPTH,
    chrome,
    new THREE.Vector3(ROOM_BOUNDS.minX + FINISH_OFFSET + 0.02, 1.05, 0),
    'chrome-rail-left',
    false,
  );
  addBox(
    target,
    0.03,
    0.04,
    ROOM_DEPTH,
    chrome,
    new THREE.Vector3(ROOM_BOUNDS.maxX - FINISH_OFFSET - 0.02, 1.05, 0),
    'chrome-rail-right',
    false,
  );

  // Lots of mirrors: chrome-framed mirror panels on the back and side walls.
  const mirrorMaterial = materialFromSpec({
    kind: 'metal',
    color: '#CFE0EC',
    roughness: 0.04,
    metalness: 1,
  });
  const mirrorMounts: Array<{ position: THREE.Vector3; normal: THREE.Vector3 }> = [
    { position: new THREE.Vector3(-1.6, 1.9, ROOM_BOUNDS.minZ), normal: new THREE.Vector3(0, 0, 1) },
    { position: new THREE.Vector3(1.6, 1.9, ROOM_BOUNDS.minZ), normal: new THREE.Vector3(0, 0, 1) },
    { position: new THREE.Vector3(2.8, 1.9, ROOM_BOUNDS.minZ), normal: new THREE.Vector3(0, 0, 1) },
    { position: new THREE.Vector3(ROOM_BOUNDS.minX, 1.9, 2.8), normal: new THREE.Vector3(1, 0, 0) },
    { position: new THREE.Vector3(ROOM_BOUNDS.maxX, 1.9, 2.5), normal: new THREE.Vector3(-1, 0, 0) },
  ];
  for (const mount of mirrorMounts) {
    const mirror = P.frame({
      width: 1.1,
      height: 1.5,
      depth: 0.03,
      rail: 0.045,
      panelMaterial: mirrorMaterial,
      material: chrome,
    });
    mirror.name = 'chrome-mirror-panel';
    mountWallPiece(target, mirror, mount.position, mount.normal);
  }

  // Ceiling: suspended white acoustic panels.
  const ceilingTexture = textureFactory.get({
    kind: 'tile',
    color: palette.ceiling,
    color2: '#EFEBE2',
    size: 256,
    repeats: 10,
  });
  const ceilingMaterial = materialFromSpec({
    kind: 'ceiling',
    color: palette.ceiling,
    roughness: 0.85,
    texture: ceilingTexture.texture,
  });
  const ceiling = addPlane(
    target,
    ROOM_WIDTH,
    ROOM_DEPTH,
    ceilingMaterial,
    new THREE.Vector3(0, ROOM_HEIGHT - FINISH_OFFSET, 0),
    'suspended-ceiling',
  );
  ceiling.rotation.x = Math.PI / 2;
}

// ---------------------------------------------------------------------------
// Furniture & decor — tubular chrome tables, pastel Memphis tops, mirrors
// ---------------------------------------------------------------------------

export function build1985FurnitureDecor(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const pastelPink = materialFromSpec({
    kind: 'plastic',
    color: '#F2B8C6',
    roughness: 0.3,
    clearcoat: 0.6,
  });
  const pastelBlue = materialFromSpec({
    kind: 'plastic',
    color: '#A8D8E8',
    roughness: 0.3,
    clearcoat: 0.6,
  });
  const pastelSeatA = materialFromSpec({
    kind: 'fabric',
    color: '#D9A8C8',
    roughness: 0.9,
    sheen: 0.4,
  });
  const pastelSeatB = materialFromSpec({
    kind: 'fabric',
    color: '#A8C8E8',
    roughness: 0.9,
    sheen: 0.4,
  });

  for (const seat of ANCHORS.seatingTables) {
    // Chrome pedestal sleeve over the shell's neutral base — reads as a
    // tubular chrome table.
    const pedestal = addCylinder(
      target,
      0.27,
      0.29,
      0.73,
      chrome,
      new THREE.Vector3(seat.x, 0.365, seat.z),
      'chrome-table-pedestal',
      20,
    );
    pedestal.castShadow = true;

    // Pastel Memphis top over the shell top.
    const topMaterial = seat.x > 0 ? pastelPink : pastelBlue;
    const top = addCylinder(
      target,
      0.6,
      0.6,
      0.035,
      topMaterial,
      new THREE.Vector3(seat.x, 0.775 + 0.0175, seat.z),
      'memphis-table-top',
      28,
    );
    top.castShadow = true;

    // Chrome rim around the pastel top.
    const edge = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.012, 8, 32), chrome);
    edge.rotation.x = Math.PI / 2;
    edge.position.set(seat.x, 0.775 + 0.035, seat.z);
    edge.name = 'table-chrome-edge';
    target.add(edge);

    // Two tubular chrome chairs per table with pastel seats.
    const chairNorth = P.chair({
      material: chrome,
      seatMaterial: pastelSeatA,
      backMaterial: chrome,
      seatY: 0.46,
      backHeight: 0.55,
      castShadow: true,
      receiveShadow: true,
    });
    chairNorth.name = 'tubular-chrome-chair';
    chairNorth.position.set(seat.x + 0.75, 0, seat.z);
    chairNorth.rotation.y = -Math.PI / 2;
    target.add(chairNorth);

    const chairSouth = P.chair({
      material: chrome,
      seatMaterial: pastelSeatB,
      backMaterial: chrome,
      seatY: 0.46,
      backHeight: 0.55,
      castShadow: true,
      receiveShadow: true,
    });
    chairSouth.name = 'tubular-chrome-chair';
    chairSouth.position.set(seat.x - 0.75, 0, seat.z);
    chairSouth.rotation.y = Math.PI / 2;
    target.add(chairSouth);
  }

  // Chrome counter facing with a blue neon strip along the customer side.
  const counter = ANCHORS.counter;
  const frontX = counter.position.x - counter.depth / 2;
  addBox(
    target,
    0.03,
    counter.height,
    counter.length,
    chrome,
    new THREE.Vector3(frontX - 0.015, counter.position.y, counter.position.z),
    'counter-chrome-facing',
    false,
  );
  const blueNeon = materialFromSpec({
    kind: 'neon',
    color: '#29E6FF',
    roughness: 0.3,
    emissive: '#29E6FF',
    emissiveIntensity: 2.2,
  });
  addBox(
    target,
    0.02,
    0.035,
    counter.length * 0.9,
    blueNeon,
    new THREE.Vector3(frontX - 0.032, 0.32, counter.position.z),
    'counter-blue-neon-strip',
    false,
  );

  // Memphis wall clock on the back wall.
  const clock = new THREE.Group();
  clock.name = 'memphis-wall-clock';
  const clockFaceMaterial = materialFromSpec({
    kind: 'ceramic',
    color: '#F2E8D8',
    roughness: 0.5,
  });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.02, 24), clockFaceMaterial);
  face.rotation.x = Math.PI / 2;
  face.name = 'clock-face';
  clock.add(face);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.015, 8, 24), chrome);
  clockRim.rotation.x = Math.PI / 2;
  clockRim.name = 'clock-rim';
  clock.add(clockRim);
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 4), blueNeon);
    marker.position.set(Math.sin(angle) * 0.18, Math.cos(angle) * 0.18, 0.013);
    marker.name = 'clock-marker';
    clock.add(marker);
  }
  const clockHandMaterial = materialFromSpec({
    kind: 'metal',
    color: '#2A2A2E',
    roughness: 0.4,
    metalness: 0.7,
  });
  const hourHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.12, 0.006), clockHandMaterial);
  hourHand.position.set(0, 0.05, 0.014);
  hourHand.name = 'clock-hour-hand';
  clock.add(hourHand);
  const minuteHand = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.17, 0.006), clockHandMaterial);
  minuteHand.position.set(0.04, 0.015, 0.014);
  minuteHand.name = 'clock-minute-hand';
  clock.add(minuteHand);
  clock.position.set(-4.5, 2.5, ROOM_BOUNDS.minZ + FINISH_OFFSET + 0.04);
  target.add(clock);
}

// ---------------------------------------------------------------------------
// Coffee machines — commercial espresso machine + grinder doser + decanters
// ---------------------------------------------------------------------------

export function build1985CoffeeMachines(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const darkPlastic = materialFromSpec({
    kind: 'plastic',
    color: '#2A2A2E',
    roughness: 0.5,
    clearcoat: 0.3,
  });
  const glass = materialFromSpec({
    kind: 'glass',
    color: '#BFD9E8',
    roughness: 0.05,
    transmission: 0.9,
    ior: 1.5,
    clearcoat: 0.6,
  });
  const coffee = materialFromSpec({
    kind: 'ceramic',
    color: '#3A2414',
    roughness: 0.2,
  });
  const machineSlot = ANCHORS.machineSlot;
  const counterTopY = machineSlot.y;

  // Commercial espresso machine (pump groups, no lever).
  const machine = P.machineShell({
    groupHead: true,
    lever: false,
    steamWand: true,
    dripTray: true,
    material: chrome,
    accentMaterial: chrome,
    width: 0.55,
    height: 0.5,
    depth: 0.45,
    castShadow: true,
  });
  machine.name = 'commercial-espresso-machine';
  machine.position.set(machineSlot.x, counterTopY, machineSlot.z);
  target.add(machine);

  // Coffee grinder doser beside the machine.
  const grinder = new THREE.Group();
  grinder.name = 'grinder-doser';
  addBox(grinder, 0.2, 0.26, 0.22, chrome, new THREE.Vector3(0, 0.13, 0), 'grinder-body', true, true);
  addCylinder(grinder, 0.06, 0.05, 0.13, darkPlastic, new THREE.Vector3(0, 0.325, 0), 'grinder-hopper', 16);
  addCylinder(grinder, 0.065, 0.065, 0.015, chrome, new THREE.Vector3(0, 0.4, 0), 'grinder-lid', 16, false);
  addCylinder(grinder, 0.06, 0.06, 0.09, chrome, new THREE.Vector3(0, 0.17, 0.14), 'grinder-doser-chamber', 16);
  addCylinder(grinder, 0.05, 0.05, 0.02, darkPlastic, new THREE.Vector3(0, 0.19, 0.185), 'grinder-doser-knob', 12, false);
  addCylinder(grinder, 0.028, 0.035, 0.07, chrome, new THREE.Vector3(0, 0.09, 0.17), 'grinder-spout', 12);
  grinder.position.set(machineSlot.x, counterTopY, machineSlot.z - 0.65);
  target.add(grinder);

  // Glass decanters on warmers (batch brews kept hot).
  for (const dz of [-1.45, -1.15]) {
    const warmer = new THREE.Group();
    warmer.name = 'glass-decanter-warmer';
    addCylinder(warmer, 0.07, 0.075, 0.05, chrome, new THREE.Vector3(0, 0.025, 0), 'warmer-base', 16);
    addCylinder(warmer, 0.055, 0.05, 0.18, glass, new THREE.Vector3(0, 0.13, 0), 'decanter-carafe', 20);
    addCylinder(warmer, 0.048, 0.044, 0.05, coffee, new THREE.Vector3(0, 0.095, 0), 'decanter-coffee', 20, false);
    addCylinder(warmer, 0.02, 0.03, 0.05, glass, new THREE.Vector3(0, 0.245, 0), 'decanter-neck', 12, false);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.006, 8, 16), glass);
    handle.position.set(0, 0.13, 0.058);
    handle.rotation.y = Math.PI / 2;
    handle.name = 'decanter-handle';
    warmer.add(handle);
    warmer.position.set(machineSlot.x - 0.15, counterTopY, machineSlot.z + dz);
    target.add(warmer);
  }
}

// ---------------------------------------------------------------------------
// Menu board — neon-marker chalkboard with 1985 dollar prices
// ---------------------------------------------------------------------------

export function build1985MenuBoard(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const neonCyan = materialFromSpec({
    kind: 'neon',
    color: '#29E6FF',
    roughness: 0.3,
    emissive: '#29E6FF',
    emissiveIntensity: 2.4,
  });
  const neonPink = materialFromSpec({
    kind: 'neon',
    color: '#FF5AC8',
    roughness: 0.3,
    emissive: '#FF5AC8',
    emissiveIntensity: 2.4,
  });
  const menuMaterial = materialFromSpec({
    kind: 'chalkboard',
    color: '#2A2A34',
    roughness: 0.85,
    texture: {
      kind: 'chalkboard',
      color: '#2A2A34',
      color2: paletteFor(era).neon,
      size: 512,
      title: era1985.menuBoard.title,
    },
  });

  const board = P.frame({
    width: 1.7,
    height: 1.2,
    depth: 0.05,
    rail: 0.05,
    panelMaterial: menuMaterial,
    material: chrome,
    castShadow: true,
  });
  board.name = 'neon-chalkboard-menu';
  const anchor = ANCHORS.menuBoardWall;
  board.position.set(anchor.position.x, anchor.position.y, anchor.position.z + 0.03);
  target.add(board);

  // Neon marker tubes flanking the board (pink + cyan).
  const pinkTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 10), neonPink);
  pinkTube.position.set(anchor.position.x - 0.95, anchor.position.y, anchor.position.z + 0.045);
  pinkTube.name = 'menu-neon-marker-pink';
  target.add(pinkTube);
  const cyanTube = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.0, 10), neonCyan);
  cyanTube.position.set(anchor.position.x + 0.95, anchor.position.y, anchor.position.z + 0.045);
  cyanTube.name = 'menu-neon-marker-cyan';
  target.add(cyanTube);
}

// ---------------------------------------------------------------------------
// Music source — ghetto-blaster / boombox on the counter
// ---------------------------------------------------------------------------

export function build1985MusicSource(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const blackPlastic = materialFromSpec({
    kind: 'plastic',
    color: '#1E1E22',
    roughness: 0.4,
    clearcoat: 0.4,
  });
  const speakerGrille = materialFromSpec({
    kind: 'fabric',
    color: '#2A2A30',
    roughness: 0.95,
  });
  const cassetteWindow = materialFromSpec({
    kind: 'glass',
    color: '#141418',
    roughness: 0.2,
    transmission: 0.2,
    clearcoat: 0.6,
  });

  const boom = new THREE.Group();
  boom.name = 'ghetto-blaster-boombox';
  addBox(boom, 0.52, 0.2, 0.17, blackPlastic, new THREE.Vector3(0, 0.1, 0), 'boom-body', true, true);

  // Two speaker rings + cones.
  for (const x of [-0.16, 0.16]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 8, 20), chrome);
    ring.position.set(x, 0.13, 0.086);
    ring.rotation.y = Math.PI / 2;
    ring.name = 'boom-speaker-ring';
    boom.add(ring);
    const cone = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.075, 0.02, 20), speakerGrille);
    cone.rotation.x = Math.PI / 2;
    cone.position.set(x, 0.13, 0.086);
    cone.name = 'boom-speaker-cone';
    boom.add(cone);
  }

  // Cassette deck window + reels.
  addPlane(boom, 0.18, 0.07, cassetteWindow, new THREE.Vector3(0, 0.1, 0.086), 'boom-cassette-deck');
  for (const x of [-0.045, 0.045]) {
    const reel = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 6, 12), chrome);
    reel.position.set(x, 0.1, 0.087);
    reel.rotation.y = Math.PI / 2;
    reel.name = 'boom-reel';
    boom.add(reel);
  }

  // Control buttons.
  for (let i = 0; i < 4; i += 1) {
    addCylinder(
      boom,
      0.008,
      0.008,
      0.015,
      chrome,
      new THREE.Vector3(-0.09 + i * 0.03, 0.035, 0.086),
      'boom-button',
      8,
      false,
    );
  }

  // Carry handle arching over the top.
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.008, 8, 20, 0, Math.PI), chrome);
  handle.position.set(0, 0.22, 0);
  handle.name = 'boom-handle';
  boom.add(handle);

  // Telescopic antenna.
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.004, 0.35, 6), chrome);
  antenna.position.set(0.24, 0.28, 0);
  antenna.rotation.z = 0.35;
  antenna.name = 'boom-antenna';
  boom.add(antenna);

  boom.position.set(ANCHORS.counter.position.x, ANCHORS.machineSlot.y, -2.3);
  target.add(boom);
}

// ---------------------------------------------------------------------------
// Posters — neon / synth-wave coffee ads
// ---------------------------------------------------------------------------

export function build1985Posters(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const posterAnchors = [
    ANCHORS.posterWalls[0],
    ANCHORS.posterWalls[1],
    ANCHORS.posterWalls[2],
    ANCHORS.posterWalls[3],
  ];
  const posterColors = [
    { base: '#D94F8C', accent: '#29E6FF' },
    { base: '#5A2E8C', accent: '#FF5AC8' },
    { base: '#1E88C7', accent: '#FFD166' },
    { base: '#2E8C6E', accent: '#FF5AC8' },
  ];

  era1985.posters.forEach((poster, index) => {
    const anchor = posterAnchors[index];
    if (!anchor) return;
    const colors = posterColors[index] ?? posterColors[0];
    const posterMaterial = materialFromSpec({
      kind: 'poster',
      color: colors.base,
      roughness: 0.85,
      texture: {
        kind: 'poster',
        color: colors.base,
        color2: colors.accent,
        size: 512,
        title: poster.title,
      },
    });
    const frame = P.frame({
      width: 0.6,
      height: 0.78,
      depth: 0.03,
      rail: 0.03,
      panelMaterial: posterMaterial,
      material: chrome,
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
// Tableware — stoneware cappuccino cups + glass demitasse
// ---------------------------------------------------------------------------

export function build1985Tableware(target: THREE.Group, era: EraYear): void {
  const stoneware = materialFromSpec({
    kind: 'ceramic',
    color: '#B08968',
    roughness: 0.55,
    clearcoat: 0.25,
  });
  const demitasseGlass = materialFromSpec({
    kind: 'glass',
    color: '#CFE8F2',
    roughness: 0.08,
    transmission: 0.85,
    ior: 1.5,
    clearcoat: 0.6,
  });
  const saucer = materialFromSpec({
    kind: 'ceramic',
    color: '#E8D8C8',
    roughness: 0.45,
    clearcoat: 0.4,
  });
  const chrome = materialFactory.forEra(era, 'chrome');
  const tableTopY = 0.81; // top surface of the Memphis table tops

  for (const seat of ANCHORS.seatingTables) {
    // Stoneware cappuccino cup + saucer.
    const cup = P.cup({
      handle: true,
      saucerMaterial: saucer,
      material: stoneware,
      height: 0.075,
      radius: 0.034,
      castShadow: true,
    });
    cup.name = 'stoneware-cappuccino-cup';
    cup.position.set(seat.x - 0.18, tableTopY + 0.006, seat.z + 0.12);
    target.add(cup);

    // Glass demitasse on a chrome saucer.
    const demitasse = P.cup({
      glass: true,
      saucerMaterial: chrome,
      material: demitasseGlass,
      height: 0.055,
      radius: 0.027,
      castShadow: true,
    });
    demitasse.name = 'glass-demitasse';
    demitasse.position.set(seat.x + 0.18, tableTopY + 0.004, seat.z - 0.08);
    target.add(demitasse);
  }
}

// ---------------------------------------------------------------------------
// Signage & lighting — pink neon sign, track lighting, blue neon accents
// ---------------------------------------------------------------------------

export function build1985SignageLighting(target: THREE.Group, _era: EraYear): void {
  const neonPink = materialFromSpec({
    kind: 'neon',
    color: '#FF5AC8',
    roughness: 0.3,
    emissive: '#FF5AC8',
    emissiveIntensity: 2.6,
  });
  const neonCyan = materialFromSpec({
    kind: 'neon',
    color: '#29E6FF',
    roughness: 0.3,
    emissive: '#29E6FF',
    emissiveIntensity: 2.2,
  });
  const darkMetal = materialFromSpec({
    kind: 'metal',
    color: '#1E1E22',
    roughness: 0.4,
    metalness: 0.7,
  });
  const bulbMaterial = materialFromSpec({
    kind: 'neon',
    color: '#FFF2D0',
    emissive: '#FFD9A0',
    emissiveIntensity: 2.2,
  });

  // Pink neon "ESPRESSO BAR" sign over the door (storefront interior face).
  const sign = P.signage({
    neon: true,
    width: 1.9,
    height: 0.46,
    depth: 0.07,
    faceMaterial: materialFromSpec({
      kind: 'wall',
      color: '#2A1620',
      roughness: 0.7,
    }),
    frameMaterial: darkMetal,
    neonMaterial: neonPink,
  });
  sign.name = 'pink-neon-espresso-bar-sign';
  sign.position.set(
    ANCHORS.entrance.position.x,
    DOOR_HEIGHT + 0.35,
    ROOM_BOUNDS.maxZ - 0.03,
  );
  sign.rotation.y = Math.PI; // face into the room
  target.add(sign);

  // Track lighting at the ceiling lighting anchors.
  for (const point of ANCHORS.lighting) {
    const track = new THREE.Group();
    track.name = 'track-light';
    addBox(track, 0.9, 0.045, 0.06, darkMetal, new THREE.Vector3(0, -0.0225, 0), 'track-rail', false);
    for (const dx of [-0.28, 0, 0.28]) {
      const spot = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.07, 0.09, 12, 1, true), darkMetal);
      spot.position.set(dx, -0.09, 0);
      spot.name = 'track-spot';
      track.add(spot);
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), bulbMaterial);
      bulb.position.set(dx, -0.115, 0);
      bulb.name = 'track-spot-bulb';
      track.add(bulb);
    }
    track.position.copy(point);
    target.add(track);
  }

  // Blue neon accent strip on the back wall under the menu board.
  const accent = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.5, 10), neonCyan);
  accent.rotation.z = Math.PI / 2;
  accent.position.set(0, 1.45, ROOM_BOUNDS.minZ + 0.03);
  accent.name = 'back-wall-blue-neon-accent';
  target.add(accent);
}

// ---------------------------------------------------------------------------
// Counter technology — electronic LED cash register
// ---------------------------------------------------------------------------

export function build1985CounterTechnology(target: THREE.Group, era: EraYear): void {
  const chrome = materialFactory.forEra(era, 'chrome');
  const blackPlastic = materialFromSpec({
    kind: 'plastic',
    color: '#202024',
    roughness: 0.45,
    clearcoat: 0.35,
  });
  const keyMaterial = materialFromSpec({
    kind: 'plastic',
    color: '#C9CDD2',
    roughness: 0.35,
    clearcoat: 0.4,
  });
  const ledDisplay = materialFromSpec({
    kind: 'neon',
    color: '#C81E1E',
    roughness: 0.3,
    emissive: '#FF2A2A',
    emissiveIntensity: 2.4,
  });

  const register = new THREE.Group();
  register.name = 'led-cash-register';
  addBox(register, 0.38, 0.18, 0.32, blackPlastic, new THREE.Vector3(0, 0.09, 0), 'register-body', true, true);
  // Elevated display housing (faces the customer after the -Y rotation).
  addBox(register, 0.3, 0.1, 0.08, blackPlastic, new THREE.Vector3(0, 0.23, -0.1), 'register-display-housing', false, true);
  const display = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.05), ledDisplay);
  display.position.set(0, 0.25, -0.055);
  display.name = 'register-led-display';
  register.add(display);
  // Programmed price keys.
  for (let row = 0; row < 3; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      addBox(
        register,
        0.045,
        0.02,
        0.045,
        keyMaterial,
        new THREE.Vector3(-0.12 + col * 0.06, 0.045 + row * 0.035, 0.14),
        'register-key',
        false,
        false,
      );
    }
  }
  // Receipt printer slot.
  addBox(register, 0.14, 0.02, 0.06, blackPlastic, new THREE.Vector3(0, 0.185, 0.12), 'register-receipt-slot', false, false);
  // Cash drawer at the front base.
  addBox(register, 0.3, 0.05, 0.12, chrome, new THREE.Vector3(0, 0.03, 0.15), 'register-drawer', false, true);
  // Face the customer side of the counter (-X into the room).
  register.rotation.y = -Math.PI / 2;

  register.position.set(ANCHORS.counter.position.x, ANCHORS.machineSlot.y, -3.4);
  target.add(register);
}

// ---------------------------------------------------------------------------
// Patrons — figures arrive in a later phase; EraData already describes them.
// ---------------------------------------------------------------------------

export function build1985Patrons(_target: THREE.Group, _era: EraYear): void {
  // Intentionally empty: the era data supplies outfits/hairstyles/gadgets, and
  // the registry label/tags expose them. Simple stylised figures can be added
  // without changing the fragment contract.
}

/** Build every 1985 fragment category into one group (convenience). */
export function build1985Scene(target: THREE.Group, era: EraYear): void {
  build1985Architecture(target, era);
  build1985FurnitureDecor(target, era);
  build1985CoffeeMachines(target, era);
  build1985MenuBoard(target, era);
  build1985MusicSource(target, era);
  build1985Posters(target, era);
  build1985Tableware(target, era);
  build1985SignageLighting(target, era);
  build1985CounterTechnology(target, era);
  build1985Patrons(target, era);
}

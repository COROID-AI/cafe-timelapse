/**
 * Café Time Period Timelapse — shared architecture shell.
 *
 * Builds the era-agnostic room container that every period configuration
 * decorates: floor, back + side walls, ceiling, real window openings (with
 * frames and glass), a counter base, and an entrance door. Only the period
 * prop groups are swapped between eras; this shell stays fixed.
 *
 * @module cafe-shell
 */
import * as THREE from 'three';

// ---------------------------------------------------------------------------
// Dimensions (metres) — X width · Y height · Z depth
// ---------------------------------------------------------------------------

/** Café interior dimensions. Shared source of truth for the whole app. */
export const CAFE_DIMENSIONS = {
  width: 12,
  height: 3.5,
  depth: 10,
};

const WALL_THICKNESS = 0.2;

const COUNTER = {
  length: 4.2,
  height: 1.1,
  depth: 0.9,
  topThickness: 0.08,
};

// -- Neutral palette (period props overlay on top of these) -----------------
const PALETTE = {
  floor: 0x8a8a86, // light warm gray
  wall: 0xcabfa8, // muted beige
  ceiling: 0xece8df, // off-white
  counter: 0x4a443d, // neutral dark base
  counterTop: 0x6b6358, // neutral stone
  frame: 0x2c2c2c, // dark window/door frame
  glass: 0xbfe3ff, // cool daylight glass
  door: 0x5a4a38, // neutral wood door
  handle: 0xb8b0a4, // metal handle
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a named, shadow-casting/receiving Box mesh. */
function box(w, h, d, material, name) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/** Z position of the back wall's interior face. */
function backWallFaceZ() {
  return -CAFE_DIMENSIONS.depth / 2 + WALL_THICKNESS / 2;
}

// ---------------------------------------------------------------------------
// Window aperture: frame mullions + glass filling a wall opening
// ---------------------------------------------------------------------------

function buildWindowAperture(x, wallT, sillY, headY, zL, zR) {
  const frameMat = new THREE.MeshStandardMaterial({
    color: PALETTE.frame,
    roughness: 0.6,
    metalness: 0.2,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    color: PALETTE.glass,
    transparent: true,
    opacity: 0.32,
    roughness: 0.08,
    metalness: 0.0,
    emissive: 0x6699cc,
    emissiveIntensity: 0.12,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const ap = new THREE.Group();
  ap.name = 'windowAperture';

  const winW = zR - zL;
  const winH = headY - sillY;
  const cy = (sillY + headY) / 2;
  const cz = (zL + zR) / 2;
  const fr = 0.08; // frame thickness
  const bx = wallT + 0.02; // slight frame depth proud of wall

  const top = box(bx, fr, winW + fr, frameMat, 'winFrameTop');
  top.position.set(x, headY - fr / 2, cz);
  ap.add(top);

  const bottom = box(bx, fr, winW + fr, frameMat, 'winFrameBottom');
  bottom.position.set(x, sillY + fr / 2, cz);
  ap.add(bottom);

  const left = box(bx, winH, fr, frameMat, 'winFrameLeft');
  left.position.set(x, cy, zL + fr / 2);
  ap.add(left);

  const right = box(bx, winH, fr, frameMat, 'winFrameRight');
  right.position.set(x, cy, zR - fr / 2);
  ap.add(right);

  // Divided-light cross mullion
  const mullV = box(bx, winH, fr * 0.7, frameMat, 'winMullionV');
  mullV.position.set(x, cy, cz);
  ap.add(mullV);
  const mullH = box(bx, fr * 0.7, winW, frameMat, 'winMullionH');
  mullH.position.set(x, cy, cz);
  ap.add(mullH);

  // Glazing pane (oriented so its normal points along ±X)
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(winW - fr, winH - fr),
    glassMat
  );
  glass.name = 'windowGlass';
  glass.rotation.y = Math.PI / 2;
  glass.position.set(x, cy, cz);
  ap.add(glass);

  return ap;
}

/**
 * Build a side wall (in the Y-Z plane at the given X) with a single large
 * window opening. The wall is composed of solid panels that leave a real
 * rectangular hole, which is then framed and glazed.
 */
function buildSideWall(xSign, mat) {
  const { height: H, depth: D } = CAFE_DIMENSIONS;
  const wall = new THREE.Group();
  const x = (xSign * CAFE_DIMENSIONS.width) / 2;
  const t = WALL_THICKNESS;

  // Window aperture rectangle
  const winW = 3.4; // Z extent
  const winH = 1.9; // Y extent
  const sillY = 1.0;
  const headY = sillY + winH;
  const winZ = 1.4; // aperture centre along Z (toward the front)
  const zL = winZ - winW / 2;
  const zR = winZ + winW / 2;
  const bandH = headY - sillY;

  // Below sill — full depth band
  const below = box(t, sillY, D, mat, 'wallBelowWindow');
  below.position.set(x, sillY / 2, 0);
  wall.add(below);

  // Above header — full depth band
  const above = box(t, H - headY, D, mat, 'wallAboveWindow');
  above.position.set(x, (headY + H) / 2, 0);
  wall.add(above);

  // Left column of the band (Z from -D/2 .. zL)
  const colLW = zL + D / 2;
  if (colLW > 0.01) {
    const colL = box(t, bandH, colLW, mat, 'wallLeftColumn');
    colL.position.set(x, (sillY + headY) / 2, (zL - D / 2) / 2);
    wall.add(colL);
  }

  // Right column of the band (Z from zR .. D/2)
  const colRW = D / 2 - zR;
  if (colRW > 0.01) {
    const colR = box(t, bandH, colRW, mat, 'wallRightColumn');
    colR.position.set(x, (sillY + headY) / 2, (zR + D / 2) / 2);
    wall.add(colR);
  }

  wall.add(buildWindowAperture(x, t, sillY, headY, zL, zR));
  return wall;
}

// ---------------------------------------------------------------------------
// Door aperture: frame + slab + handle filling a back-wall opening
// ---------------------------------------------------------------------------

function buildDoorAperture(z, wallT, doorX, doorW, doorH) {
  const frameMat = new THREE.MeshStandardMaterial({
    color: PALETTE.frame,
    roughness: 0.6,
    metalness: 0.2,
  });
  const doorMat = new THREE.MeshStandardMaterial({
    color: PALETTE.door,
    roughness: 0.55,
    metalness: 0.05,
  });
  const handleMat = new THREE.MeshStandardMaterial({
    color: PALETTE.handle,
    roughness: 0.3,
    metalness: 0.8,
  });

  const ap = new THREE.Group();
  ap.name = 'doorAperture';
  const fr = 0.1;
  const bx = wallT + 0.02;

  const top = box(doorW + fr * 2, fr, bx, frameMat, 'doorFrameTop');
  top.position.set(doorX, doorH + fr / 2, z);
  ap.add(top);

  const left = box(fr, doorH, bx, frameMat, 'doorFrameLeft');
  left.position.set(doorX - doorW / 2 - fr / 2, doorH / 2, z);
  ap.add(left);

  const right = box(fr, doorH, bx, frameMat, 'doorFrameRight');
  right.position.set(doorX + doorW / 2 + fr / 2, doorH / 2, z);
  ap.add(right);

  // Door slab, set just inside the room
  const slab = box(doorW, doorH, 0.07, doorMat, 'doorSlab');
  slab.position.set(doorX, doorH / 2, z + wallT / 2 + 0.04);
  ap.add(slab);

  const handle = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 16, 12),
    handleMat
  );
  handle.name = 'doorHandle';
  handle.position.set(
    doorX + doorW / 2 - 0.18,
    doorH / 2,
    z + wallT / 2 + 0.085
  );
  ap.add(handle);

  return ap;
}

/** Back wall (X-Y plane) with an entrance door opening on the right side. */
function buildBackWall(mat) {
  const { width: W, height: H } = CAFE_DIMENSIONS;
  const wall = new THREE.Group();
  const z = backWallFaceZ();
  const t = WALL_THICKNESS;

  // Door aperture (right-hand side, away from the counter)
  const doorW = 1.1;
  const doorH = 2.1;
  const doorX = W / 2 - 1.3;
  const dL = doorX - doorW / 2;
  const dR = doorX + doorW / 2;

  // Main panel left of the door (X from -W/2 .. dL)
  const leftSpan = dL + W / 2;
  if (leftSpan > 0.01) {
    const left = box(leftSpan, H, t, mat, 'backWallLeft');
    left.position.set((dL - W / 2) / 2, H / 2, z);
    wall.add(left);
  }

  // Sliver right of the door (X from dR .. W/2)
  const rightSpan = W / 2 - dR;
  if (rightSpan > 0.01) {
    const right = box(rightSpan, H, t, mat, 'backWallRight');
    right.position.set((dR + W / 2) / 2, H / 2, z);
    wall.add(right);
  }

  // Header above the door (full width)
  const header = box(W, H - doorH, t, mat, 'backWallHeader');
  header.position.set(0, (doorH + H) / 2, z);
  wall.add(header);

  wall.add(buildDoorAperture(z, t, doorX, doorW, doorH));
  return wall;
}

// ---------------------------------------------------------------------------
// Counter base
// ---------------------------------------------------------------------------

function buildCounterBase() {
  const baseMat = new THREE.MeshStandardMaterial({
    color: PALETTE.counter,
    roughness: 0.7,
    metalness: 0.05,
  });
  const topMat = new THREE.MeshStandardMaterial({
    color: PALETTE.counterTop,
    roughness: 0.5,
    metalness: 0.1,
  });

  const g = new THREE.Group();
  g.name = 'counterBase';

  const { length, height: h, depth: d, topThickness } = COUNTER;
  const z = backWallFaceZ() + d / 2; // snug against the back wall

  const body = box(length, h, d, baseMat, 'counterBody');
  body.position.set(0, h / 2, z);
  g.add(body);

  const top = box(length + 0.08, topThickness, d + 0.08, topMat, 'counterTop');
  top.position.set(0, h + topThickness / 2, z);
  g.add(top);

  return g;
}

// ---------------------------------------------------------------------------
// Floor & ceiling
// ---------------------------------------------------------------------------

function buildFloor() {
  const { width: W, depth: D } = CAFE_DIMENSIONS;
  const mat = new THREE.MeshStandardMaterial({
    color: PALETTE.floor,
    roughness: 0.9,
    metalness: 0.0,
  });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat);
  floor.name = 'floor';
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  return floor;
}

function buildCeiling() {
  const { width: W, depth: D } = CAFE_DIMENSIONS;
  const mat = new THREE.MeshStandardMaterial({
    color: PALETTE.ceiling,
    roughness: 1.0,
    metalness: 0.0,
  });
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat);
  ceiling.name = 'ceiling';
  ceiling.rotation.x = Math.PI / 2; // face downward
  ceiling.position.y = CAFE_DIMENSIONS.height;
  ceiling.receiveShadow = true;
  return ceiling;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build the complete café architecture shell.
 *
 * @returns {THREE.Group} Group named 'CafeShell' containing the floor,
 *   ceiling, back + side walls (with window openings and a door), and the
 *   counter base. Not added to any scene — the caller is responsible for that.
 */
export function createCafeShell() {
  const group = new THREE.Group();
  group.name = 'CafeShell';
  group.userData.dimensions = CAFE_DIMENSIONS;

  const wallMat = new THREE.MeshStandardMaterial({
    color: PALETTE.wall,
    roughness: 0.95,
    metalness: 0.0,
  });

  group.add(buildFloor());
  group.add(buildCeiling());
  group.add(buildBackWall(wallMat));
  group.add(buildSideWall(-1, wallMat)); // left wall
  group.add(buildSideWall(1, wallMat)); // right wall
  group.add(buildCounterBase());

  return group;
}

/**
 * World-space anchor on top of the counter base, for period configurations to
 * place espresso machines, tills, etc.
 * @returns {THREE.Vector3}
 */
export function getCounterAnchor() {
  const { height: h, depth: d, topThickness } = COUNTER;
  return new THREE.Vector3(0, h + topThickness, backWallFaceZ() + d / 2);
}

export { COUNTER, WALL_THICKNESS };

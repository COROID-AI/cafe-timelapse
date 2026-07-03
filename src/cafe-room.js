/**
 * CafeRoom — Builds the base café interior shell.
 *
 * This is the static architecture that persists across all eras:
 *  - Floor (tile)
 *  - Walls (4 walls with plaster texture)
 *  - Ceiling
 *  - Window (opening in the back wall with a glow plane)
 *  - Counter (base structure with marble top)
 *
 * Era packs add furniture/decor on top of this shell via the contentGroup.
 *
 * Room dimensions (meters):
 *  Width  (X): 12
 *  Depth  (Z): 10
 *  Height (Y): 4
 */

import * as THREE from 'three';
import * as Textures from './procedural-textures.js';

// Room dimensions
export const ROOM_WIDTH = 12;
export const ROOM_DEPTH = 10;
export const ROOM_HEIGHT = 4;

// Wall thickness (exported for era packs that need to place objects against walls)
export const WALL_THICKNESS = 0.2;

/**
 * Build the complete café room shell.
 * @returns {THREE.Group} Group containing all room meshes
 */
export function buildCafeRoom() {
  const room = new THREE.Group();
  room.name = 'CafeRoom';

  // Generate textures
  const floorColorMap = Textures.tileFloorColor();
  const wallColorMap = Textures.plasterWallColor();
  const wallRoughnessMap = Textures.plasterWallRoughness();
  const ceilingColorMap = Textures.ceilingColor();
  const counterColorMap = Textures.marbleCounterColor();
  const woodColorMap = Textures.woodPlankColor();
  const woodRoughnessMap = Textures.woodPlankRoughness();

  // ─── Floor ───────────────────────────────────────────
  const floorGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  const floorMat = new THREE.MeshStandardMaterial({
    map: floorColorMap,
    roughness: 0.8,
    metalness: 0.0,
  });
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2; // Lay flat
  floor.position.y = 0;
  floor.receiveShadow = true;
  floor.name = 'Floor';
  room.add(floor);

  // ─── Ceiling ─────────────────────────────────────────
  const ceilingGeo = new THREE.PlaneGeometry(ROOM_WIDTH, ROOM_DEPTH);
  const ceilingMat = new THREE.MeshStandardMaterial({
    map: ceilingColorMap,
    roughness: 0.95,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });
  const ceiling = new THREE.Mesh(ceilingGeo, ceilingMat);
  ceiling.rotation.x = Math.PI / 2; // Face down
  ceiling.position.y = ROOM_HEIGHT;
  ceiling.receiveShadow = true;
  ceiling.name = 'Ceiling';
  room.add(ceiling);

  // ─── Walls ───────────────────────────────────────────
  // Wall materials (shared)
  const wallMat = new THREE.MeshStandardMaterial({
    map: wallColorMap,
    roughnessMap: wallRoughnessMap,
    roughness: 0.9,
    metalness: 0.0,
    side: THREE.DoubleSide,
  });

  // Back wall (Z = -ROOM_DEPTH/2) — has window opening
  // We build it as 3 segments: left of window, above window, right of window
  const windowWidth = 4;
  const windowHeight = 2.5;
  const windowSillHeight = 1.0;
  const windowCenterX = 0;

  // Left of window
  const leftWidth = (ROOM_WIDTH - windowWidth) / 2 + windowCenterX;
  if (leftWidth > 0.01) {
    const leftWallGeo = new THREE.PlaneGeometry(leftWidth, ROOM_HEIGHT);
    const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
    leftWall.position.set(
      -ROOM_WIDTH / 2 + leftWidth / 2,
      ROOM_HEIGHT / 2,
      -ROOM_DEPTH / 2,
    );
    leftWall.receiveShadow = true;
    leftWall.name = 'WallBackLeft';
    room.add(leftWall);
  }

  // Right of window
  const rightStart = windowCenterX + windowWidth / 2;
  const rightWidth = ROOM_WIDTH / 2 - rightStart;
  if (rightWidth > 0.01) {
    const rightWallGeo = new THREE.PlaneGeometry(rightWidth, ROOM_HEIGHT);
    const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
    rightWall.position.set(
      rightStart + rightWidth / 2,
      ROOM_HEIGHT / 2,
      -ROOM_DEPTH / 2,
    );
    rightWall.receiveShadow = true;
    rightWall.name = 'WallBackRight';
    room.add(rightWall);
  }

  // Above window
  const aboveHeight = ROOM_HEIGHT - (windowSillHeight + windowHeight);
  if (aboveHeight > 0.01) {
    const aboveGeo = new THREE.PlaneGeometry(windowWidth, aboveHeight);
    const aboveWall = new THREE.Mesh(aboveGeo, wallMat);
    aboveWall.position.set(
      windowCenterX,
      windowSillHeight + windowHeight + aboveHeight / 2,
      -ROOM_DEPTH / 2,
    );
    aboveWall.receiveShadow = true;
    aboveWall.name = 'WallBackAboveWindow';
    room.add(aboveWall);
  }

  // Below window (sill area)
  if (windowSillHeight > 0.01) {
    const belowGeo = new THREE.PlaneGeometry(windowWidth, windowSillHeight);
    const belowWall = new THREE.Mesh(belowGeo, wallMat);
    belowWall.position.set(
      windowCenterX,
      windowSillHeight / 2,
      -ROOM_DEPTH / 2,
    );
    belowWall.receiveShadow = true;
    belowWall.name = 'WallBackBelowWindow';
    room.add(belowWall);
  }

  // Window glow plane (simulated daylight)
  const windowGlowGeo = new THREE.PlaneGeometry(windowWidth, windowHeight);
  const windowGlowMat = new THREE.MeshBasicMaterial({
    color: 0xb0d4f1,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
  });
  const windowGlow = new THREE.Mesh(windowGlowGeo, windowGlowMat);
  windowGlow.position.set(
    windowCenterX,
    windowSillHeight + windowHeight / 2,
    -ROOM_DEPTH / 2 + 0.01, // Slight offset to avoid z-fighting
  );
  windowGlow.name = 'WindowGlow';
  room.add(windowGlow);

  // Window frame
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x4a3a2a,
    roughness: 0.7,
    metalness: 0.1,
  });
  const frameThickness = 0.08;
  const frameDepth = 0.15;

  // Vertical frame pieces
  for (const fx of [windowCenterX - windowWidth / 2, windowCenterX + windowWidth / 2]) {
    const frameGeo = new THREE.BoxGeometry(frameThickness, windowHeight, frameDepth);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(fx, windowSillHeight + windowHeight / 2, -ROOM_DEPTH / 2 + frameDepth / 2);
    frame.name = 'WindowFrameVertical';
    room.add(frame);
  }

  // Horizontal frame pieces (sill + top)
  for (const fy of [windowSillHeight, windowSillHeight + windowHeight]) {
    const frameGeo = new THREE.BoxGeometry(windowWidth + frameThickness, frameThickness, frameDepth);
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(windowCenterX, fy, -ROOM_DEPTH / 2 + frameDepth / 2);
    frame.name = 'WindowFrameHorizontal';
    room.add(frame);
  }

  // Window cross (mullion)
  const mullionVGeo = new THREE.BoxGeometry(frameThickness * 0.7, windowHeight, frameDepth * 0.6);
  const mullionV = new THREE.Mesh(mullionVGeo, frameMat);
  mullionV.position.set(windowCenterX, windowSillHeight + windowHeight / 2, -ROOM_DEPTH / 2 + frameDepth / 2);
  mullionV.name = 'WindowMullionVertical';
  room.add(mullionV);

  const mullionHGeo = new THREE.BoxGeometry(windowWidth, frameThickness * 0.7, frameDepth * 0.6);
  const mullionH = new THREE.Mesh(mullionHGeo, frameMat);
  mullionH.position.set(windowCenterX, windowSillHeight + windowHeight / 2, -ROOM_DEPTH / 2 + frameDepth / 2);
  mullionH.name = 'WindowMullionHorizontal';
  room.add(mullionH);

  // Front wall (Z = +ROOM_DEPTH/2) — has doorway opening
  const doorWidth = 2;
  const doorHeight = 2.4;
  const doorCenterX = 0;

  // Left of door
  const doorLeftWidth = (ROOM_WIDTH - doorWidth) / 2 + doorCenterX;
  if (doorLeftWidth > 0.01) {
    const geo = new THREE.PlaneGeometry(doorLeftWidth, ROOM_HEIGHT);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(
      -ROOM_WIDTH / 2 + doorLeftWidth / 2,
      ROOM_HEIGHT / 2,
      ROOM_DEPTH / 2,
    );
    wall.rotation.y = Math.PI; // Face inward
    wall.receiveShadow = true;
    wall.name = 'WallFrontLeft';
    room.add(wall);
  }

  // Right of door
  const doorRightStart = doorCenterX + doorWidth / 2;
  const doorRightWidth = ROOM_WIDTH / 2 - doorRightStart;
  if (doorRightWidth > 0.01) {
    const geo = new THREE.PlaneGeometry(doorRightWidth, ROOM_HEIGHT);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(
      doorRightStart + doorRightWidth / 2,
      ROOM_HEIGHT / 2,
      ROOM_DEPTH / 2,
    );
    wall.rotation.y = Math.PI;
    wall.receiveShadow = true;
    wall.name = 'WallFrontRight';
    room.add(wall);
  }

  // Above door
  const doorAboveHeight = ROOM_HEIGHT - doorHeight;
  if (doorAboveHeight > 0.01) {
    const geo = new THREE.PlaneGeometry(doorWidth, doorAboveHeight);
    const wall = new THREE.Mesh(geo, wallMat);
    wall.position.set(
      doorCenterX,
      doorHeight + doorAboveHeight / 2,
      ROOM_DEPTH / 2,
    );
    wall.rotation.y = Math.PI;
    wall.receiveShadow = true;
    wall.name = 'WallFrontAboveDoor';
    room.add(wall);
  }

  // Left wall (X = -ROOM_WIDTH/2)
  const leftWallGeo = new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT);
  const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
  leftWall.position.set(-ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  leftWall.rotation.y = Math.PI / 2;
  leftWall.receiveShadow = true;
  leftWall.name = 'WallLeft';
  room.add(leftWall);

  // Right wall (X = +ROOM_WIDTH/2)
  const rightWallGeo = new THREE.PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT);
  const rightWall = new THREE.Mesh(rightWallGeo, wallMat);
  rightWall.position.set(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0);
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.receiveShadow = true;
  rightWall.name = 'WallRight';
  room.add(rightWall);

  // ─── Baseboard trim ──────────────────────────────────
  const baseboardMat = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    roughness: 0.6,
    metalness: 0.05,
  });
  const baseboardHeight = 0.15;

  // Front and back baseboards
  for (const z of [-ROOM_DEPTH / 2 + 0.02, ROOM_DEPTH / 2 - 0.02]) {
    const geo = new THREE.BoxGeometry(ROOM_WIDTH, baseboardHeight, 0.04);
    const board = new THREE.Mesh(geo, baseboardMat);
    board.position.set(0, baseboardHeight / 2, z);
    board.name = 'Baseboard';
    room.add(board);
  }

  // Left and right baseboards
  for (const x of [-ROOM_WIDTH / 2 + 0.02, ROOM_WIDTH / 2 - 0.02]) {
    const geo = new THREE.BoxGeometry(0.04, baseboardHeight, ROOM_DEPTH);
    const board = new THREE.Mesh(geo, baseboardMat);
    board.position.set(x, baseboardHeight / 2, 0);
    board.name = 'Baseboard';
    room.add(board);
  }

  // ─── Counter ─────────────────────────────────────────
  const counterGroup = new THREE.Group();
  counterGroup.name = 'Counter';

  // Counter base (wood)
  const counterWidth = 4;
  const counterDepth = 1.2;
  const counterHeight = 1.1;
  const counterX = 0;
  const counterZ = -ROOM_DEPTH / 2 + counterDepth / 2 + 0.5; // Near back wall

  const counterBaseMat = new THREE.MeshStandardMaterial({
    map: woodColorMap,
    roughnessMap: woodRoughnessMap,
    roughness: 0.7,
    metalness: 0.05,
  });

  const counterBaseGeo = new THREE.BoxGeometry(counterWidth, counterHeight, counterDepth);
  const counterBase = new THREE.Mesh(counterBaseGeo, counterBaseMat);
  counterBase.position.set(counterX, counterHeight / 2, counterZ);
  counterBase.castShadow = true;
  counterBase.receiveShadow = true;
  counterBase.name = 'CounterBase';
  counterGroup.add(counterBase);

  // Counter top (marble)
  const counterTopGeo = new THREE.BoxGeometry(counterWidth + 0.1, 0.08, counterDepth + 0.1);
  const counterTopMat = new THREE.MeshStandardMaterial({
    map: counterColorMap,
    roughness: 0.3,
    metalness: 0.1,
  });
  const counterTop = new THREE.Mesh(counterTopGeo, counterTopMat);
  counterTop.position.set(counterX, counterHeight + 0.04, counterZ);
  counterTop.castShadow = true;
  counterTop.receiveShadow = true;
  counterTop.name = 'CounterTop';
  counterGroup.add(counterTop);

  // Counter front panel (decorative)
  const panelGeo = new THREE.BoxGeometry(counterWidth - 0.4, 0.6, 0.04);
  const panelMat = new THREE.MeshStandardMaterial({
    color: 0x5a4030,
    roughness: 0.6,
    metalness: 0.1,
  });
  const panel = new THREE.Mesh(panelGeo, panelMat);
  panel.position.set(counterX, 0.4, counterZ + counterDepth / 2 + 0.01);
  panel.name = 'CounterPanel';
  counterGroup.add(panel);

  room.add(counterGroup);

  // ─── Crown molding at ceiling junction ───────────────
  const moldingMat = new THREE.MeshStandardMaterial({
    color: 0xe8e0d5,
    roughness: 0.5,
    metalness: 0.0,
  });

  for (const [x, z, rotY, w] of [
    [0, -ROOM_DEPTH / 2 + 0.05, 0, ROOM_WIDTH],
    [0, ROOM_DEPTH / 2 - 0.05, 0, ROOM_WIDTH],
    [-ROOM_WIDTH / 2 + 0.05, 0, Math.PI / 2, ROOM_DEPTH],
    [ROOM_WIDTH / 2 - 0.05, 0, Math.PI / 2, ROOM_DEPTH],
  ]) {
    const geo = new THREE.BoxGeometry(w, 0.1, 0.1);
    const molding = new THREE.Mesh(geo, moldingMat);
    molding.position.set(x, ROOM_HEIGHT - 0.05, z);
    molding.rotation.y = rotY;
    molding.name = 'Molding';
    room.add(molding);
  }

  return room;
}

export default { buildCafeRoom, ROOM_WIDTH, ROOM_DEPTH, ROOM_HEIGHT };

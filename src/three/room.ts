import * as THREE from 'three';
import { matColor, matRough, matWood, matGlass, matMetal } from './materials';
import type { InterpolatedColors } from './transition';

export const ROOM = {
  width: 10,
  depth: 12,
  height: 3.3,
  wallThickness: 0.14,
};

const W = ROOM.width;
const D = ROOM.depth;
const H = ROOM.height;
const T = ROOM.wallThickness;

/** Tag a material with a room role so per-frame recolor can find it. */
function role(mat: THREE.Material, roomRole: string): THREE.Material {
  mat.userData.roomRole = roomRole;
  return mat;
}

function box(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  material: THREE.Material,
): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

/**
 * Build the static café room shell: floor, ceiling, back/side walls.
 * The front (south, +z) wall is left open so the camera can look in.
 * Materials are tagged with room roles and recolored per-frame during
 * era cross-fades; discrete props live in era decor groups.
 */
export function buildRoomShell(
  colors: Pick<InterpolatedColors, 'floor' | 'ceiling' | 'wall' | 'trim'>,
): THREE.Group {
  const g = new THREE.Group();
  g.name = 'RoomShell';

  // Floor
  const floorMat = role(matRough(colors.floor, 0.92), 'floor');
  const floor = box(W, 0.16, D, 0, -0.08, 0, floorMat);
  floor.receiveShadow = true;
  g.add(floor);

  // Simple plank lines on the floor
  const lineMat = matColor('#000000', { roughness: 0.92, transparent: true, opacity: 0.06 });
  for (let i = -4; i <= 4; i += 1.6) {
    const plank = box(0.03, 0.005, D - 0.4, i, 0.012, 0, lineMat);
    g.add(plank);
  }

  // Ceiling
  const ceilMat = role(matRough(colors.ceiling, 0.88), 'ceiling');
  const ceiling = box(W + 0.4, 0.14, D + 0.4, 0, H + 0.07, 0, ceilMat);
  ceiling.receiveShadow = true;
  g.add(ceiling);

  // Back wall (north, z = -D/2)
  const wallMat = role(matRough(colors.wall, 0.9), 'wall');
  const back = box(W + 2 * T, H + 0.2, T, 0, H / 2, -D / 2 - T / 2, wallMat);
  back.receiveShadow = true;
  g.add(back);

  // Left wall (west, x = -W/2)
  const left = box(T, H + 0.2, D + 2 * T, -W / 2 - T / 2, H / 2, 0, wallMat);
  left.receiveShadow = true;
  g.add(left);

  // Right wall (east, x = W/2)
  const right = box(T, H + 0.2, D + 2 * T, W / 2 + T / 2, H / 2, 0, wallMat);
  right.receiveShadow = true;
  g.add(right);

  // Wainscot trim along the back wall
  const trimMat = role(matWood(colors.trim), 'trim');
  const wainscot = box(W - 1.2, 0.9, 0.06, 0, 0.45, -D / 2 + 0.02, trimMat);
  g.add(wainscot);

  // Ceiling coves
  for (const [x, z] of [
    [-W / 2 + 0.15, 0],
    [W / 2 - 0.15, 0],
    [0, -D / 2 + 0.15],
    [0, D / 2 - 0.15],
  ] as const) {
    const cove = box(x === 0 ? W - 0.3 : 0.12, 0.12, z === 0 ? D - 0.3 : 0.12, x, H - 0.06, z, trimMat);
    g.add(cove);
  }

  // Front window frames (openings toward the camera): a hollow frame with a
  // transparent glass pane so the café interior (and its patrons) stays
  // visible through the storefront instead of being hidden by a solid panel.
  const frameMat = role(matWood(colors.trim), 'trim');
  const glassMat = matGlass('#cfe8ff', 0.22);
  const frameW = 3.4;
  const frameH = 1.7;
  const fx = 1.9;
  const fz = D / 2 - 0.05;
  const fy = 1.6;
  const outerW = frameW + 0.16;
  const outerH = frameH + 0.16;
  const border = 0.1;
  // frame border (top, bottom, left, right) around the glass opening
  g.add(box(outerW, border, 0.1, fx, fy + outerH / 2 - border / 2, fz, frameMat));
  g.add(box(outerW, border, 0.1, fx, fy - outerH / 2 + border / 2, fz, frameMat));
  g.add(box(border, outerH, 0.1, fx - outerW / 2 + border / 2, fy, fz, frameMat));
  g.add(box(border, outerH, 0.1, fx + outerW / 2 - border / 2, fy, fz, frameMat));
  // glass pane inside the opening
  g.add(box(frameW, frameH, 0.04, fx, fy, fz - 0.02, glassMat));
  // mullions
  g.add(box(0.06, frameH, 0.06, fx, fy, fz - 0.03, frameMat));
  g.add(box(frameW, 0.06, 0.06, fx, fy, fz - 0.03, frameMat));

  // A second small window on the left wall
  g.add(box(1.9 + 0.14, 1.2 + 0.14, 0.1, -W / 2 + 0.02, 1.7, 0.6, frameMat));
  g.add(box(1.9, 1.2, 0.04, -W / 2 + 0.01, 1.7, 0.6, glassMat));

  // Wall-mounted shelves on the back wall (decorated per-era)
  for (const [sx, sz] of [
    [-2.6, -D / 2 + 0.09],
    [2.5, -D / 2 + 0.09],
  ] as const) {
    const shelf = box(1.7, 0.06, 0.3, sx, 2.0, sz, trimMat);
    g.add(shelf);
  }

  // Ceiling light fixture pole
  const poleMat = matMetal('#9a9a9a');
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H - 2.2, 12), poleMat);
  pole.position.set(0, H / 2 + 0.4, 0);
  g.add(pole);

  // Door on the right wall, slightly ajar
  const doorMat = role(matWood(colors.trim), 'trim');
  const door = box(1.5, 2.2, 0.08, W / 2 - 0.02, 1.1, -1.4, doorMat);
  door.rotation.y = 0.35;
  g.add(door);
  const knobMat = matMetal('#c9a227', 0.2);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 12), knobMat);
  knob.position.set(W / 2 - 0.28, 1.0, -0.7);
  g.add(knob);

  return g;
}

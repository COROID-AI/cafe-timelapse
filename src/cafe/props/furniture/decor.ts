/**
 * Era décor builders: the small period-telling pieces that sit on, beside or
 * above the furniture — doilies, blackout curtains, jukebox corner hint,
 * checkerboard lino, ferns, neon accents, lounge rug & wall frames, hanging
 * plants and wireless-charging spots.
 */

import * as THREE from 'three';
import type { MaterialKit } from './materials';
import type { PieceDeps } from './geometry';
import { boxMesh, cylMesh } from './geometry';

/* ----- 1945 ------------------------------------------------------------- */

/** Crocheted lace doily laid flat on a tabletop. */
export function buildDoily(deps: PieceDeps, kit: MaterialKit, topY: number): THREE.Group {
  const group = new THREE.Group();
  const lace = kit.std({
    color: '#f4efe4',
    roughness: 0.85,
    side: THREE.DoubleSide,
  });
  const ring = new THREE.Mesh(deps.geo.ring(0.17, 0.29, 22), lace);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = topY + 0.003;
  ring.castShadow = false;
  ring.receiveShadow = true;
  ring.name = 'doily';
  group.add(ring);
  const scallop = new THREE.Mesh(deps.geo.torus(0.29, 0.007, 5, 26), lace);
  scallop.rotation.x = -Math.PI / 2;
  scallop.position.y = topY + 0.004;
  scallop.castShadow = false;
  group.add(scallop);
  const centre = new THREE.Mesh(deps.geo.circle(0.1, 18), lace);
  centre.rotation.x = -Math.PI / 2;
  centre.position.y = topY + 0.0028;
  centre.castShadow = false;
  centre.receiveShadow = true;
  group.add(centre);
  return group;
}

export interface CurtainSpot {
  /** Window opening width in metres. */
  width: number;
  /** True → panels fully drawn across the opening (blackout). */
  drawn: boolean;
}

/** Heavy blackout-curtain remnants hung inside a window reveal. */
export function buildBlackoutCurtain(
  deps: PieceDeps,
  kit: MaterialKit,
  spot: CurtainSpot,
): THREE.Group {
  const group = new THREE.Group();
  const cloth = kit.std({ color: '#453f31', roughness: 0.98 });
  const lining = kit.std({ color: '#37332a', roughness: 0.98 });
  const w = spot.width;

  if (spot.drawn) {
    const panel = boxMesh(deps, cloth, w * 0.98, 1.72, 0.03, 0, 2.6 - 0.87, 0.02, 'blackout');
    panel.rotation.z = 0.008;
    group.add(panel);
    // Patched seam down the drawn curtain.
    group.add(boxMesh(deps, lining, w * 0.16, 0.34, 0.034, w * 0.12, 1.35, 0.021));
  } else {
    for (const side of [-1, 1]) {
      const panel = boxMesh(deps, cloth, w * 0.3, 1.72, 0.03, side * w * 0.33, 1.73, 0.02, 'blackout');
      panel.rotation.y = -side * 0.14;
      panel.rotation.z = side * 0.01;
      group.add(panel);
    }
  }
  // Rolled-up remnant resting on the sill rod.
  const roll = cylMesh(deps, lining, 0.055, 0.055, w * 0.72, 10, 0, 2.66, 0.04);
  roll.rotation.z = Math.PI / 2;
  group.add(roll);
  return group;
}

/* ----- 1965 ------------------------------------------------------------- */

const LINO_TILE = 0.9;

/** Red-and-cream checkerboard lino patch covering the central dining area. */
export function buildCheckerLino(
  deps: PieceDeps,
  kit: MaterialKit,
  halfX: number,
  halfZ: number,
): THREE.Group {
  const group = new THREE.Group();
  const cream = kit.std({ color: '#e6dfcd', roughness: 0.35 });
  const red = kit.std({ color: '#a63a30', roughness: 0.38 });
  const cols = Math.ceil((halfX * 2) / LINO_TILE);
  const rows = Math.ceil((halfZ * 2) / LINO_TILE);
  const startX = -(cols * LINO_TILE) / 2 + LINO_TILE / 2;
  const startZ = -(rows * LINO_TILE) / 2 + LINO_TILE / 2;
  for (let c = 0; c < cols; c += 1) {
    for (let r = 0; r < rows; r += 1) {
      const tile = boxMesh(
        deps,
        (c + r) % 2 === 0 ? cream : red,
        LINO_TILE - 0.006,
        0.008,
        LINO_TILE - 0.006,
        startX + c * LINO_TILE,
        0.046,
        startZ + r * LINO_TILE,
        'lino',
      );
      tile.castShadow = false;
      group.add(tile);
    }
  }
  return group;
}

/**
 * Jukebox corner hint: a glowing arched cabinet silhouette with colour
 * strips — present but deliberately not a fully detailed machine.
 */
export function buildJukeboxHint(deps: PieceDeps, kit: MaterialKit): THREE.Group {
  const group = new THREE.Group();
  const body = kit.std({ color: '#571f20', roughness: 0.32, metalness: 0.15 });
  const glowWarm = kit.std({ color: '#2b1416', emissive: '#ffb347', emissiveIntensity: 1.1 });
  const glowPink = kit.std({ color: '#200d16', emissive: '#ff4f9e', emissiveIntensity: 1.3 });
  const glowCyan = kit.std({ color: '#0d1620', emissive: '#39c8de', emissiveIntensity: 1.1 });

  group.add(boxMesh(deps, body, 0.84, 1.08, 0.52, 0, 0.58, 0, 'jukebox'));
  const arch = new THREE.Mesh(deps.geo.extrudedArch(0.42, 0.52), body);
  arch.position.set(0, 1.12, 0);
  group.add(arch);
  const window_ = new THREE.Mesh(deps.geo.extrudedArch(0.3, 0.54), glowWarm);
  window_.position.set(0, 1.12, 0);
  window_.castShadow = false;
  window_.name = 'jukebox-glow';
  group.add(window_);
  for (const sx of [-0.37, 0.37]) {
    const strip = boxMesh(deps, glowPink, 0.06, 0.92, 0.02, sx, 0.66, 0.27);
    strip.castShadow = false;
    group.add(strip);
  }
  // Button rail under the arch.
  for (let i = 0; i < 6; i += 1) {
    const button = cylMesh(deps, i % 2 === 0 ? glowCyan : glowPink, 0.02, 0.02, 0.02, 8, -0.25 + i * 0.1, 1.02, 0.27);
    button.rotation.x = Math.PI / 2;
    button.castShadow = false;
    group.add(button);
  }
  group.add(boxMesh(deps, body, 0.9, 0.09, 0.56, 0, 0.045, 0));
  // Lower grille.
  const grille = boxMesh(deps, glowCyan, 0.46, 0.24, 0.015, 0, 0.32, 0.27);
  grille.castShadow = false;
  group.add(grille);
  return group;
}

/** A couple of record sleeves leaning against the jukebox corner. */
export function buildRecordCrates(deps: PieceDeps, kit: MaterialKit): THREE.Group {
  const group = new THREE.Group();
  const sleeves = ['#c8b78e', '#7a4444', '#4f6b73'];
  sleeves.forEach((color, i) => {
    const mat = kit.std({ color, roughness: 0.7 });
    const sleeve = boxMesh(deps, mat, 0.32, 0.32, 0.012, i * 0.05, 0.17, i * 0.03, 'record-sleeve');
    sleeve.rotation.x = -0.22;
    sleeve.rotation.z = 0.06 * i;
    group.add(sleeve);
  });
  return group;
}

/* ----- 1985 ------------------------------------------------------------- */

/** Potted fern with layered frond cones. */
export function buildFern(deps: PieceDeps, kit: MaterialKit, scale: number): THREE.Group {
  const group = new THREE.Group();
  const potMat = kit.std({ color: '#9a5b3c', roughness: 0.85 });
  const soilMat = kit.std({ color: '#33261c', roughness: 1 });

  group.add(cylMesh(deps, potMat, 0.16, 0.115, 0.26, 12, 0, 0.13, 0, 'fern-pot'));
  const lip = new THREE.Mesh(deps.geo.torus(0.158, 0.014, 6, 14), potMat);
  lip.rotation.x = Math.PI / 2;
  lip.position.y = 0.26;
  group.add(lip);
  group.add(cylMesh(deps, soilMat, 0.145, 0.145, 0.02, 12, 0, 0.265, 0));

  const frondColors = ['#3f7d44', '#4c8f4a', '#356b3c'];
  let fi = 0;
  const addFrond = (angle: number, pitch: number, len: number, radius: number): void => {
    const mat = kit.std({ color: frondColors[fi % frondColors.length], roughness: 0.75 });
    fi += 1;
    const frond = new THREE.Mesh(deps.geo.cone(radius, len, 5), mat);
    frond.geometry.scale(1, 1, 0.28); // Flatten into a leaf blade.
    frond.position.set(Math.sin(angle) * 0.07, 0.28 + Math.cos(pitch) * len * 0.42, Math.cos(angle) * 0.07);
    frond.rotation.set(Math.sin(angle) * -pitch, angle, Math.cos(angle) * pitch);
    frond.castShadow = true;
    frond.name = 'fern-frond';
    group.add(frond);
  };
  for (let i = 0; i < 5; i += 1) addFrond((i * Math.PI * 2) / 5 + 0.3, 0.9, 0.62, 0.075);
  for (let i = 0; i < 4; i += 1) addFrond((i * Math.PI * 2) / 4 + 0.95, 0.25, 0.5, 0.06);

  group.scale.setScalar(scale);
  return group;
}

/** Neon-accented wall piece: glowing ring plus zigzag tube on a dark plate. */
export function buildNeonPanel(deps: PieceDeps, kit: MaterialKit, accentColors: string[]): THREE.Group {
  const group = new THREE.Group();
  const plate = kit.std({ color: '#191a20', roughness: 0.6 });
  const neonA = kit.std({ color: '#22091c', emissive: accentColors[0] ?? '#ff4fd8', emissiveIntensity: 1.7 });
  const neonB = kit.std({ color: '#082026', emissive: '#3ae7ff', emissiveIntensity: 1.5 });

  group.add(boxMesh(deps, plate, 0.94, 0.54, 0.03, 0, 0, 0, 'neon'));
  const ring = new THREE.Mesh(deps.geo.torus(0.17, 0.02, 8, 24), neonA);
  ring.position.set(-0.24, 0.02, 0.02);
  ring.castShadow = false;
  group.add(ring);
  for (let i = 0; i < 4; i += 1) {
    const seg = boxMesh(deps, neonB, 0.17, 0.032, 0.02, 0.06 + i * 0.19, (i % 2 === 0 ? 0.09 : -0.05), 0.02);
    seg.rotation.z = i % 2 === 0 ? -0.5 : 0.5;
    seg.castShadow = false;
    group.add(seg);
  }
  return group;
}

/** Small pastel ceramic vase for tabletops. */
export function buildVase(deps: PieceDeps, kit: MaterialKit, color: string, topY: number): THREE.Group {
  const group = new THREE.Group();
  const glaze = kit.std({ color, roughness: 0.25 });
  group.add(cylMesh(deps, glaze, 0.045, 0.07, 0.2, 10, 0, topY + 0.1, 0, 'vase'));
  const neck = new THREE.Mesh(deps.geo.torus(0.048, 0.009, 6, 12), glaze);
  neck.rotation.x = Math.PI / 2;
  neck.position.y = topY + 0.2;
  group.add(neck);
  return group;
}

/* ----- 2005 ------------------------------------------------------------- */

/** Framed abstract prints, mounted flush to a wall. */
export function buildWallFrame(
  deps: PieceDeps,
  kit: MaterialKit,
  width: number,
  height: number,
  printColor: string,
): THREE.Group {
  const group = new THREE.Group();
  const frame = kit.std({ color: '#211712', roughness: 0.4 });
  const print = kit.std({ color: printColor, roughness: 0.9 });
  group.add(boxMesh(deps, frame, width + 0.06, height + 0.06, 0.03, 0, 0, 0, 'wall-frame'));
  const canvas_ = boxMesh(deps, print, width, height, 0.012, 0, 0, 0.017);
  canvas_.castShadow = false;
  group.add(canvas_);
  return group;
}

/* ----- Rugs (shared helper) ---------------------------------------------- */

/** Flat rug slab; optional contrasting border underneath. */
export function buildRug(
  deps: PieceDeps,
  kit: MaterialKit,
  sizeX: number,
  sizeZ: number,
  color: string,
  borderColor?: string,
  round = false,
): THREE.Group {
  const group = new THREE.Group();
  if (borderColor) {
    const border = round
      ? (() => {
          const mesh = new THREE.Mesh(deps.geo.circle(Math.max(sizeX, sizeZ) / 2 + 0.12, 30), kit.std({ color: borderColor, roughness: 0.95 }));
          return mesh;
        })()
      : boxMesh(deps, kit.std({ color: borderColor, roughness: 0.95 }), sizeX + 0.24, 0.01, sizeZ + 0.24, 0, 0.045, 0);
    border.rotation.x = round ? -Math.PI / 2 : border.rotation.x;
    border.position.y = round ? 0.045 : border.position.y;
    border.castShadow = false;
    border.receiveShadow = true;
    group.add(border);
  }
  const mat = kit.std({ color, roughness: 0.96 });
  const rug = round
    ? new THREE.Mesh(deps.geo.circle(sizeX / 2, 30), mat)
    : boxMesh(deps, mat, sizeX, 0.011, sizeZ, 0, 0.049, 0, 'rug');
  if (round) {
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.049;
    rug.name = 'rug';
  }
  rug.castShadow = false;
  rug.receiveShadow = true;
  group.add(rug);
  return group;
}

/* ----- 2025 ------------------------------------------------------------- */

/** Macramé-style hanging plant suspended from the ceiling. */
export function buildHangingPlant(
  deps: PieceDeps,
  kit: MaterialKit,
  ceilingY: number,
  drop: number,
): THREE.Group {
  const group = new THREE.Group();
  const cordMat = kit.std({ color: '#cbbfa8', roughness: 0.9 });
  const potMat = kit.std({ color: '#ddd5c6', roughness: 0.65 });
  const leafMat = kit.std({ color: '#5c8a4a', roughness: 0.8 });
  const trailingMat = kit.std({ color: '#6f9a55', roughness: 0.85 });

  const hookY = ceilingY - 0.02;
  const potTopY = hookY - drop;
  group.add(cylMesh(deps, cordMat, 0.028, 0.028, 0.012, 10, 0, hookY, 0, 'hanging-plant'));

  const rimRadius = 0.13;
  for (let i = 0; i < 3; i += 1) {
    const angle = (i * Math.PI * 2) / 3;
    const px = Math.sin(angle) * rimRadius;
    const pz = Math.cos(angle) * rimRadius;
    const from = new THREE.Vector3(0, hookY - 0.006, 0);
    const to = new THREE.Vector3(px, potTopY, pz);
    const dir = to.clone().sub(from);
    const length = dir.length();
    const cord = cylMesh(deps, cordMat, 0.004, 0.004, length, 5, 0, 0, 0);
    cord.position.copy(from).addScaledVector(dir, 0.5);
    cord.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    group.add(cord);
  }

  group.add(cylMesh(deps, potMat, 0.13, 0.1, 0.2, 12, 0, potTopY - 0.1, 0));
  group.add(cylMesh(deps, kit.std({ color: '#33261c', roughness: 1 }), 0.115, 0.115, 0.02, 12, 0, potTopY - 0.005, 0));
  for (let i = 0; i < 6; i += 1) {
    const angle = (i * Math.PI) / 3;
    const leaf = new THREE.Mesh(deps.geo.sphere(0.045, 8, 6), leafMat);
    leaf.scale.set(1, 0.45, 1);
    leaf.position.set(Math.sin(angle) * 0.11, potTopY + 0.02, Math.cos(angle) * 0.11);
    leaf.castShadow = true;
    group.add(leaf);
  }
  // Trailing vines spilling over the rim.
  for (let v = 0; v < 4; v += 1) {
    const angle = (v * Math.PI) / 2 + 0.4;
    const bx = Math.sin(angle) * 0.12;
    const bz = Math.cos(angle) * 0.12;
    for (let s = 0; s < 4; s += 1) {
      const bead = new THREE.Mesh(deps.geo.sphere(0.02 - s * 0.002, 6, 5), trailingMat);
      bead.position.set(bx * (1 + s * 0.25), potTopY - 0.06 - s * 0.09, bz * (1 + s * 0.25));
      bead.scale.y = 1.6;
      bead.castShadow = true;
      group.add(bead);
    }
  }
  return group;
}

/** Wireless-charging spot inset flush in a tabletop. */
export function buildChargingSpot(deps: PieceDeps, kit: MaterialKit, topY: number): THREE.Group {
  const group = new THREE.Group();
  const pad = kit.std({ color: '#23252a', roughness: 0.5 });
  const ledRing = kit.std({ color: '#0d1f1b', emissive: '#58e0c0', emissiveIntensity: 0.7 });
  const padMesh = cylMesh(deps, pad, 0.07, 0.07, 0.006, 18, 0, topY + 0.003, 0, 'charging-pad');
  padMesh.castShadow = false;
  group.add(padMesh);
  const ring = new THREE.Mesh(deps.geo.torus(0.055, 0.004, 6, 20), ledRing);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = topY + 0.0065;
  ring.castShadow = false;
  group.add(ring);
  return group;
}

/** Tiny succulent pot for 2025 tables. */
export function buildSucculent(deps: PieceDeps, kit: MaterialKit, topY: number): THREE.Group {
  const group = new THREE.Group();
  const pot = kit.std({ color: '#c9c2b4', roughness: 0.7 });
  const plant = kit.std({ color: '#7fa06a', roughness: 0.85 });
  group.add(cylMesh(deps, pot, 0.05, 0.038, 0.07, 10, 0, topY + 0.035, 0, 'succulent'));
  const blob = new THREE.Mesh(deps.geo.sphere(0.045, 8, 6), plant);
  blob.scale.set(1, 0.7, 1);
  blob.position.y = topY + 0.085;
  blob.castShadow = true;
  group.add(blob);
  return group;
}

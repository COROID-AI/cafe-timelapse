import * as THREE from 'three';
import { matColor, matWood, matMetal, matFabric, matGlass, matGloss } from './materials';
import type { Era } from '../types';

/** Table placement shared by furniture + decor so tableware lands on tables. */
export const TABLE_POSITIONS: Array<{ x: number; z: number; ry: number }> = [
  { x: -2.2, z: 2.2, ry: 0.2 },
  { x: 1.6, z: 2.9, ry: -0.35 },
  { x: -0.6, z: 5.2, ry: 0.5 },
  { x: 2.6, z: 5.6, ry: -0.5 },
];

/** Chair seat offsets (local coords) around a table; shared with patron placement. */
export interface ChairSlot {
  x: number;
  z: number;
  /** Angle around the table (radians), matching buildTableSet. */
  angle: number;
}

export function chairOffsets(era: Era): ChairSlot[] {
  const count = era.furniture.chairStyle.includes('levitating') ? 4 : 3;
  return Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    return { x: Math.sin(a) * 1.02, z: Math.cos(a) * 1.02, angle: a };
  });
}

/** World-space chair seat positions (and facing) for a table, for patron placement. */
export function chairSeatPositions(
  era: Era,
  x: number,
  z: number,
  rotationY = 0,
): Array<{ x: number; y: number; z: number; ry: number }> {
  const cos = Math.cos(rotationY);
  const sin = Math.sin(rotationY);
  const seatY = era.furniture.chairStyle.includes('levitating')
    ? 0.64
    : era.furniture.chairStyle.includes('armchair') || era.furniture.chairStyle.includes('tubular')
      ? 0.49
      : era.furniture.chairStyle.includes('plastic') || era.furniture.chairStyle.includes('plywood')
        ? 0.485
        : 0.465;
  return chairOffsets(era).map((o) => ({
    x: x + o.x * cos + o.z * sin,
    y: seatY,
    z: z - o.x * sin + o.z * cos,
    ry: rotationY - o.angle,
  }));
}

export interface FurnitureGroup {
  group: THREE.Group;
}

function add(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  x: number,
  y: number,
  z: number,
  opts: { rx?: number; ry?: number; rz?: number; cast?: boolean; receive?: boolean } = {},
): THREE.Mesh {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(x, y, z);
  if (opts.rx) m.rotation.x = opts.rx;
  if (opts.ry) m.rotation.y = opts.ry;
  if (opts.rz) m.rotation.z = opts.rz;
  m.castShadow = opts.cast ?? true;
  m.receiveShadow = opts.receive ?? true;
  parent.add(m);
  return m;
}

const cyl = (rt: number, rb: number, h: number, seg = 18) => new THREE.CylinderGeometry(rt, rb, h, seg);

function matEmitLight(color: string, intensity: number): THREE.MeshStandardMaterial {
  return matColor(color, {
    emissive: color,
    emissiveIntensity: intensity,
    roughness: 0.5,
  });
}

/**
 * Build the café's fixed counter (bar) along the back-left area, with a
 * glass pastry case, register, and space for the era espresso machine.
 */
export function buildCounter(era: Era): FurnitureGroup {
  const g = new THREE.Group();
  g.name = 'Counter';
  const counterMat = matWood(era.furniture.accent);
  const topMat = matGloss('#d8cfc2');

  add(g, new THREE.BoxGeometry(3.4, 0.9, 0.9), counterMat, -1.4, 0.45, -4.6);
  add(g, new THREE.BoxGeometry(3.5, 0.08, 0.95), topMat, -1.4, 0.95, -4.6);
  add(g, new THREE.BoxGeometry(3.4, 0.85, 0.05), matWood('#3a2a18'), -1.4, 0.45, -4.12);

  // register
  const registerMat = matColor('#2f2f2f', { roughness: 0.3, metalness: 0.6 });
  add(g, new THREE.BoxGeometry(0.5, 0.16, 0.42), registerMat, -2.3, 1.08, -4.55);
  add(g, new THREE.BoxGeometry(0.34, 0.1, 0.26), matMetal('#c9a227', 0.2), -2.3, 1.19, -4.55);
  add(g, new THREE.BoxGeometry(0.3, 0.04, 0.2), matEmitLight('#ffd27f', 1.2), -2.3, 1.25, -4.55);

  // pastry case
  const caseMat = matGlass('#dff1ff', 0.3);
  add(g, new THREE.BoxGeometry(1.1, 0.5, 0.6), caseMat, -0.5, 0.75, -4.75);
  add(g, new THREE.BoxGeometry(1.12, 0.06, 0.62), matGloss('#cfc6b8'), -0.5, 0.5, -4.75);
  add(g, new THREE.BoxGeometry(0.9, 0.3, 0.5), matEmitLight('#ffd9a0', 0.7), -0.5, 0.68, -4.75);

  // stools along the counter
  const stoolMat = matMetal('#9a9a9a', 0.4);
  const seatMat = matFabric(era.furniture.accent);
  for (const sx of [-2.8, -1.9, -0.9]) {
    add(g, cyl(0.025, 0.025, 0.72, 10), stoolMat, sx, 0.36, -3.9);
    add(g, cyl(0.3, 0.3, 0.07, 18), seatMat, sx, 0.78, -3.9);
  }

  return { group: g };
}

/**
 * Build a café table for the era, with its chairs.
 */
export function buildTableSet(era: Era, x: number, z: number, rotationY = 0): THREE.Group {
  const g = new THREE.Group();
  g.name = 'TableSet';
  g.position.set(x, 0, z);
  g.rotation.y = rotationY;

  const tableBaseMat = matMetal('#555555', 0.5);
  const tableTop =
    era.furniture.tableStyle === 'marble top'
      ? matGloss('#d8d2c6')
      : era.furniture.tableStyle === 'translucent resin'
        ? matColor(era.furniture.accent, { transparent: true, opacity: 0.55, roughness: 0.15, metalness: 0.3 })
        : matWood(era.furniture.accent);

  add(g, new THREE.CylinderGeometry(0.72, 0.72, 0.06, 32), tableTop, 0, 0.78, 0);
  add(g, cyl(0.05, 0.09, 0.72, 12), tableBaseMat, 0, 0.38, 0);

  const chairCount = era.furniture.chairStyle.includes('levitating') ? 4 : 3;
  for (let i = 0; i < chairCount; i++) {
    const a = (i / chairCount) * Math.PI * 2;
    const cx = Math.sin(a) * 1.02;
    const cz = Math.cos(a) * 1.02;
    const chair = buildChair(era, cx, cz, -a);
    g.add(chair);
  }

  return g;
}

/** One era-dependent chair at an offset. */
export function buildChair(era: Era, x: number, z: number, rotY = 0): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Chair';
  g.position.set(x, 0, z);
  g.rotation.y = rotY;

  if (era.furniture.chairStyle.includes('levitating')) {
    const ringMat = matMetal('#b8d8ff', 0.25);
    const seatMat = matFabric(era.furniture.accent);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 10, 28), ringMat);
    ring.position.y = 0.52;
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    const seat = new THREE.Mesh(new THREE.SphereGeometry(0.24, 18, 12), seatMat);
    seat.position.y = 0.55;
    seat.scale.set(1, 0.4, 1);
    g.add(seat);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), matEmitLight('#9ad0ff', 0.5));
    glow.position.y = 0.5;
    glow.scale.set(1, 0.3, 1);
    glow.material.transparent = true;
    glow.material.opacity = 0.3;
    g.add(glow);
    return g;
  }

  if (era.furniture.chairStyle.includes('plastic')) {
    const shellMat = matColor(era.furniture.accent, { roughness: 0.4 });
    const legMat = matMetal('#c0c0c0', 0.55);
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.07, 0.42), shellMat);
    seat.position.y = 0.45;
    seat.rotation.x = -0.08;
    g.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.46, 0.06), shellMat);
    back.position.set(0, 0.72, -0.18);
    back.rotation.x = 0.12;
    g.add(back);
    for (const [lx, lz] of [
      [-0.17, 0.17],
      [0.17, 0.17],
      [-0.17, -0.17],
      [0.17, -0.17],
    ] as const) {
      add(g, cyl(0.015, 0.015, 0.45, 8), legMat, lx, 0.22, lz);
    }
    return g;
  }

  if (era.furniture.chairStyle.includes('tubular')) {
    const seatMat = matFabric('#222222');
    const chrome = matMetal('#cfcfcf', 0.15);
    add(g, new THREE.BoxGeometry(0.42, 0.06, 0.44), seatMat, 0, 0.46, 0);
    add(g, new THREE.BoxGeometry(0.42, 0.5, 0.05), seatMat, 0, 0.72, -0.2);
    add(g, cyl(0.012, 0.012, 0.46, 8), chrome, -0.18, 0.23, 0.18);
    add(g, cyl(0.012, 0.012, 0.46, 8), chrome, 0.18, 0.23, 0.18);
    add(g, cyl(0.012, 0.012, 0.46, 8), chrome, -0.18, 0.23, -0.18);
    add(g, cyl(0.012, 0.012, 0.46, 8), chrome, 0.18, 0.23, -0.18);
    return g;
  }

  if (era.furniture.chairStyle.includes('armchair')) {
    const fabric = matFabric('#8a5a2f');
    const wood = matWood('#5c3a1e');
    add(g, new THREE.BoxGeometry(0.5, 0.1, 0.48), fabric, 0, 0.44, 0);
    add(g, new THREE.BoxGeometry(0.5, 0.56, 0.1), fabric, 0, 0.72, -0.22);
    add(g, new THREE.BoxGeometry(0.1, 0.3, 0.5), fabric, -0.26, 0.62, 0);
    add(g, new THREE.BoxGeometry(0.1, 0.3, 0.5), fabric, 0.26, 0.62, 0);
    for (const [lx, lz] of [
      [-0.2, 0.2],
      [0.2, 0.2],
      [-0.2, -0.2],
      [0.2, -0.2],
    ] as const) {
      add(g, cyl(0.02, 0.02, 0.44, 8), wood, lx, 0.22, lz);
    }
    return g;
  }

  if (era.furniture.chairStyle.includes('plywood')) {
    const wood = matWood('#b0853f');
    add(g, new THREE.BoxGeometry(0.4, 0.05, 0.42), wood, 0, 0.46, 0);
    add(g, new THREE.BoxGeometry(0.4, 0.42, 0.05), wood, 0, 0.68, -0.2);
    add(g, cyl(0.018, 0.018, 0.44, 8), wood, -0.16, 0.22, 0.16);
    add(g, cyl(0.018, 0.018, 0.44, 8), wood, 0.16, 0.22, 0.16);
    add(g, cyl(0.018, 0.018, 0.44, 8), wood, -0.16, 0.22, -0.16);
    add(g, cyl(0.018, 0.018, 0.44, 8), wood, 0.16, 0.22, -0.16);
    return g;
  }

  // 1945 bentwood café chair
  const wood = matWood('#a06a35');
  add(g, new THREE.BoxGeometry(0.4, 0.05, 0.4), wood, 0, 0.44, 0);
  const backTorus = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 8, 24), wood);
  backTorus.position.set(0, 0.82, -0.02);
  backTorus.rotation.x = 0.1;
  g.add(backTorus);
  add(g, cyl(0.02, 0.02, 0.44, 8), wood, -0.16, 0.22, 0.16);
  add(g, cyl(0.02, 0.02, 0.44, 8), wood, 0.16, 0.22, 0.16);
  add(g, cyl(0.02, 0.02, 0.44, 8), wood, -0.16, 0.22, -0.16);
  add(g, cyl(0.02, 0.02, 0.44, 8), wood, 0.16, 0.22, -0.16);
  return g;
}

/** Bench along the left wall (for waiting guests). */
export function buildBench(era: Era): THREE.Group {
  const g = new THREE.Group();
  g.name = 'Bench';
  const fabric = matFabric(era.furniture.accent);
  const wood = matWood('#6a4a28');
  add(g, new THREE.BoxGeometry(2.3, 0.09, 0.5), fabric, -3.85, 0.52, 1.6);
  add(g, new THREE.BoxGeometry(2.3, 0.4, 0.5), wood, -3.85, 0.24, 1.6);
  for (const lx of [-4.5, -3.2]) {
    add(g, cyl(0.03, 0.03, 0.2, 8), wood, lx, 0.1, 1.6);
  }
  return g;
}

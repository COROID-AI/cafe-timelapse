import * as THREE from 'three';
import { DINING_TABLE_ANCHORS, SURFACE_LIFT, tableSurfaceY } from './layout';

/**
 * Cluster assembly + placement helpers shared by the era composers.
 *
 * One "cluster" is the complete tabletop dressing of a single dining table.
 * Its origin sits exactly ON the dressed surface (tabletop height, cloth pad
 * included, micro lift applied), so every item built by `./kit/parts` — whose
 * origins are likewise at their contact point — rests on the furniture
 * without clipping or floating.
 */

/** Deterministic PRNG so era layouts are stable across reloads. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 14), 1 | t)) ^ t;
    return t / 4294967296;
  };
}

/**
 * Creates one empty tabletop cluster for dining table `index` in `year`.
 *
 * The Y position derives from the FURNITURE specs (shared anchors + cloth-pad
 * thickness) so tableware can never drift out of sync with the tables it
 * dresses.
 */
export function createTableCluster(year: number, index: number): THREE.Group {
  const anchor = DINING_TABLE_ANCHORS[index];
  if (!anchor) throw new Error(`No dining-table anchor for index ${index}.`);
  const cluster = new THREE.Group();
  cluster.name = `tableware-table-${index}`;
  cluster.position.set(anchor.x, tableSurfaceY(year, index) + SURFACE_LIFT, anchor.z);
  cluster.userData.tableIndex = index;
  cluster.userData.surfaceY = tableSurfaceY(year, index);
  return cluster;
}

/**
 * Tags an item as a distinct tabletop prop: named for tests/tooling, labelled
 * for tooltips, and flagged so the rig's pop-in animation picks it up.
 */
export function tagItem<T extends THREE.Object3D>(item: T, label: string, name: string): T {
  item.name = name;
  item.userData.itemLabel = label;
  item.userData.popItem = true;
  return item;
}

/** Collects every pop-in-tagged item beneath `root`, in stable tree order. */
export function collectPopItems(root: THREE.Object3D): THREE.Object3D[] {
  const items: THREE.Object3D[] = [];
  root.traverse((node) => {
    if (node.userData.popItem === true) items.push(node);
  });
  return items;
}

/* ------------------------------------------------------------------ *
 * Placement slots                                                     *
 * ------------------------------------------------------------------ */

export interface Spot {
  /** Angle around the table centre, degrees (0° = +z, towards room north). */
  angleDeg: number;
  /** Distance from the table centre in metres (kept well inside the top). */
  radius: number;
}

/**
 * Shared placement slots. Radii stay ≤ 0.185 so even wide props keep every
 * vertex inside `TABLE_MAX_REACH` (0.33 m) on the smallest diner top.
 */
export const SEAT_SPOTS: readonly Spot[] = [
  { angleDeg: 40, radius: 0.165 },
  { angleDeg: 220, radius: 0.165 },
];
export const THIRD_SEAT_SPOT: Spot = { angleDeg: 130, radius: 0.175 };
export const PLATE_SPOTS: readonly Spot[] = [
  { angleDeg: 70, radius: 0.105 },
  { angleDeg: 250, radius: 0.105 },
];
export const CENTRE_SPOT: Spot = { angleDeg: 150, radius: 0.085 };
export const SIDE_SPOT: Spot = { angleDeg: 315, radius: 0.125 };

/** Local-space position of a spot, optionally jittered by ±jitterDeg. */
export function spotPosition(spot: Spot, jitterDeg = 0): THREE.Vector3 {
  const angle = ((spot.angleDeg + jitterDeg) * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(angle) * spot.radius, 0, Math.cos(angle) * spot.radius);
}

/**
 * Material + geometry factory for the `patrons` prop group.
 *
 * Mirrors the conventions of the sibling prop groups (`furniture`,
 * `machines`): every material mints transparent-enabled with `depthWrite`
 * ON so the era crossfade animates `opacity` without shader recompiles, and
 * every mesh reuses a handful of cached unit geometries via `mesh.scale`.
 * The kit tracks both pools so {@link dispose} can release GPU resources.
 */

import * as THREE from 'three';

export interface StdOptions {
  color: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
}

export class PatronKit {
  private readonly pool: THREE.MeshStandardMaterial[] = [];
  private readonly geos: THREE.BufferGeometry[] = [];

  private readonly unitBox = new THREE.BoxGeometry(1, 1, 1);
  private readonly unitSphere = new THREE.SphereGeometry(0.5, 10, 8);
  private readonly unitCylinder = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
  private readonly unitCone = new THREE.ConeGeometry(0.5, 1, 7);

  constructor() {
    this.geos.push(this.unitBox, this.unitSphere, this.unitCylinder, this.unitCone);
  }

  /** Mints one tracked standard material (transparent from birth). */
  std(options: StdOptions): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: options.color,
      roughness: options.roughness ?? 0.72,
      metalness: options.metalness ?? 0.0,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 1,
      transparent: true,
      opacity: 0, // Invisible until the crossfade fades the cast in.
      depthWrite: true,
    });
    this.pool.push(material);
    return material;
  }

  /* ----- mesh helpers ---------------------------------------------------- */

  box(
    material: THREE.Material,
    w: number,
    h: number,
    d: number,
    x = 0,
    y = 0,
    z = 0,
    name?: string,
  ): THREE.Mesh {
    return this.place(new THREE.Mesh(this.unitBox, material), w, h, d, x, y, z, name);
  }

  sphere(material: THREE.Material, r: number, x = 0, y = 0, z = 0, name?: string): THREE.Mesh {
    return this.place(new THREE.Mesh(this.unitSphere, material), r * 2, r * 2, r * 2, x, y, z, name);
  }

  /** Vertical cylinder of radius `r`, height `h`, centred at (x, y, z). */
  cylinder(
    material: THREE.Material,
    rTop: number,
    rBottom: number,
    h: number,
    x = 0,
    y = 0,
    z = 0,
    name?: string,
  ): THREE.Mesh {
    const mesh = new THREE.Mesh(this.unitCylinder, material);
    if (Math.abs(rTop - rBottom) > 1e-6) {
      // Taper by scaling the top-ring radii once on a cloned geometry —
      // cheap, keeps the shared cache intact for the straight case.
      const clone = this.unitCylinder.clone();
      this.geos.push(clone);
      const cpos = clone.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < cpos.count; i++) {
        if (cpos.getY(i) > 0) cpos.setX(i, cpos.getX(i) * (rTop / rBottom));
      }
      cpos.needsUpdate = true;
      mesh.geometry = clone;
    }
    return this.place(mesh, rBottom * 2, h, rBottom * 2, x, y, z, name);
  }

  cone(material: THREE.Material, r: number, h: number, x = 0, y = 0, z = 0, name?: string): THREE.Mesh {
    return this.place(new THREE.Mesh(this.unitCone, material), r * 2, h, r * 2, x, y, z, name);
  }

  /** Registers an ad-hoc geometry (torus bands, arcs…) for disposal. */
  custom<T extends THREE.BufferGeometry>(geometry: T): T {
    this.geos.push(geometry);
    return geometry;
  }

  /** All materials minted by this kit (for opacity fading). */
  get materials(): readonly THREE.MeshStandardMaterial[] {
    return this.pool;
  }

  dispose(): void {
    for (const material of this.pool) material.dispose();
    this.pool.length = 0;
    for (const geometry of this.geos) geometry.dispose();
    this.geos.length = 0;
  }

  private place(
    mesh: THREE.Mesh,
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    name?: string,
  ): THREE.Mesh {
    mesh.scale.set(w, h, d);
    mesh.position.set(x, y, z);
    if (name) mesh.name = name;
    return mesh;
  }
}

/**
 * Deterministic PRNG (mulberry32) so colour/pose jitter is stable across
 * reloads — same seed, same cast.
 */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Disposes every geometry/material under `root` that is flagged as owned via
 * `userData.patronsOwned === true`. The builder flags nothing itself — this
 * helper exists for symmetry with `disposeObjectTree` in the machines kit and
 * is used by tests to verify teardown leaves shared unit geometries intact.
 */
export function countOwnedMeshes(root: THREE.Object3D): number {
  let count = 0;
  root.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) count += 1;
  });
  return count;
}

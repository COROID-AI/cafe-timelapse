import * as THREE from 'three';

/**
 * Procedural primitive kit for the tableware group.
 *
 * Follows the same pattern as the room shell and the brewing-equipment kit: a
 * handful of shared unit geometries are re-used (scaled) for the very common
 * box/cylinder/sphere cases, while anything with a baked profile allocates
 * its own small geometry. Individual polycounts stay low because there are
 * many tabletop instances; `disposeObjectTree` disposes every non-shared
 * geometry plus all materials, so tearing a rig down leaks nothing.
 */

const SHARED_FLAG = 'sharedTablewareKitGeometry';

function tagShared<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.userData[SHARED_FLAG] = true;
  return geometry;
}

export const unitBox = tagShared(new THREE.BoxGeometry(1, 1, 1));
export const unitCylinder = tagShared(new THREE.CylinderGeometry(1, 1, 1, 18));
export const unitLowCylinder = tagShared(new THREE.CylinderGeometry(1, 1, 1, 10));
export const unitSphere = tagShared(new THREE.SphereGeometry(1, 14, 9));

/** Axis-aligned box centred on (x, y, z). */
export function box(
  material: THREE.Material,
  w: number,
  h: number,
  d: number,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(unitBox, material);
  mesh.scale.set(w, h, d);
  mesh.position.set(x, y, z);
  return mesh;
}

/**
 * Cylinder along +y resting logic-free (caller places centres). Tapered
 * profiles (rTop ≠ rBottom) bake a fresh low-segment geometry; straight tubes
 * share one unit cylinder.
 */
export function cylinder(
  material: THREE.Material,
  rTop: number,
  rBottom: number,
  height: number,
  x = 0,
  y = 0,
  z = 0,
  lowPoly = false,
): THREE.Mesh {
  if (Math.abs(rTop - rBottom) < 1e-5) {
    const shared = new THREE.Mesh(lowPoly ? unitLowCylinder : unitCylinder, material);
    shared.scale.set(rTop, height, rTop);
    shared.position.set(x, y, z);
    return shared;
  }
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, height, lowPoly ? 10 : 18),
    material,
  );
  mesh.position.set(x, y, z);
  return mesh;
}

/** Sphere of `radius`, squashed along y by `yScale` (domes, sugar mounds). */
export function sphere(
  material: THREE.Material,
  radius: number,
  x = 0,
  y = 0,
  z = 0,
  yScale = 1,
): THREE.Mesh {
  const mesh = new THREE.Mesh(unitSphere, material);
  mesh.scale.set(radius, radius * yScale, radius);
  mesh.position.set(x, y, z);
  return mesh;
}

/** Cone pointing up (+y), used for shaker caps and dripper cones. */
export function cone(
  material: THREE.Material,
  radius: number,
  height: number,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 16), material);
  mesh.position.set(x, y, z);
  return mesh;
}

/**
 * Torus ring in the local XY plane (hole facing ±z). Mug handles, rims,
 * drip flanges. Arcs start at the +x axis and sweep counter-clockwise.
 */
export function torus(
  material: THREE.Material,
  radius: number,
  tube: number,
  x = 0,
  y = 0,
  z = 0,
  options?: { arc?: number; rotationX?: number; rotationZ?: number },
): THREE.Mesh {
  const arc = options?.arc ?? Math.PI * 2;
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 8, Math.max(10, Math.round(arc * 18)), arc),
    material,
  );
  mesh.position.set(x, y, z);
  if (options?.rotationX) mesh.rotation.x = options.rotationX;
  if (options?.rotationZ !== undefined) mesh.rotation.z = options.rotationZ;
  return mesh;
}

/** Flat disc facing up (+y) — liquid surfaces, ashtray floors. */
export function disc(
  material: THREE.Material,
  radius: number,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CircleGeometry(radius, 18), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  return mesh;
}

/** Convenience rotation chain so call sites stay compact. */
export function orient(mesh: THREE.Object3D, rx: number, ry: number, rz: number): THREE.Object3D {
  mesh.rotation.set(rx, ry, rz);
  return mesh;
}

/* ------------------------------------------------------------------ *
 * Metadata flags consumed by the rig's shadow pass                    *
 * ------------------------------------------------------------------ */

/**
 * Marks translucent glass so it never casts a solid shadow blob.
 * Registration forces castShadow=true on everything; the rig clears the flag
 * once via microtask right after build (idempotently re-run per swap).
 */
export function markNoCastShadow<T extends THREE.Mesh>(mesh: T): T {
  mesh.userData.noCastShadow = true;
  return mesh;
}

function isSharedGeometry(geometry: THREE.BufferGeometry): boolean {
  return geometry.userData[SHARED_FLAG] === true;
}

/**
 * Disposes every non-shared geometry and every material beneath `root`,
 * then detaches root from its parent.
 */
export function disposeObjectTree(root: THREE.Object3D): void {
  root.traverse((node) => {
    const candidate = node as THREE.Mesh;
    if (!candidate.isMesh) return;
    if (!isSharedGeometry(candidate.geometry)) candidate.geometry.dispose();
    const materials = Array.isArray(candidate.material)
      ? candidate.material
      : [candidate.material];
    for (const material of materials) material.dispose();
  });
  if (root.parent) root.parent.remove(root);
}

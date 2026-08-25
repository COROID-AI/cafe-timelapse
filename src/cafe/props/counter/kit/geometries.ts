import * as THREE from 'three';

/**
 * Procedural primitive kit for the counter-technology group.
 *
 * Follows the same pattern as the room shell and the brewing-equipment kit:
 * a handful of shared unit geometries are re-used (scaled) for the very
 * common box/cylinder/sphere cases, while anything with a baked profile
 * (tapers, torus arcs, open shells) allocates its own small geometry.
 * `disposeObjectTree` disposes every non-shared geometry plus all materials,
 * so tearing a rig down leaks nothing.
 */

const SHARED_FLAG = 'sharedCounterKitGeometry';

function tagShared<T extends THREE.BufferGeometry>(geometry: T): T {
  geometry.userData[SHARED_FLAG] = true;
  return geometry;
}

export const unitBox = tagShared(new THREE.BoxGeometry(1, 1, 1));
export const unitCylinder = tagShared(new THREE.CylinderGeometry(1, 1, 1, 28));
export const unitLowCylinder = tagShared(new THREE.CylinderGeometry(1, 1, 1, 12));
export const unitSphere = tagShared(new THREE.SphereGeometry(1, 22, 14));

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
 * Cylinder along +y. Tapered profiles (rTop ≠ rBottom) bake a fresh geometry;
 * straight tubes share one unit cylinder.
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
  const segments = lowPoly ? 12 : 28;
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, height, segments),
    material,
  );
  mesh.position.set(x, y, z);
  return mesh;
}

/** Sphere of `radius`, squashed along y by `yScale` (domes, knobs, bells). */
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

/** Cone pointing up (+y), used for pencil tips and finials. */
export function cone(
  material: THREE.Material,
  radius: number,
  height: number,
  x = 0,
  y = 0,
  z = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 24), material);
  mesh.position.set(x, y, z);
  return mesh;
}

/**
 * Torus ring in the local XY plane (hole facing ±z). Arcs start at the +x
 * axis and sweep counter-clockwise — used for the contactless wave symbol.
 */
export function torus(
  material: THREE.Material,
  radius: number,
  tube: number,
  x = 0,
  y = 0,
  z = 0,
  options?: { arc?: number; rotationX?: number; rotationY?: number; rotationZ?: number },
): THREE.Mesh {
  const arc = options?.arc ?? Math.PI * 2;
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(radius, tube, 10, Math.max(8, Math.round(arc * 20)), arc),
    material,
  );
  mesh.position.set(x, y, z);
  if (options?.rotationX) mesh.rotation.x = options.rotationX;
  if (options?.rotationY) mesh.rotation.y = options.rotationY;
  if (options?.rotationZ !== undefined) mesh.rotation.z = options.rotationZ;
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
 * Marks translucent/emissive surfaces that must never cast a solid shadow.
 * `CafeScene.registerPropGroup` switches shadows ON for every mesh after the
 * builder returns; the rig clears the flag on first era application (and once
 * via microtask right after build).
 */
export function markNoCastShadow<T extends THREE.Mesh>(mesh: T): T {
  mesh.userData.noCastShadow = true;
  return mesh;
}

/** Emissive UI surfaces (screens, LEDs, glow rings): never cast shadows. */
export function markGlowSurface<T extends THREE.Mesh>(mesh: T): T {
  mesh.userData.glowSurface = true;
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

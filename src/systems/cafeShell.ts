/**
 * CaféShell — the shared interior bounding volume (walls / floor / ceiling)
 * used by the Navigation rig for collision clamping, plus the placeholder
 * shell meshes that make the bounds visible.
 *
 * Phase 2 era fragments build their own interior detail; this shell remains
 * the canonical "café shell" that the camera must never clip through.
 */
import * as THREE from 'three';
import type { CaféBounds } from './Navigation';

/** The canonical interior dimensions of the café room. */
export const CAFÉ_BOUNDS: CaféBounds = {
  minX: -7,
  maxX: 7,
  minY: 0,
  maxY: 4,
  minZ: -5.5,
  maxZ: 5.5,
};

/** Centre of the interior volume (used as the default orbit target). */
export const CAFÉ_CENTER = new THREE.Vector3(
  (CAFÉ_BOUNDS.minX + CAFÉ_BOUNDS.maxX) / 2,
  (CAFÉ_BOUNDS.minY + CAFÉ_BOUNDS.maxY) / 2,
  (CAFÉ_BOUNDS.minZ + CAFÉ_BOUNDS.maxZ) / 2,
);

/**
 * Build a simple placeholder shell around the café bounds so the interior
 * volume is visible before era fragments add real architecture. Meshes are
 * added to `target` so the caller owns the group lifecycle.
 */
export function buildCaféShell(target: THREE.Group): void {
  const b = CAFÉ_BOUNDS;
  const thickness = 0.3;
  const height = b.maxY - b.minY;
  const depth = b.maxZ - b.minZ;
  const width = b.maxX - b.minX;

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x8a7a68, roughness: 0.95 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x4a3d33, roughness: 0.9 });
  const ceilingMaterial = new THREE.MeshStandardMaterial({ color: 0x6b6157, roughness: 0.9 });

  const box = (
    w: number,
    h: number,
    d: number,
    x: number,
    y: number,
    z: number,
    material: THREE.Material,
  ): THREE.Mesh => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    mesh.position.set(x, y, z);
    mesh.receiveShadow = true;
    target.add(mesh);
    return mesh;
  };

  // Floor slab (under the room) and ceiling slab (above the room).
  box(width + thickness * 2, thickness, depth + thickness * 2, 0, b.minY - thickness / 2, 0, floorMaterial);
  box(width + thickness * 2, thickness, depth + thickness * 2, 0, b.maxY + thickness / 2, 0, ceilingMaterial);

  // Two long walls (north/south) and two short walls (east/west).
  box(width + thickness * 2, height, thickness, 0, (b.minY + b.maxY) / 2, b.minZ - thickness / 2, wallMaterial);
  box(width + thickness * 2, height, thickness, 0, (b.minY + b.maxY) / 2, b.maxZ + thickness / 2, wallMaterial);
  box(thickness, height, depth + thickness * 2, b.minX - thickness / 2, (b.minY + b.maxY) / 2, 0, wallMaterial);
  box(thickness, height, depth + thickness * 2, b.maxX + thickness / 2, (b.minY + b.maxY) / 2, 0, wallMaterial);
}

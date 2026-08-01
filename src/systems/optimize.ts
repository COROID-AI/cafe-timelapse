/**
 * optimize.ts — performance & resource-cleanup helpers for era mounting.
 *
 * The heavy per-era GPU work (geometries, textures, materials) is owned by
 * either the era group (disposed on unmount) or the shared procedural
 * factories (cached, pruned when no longer referenced by a live root).
 *
 * Helpers in this module:
 *  - {@link mergeStaticMeshes} — collapse same-material static meshes inside
 *    one era group into per-material merged draw calls (a large drop in draw
 *    calls for furniture/tableware/lighting that share era palette
 *    materials). Animated objects (CharacterAvatar subtrees), `InstancedMesh`
 *    and meshes with non-uniform world scale are preserved as-is.
 *  - {@link collectLiveTextures} / {@link pruneFactoryTextures} — drop cached
 *    procedural textures that are no longer referenced by any live root (the
 *    scene after the outgoing era group has been unmounted), so the shared
 *    TextureFactory stays bounded across many era switches.
 *  - {@link countLiveObject3D} — count the Object3D nodes reachable from a
 *    root, used by the QA gate to detect Object3D leaks across era switches.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { textureFactory } from '../assets/TextureFactory';
import { materialFactory } from '../assets/MaterialFactory';

/** Result of {@link mergeStaticMeshes}. */
export interface MergeReport {
  /** Meshes merged into combined draw calls (removed from the scope). */
  mergedMeshes: number;
  /** Combined meshes added back to the scope. */
  mergedGroups: number;
  /** Original geometries freed because nothing references them any more. */
  disposedGeometries: number;
}

export interface MergeOptions {
  /**
   * Minimum number of same-material meshes before a merge is worthwhile.
   * Default: 2.
   */
  minBucketSize?: number;
}

/** True when an ancestor group carries the CharacterAvatar marker. */
function isInsideAvatar(object: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object.parent;
  while (current) {
    if ((current as THREE.Group).userData?.characterAvatar) return true;
    current = current.parent;
  }
  return false;
}

function isUniformScale(scale: THREE.Vector3): boolean {
  return (
    Math.abs(scale.x - scale.y) < 1e-4 &&
    Math.abs(scale.y - scale.z) < 1e-4 &&
    Math.abs(scale.x) > 1e-6
  );
}

/**
 * Merge same-material static meshes in `scope` into one mesh per material
 * bucket. Mesh world transforms (relative to the merged mesh's target parent)
 * are baked into the merged geometry, so meshes nested inside child groups
 * merge correctly and keep their visual position.
 *
 * Safety skips:
 *  - meshes inside a CharacterAvatar subtree (animated);
 *  - `InstancedMesh` / `SkinnedMesh`;
 *  - meshes with `userData.noMerge === true`;
 *  - meshes with a non-uniform world scale (would skew baked normals);
 *  - multi-material meshes (already merged by their builder).
 */
export function mergeStaticMeshes(
  scope: THREE.Object3D,
  options: MergeOptions = {},
): MergeReport {
  const minBucketSize = options.minBucketSize ?? 2;
  const report: MergeReport = {
    mergedMeshes: 0,
    mergedGroups: 0,
    disposedGeometries: 0,
  };

  scope.updateMatrixWorld(true);

  // Classify every mesh under the scope.
  const candidates: Array<{ mesh: THREE.Mesh; material: THREE.Material }> = [];
  const kept: THREE.Object3D[] = [];
  scope.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (
      (mesh as THREE.InstancedMesh).isInstancedMesh ||
      (mesh as THREE.SkinnedMesh).isSkinnedMesh
    ) {
      kept.push(mesh);
      return;
    }
    if (isInsideAvatar(mesh) || mesh.userData.noMerge === true) {
      kept.push(mesh);
      return;
    }
    const worldScale = mesh.getWorldScale(new THREE.Vector3());
    if (!isUniformScale(worldScale)) {
      kept.push(mesh);
      return;
    }
    if (
      !mesh.geometry ||
      Object.keys(mesh.geometry.morphAttributes).length > 0
    ) {
      kept.push(mesh);
      return;
    }
    if (Array.isArray(mesh.material)) {
      // Multi-material meshes are already a single draw call.
      kept.push(mesh);
      return;
    }
    const material = mesh.material as THREE.Material;
    if (!material) {
      kept.push(mesh);
      return;
    }
    candidates.push({ mesh, material });
  });

  // Bucket by (material, parent) identity. Era palette materials are
  // cached/shared, so same-material meshes merge into per-material draw
  // calls; keeping the parent in the key preserves each fragment category
  // group's structure (a category that builds meshes keeps at least one).
  const buckets = new Map<string, typeof candidates>();
  for (const candidate of candidates) {
    const parent = candidate.mesh.parent ?? scope;
    const key = `${candidate.material.uuid}|${parent.uuid}`;
    const bucket = buckets.get(key);
    if (bucket) bucket.push(candidate);
    else buckets.set(key, [candidate]);
  }

  for (const [, bucket] of buckets) {
    if (bucket.length < minBucketSize) {
      for (const candidate of bucket) kept.push(candidate.mesh);
      continue;
    }

    const baked: THREE.BufferGeometry[] = [];
    let castShadow = false;
    let receiveShadow = false;
    let firstMesh: THREE.Mesh | null = null;
    let skip = false;
    // All candidates in a bucket share one parent.
    const targetParent = bucket[0].mesh.parent ?? scope;

    for (const candidate of bucket) {
      const mesh = candidate.mesh;
      const geometry = mesh.geometry;
      if (!geometry) {
        skip = true;
        break;
      }
      firstMesh ??= mesh;
      castShadow ||= mesh.castShadow;
      receiveShadow ||= mesh.receiveShadow;
    }

    if (skip || !targetParent) {
      for (const candidate of bucket) kept.push(candidate.mesh);
      continue;
    }

    // Bake every candidate into the target parent's local space (the merged
    // mesh is a fresh identity-transform mesh added to that parent).
    const targetWorldInverse = targetParent.matrixWorld.clone().invert();
    for (const candidate of bucket) {
      const clone = candidate.mesh.geometry.clone();
      const transform = targetWorldInverse.clone().multiply(candidate.mesh.matrixWorld);
      clone.applyMatrix4(transform);
      baked.push(clone);
    }

    let merged: THREE.BufferGeometry | null = null;
    try {
      merged = mergeGeometries(baked, true);
    } catch {
      merged = null;
    }

    if (!merged) {
      // Attribute mismatch: restore the originals untouched.
      for (const candidate of bucket) kept.push(candidate.mesh);
      continue;
    }
    merged.computeBoundingSphere();

    const mergedMesh = new THREE.Mesh(merged, bucket[0].material);
    mergedMesh.name = firstMesh?.name ?? 'merged-static';
    mergedMesh.castShadow = castShadow;
    mergedMesh.receiveShadow = receiveShadow;
    targetParent.add(mergedMesh);

    for (const candidate of bucket) {
      candidate.mesh.removeFromParent();
      report.mergedMeshes += 1;
    }
    report.mergedGroups += 1;
  }

  // Free source geometries that are not referenced by any mesh that survived
  // the merge (a geometry could be shared with a kept mesh).
  const stillUsed = new Set<THREE.BufferGeometry>();
  for (const object of kept) {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) stillUsed.add(mesh.geometry);
  }
  const mergedGeometries = new Set<THREE.BufferGeometry>();
  for (const materialBucket of buckets.values()) {
    for (const candidate of materialBucket) {
      if (!candidate.mesh.parent) {
        // Removed from the scope during the merge → eligible for disposal.
        mergedGeometries.add(candidate.mesh.geometry);
      }
    }
  }
  for (const geometry of mergedGeometries) {
    if (stillUsed.has(geometry)) continue;
    geometry.dispose();
    report.disposedGeometries += 1;
  }

  return report;
}

/** Collect every texture referenced by a root's material graph. */
export function collectLiveTextures(
  root: THREE.Object3D,
  out: Set<THREE.Texture>,
): void {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return;
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value instanceof THREE.Texture) out.add(value);
      }
    }
  });
}

/**
 * Drop every TextureFactory entry that is not referenced by a live root (or
 * by a cached MaterialFactory material). Returns the number of textures
 * disposed. Call after an era group has been unmounted: the outgoing group's
 * textures become unreferenced and are released, so the shared factory cache
 * stays bounded across many era switches.
 */
export function pruneFactoryTextures(
  liveRoots: readonly THREE.Object3D[],
): number {
  const live = new Set<THREE.Texture>();
  for (const root of liveRoots) collectLiveTextures(root, live);
  for (const texture of materialFactory.liveTextures()) live.add(texture);
  return textureFactory.pruneUnused(live);
}

/** Count every Object3D node reachable from `root` (leak detector). */
export function countLiveObject3D(root: THREE.Object3D): number {
  let count = 0;
  root.traverse(() => {
    count += 1;
  });
  return count;
}

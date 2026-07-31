/**
 * SceneHost — the mount/unmount contract the TransitionController coordinates
 * with (the "SceneManager hooks").
 *
 * The host owns the scene root that era groups are added to and removed from,
 * exposes the currently active era, and is responsible for disposing group
 * resources when an era is unmounted. `EraGroupHost` is the reference
 * implementation backed by the AssetRegistry; a future dedicated SceneManager
 * can implement the same interface without changing the controller.
 */
import * as THREE from 'three';
import type { EraYear } from '../data/eras';
import { getEraRegistration } from '../registry/AssetRegistry';
import { mergeStaticMeshes, pruneFactoryTextures } from './optimize';

export interface SceneHost {
  /** The scene (or root group) era groups are mounted into. */
  readonly root: THREE.Group;
  /** Build and mount the era's fragment group; returns the mounted group. */
  mount(era: EraYear): THREE.Group;
  /** Remove the group from the scene and dispose its resources. */
  unmount(group: THREE.Group): void;
  /** The era currently considered active by the host. */
  getActiveEra(): EraYear | null;
  /** Update the host's notion of the active era. */
  setActiveEra(era: EraYear | null): void;
}

export interface EraGroupHostOptions {
  /**
   * Clone every material when a group is mounted so cross-fades can animate
   * opacity without mutating materials shared with other scenes/eras.
   * Default: true.
   */
  cloneMaterials?: boolean;
  /**
   * Merge same-material static meshes inside each mounted era group into
   * per-material draw calls (an easy draw-call win for furniture/tableware/
   * lighting that share era palette materials). Animated CharacterAvatar
   * subtrees, instanced meshes and non-uniform scaled meshes are preserved.
   * Default: true.
   */
  mergeStaticMeshes?: boolean;
  /**
   * Extra roots whose materials keep the shared TextureFactory cache alive
   * when an era group is unmounted. Pass the persistent scene (or shell
   * group) so era finishes applied outside the era root (e.g. composed shell
   * surface slots) are never pruned while still in use.
   */
  liveTextureRoots?: readonly THREE.Object3D[];
}

/**
 * Reference SceneHost: mounts era fragments from the AssetRegistry.
 *
 * `mount` builds one group per era by invoking every registered fragment's
 * `build(target, era)` hook, then adds the group to `root`. When
 * `cloneMaterials` is enabled (default) each material is cloned so the
 * transition controller can fade opacity freely without affecting shared
 * material libraries.
 */
export class EraGroupHost implements SceneHost {
  readonly root: THREE.Group;
  private activeEra: EraYear | null = null;
  private readonly cloneMaterials: boolean;
  private readonly mergeStaticMeshes: boolean;
  private readonly liveTextureRoots: readonly THREE.Object3D[];
  /** Merged mesh count per mounted era (QA + diagnostics). */
  readonly mergeStats = new Map<EraYear, { mergedMeshes: number; mergedGroups: number }>();

  constructor(root: THREE.Group = new THREE.Group(), options: EraGroupHostOptions = {}) {
    this.root = root;
    this.cloneMaterials = options.cloneMaterials ?? true;
    this.mergeStaticMeshes = options.mergeStaticMeshes ?? true;
    this.liveTextureRoots = options.liveTextureRoots ?? [];
  }

  getActiveEra(): EraYear | null {
    return this.activeEra;
  }

  setActiveEra(era: EraYear | null): void {
    this.activeEra = era;
  }

  mount(era: EraYear): THREE.Group {
    const group = new THREE.Group();
    group.name = `era-${era}`;
    const registration = getEraRegistration(era);
    if (registration) {
      for (const fragment of registration.fragments) {
        fragment.build(group, era);
      }
    }
    if (this.cloneMaterials) cloneGroupMaterials(group);
    if (this.mergeStaticMeshes) {
      const report = mergeStaticMeshes(group);
      this.mergeStats.set(era, {
        mergedMeshes: report.mergedMeshes,
        mergedGroups: report.mergedGroups,
      });
    }
    this.root.add(group);
    return group;
  }

  unmount(group: THREE.Group): void {
    this.root.remove(group);
    disposeGroup(group);
    // The outgoing group's procedural textures are no longer referenced by
    // any live root; release them from the shared factory cache so texture
    // memory stays bounded across many era switches.
    pruneFactoryTextures([this.root, ...this.liveTextureRoots]);
  }
}

/** Replace every material in `group` with a per-group clone. */
export function cloneGroupMaterials(group: THREE.Group): void {
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (!mesh.material) return;
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map((material) => material.clone());
    } else {
      mesh.material = mesh.material.clone();
    }
  });
}

/** Dispose every geometry and material reachable from `group` (deduplicated). */
export function disposeGroup(group: THREE.Group): void {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) geometries.add(mesh.geometry);
    if (!mesh.material) return;
    if (Array.isArray(mesh.material)) {
      for (const material of mesh.material) materials.add(material);
    } else {
      materials.add(mesh.material);
    }
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
}

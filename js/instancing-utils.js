/**
 * instancing-utils.js — helpers for rendering repeated meshes efficiently.
 *
 * Period modules create many identical objects (chairs, cups, tiles, …).
 * Rendering each as an individual Mesh balloons draw calls and hurts the
 * 60fps target. These helpers collapse identical objects into a single
 * THREE.InstancedMesh, dramatically reducing draw calls.
 *
 * Each helper returns the InstancedMesh plus a `dispose()` that frees the
 * instance matrix attribute and shared geometry/material — safe to call
 * from a period teardown function.
 */

import * as THREE from "three";

/**
 * Build an InstancedMesh from a list of per-instance transforms.
 *
 * @param {object}   opts
 * @param {THREE.BufferGeometry} opts.geometry  — shared geometry for all instances.
 * @param {THREE.Material}       opts.material  — shared material for all instances.
 * @param {Array<{position:[number,number,number],rotation:[number,number,number]|number,scale:[number,number,number]|[number,number,number,number]>} opts.transforms
 * @param {number} [opts.count]                 — override instance count (defaults to transforms.length).
 * @param {boolean} [opts.castShadow]
 * @param {boolean} [opts.receiveShadow]
 * @param {string}  [opts.name]
 * @returns {{ mesh: THREE.InstancedMesh, dispose: () => void }}
 */
export function createInstancedMesh({
  geometry,
  material,
  transforms,
  count,
  castShadow = true,
  receiveShadow = true,
  name = "instanced-mesh",
}) {
  const instanceCount = count ?? transforms.length;
  const mesh = new THREE.InstancedMesh(geometry, material, instanceCount);
  mesh.name = name;
  mesh.castShadow = castShadow;
  mesh.receiveShadow = receiveShadow;
  mesh.instanceMatrix.setUsage(THREE.StaticDrawUsage);

  const dummy = new THREE.Object3D();

  for (let i = 0; i < instanceCount; i++) {
    const t = transforms[i];
    if (!t) continue;

    dummy.position.set(t.position[0], t.position[1], t.position[2]);

    if (Array.isArray(t.rotation)) {
      // Euler [x, y, z] (radians)
      dummy.rotation.set(t.rotation[0], t.rotation[1], t.rotation[2]);
    } else if (typeof t.rotation === "number") {
      // Single Y-axis rotation (common for furniture placed on a floor)
      dummy.rotation.set(0, t.rotation, 0);
    } else {
      dummy.rotation.set(0, 0, 0);
    }

    if (Array.isArray(t.scale)) {
      if (t.scale.length === 3) {
        dummy.scale.set(t.scale[0], t.scale[1], t.scale[2]);
      } else if (t.scale.length === 4) {
        // Quaternion [x, y, z, w]
        dummy.quaternion.set(t.scale[0], t.scale[1], t.scale[2], t.scale[3]);
        dummy.scale.set(1, 1, 1);
      }
    } else {
      dummy.scale.set(1, 1, 1);
    }

    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();

  /** Dispose geometry, material (if not shared externally), and instance attrs. */
  const dispose = () => {
    mesh.dispose(); // frees instanceMatrix / instanceColor attributes
    geometry.dispose();
    // NOTE: material is intentionally NOT disposed here because period
    // modules own shared material palettes and dispose them in teardown.
  };

  return { mesh, dispose };
}

/**
 * Recursively dispose every geometry & material under a group, including
 * InstancedMesh instance attributes. Intended as a one-call teardown helper.
 *
 * @param {THREE.Object3D} root
 */
export function disposeGroupResources(root) {
  root.traverse((child) => {
    if (child.isInstancedMesh) {
      child.dispose(); // releases instanceMatrix / instanceColor
    }
    if (child.isMesh || child.isInstancedMesh) {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((m) => disposeMaterial(m));
      }
    }
  });
}

/**
 * Dispose a material and its associated textures.
 * @param {THREE.Material} material
 */
export function disposeMaterial(material) {
  for (const key of ["map", "normalMap", "roughnessMap", "metalnessMap", "emissiveMap"]) {
    if (material[key] && material[key].dispose) {
      material[key].dispose();
    }
  }
  material.dispose();
}

import * as THREE from 'three';

/** Shared, cheap material cache to keep draw calls low. */
const cache = new Map<string, THREE.Material>();

function cached<T extends THREE.Material>(key: string, make: () => T): T {
  const hit = cache.get(key);
  if (hit) return hit as T;
  const m = make();
  cache.set(key, m);
  return m;
}

export function matColor(color: string, extra?: Partial<THREE.MeshStandardMaterialParameters>): THREE.MeshStandardMaterial {
  return cached(`std:${color}:${JSON.stringify(extra ?? {})}`, () => new THREE.MeshStandardMaterial({ color, ...extra }));
}

export function matRough(color: string, roughness: number, metalness = 0): THREE.MeshStandardMaterial {
  return matColor(color, { roughness, metalness });
}

export function matGloss(color: string): THREE.MeshStandardMaterial {
  return matColor(color, { roughness: 0.18, metalness: 0.35 });
}

export function matMetal(color: string, roughness = 0.32): THREE.MeshStandardMaterial {
  return matColor(color, { roughness, metalness: 0.95 });
}

export function matWood(color: string): THREE.MeshStandardMaterial {
  return matColor(color, { roughness: 0.62, metalness: 0.02 });
}

export function matFabric(color: string): THREE.MeshStandardMaterial {
  return matColor(color, { roughness: 0.95, metalness: 0 });
}

export function matGlass(color = '#bfe3ff', opacity = 0.35): THREE.MeshStandardMaterial {
  return cached(`glass:${color}:${opacity}`, () => {
    const m = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity,
      roughness: 0.08,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    return m;
  });
}

export function matEmit(color: string, intensity = 1): THREE.MeshStandardMaterial {
  return cached(`emit:${color}:${intensity}`, () => {
    const m = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: intensity,
      roughness: 0.5,
    });
    return m;
  });
}

export function disposeMaterials(root: THREE.Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh;
    if (mesh.isMesh && mesh.material) {
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of materials) {
        // only dispose materials owned by this scene
        if (!cache.has(mat.uuid)) mat.dispose();
      }
    }
  });
}

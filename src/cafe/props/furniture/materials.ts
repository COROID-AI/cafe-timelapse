import * as THREE from 'three';

export interface StdMaterialOptions {
  color: THREE.ColorRepresentation;
  roughness?: number;
  metalness?: number;
  emissive?: THREE.ColorRepresentation;
  emissiveIntensity?: number;
  side?: THREE.Side;
}

/**
 * Per-era material factory.
 *
 * Every material mints transparent-enabled from the start so the crossfade
 * animates `opacity` without triggering shader recompiles mid-transition.
 * Materials are tracked so the builder can fade and dispose a whole era set.
 */
export class MaterialKit {
  private readonly pool: THREE.MeshStandardMaterial[] = [];

  std(options: StdMaterialOptions): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial({
      color: options.color,
      roughness: options.roughness ?? 0.75,
      metalness: options.metalness ?? 0.0,
      emissive: options.emissive ?? 0x000000,
      emissiveIntensity: options.emissiveIntensity ?? 1,
      side: options.side ?? THREE.FrontSide,
      transparent: true,
      opacity: 0,
      depthWrite: true,
    });
    this.pool.push(material);
    return material;
  }

  /** All materials minted by this kit (for opacity fading). */
  get materials(): readonly THREE.MeshStandardMaterial[] {
    return this.pool;
  }

  dispose(): void {
    for (const material of this.pool) material.dispose();
    this.pool.length = 0;
  }
}

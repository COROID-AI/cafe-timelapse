import * as THREE from 'three';

/**
 * Material factory kit for the counter-technology group.
 *
 * Every function returns a FRESH material instance — era variants must never
 * share material objects, because the crossfade animator drives per-variant
 * opacity independently. Palette helpers keep the five era files readable.
 */

export type SurfaceMaterial = THREE.MeshStandardMaterial;

/** Generic painted / matte surface. */
export function paint(color: number, roughness = 0.6): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Appliance housings — register shells, POS wedges, terminals. */
export function plastic(color: number, roughness = 0.46): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Vitreous enamel — cream cash-register bodies, 1960s trim. */
export function enamel(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.2 });
}

/** Timber — till cabinets, receipt pads, stands. */
export function wood(color: number, roughness = 0.62): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Generic metal; tune metalness down for worn or painted metal. */
export function metal(color: number, roughness = 0.32, metalness = 0.9): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** Mirror chrome — register bands, imprinter rails. */
export function chrome(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xf0f3f4, roughness: 0.16, metalness: 0.95 });
}

/** Brushed stainless — card terminals, PC cases. */
export function brushedSteel(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xc3c8cc, roughness: 0.42, metalness: 0.85 });
}

export function brass(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xb08d3e, roughness: 0.3, metalness: 0.9 });
}

export function blackSteel(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x23211f, roughness: 0.55, metalness: 0.6 });
}

/**
 * Emissive panel — VFD tubes, LCDs, contactless glows. The base colour stays
 * near-black while `emissive` does the visual work.
 */
export function glow(colorHex: number, intensity = 1.7): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x0b0d10,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: intensity,
    roughness: 0.4,
  });
}

/** Receipt / carbon paper — matte, slightly warm white. */
export function paper(color = 0xf2ead6): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.88 });
}

export function rubber(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9 });
}

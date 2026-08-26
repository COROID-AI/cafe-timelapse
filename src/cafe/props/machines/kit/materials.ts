import * as THREE from 'three';

/**
 * Material factory kit for the brewing-equipment group.
 *
 * Every function returns a FRESH material instance — era variants must never
 * share material objects, because the crossfade animator animates per-variant
 * opacity independently. Palette helpers keep the five era files readable.
 */

export type SurfaceMaterial = THREE.MeshStandardMaterial;

/** Generic painted / matte surface. */
export function paint(color: number, roughness = 0.6): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Injection-moulded appliance plastic (1980s drip machines, 2025 monoliths). */
export function plastic(color: number, roughness = 0.46): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Vitreous enamel — cream urns, canisters, post-war cookware. */
export function enamel(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.2 });
}

/** Glazed ceramic cups and jugs. */
export function ceramic(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.26 });
}

/** Timber — grinder boxes, oak slats, bench tops. */
export function wood(color: number, roughness = 0.62): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Generic metal; tune metalness down for worn or painted metal. */
export function metal(color: number, roughness = 0.32, metalness = 0.9): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** Mirror chrome — percolators, espresso trim. */
export function chrome(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xf0f3f4, roughness: 0.16, metalness: 0.95 });
}

/** Brushed stainless steel — 2005-era espresso hardware. */
export function brushedSteel(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xc3c8cc, roughness: 0.42, metalness: 0.85 });
}

export function brass(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xb08d3e, roughness: 0.3, metalness: 0.9 });
}

export function blackSteel(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x23211f, roughness: 0.55, metalness: 0.6 });
}

/** Translucent glass panes and reservoirs. Depth-write off so interiors read. */
export function glass(tint = 0xd8e6e8, opacity = 0.26): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({
    color: tint,
    roughness: 0.08,
    metalness: 0.05,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
}

/** Liquid fills — coffee in carafes, cold brew in dispensers. */
export function liquid(color: number, opacity = 0.94): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.18,
    transparent: true,
    opacity,
  });
}

/**
 * Emissive panel — touchscreens, indicator LEDs, gas flames. The base colour
 * stays near-black while `emissive` does the visual work.
 */
export function glow(colorHex: number, intensity = 1.7): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0x0b0d10,
    emissive: new THREE.Color(colorHex),
    emissiveIntensity: intensity,
    roughness: 0.4,
  });
}

export function rubber(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0x14161a, roughness: 0.9 });
}

export function fabric(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
}

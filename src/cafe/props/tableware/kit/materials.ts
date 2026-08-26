import * as THREE from 'three';

/**
 * Material factory kit for the tableware group.
 *
 * Every function returns a FRESH material instance — era variants must never
 * share material objects, because the instant-swap rig restores per-variant
 * state independently. Palette helpers keep the five era files readable.
 */

export type SurfaceMaterial = THREE.MeshStandardMaterial;

/** Glazed ceramic / vitreous china — cups, plates, ashtrays. */
export function ceramic(color: number, roughness = 0.24): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Matte fired clay — 1980s pastel stoneware. */
export function stoneware(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.58 });
}

/** Vitreous enamel — chipped wartime mugs and pitchers. */
export function enamel(color: number, roughness = 0.18): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Injection-moulded melamine — formica-safe diner plates. */
export function melamine(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.04 });
}

/** Generic moulded plastic — lids, syrup caps, eco-cup bodies. */
export function plastic(color: number, roughness = 0.42): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

/** Corrugated cardboard — branded takeaway sleeves. */
export function cardboard(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xa87c50, roughness: 0.95 });
}

/** Paper napkins, ration-book pages, cigarette stubs. */
export function paper(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xf1eee2, roughness: 0.92 });
}

/** Printed card stock — takeaway branding bands, ration-book covers. */
export function cardStock(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85 });
}

/** Woven linen — 1945 sugar-bowl cloth accents. */
export function linen(color: number): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.95 });
}

/** Translucent glass — sugar pourers, carafes, flat-white glasses. */
export function glass(tint = 0xdce8ea, opacity = 0.3): SurfaceMaterial {
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

/** Liquid fills — filter coffee, syrup, crema-topped milk. */
export function liquid(color: number, opacity = 0.96): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.16, transparent: true, opacity });
}

/** Generic metal; tune metalness down for worn or painted metal. */
export function metal(color: number, roughness = 0.32, metalness = 0.9): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

/** Mirror chrome — diner shaker caps. */
export function chrome(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xf0f3f4, roughness: 0.16, metalness: 0.95 });
}

/** Brushed stainless steel — napkin dispensers, pourer caps. */
export function stainless(): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color: 0xc3c8cc, roughness: 0.42, metalness: 0.85 });
}

/** Near-black matte — slots, chip marks, ash. */
export function darkMatte(color = 0x17151a, roughness = 0.9): SurfaceMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness });
}

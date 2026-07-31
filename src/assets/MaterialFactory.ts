/**
 * MaterialFactory — PBR-ish Three.js materials parameterised by era palette.
 *
 * Materials are built with `MeshPhysicalMaterial` (the StandardPhysical
 * surface from the brief: clearcoat, sheen, transmission, IOR, …) so era
 * fragments get convincing café surfaces without loading external maps. A
 * material can be stamped from an era's palette tokens (`forEra`) or built
 * directly from an explicit `MaterialSpec` (useful for single-purpose props).
 *
 * `forEra` returns the same material instance for the same era + spec key, so
 * fragments that share a surface share one material (efficient, and the
 * TransitionController's per-group material cloning keeps cross-fades safe).
 *
 * Headless-safe: CanvasTexture-backed materials never touch WebGL until the
 * renderer uploads them, and the spec helpers only depend on `three` math.
 */
import * as THREE from 'three';
import type { EraYear } from '../data/eras';
import { paletteFor, type EraPaletteTokens } from './palettes';
import { textureFactory } from './TextureFactory';

/** The kinds of surfaces the factory can synthesise for an era. */
export type MaterialKind =
  | 'wall'
  | 'floor'
  | 'ceiling'
  | 'trim'
  | 'wood'
  | 'metal'
  | 'chrome'
  | 'brass'
  | 'plastic'
  | 'leather'
  | 'ceramic'
  | 'glass'
  | 'neon'
  | 'chalkboard'
  | 'letterboard'
  | 'poster'
  | 'fabric'
  | 'wallpaper'
  | 'geometric'
  | 'woodPanel';

/** Explicit material construction parameters. */
export interface MaterialSpec {
  kind?: MaterialKind;
  /** Albedo colour (CSS hex). */
  color: string;
  /** Roughness in [0, 1]. Default 0.6. */
  roughness?: number;
  /** Metalness in [0, 1]. Default 0. */
  metalness?: number;
  /** Clearcoat strength in [0, 1]. Default 0. */
  clearcoat?: number;
  /** Sheen strength in [0, 1] (fabrics). Default 0. */
  sheen?: number;
  /** Transmission in [0, 1] (glass). Default 0. */
  transmission?: number;
  /** Index of refraction. Default 1.5. */
  ior?: number;
  /** Emissive colour (CSS hex). Default black. */
  emissive?: string;
  /** Emissive intensity. Default 0. */
  emissiveIntensity?: number;
  /**
   * Optional procedural texture applied to the map slot. `texture` can be a
   * `THREE.Texture` or a TextureFactory spec (via the shared factory). When a
   * texture is present it tints the map with `color`.
   */
  texture?: THREE.Texture | {
    kind: 'woodGrain' | 'tile' | 'wallpaper' | 'geometric' | 'neon' | 'chalkboard' | 'letterboard' | 'poster' | 'brick';
    color?: string;
    color2?: string;
    size?: number;
    repeats?: number;
    rotation?: number;
    title?: string;
    lines?: string[];
  };
  /** Multiply map texture strength in [0, 1]. Default 1. */
  mapStrength?: number;
  /** Tint applied over the texture. Default white (no tint). */
  tint?: string;
}

export interface EraMaterialOptions {
  /** Override individual material kinds for this era. */
  overrides?: Partial<Record<MaterialKind, MaterialSpec>>;
}

/** Build a material directly from an explicit spec. */
export function materialFromSpec(spec: MaterialSpec): THREE.MeshPhysicalMaterial {
  let map: THREE.Texture | null = null;
  if (spec.texture) {
    const result =
      spec.texture instanceof THREE.Texture
        ? { texture: spec.texture as THREE.Texture }
        : textureFactory.get(spec.texture);
    map = result.texture;
  }

  const materialParams: THREE.MeshPhysicalMaterialParameters = {
    color: new THREE.Color(spec.tint ?? '#ffffff'),
    roughness: spec.roughness ?? 0.6,
    metalness: spec.metalness ?? 0,
    clearcoat: spec.clearcoat ?? 0,
    sheen: spec.sheen ?? 0,
    transmission: spec.transmission ?? 0,
    ior: spec.ior ?? 1.5,
    emissive: new THREE.Color(spec.emissive ?? '#000000'),
    emissiveIntensity: spec.emissiveIntensity ?? 0,
  };
  if (map) materialParams.map = map;
  const material = new THREE.MeshPhysicalMaterial(materialParams);

  if (map && spec.mapStrength !== undefined) {
    material.color.multiplyScalar(spec.mapStrength);
  }
  if (map) {
    // Keep albedo from washing out the pattern when both are provided.
    material.color.multiply(new THREE.Color(spec.color));
  } else {
    material.color.set(spec.color);
  }

  material.name = `procedural-${spec.kind ?? 'material'}-${spec.color}`;
  material.userData.proceduralKind = spec.kind ?? 'material';
  return material;
}

const KIND_COLOR_FALLBACK: Record<MaterialKind, string> = {
  wall: '#EDE3CE',
  floor: '#E8E0D0',
  ceiling: '#B9B2A2',
  trim: '#4A3726',
  wood: '#5C4432',
  wallpaper: '#EDE3CE',
  geometric: '#EFE3B6',
  woodPanel: '#8A6A4A',
  metal: '#B0B4B8',
  chrome: '#D6D9DC',
  brass: '#B08D57',
  plastic: '#D94F3D',
  leather: '#7A2436',
  ceramic: '#F4EFE6',
  glass: '#9FD8E8',
  neon: '#FF5AC8',
  chalkboard: '#2F3B31',
  letterboard: '#1F2428',
  poster: '#C94F3D',
  fabric: '#E4DCC8',
};

/** Compose one era's tokens into a full default material spec set. */
export function eraMaterialSpecs(tokens: EraPaletteTokens): Record<MaterialKind, MaterialSpec> {
  return {
    wall: { kind: 'wall', color: tokens.walls, roughness: 0.92, texture: { kind: 'wallpaper', color: tokens.walls, color2: tokens.trim, size: 256, repeats: 3 } },
    wallpaper: { kind: 'wallpaper', color: tokens.walls, roughness: 0.92, texture: { kind: 'wallpaper', color: tokens.walls, color2: tokens.accent, size: 256, repeats: 3 } },
    geometric: { kind: 'geometric', color: tokens.walls, roughness: 0.92, texture: { kind: 'geometric', color: tokens.walls, color2: tokens.accent, size: 256, repeats: 3 } },
    woodPanel: { kind: 'woodPanel', color: tokens.trim, roughness: 0.55, clearcoat: 0.25, texture: { kind: 'woodGrain', color: tokens.furniture, color2: tokens.trim, size: 256 } },
    floor: { kind: 'floor', color: tokens.floor, roughness: 0.85, texture: { kind: 'tile', color: tokens.floor, color2: tokens.trim, size: 256, repeats: 4 } },
    ceiling: { kind: 'ceiling', color: tokens.ceiling, roughness: 0.9 },
    trim: { kind: 'trim', color: tokens.trim, roughness: 0.6, metalness: 0.35 },
    wood: { kind: 'wood', color: tokens.furniture, roughness: 0.5, clearcoat: 0.3, texture: { kind: 'woodGrain', color: tokens.furniture, color2: tokens.trim, size: 256 } },
    metal: { kind: 'metal', color: tokens.machines, roughness: 0.4, metalness: 0.9 },
    chrome: { kind: 'chrome', color: tokens.machines, roughness: 0.12, metalness: 1 },
    brass: { kind: 'brass', color: tokens.machines, roughness: 0.35, metalness: 0.95 },
    plastic: { kind: 'plastic', color: tokens.furniture, roughness: 0.35, clearcoat: 0.5 },
    leather: { kind: 'leather', color: tokens.furniture, roughness: 0.6, sheen: 0.4 },
    ceramic: { kind: 'ceramic', color: tokens.tableware, roughness: 0.25, clearcoat: 0.8 },
    glass: { kind: 'glass', color: tokens.neon, roughness: 0.08, transmission: 0.85, ior: 1.5, clearcoat: 0.6 },
    neon: { kind: 'neon', color: tokens.signage, roughness: 0.3, emissive: tokens.neon, emissiveIntensity: 2.2, texture: { kind: 'neon', color: tokens.neon, color2: tokens.signage, size: 256 } },
    chalkboard: { kind: 'chalkboard', color: tokens.signage, roughness: 0.85, texture: { kind: 'chalkboard', color: tokens.signage, color2: tokens.neon, size: 512, title: 'MENU' } },
    letterboard: { kind: 'letterboard', color: tokens.signage, roughness: 0.7, clearcoat: 0.3, texture: { kind: 'letterboard', color: tokens.signage, color2: tokens.neon, size: 512, lines: ['COFFEE 20', 'ESPRESSO 25', 'CAPPUCCINO 30', 'DONUT 20', 'PIE 25'] } },
    poster: { kind: 'poster', color: tokens.accent, roughness: 0.85, texture: { kind: 'poster', color: tokens.accent, color2: tokens.neon, size: 512, title: 'POSTER' } },
    fabric: { kind: 'fabric', color: tokens.accent, roughness: 0.95, sheen: 0.6 },
  };
}

/**
 * MaterialFactory — cached per-era material library.
 *
 * ```ts
 * const materials = new MaterialFactory();
 * const counterWood = materials.forEra(1945, 'wood');
 * const neonSign   = materials.forEra(1965, 'neon');
 * const glassCup   = materials.forEra(2025, 'glass');
 * ```
 */
export class MaterialFactory {
  private readonly cache = new Map<string, THREE.MeshPhysicalMaterial>();
  private readonly options: EraMaterialOptions;

  constructor(options: EraMaterialOptions = {}) {
    this.options = options;
  }

  /** Return the (cached) material for one era + kind. */
  forEra(era: EraYear, kind: MaterialKind): THREE.MeshPhysicalMaterial {
    const key = `${era}:${kind}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const material = this.create(era, kind);
    this.cache.set(key, material);
    return material;
  }

  /** Number of distinct materials currently cached. */
  get size(): number {
    return this.cache.size;
  }

  /** Release all cached materials (and their maps). */
  releaseAll(): void {
    for (const material of this.cache.values()) {
      material.map?.dispose();
      material.dispose();
    }
    this.cache.clear();
  }

  private create(era: EraYear, kind: MaterialKind): THREE.MeshPhysicalMaterial {
    const override = this.options.overrides?.[kind];
    if (override) return materialFromSpec({ ...override, kind: kind ?? override.kind });
    const specs = eraMaterialSpecs(paletteFor(era));
    return materialFromSpec(specs[kind]);
  }
}

/** Convenience singleton so era tasks can share one material library. */
export const materialFactory = new MaterialFactory();

export { KIND_COLOR_FALLBACK };

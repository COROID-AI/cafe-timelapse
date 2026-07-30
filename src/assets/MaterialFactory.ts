/**
 * MaterialFactory.ts — PBR-ish Three.js materials parameterized by era palette.
 *
 * Exposes parameterized `MeshStandardMaterial` / `MeshPhysicalMaterial` builders
 * keyed by era. Every era task asks this factory for a material by *role*
 * (wood, metal, ceramic, neon, chalkboard, fabric, glass, …) and receives a
 * PBR-tuned material whose colour, roughness, metalness, and clearcoat reflect
 * the era's {@link EraPalette} and mood. This is the single source of truth for
 * surface appearance — era tasks consume but never hand-roll their own PBR
 * params.
 *
 * Materials are cached per (role, year, option-hash) so instanced props share
 * the same material instance wherever possible, keeping draw-call-friendly
 * material reuse high.
 *
 * The factory also wires procedural textures from {@link TextureFactory} onto
 * the relevant roles (wood grain on the wood material, wallpaper on the wall
 * material, slate on the chalkboard material, …) so a single call yields a
 * fully-dressed surface.
 */
import {
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
  type Texture,
} from 'three';
import { getEraPalette, darken } from './EraPalette.js';
import { TextureFactory } from './TextureFactory.js';
import type { EraYear } from '../data/EraData.js';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Material roles — the *named surfaces* the asset toolkit exposes. Each maps to
 * a tuned PBR recipe. Era tasks request materials by role, never by raw params.
 */
export type MaterialRole =
  | 'wood'
  | 'metal'
  | 'chrome'
  | 'brass'
  | 'ceramic'
  | 'glass'
  | 'plastic'
  | 'neon'
  | 'chalkboard'
  | 'wallpaper'
  | 'plaster'
  | 'brick'
  | 'concrete'
  | 'fabric'
  | 'paper'
  | 'leather';

/** Tunable overrides applied on top of the era-derived PBR defaults. */
export interface MaterialOptions {
  /** Override the base colour (else the palette token for the role is used). */
  readonly color?: number;
  /** Override roughness (0 mirror – 1 fully diffuse). */
  readonly roughness?: number;
  /** Override metalness (0 dielectric – 1 metal). */
  readonly metalness?: number;
  /** Emissive colour (for neon / signage). Defaults to none. */
  readonly emissive?: number;
  /** Emissive intensity multiplier. */
  readonly emissiveIntensity?: number;
  /** Clearcoat layer intensity (0–1) for lacquered/ceramic sheen. */
  readonly clearcoat?: number;
  /** Transmission (0–1) for glass; enables physical transparency. */
  readonly transmission?: number;
  /** Whether to apply the procedural map texture for this role. */
  readonly textured?: boolean;
  /** Texture horizontal repeat. */
  readonly repeatX?: number;
  /** Texture vertical repeat. */
  readonly repeatY?: number;
}

/** The union of option types accepted by the factory (currently uniform). */
export type AnyMaterialOptions = MaterialOptions;

// ---------------------------------------------------------------------------
// Per-role PBR recipes.
//
// Each recipe derives its base colour + PBR scalars from an EraPalette and the
// intended physical material at a glance.
// ---------------------------------------------------------------------------

/** Result of a recipe: the params to feed a material constructor. */
interface RecipeResult {
  color: number;
  roughness: number;
  metalness: number;
  emissive: number;
  emissiveIntensity: number;
  clearcoat: number;
  transmission: number;
  /** Which TextureFactory kind to attach as the map, if textured. */
  textureKind?:
    | 'wood'
    | 'tile'
    | 'wallpaper'
    | 'neonGlow'
    | 'chalkboard'
    | 'posterFrame'
    | 'concrete'
    | 'brick'
    | 'plaster'
    | 'fabric';
}

/** Resolve a role's recipe against a palette + overrides. */
function resolveRecipe(
  role: MaterialRole,
  p: ReturnType<typeof getEraPalette>,
  o: MaterialOptions,
): RecipeResult {
  // Start from role-specific defaults.
  const base: RecipeResult = (() => {
    switch (role) {
      case 'wood':
        return {
          color: p.wood,
          roughness: 0.7 - p.warmth * 0.15,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0.1,
          transmission: 0,
          textureKind: 'wood' as const,
        };
      case 'metal':
        return {
          color: p.metal,
          roughness: 0.4,
          metalness: 0.9,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
        };
      case 'chrome':
        return {
          color: 0xeef0f4,
          roughness: 0.08,
          metalness: 1,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
        };
      case 'brass':
        return {
          color: p.metal,
          roughness: 0.25,
          metalness: 1,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0.3,
          transmission: 0,
        };
      case 'ceramic':
        return {
          color: p.ceramic,
          roughness: 0.35,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0.8,
          transmission: 0,
        };
      case 'glass':
        return {
          color: 0xffffff,
          roughness: 0.05,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 1,
        };
      case 'plastic':
        return {
          color: p.secondary,
          roughness: 0.5,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0.5,
          transmission: 0,
        };
      case 'neon':
        return {
          color: p.neon,
          roughness: 0.4,
          metalness: 0,
          emissive: p.neon,
          emissiveIntensity: 1.6,
          clearcoat: 0,
          transmission: 0,
          textureKind: 'neonGlow' as const,
        };
      case 'chalkboard':
        return {
          color: p.chalkboard,
          roughness: 0.9,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
          textureKind: 'chalkboard' as const,
        };
      case 'wallpaper':
        return {
          color: p.wall,
          roughness: 0.85,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
          textureKind: 'wallpaper' as const,
        };
      case 'plaster':
        return {
          color: p.wall,
          roughness: 0.95,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
          textureKind: 'plaster' as const,
        };
      case 'brick':
        return {
          color: p.wall,
          roughness: 0.9,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
          textureKind: 'brick' as const,
        };
      case 'concrete':
        return {
          color: p.floor,
          roughness: 0.8,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0.1,
          transmission: 0,
          textureKind: 'concrete' as const,
        };
      case 'fabric':
        return {
          color: p.primary,
          roughness: 0.9,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
          textureKind: 'fabric' as const,
        };
      case 'paper':
        return {
          color: p.paper,
          roughness: 0.85,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0,
          transmission: 0,
        };
      case 'leather':
        return {
          color: darken(p.wood, 0.1),
          roughness: 0.6,
          metalness: 0,
          emissive: 0x000000,
          emissiveIntensity: 0,
          clearcoat: 0.4,
          transmission: 0,
        };
      default: {
        const exhaustive: never = role;
        throw new Error(`MaterialFactory: unhandled role "${exhaustive}".`);
      }
    }
  })();

  // Apply per-option overrides.
  return {
    ...base,
    color: o.color ?? base.color,
    roughness: o.roughness ?? base.roughness,
    metalness: o.metalness ?? base.metalness,
    emissive: o.emissive ?? base.emissive,
    emissiveIntensity: o.emissiveIntensity ?? base.emissiveIntensity,
    clearcoat: o.clearcoat ?? base.clearcoat,
    transmission: o.transmission ?? base.transmission ?? 0,
    textureKind: o.textured === false ? undefined : base.textureKind,
  };
}

// ---------------------------------------------------------------------------
// Cache + public factory
// ---------------------------------------------------------------------------

/** Composite cache key for materials. */
function cacheKey(
  role: MaterialRole,
  year: EraYear,
  o: MaterialOptions,
): string {
  return [
    role,
    String(year),
    `c${o.color ?? ''}`,
    `r${o.roughness ?? ''}`,
    `m${o.metalness ?? ''}`,
    `e${o.emissive ?? ''}`,
    `ei${o.emissiveIntensity ?? ''}`,
    `cc${o.clearcoat ?? ''}`,
    `t${o.transmission ?? ''}`,
    `tx${o.textured === false ? 0 : 1}`,
    `rx${o.repeatX ?? ''}`,
    `ry${o.repeatY ?? ''}`,
  ].join('|');
}

/** Shared material cache. */
const materialCache = new Map<string, Material>();

/**
 * Build (or fetch cached) a material for a role + era. Returns a
 * `MeshPhysicalMaterial` when clearcoat/transmission are needed, otherwise a
 * lighter `MeshStandardMaterial`.
 */
function buildMaterial(
  role: MaterialRole,
  year: EraYear,
  options: MaterialOptions,
): Material {
  const key = cacheKey(role, year, options);
  const cached = materialCache.get(key);
  if (cached) return cached;

  const palette = getEraPalette(year);
  const r = resolveRecipe(role, palette, options);

  // Decide whether we need the heavier Physical material.
  const needsPhysical = r.clearcoat > 0 || r.transmission > 0;

  let material: MeshStandardMaterial;
  if (needsPhysical) {
    const phys = new MeshPhysicalMaterial({
      color: r.color,
      roughness: r.roughness,
      metalness: r.metalness,
      emissive: r.emissive,
      emissiveIntensity: r.emissiveIntensity,
      clearcoat: r.clearcoat,
      clearcoatRoughness: Math.max(0.02, r.roughness * 0.5),
      transmission: r.transmission,
      thickness: r.transmission > 0 ? 0.5 : 0,
      ior: r.transmission > 0 ? 1.45 : 1.5,
    });
    material = phys;
  } else {
    material = new MeshStandardMaterial({
      color: r.color,
      roughness: r.roughness,
      metalness: r.metalness,
      emissive: r.emissive,
      emissiveIntensity: r.emissiveIntensity,
    });
  }

  // Attach the procedural map texture for this role, if applicable.
  if (r.textureKind) {
    const tex: Texture = TextureFactory.get(r.textureKind, year, {
      repeatX: options.repeatX,
      repeatY: options.repeatY,
    });
    material.map = tex;
    // For emissive roles (neon), also wire emissiveMap so the glow map drives
    // the emission.
    if (role === 'neon') material.emissiveMap = tex;
    material.needsUpdate = true;
  }

  material.name = `mat:${role}:${year}`;
  materialCache.set(key, material);
  return material;
}

/** Public API surface for the procedural material toolkit. */
export const MaterialFactory = {
  /** Number of materials currently held in the cache. */
  get cacheSize(): number {
    return materialCache.size;
  },

  /**
   * Get (creating + caching if absent) a PBR material for the given role and
   * era. Repeated calls with identical parameters return the same instance.
   */
  get(role: MaterialRole, year: EraYear, options: MaterialOptions = {}): Material {
    return buildMaterial(role, year, options);
  },

  /** Convenience accessors for the most common roles. */
  wood(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('wood', year, options);
  },
  metal(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('metal', year, options);
  },
  chrome(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('chrome', year, options);
  },
  ceramic(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('ceramic', year, options);
  },
  glass(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('glass', year, options);
  },
  neon(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('neon', year, options);
  },
  chalkboard(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('chalkboard', year, options);
  },
  wallpaper(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('wallpaper', year, options);
  },
  fabric(year: EraYear, options: MaterialOptions = {}): Material {
    return this.get('fabric', year, options);
  },

  /**
   * Dispose a single cached material (and drop it from the cache). Note: the
   * procedural textures backing a material are owned by TextureFactory's cache
   * and are not disposed here.
   */
  dispose(role: MaterialRole, year: EraYear, options: MaterialOptions = {}): void {
    const key = cacheKey(role, year, options);
    const mat = materialCache.get(key);
    if (mat) {
      mat.dispose();
      materialCache.delete(key);
    }
  },

  /** Dispose every cached material and clear the cache (e.g. on full reset). */
  disposeAll(): void {
    for (const mat of materialCache.values()) mat.dispose();
    materialCache.clear();
  },
} as const;

// Re-export so era tasks can type material fields without importing three.
export type { Material, Texture };

/**
 * AssetRegistry.ts — registration pattern for per-era scene fragments.
 *
 * Each era registers a factory for each of the 11 categories. A factory is a
 * zero-argument function that builds (and returns) a Three.js `Object3D` — a
 * self-contained "fragment" of the scene for that category and era (e.g. the
 * 1985 jukebox, the 2025 contactless counter, the 2055 wall panels).
 *
 * Downstream tasks register their fragments:
 *
 *   register('musicSource', 1985, () => buildJukebox());
 *   const fragments = getFragmentsForEra(1985);
 *   for (const f of fragments) scene.add(f());
 *
 * Factories are intentionally lazy: building all six eras' geometry upfront
 * would be wasteful. The scene controller mounts only the selected era's
 * fragments and disposes the rest.
 */
import type { Object3D } from 'three';
import type { CategoryKey, EraYear } from '../data/EraData.js';

/** Per-era context handed to a factory when it is invoked. */
export interface EraSceneContext {
  readonly era: EraYear;
  readonly category: CategoryKey;
}

/**
 * A factory that builds the scene fragment for one category + era.
 * Must return a fresh `Object3D` tree each call (the controller owns disposal).
 */
export type SceneFragmentFactory = (context: EraSceneContext) => Object3D;

interface RegistryEntry {
  factory: SceneFragmentFactory;
  category: CategoryKey;
  era: EraYear;
}

class AssetRegistryImpl {
  private readonly entries = new Map<string, RegistryEntry>();
  private readonly registeredKeys = new Set<string>();

  /** Stable composite key for a (category, era) pair. */
  private key(category: CategoryKey, era: EraYear): string {
    return `${category}::${era}`;
  }

  /**
   * Register a scene-fragment factory for a given category and era.
   * Throws on duplicate registration to catch accidental double-registration
   * during module init.
   */
  register(
    category: CategoryKey,
    era: EraYear,
    factory: SceneFragmentFactory,
  ): void {
    const k = this.key(category, era);
    if (this.registeredKeys.has(k)) {
      throw new Error(
        `AssetRegistry: duplicate registration for "${category}" (era ${era}).`,
      );
    }
    this.registeredKeys.add(k);
    this.entries.set(k, { factory, category, era });
  }

  /** True when a factory has been registered for the (category, era) pair. */
  has(category: CategoryKey, era: EraYear): boolean {
    return this.registeredKeys.has(this.key(category, era));
  }

  /** Get the single factory for a category + era, or undefined. */
  get(category: CategoryKey, era: EraYear): SceneFragmentFactory | undefined {
    return this.entries.get(this.key(category, era))?.factory;
  }

  /**
   * Get every registered factory for an era as an ordered map keyed by
   * category. Categories with no registration are simply absent — callers that
   * require completeness should validate against CATEGORY_KEYS.
   */
  getFragmentsForEra(era: EraYear): Map<CategoryKey, SceneFragmentFactory> {
    const out = new Map<CategoryKey, SceneFragmentFactory>();
    for (const entry of this.entries.values()) {
      if (entry.era === era) out.set(entry.category, entry.factory);
    }
    return out;
  }

  /** Build (instantiate) all registered fragments for an era into Object3Ds. */
  buildFragmentsForEra(era: EraYear): Object3D[] {
    const out: Object3D[] = [];
    for (const [category, factory] of this.getFragmentsForEra(era)) {
      out.push(factory({ era, category }));
    }
    return out;
  }

  /** Number of registered (category, era) pairs. Mainly for diagnostics. */
  get size(): number {
    return this.registeredKeys.size;
  }
}

/** Shared process-wide registry instance. */
export const assetRegistry = new AssetRegistryImpl();

/**
 * Convenience module-level function mirroring the documented pattern:
 *   register(category, era, factory)
 */
export function register(
  category: CategoryKey,
  era: EraYear,
  factory: SceneFragmentFactory,
): void {
  assetRegistry.register(category, era, factory);
}

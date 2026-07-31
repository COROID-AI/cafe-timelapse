/**
 * CharacterRoster.ts — era-scoped registry of café patron configurations.
 *
 * Era-population tasks (Phase 6) create {@link PatronConfig}s and register them
 * here. The roster both **stores** the configs (so other systems can query
 * which patrons belong to an era) and **registers** a single scene-fragment
 * factory per era with the {@link AssetRegistry}, so the era's patrons mount /
 * unmount automatically when {@link SceneManager} switches eras.
 *
 * The roster is a thin coordinator over three existing systems:
 *   1. {@link AssetRegistry} — the factory-registration pattern era fragments use.
 *   2. {@link CharacterAvatar} — the procedural seated-figure builder.
 *   3. {@link layout.ts} anchors — the stable named seats.
 *
 * It owns no geometry itself. Each registered era gets one factory that builds
 * a `Group` containing every patron for that era, seated at their anchors.
 *
 * Downstream consumers (the era fragment builders, the scene controller, the
 * slider transition wiring) ask the roster for the active era's configs and
 * hand them to {@link CharacterAvatar} to build the visible Object3D figures.
 *
 * The roster is deliberately data-only: it holds {@link PatronConfig} objects
 * (plain data), not Three.js objects. This keeps era-scoped visibility a pure
 * data question and lets the avatar builder be swapped independently.
 */
import { Group, type Object3D } from 'three';
import { assetRegistry } from '../registry/AssetRegistry.js';
import { ANCHORS } from '../world/layout.js';
import { buildSeatedPatron, buildCharacterAvatar } from './CharacterAvatar.js';
import type { PatronConfig } from './PatronConfig.js';
import type { EraYear } from '../data/EraData.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options handed to a roster-registered factory. Mirrors the
 * {@link AssetRegistry} {@link EraSceneContext} but is kept self-contained so
 * the roster module does not re-export the registry's context type.
 */
export interface RosterFactoryContext {
  readonly era: EraYear;
  /** The category the roster registers under — always `'patrons'`. */
  readonly category: 'patrons';
}

// ---------------------------------------------------------------------------
// CharacterRoster
// ---------------------------------------------------------------------------

/**
 * Userland type guard that recognises both mutable and readonly patron-config
 * arrays. The built-in `Array.isArray` narrows to `any[]`, which does not
 * exclude `readonly T[]` from the false branch, so we provide our own.
 */
function isPatronConfigArray(
  v: PatronConfig | readonly PatronConfig[],
): v is readonly PatronConfig[] {
  return Array.isArray(v);
}

class CharacterRosterImpl {
  /** Patrons keyed by era, then by patron id. */
  private readonly patrons = new Map<EraYear, Map<string, PatronConfig>>();

  /** Track which eras have already had a factory registered, to avoid dupes. */
  private readonly registeredEras = new Set<EraYear>();

  /** Flat set of all registered patron ids (catches duplicate ids). */
  private readonly ids = new Set<string>();

  /**
   * Register one or more patrons for an era. Call this during era-population
   * module init. Patrons are stored immediately; the scene-fragment factory is
   * registered with the {@link AssetRegistry} on the first call for a given era.
   *
   * Two call signatures are supported:
   *  • `register(config)` / `register(configs[])` — structured (1945) form;
   *    all configs in a single call must share an era.
   *  • `register(era, ...configs)` — flat-slug (1965+) form; each patron's
   *    `era` field MUST match the era argument (a mismatch throws — it catches
   *    accidental cross-era registration).
   */
  register(config: PatronConfig): void;
  register(configs: readonly PatronConfig[]): void;
  register(era: EraYear, ...configs: PatronConfig[]): void;
  register(
    configOrEra: PatronConfig | readonly PatronConfig[] | EraYear,
    ...rest: PatronConfig[]
  ): void {
    let era: EraYear;
    let configs: readonly PatronConfig[];

    if (typeof configOrEra === 'number') {
      // Flat-slug form: register(era, ...configs)
      era = configOrEra;
      configs = rest;
      for (const c of configs) {
        if (c.era !== era) {
          throw new Error(
            `CharacterRoster: patron "${c.id}" has era ${c.era} but was registered under era ${era}.`,
          );
        }
      }
    } else if (isPatronConfigArray(configOrEra)) {
      // Array form: register(configs[])
      configs = configOrEra;
      if (configs.length === 0) return;
      era = configs[0].era;
      // All configs in a single call must share an era.
      for (const c of configs) {
        if (c.era !== era) {
          throw new Error(
            `CharacterRoster.register: mixed eras in one call ` +
              `(found ${c.era} alongside ${era}). Register per-era.`,
          );
        }
      }
    } else {
      // Single config form: register(config)
      configs = [configOrEra];
      era = configOrEra.era;
    }

    if (configs.length === 0) return;

    for (const c of configs) {
      if (c.id.length === 0) {
        throw new Error('CharacterRoster.register: patron id must be non-empty.');
      }
    }

    let bucket = this.patrons.get(era);
    if (!bucket) {
      bucket = new Map();
      this.patrons.set(era, bucket);
    }

    for (const c of configs) {
      if (bucket.has(c.id) || this.ids.has(c.id)) {
        throw new Error(
          `CharacterRoster.register: duplicate patron id "${c.id}" for era ${era}.`,
        );
      }
      bucket.set(c.id, c);
      this.ids.add(c.id);
    }

    // Lazily register the era's scene-fragment factory once.
    this.ensureFactoryRegistered(era);
  }

  /**
   * Register the per-era `patrons` factory with the AssetRegistry, unless it
   * has already been registered (either by us or pre-emptively by a stub).
   *
   * The AssetRegistry throws on duplicate registration, so we guard with
   * `has()`. The stub sweep (eraFragments.ts) itself skips already-registered
   * slots, so the contract is: import era-population modules BEFORE the stub
   * sweep in main.ts, and the detailed patron factory wins the slot.
   */
  private ensureFactoryRegistered(era: EraYear): void {
    if (this.registeredEras.has(era)) return;
    if (assetRegistry.has('patrons', era)) return;
    assetRegistry.register('patrons', era, (ctx) => this.buildEraGroup(ctx as RosterFactoryContext));
    this.registeredEras.add(era);
  }

  /**
   * Build the era's patron group from the stored configs. This is the factory
   * body the AssetRegistry invokes when mounting the era. It dispatches per
   * config shape: structured (1945) configs use the seated-figure builder at
   * the anchor world position; flat-slug (1965+) configs use the
   * era-palette-tinted builder.
   */
  private buildEraGroup(ctx: RosterFactoryContext): Object3D {
    const group = new Group();
    group.name = `patrons:${ctx.era}`;

    const bucket = this.patrons.get(ctx.era);
    if (!bucket) return group;

    for (const config of bucket.values()) {
      const isFlatSlug = typeof config.outfit === 'string';
      if (isFlatSlug) {
        group.add(buildCharacterAvatar(config));
      } else {
        const anchor = ANCHORS[config.seat];
        const anchorWorld: readonly [number, number, number] = [
          anchor.x,
          anchor.y,
          anchor.z,
        ];
        group.add(buildSeatedPatron(config, anchorWorld));
      }
    }

    return group;
  }

  /** True when at least one patron is registered for the era. */
  has(era: EraYear): boolean {
    const bucket = this.patrons.get(era);
    return !!bucket && bucket.size > 0;
  }

  /** Alias of {@link has} matching the flat-slug vocabulary. */
  hasEra(era: EraYear): boolean {
    return this.has(era);
  }

  /** All patrons for an era, in insertion order. */
  getForEra(era: EraYear): readonly PatronConfig[] {
    const bucket = this.patrons.get(era);
    return bucket ? [...bucket.values()] : [];
  }

  /** Alias of {@link getForEra} matching the flat-slug vocabulary. */
  getPatrons(era: EraYear): readonly PatronConfig[] {
    return this.getForEra(era);
  }

  /** A specific patron by id, or undefined. */
  getById(era: EraYear, id: string): PatronConfig | undefined {
    return this.patrons.get(era)?.get(id);
  }

  /**
   * Assert era-scoped visibility: `era` has at least `minCount` patrons and
   * no *other* era shares any of `era`'s patron ids. Used by tests to prove
   * a population is era-exclusive.
   */
  assertEraExclusive(era: EraYear, minCount: number): boolean {
    const mine = this.getForEra(era);
    if (mine.length < minCount) return false;
    const myIds = new Set(mine.map((c) => c.id));
    for (const [otherEra, bucket] of this.patrons) {
      if (otherEra === era) continue;
      for (const c of bucket.values()) {
        if (myIds.has(c.id)) return false;
      }
    }
    return true;
  }

  /** Number of patrons across all eras. */
  get size(): number {
    let total = 0;
    for (const bucket of this.patrons.values()) total += bucket.size;
    return total;
  }

  /** Remove all patrons for an era (the AssetRegistry factory is left in place). */
  clearEra(era: EraYear): void {
    const bucket = this.patrons.get(era);
    if (bucket) {
      for (const c of bucket.values()) this.ids.delete(c.id);
      bucket.clear();
    }
  }

  /** Remove all patrons for all eras (primarily for tests). */
  clear(): void {
    this.patrons.clear();
    this.ids.clear();
    this.registeredEras.clear();
  }
}

/** Shared process-wide roster instance. */
export const characterRoster = new CharacterRosterImpl();

/** Convenience function mirroring the instance method. */
export function registerPatron(config: PatronConfig): void {
  characterRoster.register(config);
}

/** Convenience function mirroring the instance method. */
export function registerPatrons(configs: readonly PatronConfig[]): void {
  characterRoster.register(configs);
}

/** Re-export the seating zone so consumers can validate anchor membership. */
export type { Object3D };

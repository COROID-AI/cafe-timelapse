/**
 * CharacterRoster.ts — era-scoped registry of café patrons.
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
 */
import { Group, type Object3D } from 'three';
import { assetRegistry } from '../registry/AssetRegistry.js';
import { ANCHORS } from '../world/layout.js';
import { buildSeatedPatron } from './CharacterAvatar.js';
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

class CharacterRosterImpl {
  /** Patrons keyed by era, then by patron id. */
  private readonly patrons = new Map<EraYear, Map<string, PatronConfig>>();

  /** Track which eras have already had a factory registered, to avoid dupes. */
  private readonly registeredEras = new Set<EraYear>();

  /**
   * Register one or more patrons for an era. Call this during era-population
   * module init. Patrons are stored immediately; the scene-fragment factory is
   * registered with the {@link AssetRegistry} on the first call for a given era.
   */
  register(config: PatronConfig): void;
  register(configs: readonly PatronConfig[]): void;
  register(config: PatronConfig | readonly PatronConfig[]): void {
    const configs = Array.isArray(config) ? config : [config];
    if (configs.length === 0) return;

    // All configs in a single call must share an era.
    const era = configs[0].era;
    for (const c of configs) {
      if (c.era !== era) {
        throw new Error(
          `CharacterRoster.register: mixed eras in one call ` +
            `(found ${c.era} alongside ${era}). Register per-era.`,
        );
      }
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
      if (bucket.has(c.id)) {
        throw new Error(
          `CharacterRoster.register: duplicate patron id "${c.id}" for era ${era}.`,
        );
      }
      bucket.set(c.id, c);
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
   * body the AssetRegistry invokes when mounting the era.
   */
  private buildEraGroup(ctx: RosterFactoryContext): Object3D {
    const group = new Group();
    group.name = `patrons:${ctx.era}`;

    const bucket = this.patrons.get(ctx.era);
    if (!bucket) return group;

    for (const config of bucket.values()) {
      const anchor = ANCHORS[config.seat];
      const anchorWorld: readonly [number, number, number] = [
        anchor.x,
        anchor.y,
        anchor.z,
      ];
      const avatar = buildSeatedPatron(config, anchorWorld);
      group.add(avatar);
    }

    return group;
  }

  /** True when at least one patron is registered for the era. */
  has(era: EraYear): boolean {
    const bucket = this.patrons.get(era);
    return !!bucket && bucket.size > 0;
  }

  /** All patrons for an era, in insertion order. */
  getForEra(era: EraYear): readonly PatronConfig[] {
    const bucket = this.patrons.get(era);
    return bucket ? [...bucket.values()] : [];
  }

  /** A specific patron by id, or undefined. */
  getById(era: EraYear, id: string): PatronConfig | undefined {
    return this.patrons.get(era)?.get(id);
  }

  /** Number of patrons across all eras. */
  get size(): number {
    let total = 0;
    for (const bucket of this.patrons.values()) total += bucket.size;
    return total;
  }

  /** Remove all patrons for an era (the AssetRegistry factory is left in place). */
  clearEra(era: EraYear): void {
    this.patrons.get(era)?.clear();
  }

  /** Remove all patrons for all eras (primarily for tests). */
  clear(): void {
    this.patrons.clear();
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

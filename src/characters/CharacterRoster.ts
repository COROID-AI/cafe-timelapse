/**
 * CharacterRoster.ts — era-scoped registry of café patrons.
 *
 * Per-era population tasks (e.g. {@link src/characters/patrons1985.ts})
 * register {@link PatronConfig}s here keyed by {@link EraYear}. The roster
 * is the single source of truth for "which patrons exist in which era", and
 * its era-scoped lookup is the mechanism that guarantees a 1985 patron is
 * visible ONLY in era 1985 — never in 1945, 2005, or any other era.
 *
 * Visibility contract: {@link getPatronsForEra} returns exactly the configs
 * registered for that era; {@link buildAvatarsForEra} resolves those configs
 * into positioned avatar `Object3D`s via {@link CharacterAvatar}. Because the
 * SceneManager only mounts the active era's group (built from the
 * AssetRegistry + this roster), a patron registered for 1985 is physically
 * absent from every other era's scene graph.
 *
 * Duplicate-guarded: registering a patron id twice (within the same era)
 * throws, so accidental double-registration during module init is caught.
 */
import type { EraYear } from '../data/EraData.js';
import type { PatronConfig } from './PatronConfig.js';
import { buildCharacterAvatar } from './CharacterAvatar.js';
import type { Object3D } from 'three';

/**
 * The shared, process-wide patron roster. A single instance backs the
 * exported `characterRoster` and the `registerPatrons`/`getPatronsForEra`
 * convenience functions, mirroring the {@link AssetRegistry} singleton
 * pattern.
 */
class CharacterRosterImpl {
  /** Era → list of patron configs (insertion-ordered). */
  private readonly byEra = new Map<EraYear, PatronConfig[]>();

  /** Patron id → era (for cross-era duplicate detection). */
  private readonly idToEra = new Map<string, EraYear>();

  /**
   * Register a single patron config for its declared era. Throws if a patron
   * with the same `id` is already registered (in any era) — ids must be
   * globally unique so avatar naming stays stable.
   */
  register(config: PatronConfig): void {
    if (this.idToEra.has(config.id)) {
      throw new Error(
        `CharacterRoster: duplicate patron id "${config.id}" ` +
          `(already registered for era ${this.idToEra.get(config.id)}).`,
      );
    }
    let list = this.byEra.get(config.era);
    if (!list) {
      list = [];
      this.byEra.set(config.era, list);
    }
    list.push(config);
    this.idToEra.set(config.id, config.era);
  }

  /**
   * Register multiple patron configs at once (convenience for era-population
   * modules that declare an array of configs).
   */
  registerAll(configs: readonly PatronConfig[]): void {
    for (const c of configs) this.register(c);
  }

  /** True when at least one patron is registered for the era. */
  hasEra(era: EraYear): boolean {
    return this.byEra.has(era);
  }

  /**
   * Get every patron config registered for an era (insertion-ordered). Returns
   * a defensive shallow copy so callers cannot mutate the roster's internal
   * list. Returns an empty array for an era with no patrons.
   */
  getPatronsForEra(era: EraYear): readonly PatronConfig[] {
    const list = this.byEra.get(era);
    return list ? [...list] : [];
  }

  /**
   * Build positioned avatar `Object3D`s for every patron registered for an
   * era, in insertion order. Each avatar is named `patron:<id>` and seated at
   * its declared anchor. The caller owns disposal of the returned objects.
   */
  buildAvatarsForEra(era: EraYear): Object3D[] {
    return this.getPatronsForEra(era).map((c) => buildCharacterAvatar(c));
  }

  /** Total number of registered patron configs across all eras. */
  get size(): number {
    let n = 0;
    for (const list of this.byEra.values()) n += list.length;
    return n;
  }

  /** Number of patrons registered for a single era. */
  countForEra(era: EraYear): number {
    return this.byEra.get(era)?.length ?? 0;
  }

  /** Clear every registered patron (primarily for tests). */
  clear(): void {
    this.byEra.clear();
    this.idToEra.clear();
  }
}

/** Shared process-wide roster instance. */
export const characterRoster = new CharacterRosterImpl();

/**
 * Convenience module-level function mirroring the documented pattern:
 *   characterRoster.register(config)
 * Registers a single patron config.
 */
export function registerPatron(config: PatronConfig): void {
  characterRoster.register(config);
}

/**
 * Convenience: register an array of patron configs for an era. Era-population
 * modules (e.g. patrons1985) call this with their full config list.
 */
export function registerPatrons(configs: readonly PatronConfig[]): void {
  characterRoster.registerAll(configs);
}

/**
 * Convenience: get every patron config for an era (era-scoped visibility
 * gate). Returns an empty array for eras with no registered patrons.
 */
export function getPatronsForEra(era: EraYear): readonly PatronConfig[] {
  return characterRoster.getPatronsForEra(era);
}

/**
 * Convenience: build positioned avatar Object3Ds for an era. The caller owns
 * disposal of the returned objects.
 */
export function buildAvatarsForEra(era: EraYear): Object3D[] {
  return characterRoster.buildAvatarsForEra(era);
}
